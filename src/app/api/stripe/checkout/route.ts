import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = createServerSupabaseClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .single();
    return NextResponse.json({ success: true, subscription: sub || null });
  } catch {
    return NextResponse.json({ success: false, error: "Service unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { priceId, successUrl, cancelUrl } = await request.json();
    if (!priceId) {
      return NextResponse.json({ success: false, error: "Missing priceId" }, { status: 400 });
    }

    const { getStripe } = await import("@/lib/stripe");
    const stripe = await getStripe();
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = createServerSupabaseClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", session.user.id)
      .single();

    const { data: existingSub } = await supabase
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
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/settings?checkout=success`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: { userId: session.user.id },
    });

    return NextResponse.json({ success: true, url: checkout.url });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
