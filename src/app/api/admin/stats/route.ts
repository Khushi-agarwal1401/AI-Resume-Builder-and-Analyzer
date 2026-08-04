import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 60_000;
let cache: { at: number; payload: unknown } | null = null;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(await isAdmin(session.user.id, session.user.email || ""))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return NextResponse.json({ success: true, data: cache.payload });
  }

  // Service-role client: platform-wide aggregates must span every user's rows.
  // The user-session client is RLS-scoped to the admin's own rows, which made
  // most metrics undercount (K-13). The route is admin-gated above, so using
  // the privileged client here is safe.
  const supabase = createAdminSupabaseClient();

  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: totalResumes } = await supabase.from("resumes").select("*", { count: "exact", head: true });
  const { count: proUsers } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("plan_id", "pro");
  const { count: totalAnalyses } = await supabase.from("job_analyses").select("*", { count: "exact", head: true });
  const { count: totalApplications } = await supabase.from("applications").select("*", { count: "exact", head: true });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const recentSignupsRes = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgo.toISOString());
  const active7dRes = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("last_seen_at", weekAgo.toISOString());
  const active30dRes = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("last_seen_at", monthAgo.toISOString());

  const { data: resumeData } = await supabase.from("resumes").select("template, profiles(user_type)");
  const templatesUsed: Record<string, number> = {};
  const resumesByUserType: Record<string, number> = {};
  for (const r of resumeData || []) {
    templatesUsed[r.template] = (templatesUsed[r.template] || 0) + 1;
    const userType = (r.profiles as { user_type?: string } | null)?.user_type || "unknown";
    resumesByUserType[userType] = (resumesByUserType[userType] || 0) + 1;
  }

  // ATS report: score bands + top missing keywords, from job_analyses result JSONB
  const { data: analysisData } = await supabase
    .from("job_analyses")
    .select("match_percentage, result")
    .not("match_percentage", "is", null);
  const scores = (analysisData || []).map((a: Record<string, unknown>) => a.match_percentage as number).filter(Boolean);
  const averageCompatibilityScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const scoreBands = { excellent: 0, good: 0, average: 0, weak: 0 };
  const missingKeywordCounts: Record<string, number> = {};
  for (const a of analysisData || []) {
    const s = (a as Record<string, unknown>).match_percentage as number;
    if (s >= 85) scoreBands.excellent++;
    else if (s >= 70) scoreBands.good++;
    else if (s >= 50) scoreBands.average++;
    else scoreBands.weak++;

    let parsed: { missingKeywords?: string[] } | null = null;
    try { parsed = typeof (a as Record<string, unknown>).result === "string" ? JSON.parse((a as Record<string, unknown>).result as string) : null; } catch { parsed = null; }
    for (const kw of parsed?.missingKeywords || []) {
      missingKeywordCounts[kw] = (missingKeywordCounts[kw] || 0) + 1;
    }
  }
  const topMissingKeywords = Object.entries(missingKeywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));

  const payload = {
    totalUsers: totalUsers || 0,
    totalResumes: totalResumes || 0,
    proUsers: proUsers || 0,
    totalAnalyses: totalAnalyses || 0,
    totalApplications: totalApplications || 0,
    recentSignups: recentSignupsRes.count || 0,
    activeUsers7d: active7dRes.count || 0,
    activeUsers30d: active30dRes.count || 0,
    templatesUsed,
    resumesByUserType,
    averageCompatibilityScore,
    atsReport: {
      scoreBands,
      topMissingKeywords,
      totalScored: scores.length,
    },
  };
  cache = { at: Date.now(), payload };

  return NextResponse.json({ success: true, data: payload });
}
