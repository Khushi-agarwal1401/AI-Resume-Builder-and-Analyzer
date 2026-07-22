import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.email !== "admin@resumeai.com") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();

  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: totalResumes } = await supabase.from("resumes").select("*", { count: "exact", head: true });
  const { count: proUsers } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("plan_id", "pro");
  const { count: totalAnalyses } = await supabase.from("job_analyses").select("*", { count: "exact", head: true });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: recentSignups } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgo.toISOString());

  const { data: resumeData } = await supabase.from("resumes").select("template");
  const templatesUsed: Record<string, number> = {};
  for (const r of resumeData || []) {
    templatesUsed[r.template] = (templatesUsed[r.template] || 0) + 1;
  }

  return NextResponse.json({
    success: true,
    data: {
      totalUsers: totalUsers || 0,
      totalResumes: totalResumes || 0,
      proUsers: proUsers || 0,
      totalAnalyses: totalAnalyses || 0,
      recentSignups: recentSignups || 0,
      templatesUsed,
    },
  });
}
