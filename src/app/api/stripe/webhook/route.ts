import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

  let supabase;
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    supabase = createServerSupabaseClient();
  } catch {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const sess = event.data.object as unknown as Record<string, unknown>;
      const meta = sess.metadata as Record<string, string> | undefined;
      const userId = meta?.userId;
      const customerId = sess.customer as string | undefined;
      const subId = sess.subscription as string | undefined;

      if (userId && subId) {
        const subscription = await stripe.subscriptions.retrieve(subId) as unknown as { status: string; items: { data: { price?: { nickname?: string } }[] }; current_period_start: number; current_period_end: number };
        const planId = subscription.items.data[0]?.price?.nickname?.toLowerCase() || "pro";

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan_id: planId,
          stripe_customer_id: customerId || null,
          stripe_subscription_id: subId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: "user_id" });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as unknown as Record<string, unknown>;
      const subId = sub.id as string | undefined;
      const meta = sub.metadata as Record<string, string> | undefined;
      const userId = meta?.userId;

      if (userId && subId) {
        await supabase.from("subscriptions").update({
          status: (sub.status as string) || "canceled",
          current_period_start: sub.current_period_start ? new Date((sub.current_period_start as number) * 1000).toISOString() : undefined,
          current_period_end: sub.current_period_end ? new Date((sub.current_period_end as number) * 1000).toISOString() : undefined,
          cancel_at_period_end: (sub.cancel_at_period_end as boolean) || false,
          updated_at: new Date().toISOString(),
        }).eq("stripe_subscription_id", subId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
