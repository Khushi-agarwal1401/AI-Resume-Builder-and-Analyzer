import { createServerClient } from "@/lib/db/server";
import { getPlanLimits, UNLIMITED_USAGE } from "@/lib/stripe";
import { isAdmin } from "@/lib/admin";

export type PlanLimits = ReturnType<typeof getPlanLimits>;

export async function getUserSubscription(userId: string) {
  const db = await createServerClient();
  const { data: sub } = await db
    .from("subscriptions")
    .select("*, subscription_plans(*)")
    .eq("user_id", userId)
    .single();
  return sub;
}

/** Subscription statuses that still grant paid-plan limits (K-14). */
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  // Admins have full access — no Pro subscription required. The DB-role check
  // (isAdmin with empty email) covers role-based admins here; env-email admins
  // are exempted by the per-route isAdmin checks that short-circuit first. This
  // single source of truth means every present and future plan limit is Pro for
  // admins, regardless of which route enforces it.
  if (await isAdmin(userId, "")) {
    const limits = getPlanLimits("pro");
    // Truly unlimited for admins: raise every numeric cap past checkUsageLimit's
    // unlimited threshold so no usage or resume-count gate can ever block an
    // admin — even one that forgets its own isAdmin shortcut. Feature booleans
    // (hasAdvancedTemplates, hasExportPdf, …) stay Pro = true.
    return {
      ...limits,
      maxResumes: UNLIMITED_USAGE,
      maxAtsChecks: UNLIMITED_USAGE,
      maxJdAnalyses: UNLIMITED_USAGE,
      maxAiActions: UNLIMITED_USAGE,
    };
  }

  const sub = await getUserSubscription(userId);
  // Only an active (or trialing) subscription grants paid limits. A canceled /
  // past_due / unpaid subscription must fall back to the free plan — otherwise
  // users who stop paying keep Pro access indefinitely (K-14).
  const hasActiveSub = !!sub && ACTIVE_SUBSCRIPTION_STATUSES.has(sub.status);
  const planId = hasActiveSub ? sub.plan_id || "free" : "free";
  return getPlanLimits(planId);
}

export async function checkUsageLimit(
  userId: string,
  metric: string,
  limit: number
): Promise<{ allowed: boolean; current: number; limit: number }> {
  if (limit >= UNLIMITED_USAGE) return { allowed: true, current: 0, limit };

  const db = await createServerClient();
  const { data } = await db
    .from("usage_counts")
    .select("count, reset_at")
    .eq("user_id", userId)
    .eq("metric", metric)
    .maybeSingle();

  const now = new Date();
  const resetAt = data?.reset_at ? new Date(data.reset_at) : new Date(0);
  const count = data && resetAt > now ? (data.count ?? 0) : 0;

  return { allowed: count < limit, current: count, limit };
}

export async function incrementUsage(userId: string, metric: string): Promise<void> {
  const db = await createServerClient();
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data } = await db
    .from("usage_counts")
    .select("id, count, reset_at")
    .eq("user_id", userId)
    .eq("metric", metric)
    .maybeSingle();

  if (!data || new Date(data.reset_at) < now) {
    await db.from("usage_counts").upsert({
      user_id: userId,
      metric,
      count: 1,
      reset_at: nextMonth.toISOString(),
    }, { onConflict: "user_id,metric" });
  } else {
    await db.from("usage_counts").update({
      count: (data.count || 0) + 1,
      updated_at: now.toISOString(),
    }).eq("id", data.id);
  }
}
