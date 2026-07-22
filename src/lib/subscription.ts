import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPlanLimits } from "@/lib/stripe";

export type PlanLimits = ReturnType<typeof getPlanLimits>;

export async function getUserSubscription(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*, subscription_plans(*)")
    .eq("user_id", userId)
    .single();
  return sub;
}

export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const sub = await getUserSubscription(userId);
  const planId = sub?.plan_id || "free";
  return getPlanLimits(planId);
}

export async function checkUsageLimit(
  userId: string,
  metric: string,
  limit: number
): Promise<{ allowed: boolean; current: number; limit: number }> {
  if (limit >= 999) return { allowed: true, current: 0, limit };

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("usage_counts")
    .select("count, reset_at")
    .eq("user_id", userId)
    .eq("metric", metric)
    .maybeSingle();

  const now = new Date();
  const resetAt = data?.reset_at ? new Date(data.reset_at) : new Date(0);
  const count = data && resetAt > now ? data.count : 0;

  return { allowed: count < limit, current: count, limit };
}

export async function incrementUsage(userId: string, metric: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data } = await supabase
    .from("usage_counts")
    .select("id, count, reset_at")
    .eq("user_id", userId)
    .eq("metric", metric)
    .maybeSingle();

  if (!data || new Date(data.reset_at) < now) {
    await supabase.from("usage_counts").upsert({
      user_id: userId,
      metric,
      count: 1,
      reset_at: nextMonth.toISOString(),
    }, { onConflict: "user_id,metric" });
  } else {
    await supabase.from("usage_counts").update({
      count: (data.count || 0) + 1,
      updated_at: now.toISOString(),
    }).eq("id", data.id);
  }
}
