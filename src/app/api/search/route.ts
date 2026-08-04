import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=term
 * Aggregates the user's data across resumes, templates, job applications,
 * companies (from applications + resume experience) and skills.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const q = (request.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  if (!q) {
    return NextResponse.json({
      success: true,
      data: { resumes: [], templates: [], jobs: [], companies: [], skills: [] },
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Resumes (names)
    const { data: resumes } = await supabase
      .from("resumes")
      .select("id, title, template, ats_score")
      .eq("user_id", session.user.id);

    // Job applications (jobs + companies)
    const { data: applications } = await supabase
      .from("applications")
      .select("id, company, role, status")
      .eq("user_id", session.user.id);

    // Templates catalog (active)
    const { data: templates } = await supabase
      .from("templates")
      .select("id, name, category, description")
      .eq("is_active", true);

    // Resume experience rows -> companies; skills rows -> skills
    const resumeIds = (resumes || []).map((r) => r.id);
    const { data: experienceRows } = resumeIds.length
      ? await supabase.from("experience").select("company").in("resume_id", resumeIds)
      : { data: [] };

    const { data: skillRows } = resumeIds.length
      ? await supabase.from("skills").select("technical, soft, tools, frameworks").in("resume_id", resumeIds)
      : { data: [] };

    const matchedResumes = (resumes || [])
      .filter((r) => r.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        title: r.title,
        template: r.template,
        ats_score: r.ats_score,
      }));

    const matchedTemplates = (templates || [])
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((t) => ({ id: t.id, name: t.name, category: t.category }));

    const matchedJobs = (applications || [])
      .filter(
        (a) => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((a) => ({ id: a.id, company: a.company, role: a.role, status: a.status }));

    // Companies: dedupe across applications + resume experience
    const companySet = new Set<string>();
    (applications || []).forEach((a) => companySet.add(a.company));
    (experienceRows || []).forEach((e) => companySet.add(e.company));
    const matchedCompanies = [...companySet]
      .filter((c) => c.toLowerCase().includes(q))
      .slice(0, 5)
      .map((name) => ({ name }));

    // Skills: dedupe across all skill rows
    const skillSet = new Set<string>();
    (skillRows || []).forEach((s) => {
      [s.technical, s.soft, s.tools, s.frameworks].forEach((list) => {
        if (Array.isArray(list)) list.forEach((skill) => typeof skill === "string" && skillSet.add(skill));
      });
    });
    const matchedSkills = [...skillSet]
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 5)
      .map((name) => ({ name }));

    return NextResponse.json({
      success: true,
      data: {
        resumes: matchedResumes,
        templates: matchedTemplates,
        jobs: matchedJobs,
        companies: matchedCompanies,
        skills: matchedSkills,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
