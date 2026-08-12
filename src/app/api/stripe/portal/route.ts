import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { appRedirectUrl } from "@/lib/redirect-url";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { createServerClient } = await import("@/lib/db/server");
    const db = await createServerClient();
    const { data: sub } = await db
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", session.user.id)
      .single();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ success: false, error: "No subscription found" }, { status: 404 });
    }

    const { getStripe } = await import("@/lib/stripe");
    const stripe = await getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: appRedirectUrl("/settings", request),
    });

    return NextResponse.json({ success: true, url: portal.url });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
