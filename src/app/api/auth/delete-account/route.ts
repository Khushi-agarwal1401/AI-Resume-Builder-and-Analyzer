import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/db/server";
import { logError } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * DELETE account (self-service)
 *
 *   1. Verifies the NextAuth session.
 *   2. Cancels any active Stripe subscription (best-effort — never blocks
 *      deletion, so a Stripe outage can't strand the user's data).
 *   3. Deletes the `profiles` row. Every owned table references profiles(id)
 *      ON DELETE CASCADE, so resumes, sections, applications, subscriptions,
 *      usage, notifications, … are removed automatically.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "You must be signed in to delete your account." },
      { status: 401 }
    );
  }
  const userId = session.user.id;

  const db = await createServerClient();

  // ── 1. Cancel active Stripe subscriptions (best-effort) ────────────────
  try {
    const { data: sub } = await db
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (
      sub?.stripe_subscription_id &&
      (sub.status === "active" || sub.status === "trialing")
    ) {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = await getStripe();
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    }
  } catch (e) {
    // Best-effort: an active billing subscription must not block deletion.
    await logError(e, "delete-account stripe cancel");
  }

  // ── 2. Delete the profile (cascades to all owned data) ─────────────────
  try {
    const { error } = await db.from("profiles").delete().eq("id", userId);
    if (error) {
      await logError(error, "delete-account");
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't delete your account right now. Please contact support.",
        },
        { status: 500 }
      );
    }
  } catch (e) {
    await logError(e, "delete-account");
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't delete your account right now. Please contact support.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
