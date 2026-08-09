import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/db/server";
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

  const db = await createServerClient();

  const { count: totalUsers } = await db.from("profiles").select("*", { count: "exact", head: true });
  const { count: totalResumes } = await db.from("resumes").select("*", { count: "exact", head: true });
  const { count: proUsers } = await db.from("subscriptions").select("*", { count: "exact", head: true }).eq("plan_id", "pro");
  const { count: totalAnalyses } = await db.from("job_analyses").select("*", { count: "exact", head: true });
  const { count: totalApplications } = await db.from("applications").select("*", { count: "exact", head: true });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: recentSignups } = await db
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgo.toISOString());

  // Active users: signed in within the last 7 days (profiles.last_seen_at).
  const { count: activeUsers } = await db
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("last_seen_at", weekAgo.toISOString());

  // ATS checks performed through the /ats-check section.
  const { count: totalAtsChecks } = await db
    .from("ats_analyses")
    .select("*", { count: "exact", head: true });

  // Total templates in the catalog.
  const { count: totalTemplates } = await db
    .from("templates")
    .select("*", { count: "exact", head: true });

  // Recent signups (5 most recent) with plan + role, for the dashboard feed.
  const { data: recentSignupsDetail } = await db
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  const { data: subPlanRows } = await db
    .from("subscriptions")
    .select("user_id, plan_id");
  const planByUser = new Map<string, string>();
  for (const s of subPlanRows || []) planByUser.set(s.user_id, s.plan_id);
  const recentSignupsList = (recentSignupsDetail || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    email: p.email as string | null,
    full_name: p.full_name as string | null,
    role: p.role as string | null,
    plan: planByUser.get(p.id as string) || "free",
    created_at: p.created_at as string,
  }));

  // Latest admin activity feed from the audit log.
  const { data: auditRows } = await db
    .from("admin_audit_log")
    .select("id, admin_id, action, target_type, target_id, created_at")
    .order("created_at", { ascending: false })
    .limit(8);
  const { data: auditAdmins } = await db
    .from("profiles")
    .select("id, email");
  const emailByUser = new Map<string, string>();
  for (const p of auditAdmins || []) emailByUser.set(p.id, p.email || "");
  const recentActivity = (auditRows || []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    action: a.action as string,
    target_type: a.target_type as string,
    target_id: a.target_id as string,
    adminEmail: emailByUser.get(a.admin_id as string) || "",
    created_at: a.created_at as string,
  }));

  const { data: resumeData } = await db.from("resumes").select("template");
  const templatesUsed: Record<string, number> = {};
  for (const r of resumeData || []) {
    templatesUsed[r.template] = (templatesUsed[r.template] || 0) + 1;
  }

  // Average Estimated Compatibility Score from job_analyses
  const { data: analysisData } = await db
    .from("job_analyses")
    .select("match_percentage")
    .not("match_percentage", "is", null);
  const scores = (analysisData || []).map((a: Record<string, unknown>) => a.match_percentage as number).filter(Boolean);
  const averageCompatibilityScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const payload = {
    totalUsers: totalUsers || 0,
    totalResumes: totalResumes || 0,
    proUsers: proUsers || 0,
    totalAnalyses: totalAnalyses || 0,
    totalApplications: totalApplications || 0,
    recentSignups: recentSignups || 0,
    activeUsers: activeUsers || 0,
    totalAtsChecks: totalAtsChecks || 0,
    totalTemplates: totalTemplates || 0,
    recentSignupsList,
    recentActivity,
    templatesUsed,
    averageCompatibilityScore,
  };
  cache = { at: Date.now(), payload };

  return NextResponse.json({ success: true, data: payload });
}
