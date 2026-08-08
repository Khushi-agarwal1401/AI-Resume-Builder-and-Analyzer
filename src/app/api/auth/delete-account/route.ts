import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logError } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * DELETE account (self-service)
 *
 * The browser Supabase client has no auth session (this app authenticates
 * through NextAuth), so the client-side `delete_user_account` RPC can never
 * resolve `auth.uid()` and always fails. This route is the reliable path:
 *
 *   1. Verifies the NextAuth session.
 *   2. Cancels any active Stripe subscription (best-effort — never blocks
 *      deletion, so a Stripe outage can't strand the user's data).
 *   3. Deletes the Supabase auth user with the service-role client. The
 *      `profiles` FK cascades remove every owned row (resumes, sections,
 *      applications, subscriptions, usage, notifications, …).
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

  const { createClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ── 1. Cancel active Stripe subscriptions (best-effort) ────────────────
  try {
    const { data: sub } = await supabaseAdmin
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

  // ── 2. Delete the auth user (cascades to all owned data) ───────────────
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
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
