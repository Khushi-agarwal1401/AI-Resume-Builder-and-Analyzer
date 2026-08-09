import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory set of processed Stripe event IDs — a fast path only. The source
// of truth for idempotency is the webhook_events table (migration 00028),
// which survives redeploys and multiple instances (K-14).
const processedEvents = new Set<string>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Periodic cleanup of old event IDs
setInterval(() => {
  if (processedEvents.size > 10000) processedEvents.clear();
}, IDEMPOTENCY_TTL_MS);

/** Stripe price IDs that map to the Pro plan (from env). */
function proPriceIds(): Set<string> {
  return new Set(
    [process.env.STRIPE_PRO_PRICE_ID_MONTHLY, process.env.STRIPE_PRO_PRICE_ID_YEARLY].filter(
      (id): id is string => !!id
    )
  );
}

/**
 * Maps a Stripe price id to a plan id. Unknown/missing prices resolve to the
 * SAFE default ("free") and alert — a misconfigured or surprise price must
 * never silently upgrade a customer (K-14).
 */
async function planIdFromPrice(priceId: string | undefined, eventId: string): Promise<string> {
  if (priceId && proPriceIds().has(priceId)) return "pro";

  console.error(
    `[webhook] unknown Stripe price ${priceId ?? "(none)"} on event ${eventId}; defaulting to free plan`
  );
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureMessage(
      `Unknown Stripe price ${priceId ?? "(none)"} mapped to free plan (event ${eventId})`,
      "warning"
    );
  } catch {
    // Sentry is optional — the console error above is the fallback alert.
  }
  return "free";
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const { getStripe } = await import("@/lib/stripe");
  const stripe = await getStripe();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature") || "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Fast-path idempotency: skip if this instance already saw the event ──
  const eventId = event.id;
  if (processedEvents.has(eventId)) {
    return NextResponse.json({ received: true, idempotent: true });
  }
  processedEvents.add(eventId);

  // Admin client: a webhook has no user session, so it can't use the
  // session-scoped client. With Neon there is no RLS — the admin client is
  // the same Postgres pool, and writes are scoped explicitly (K-13).
  let db;
  try {
    const { createAdminClient } = await import("@/lib/db/admin");
    db = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  // ── Durable idempotency: record the event id up-front. A replayed event
  // (e.g. after a redeploy or from another instance) violates the unique
  // constraint and is skipped (K-14).
  const { error: dedupError } = await db
    .from("webhook_events")
    .insert({ event_id: eventId });
  if (dedupError?.code === "23505") {
    return NextResponse.json({ received: true, idempotent: true });
  }
  if (dedupError) {
    // DB hiccup — fall back to the in-memory set only. Still answer 200 so a
    // temporary DB outage doesn't make Stripe hammer the endpoint.
    console.error(`[webhook] dedup insert failed for ${eventId}`, dedupError);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sess = event.data.object as unknown as Record<string, unknown>;
        const meta = sess.metadata as Record<string, string> | undefined;
        const userId = meta?.userId;
        const customerId = sess.customer as string | undefined;
        const subId = sess.subscription as string | undefined;

        if (userId && subId) {
          // Second-layer idempotency: skip if this subscription already exists.
          const { data: existingSub } = await db
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", subId)
            .maybeSingle();

          if (existingSub) {
            return NextResponse.json({ received: true, idempotent: true });
          }

          const subscription = await stripe.subscriptions.retrieve(subId) as unknown as {
            status: string;
            items: { data: { price?: { id?: string; nickname?: string } }[] };
            current_period_start: number;
            current_period_end: number;
          };
          const planId = await planIdFromPrice(subscription.items.data[0]?.price?.id, eventId);

          await db.from("subscriptions").upsert({
            user_id: userId,
            plan_id: planId,
            stripe_customer_id: customerId || null,
            stripe_subscription_id: subId,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, { onConflict: "user_id" });

          // Notification Center (Task 2.1): welcome Pro subscribers. The
          // webhook has no session, so the write uses the admin client.
          if (planId === "pro") {
            const { createNotificationAdmin } = await import("@/services/notifications/service");
            await createNotificationAdmin(userId, {
              type: "sub",
              title: "Welcome to Pro 🎉",
              message: "Your Pro subscription is active — all premium features are unlocked.",
              link: "/settings/subscription",
            });
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as unknown as Record<string, unknown>;
        const subId = sub.id as string | undefined;

        // Match by stripe_subscription_id: Stripe does not attach session
        // metadata to these events, so the userId is looked up via the row.
        if (subId) {
          const { data: subRow } = await db
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subId)
            .maybeSingle();
          const subUserId = (subRow as { user_id?: string } | null)?.user_id;

          const priceId = (
            sub.items as unknown as { data?: { price?: { id?: string } }[] } | undefined
          )?.data?.[0]?.price?.id;
          const updates: {
            status: string;
            current_period_start?: string;
            current_period_end?: string;
            cancel_at_period_end: boolean;
            updated_at: string;
            plan_id?: string;
          } = {
            status: (sub.status as string) || "canceled",
            current_period_start: sub.current_period_start
              ? new Date((sub.current_period_start as number) * 1000).toISOString()
              : undefined,
            current_period_end: sub.current_period_end
              ? new Date((sub.current_period_end as number) * 1000).toISOString()
              : undefined,
            cancel_at_period_end: (sub.cancel_at_period_end as boolean) || false,
            updated_at: new Date().toISOString(),
          };
          // Keep plan_id in sync when the subscription's price changes.
          if (priceId) updates.plan_id = await planIdFromPrice(priceId, eventId);

          await db.from("subscriptions").update(updates).eq("stripe_subscription_id", subId);

          // Notification Center (Task 2.1): notify when a subscription ends.
          if (event.type === "customer.subscription.deleted" && subUserId) {
            const { createNotificationAdmin } = await import("@/services/notifications/service");
            await createNotificationAdmin(subUserId, {
              type: "sub",
              title: "Pro subscription ended",
              message: "Your Pro subscription has been canceled. You're back on the Free plan.",
              link: "/settings/subscription",
            });
          }
        }
        break;
      }
    }
  } catch (err) {
    // Remove the dedup row AND the in-memory fast-path entry so Stripe's
    // retry re-processes this event (otherwise the in-memory set would
    // short-circuit the retry for the next 24h, K-14).
    console.error(`[webhook] processing failed for ${eventId}`, err);
    processedEvents.delete(eventId);
    try {
      await db.from("webhook_events").delete().eq("event_id", eventId);
    } catch {
      // Best-effort cleanup — a failed delete just means a later retry no-ops.
    }
    return NextResponse.json({ received: true, error: "processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
