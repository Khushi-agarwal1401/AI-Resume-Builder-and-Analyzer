import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  subscription_plans?: {
    name: string | null;
    price_monthly: number | null;
    price_yearly: number | null;
  } | null;
  users?: { id: string; email: string | null; full_name: string | null } | null;
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id, session.user.email || ""))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();

    // Fetch subscriptions with user and plan information
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        user_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        subscription_plans (
          name,
          price_monthly,
          price_yearly
        ),
        users!inner (
          id,
          email,
          full_name
        )
      `)
      .order("current_period_start", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const formattedSubscriptions = (subscriptions as SubscriptionRow[])?.map((s) => ({
      id: s.id,
      userId: s.user_id,
      userEmail: s.users?.email,
      userName: s.users?.full_name,
      plan: s.plan_id || "free",
      status: s.status || "active",
      currentPeriodStart: s.current_period_start || "",
      currentPeriodEnd: s.current_period_end || "",
      cancelAtPeriodEnd: s.cancel_at_period_end || false,
      amount: Math.round((s.subscription_plans?.price_monthly || 0) / 100),
      currency: "usd",
    })) || [];

    return NextResponse.json({ success: true, data: formattedSubscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}
