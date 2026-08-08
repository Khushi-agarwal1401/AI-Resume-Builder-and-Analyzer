import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface AtsReportRow {
  id: string;
  resume_id: string;
  overall_score: number | null;
  keyword_relevance: number | null;
  formatting: number | null;
  readability: number | null;
  sections: number | null;
  job_description: string | null;
  created_at: string;
  resumes?: { id: string; title: string | null } | null;
  users?: { id: string; email: string | null; full_name: string | null } | null;
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id, session.user.email || ""))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();

    // Fetch ATS reports with user information
    const { data: reports, error } = await supabase
      .from("ats_scores")
      .select(`
        id,
        resume_id,
        overall_score,
        keyword_relevance,
        formatting,
        readability,
        sections,
        job_description,
        created_at,
        resumes!inner (
          id,
          title
        ),
        users!inner (
          id,
          email,
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const formattedReports = (reports as AtsReportRow[])?.map((r) => ({
      id: r.id as string,
      resumeId: r.resume_id as string,
      resumeTitle: r.resumes?.title || "Untitled",
      userId: r.users?.id as string,
      userEmail: r.users?.email as string | null,
      userName: r.users?.full_name as string | null,
      overallScore: (r.overall_score as number) || 0,
      keywordRelevance: (r.keyword_relevance as number) || 0,
      formatting: (r.formatting as number) || 0,
      readability: (r.readability as number) || 0,
      sections: (r.sections as number) || 0,
      jobDescription: r.job_description as string | null,
      createdAt: r.created_at as string,
    })) || [];

    return NextResponse.json({ success: true, data: formattedReports });
  } catch (error) {
    console.error("Error fetching ATS reports:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch ATS reports" }, { status: 500 });
  }
}
