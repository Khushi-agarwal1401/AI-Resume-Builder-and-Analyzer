import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResumes, getResume } from "@/services/resume/service";
import { getApplications } from "@/services/applications/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/data-export — GDPR-style export of the signed-in user's data.
 * Used by the Settings → Delete Account flow ("we'll offer you a data
 * export of your resumes and application history").
 *
 * Includes FULL resume content (every section, via getResume) rather than
 * the dashboard list rows, plus applications and JD-analysis history.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // Full resume content — not just the list metadata.
    const resumes = await getResumes(userId);
    const resumeData = await Promise.all(
      resumes.map(async (r) => {
        try {
          return await getResume(String(r.id), userId);
        } catch {
          return null;
        }
      })
    );

    // Application history — paginate so large lists aren't truncated.
    const applications: unknown[] = [];
    let page = 1;
    for (;;) {
      const { data, total } = await getApplications(userId, undefined, {
        page,
        pageSize: 200,
      });
      applications.push(...data);
      if (applications.length >= total || data.length === 0) break;
      page += 1;
    }

    // Job-description analysis history.
    const supabase = await createServerSupabaseClient();
    const { data: jobAnalyses } = await supabase
      .from("job_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        resumes: resumeData.filter(Boolean),
        applications,
        jobAnalyses: jobAnalyses || [],
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
