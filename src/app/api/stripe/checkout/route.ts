import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkoutSchema, validateOrError } from "@/lib/validation";
import { appRedirectUrl } from "@/lib/redirect-url";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { createServerClient } = await import("@/lib/db/server");
    const { isAdmin } = await import("@/lib/admin");
    const db = await createServerClient();
    const { data: sub } = await db
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .single();
    // isAdmin lets the client treat admins as Pro (no premium locks) even when
    // they have no paid subscription.
    const adminUser = await isAdmin(session.user.id, session.user.email || "");
    return NextResponse.json({ success: true, subscription: sub || null, isAdmin: adminUser });
  } catch {
    return NextResponse.json({ success: false, error: "Service unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(checkoutSchema, body);
  if ("error" in validated) return validated.error;

  const { priceId, successUrl, cancelUrl } = validated.data;

  try {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = await getStripe();
    const { createServerClient } = await import("@/lib/db/server");
    const db = await createServerClient();
    const { data: profile } = await db
      .from("profiles")
      .select("email, full_name")
      .eq("id", session.user.id)
      .single();

    const { data: existingSub } = await db
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", session.user.id)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || session.user.email!,
        name: profile?.full_name || session.user.email!,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
    }

    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || appRedirectUrl("/settings?checkout=success", request),
      cancel_url: cancelUrl || appRedirectUrl("/pricing", request),
      metadata: { userId: session.user.id },
    });

    return NextResponse.json({ success: true, url: checkout.url });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
