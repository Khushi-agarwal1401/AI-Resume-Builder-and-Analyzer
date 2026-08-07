import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * AI tools / feature pages that can be searched by name or keyword.
 * Note: cover letters are NOT persisted anywhere in the app (no table), so
 * they are represented here as a single "Cover Letter" tool entry pointing at
 * the generator. If a cover-letter storage layer is ever added, promote it to
 * its own search category alongside resumes/atsReports.
 */
const TOOL_CATALOG: { id: string; name: string; keywords: string[]; href: string }[] = [
  { id: "job-match", name: "AI Job Match", keywords: ["job match", "jd", "analyzer", "job description"], href: "/tools/job-match" },
  { id: "cover-letter", name: "Cover Letter", keywords: ["cover letter", "letter"], href: "/tools/cover-letter" },
  { id: "application-kit", name: "Application Kit", keywords: ["application kit", "kit", "package"], href: "/tools/application-kit" },
  { id: "ats-check", name: "ATS Check", keywords: ["ats", "check", "score", "analysis"], href: "/ats-check" },
  { id: "analytics", name: "Analytics", keywords: ["analytics", "trend", "stats", "score trend"], href: "/analytics" },
  { id: "templates", name: "Template Gallery", keywords: ["template", "gallery", "design", "layout"], href: "/templates" },
  { id: "job-tracker", name: "Job Tracker", keywords: ["job tracker", "tracker", "applications"], href: "/jobs" },
  { id: "updates", name: "Updates", keywords: ["updates", "changelog", "what's new"], href: "/updates" },
  { id: "github", name: "GitHub Integration", keywords: ["github", "sync", "repo", "contributions"], href: "/integrations/github" },
  { id: "linkedin", name: "LinkedIn Integration", keywords: ["linkedin", "import", "sync", "profile"], href: "/integrations/linkedin" },
];

/** Settings / account pages that can be searched by name or keyword. */
const SETTINGS_CATALOG: { id: string; name: string; keywords: string[]; href: string }[] = [
  { id: "settings", name: "Settings", keywords: ["settings", "profile", "account", "preferences", "appearance"], href: "/settings" },
  { id: "subscription", name: "Subscription & Billing", keywords: ["subscription", "billing", "plan", "pro", "upgrade"], href: "/settings/subscription" },
  { id: "pricing", name: "Pricing & Plans", keywords: ["pricing", "plans", "upgrade", "pro", "free"], href: "/pricing" },
];

/**
 * GET /api/search?q=term
 * Aggregates the user's data across resumes, templates, job applications,
 * companies, skills, ATS reports, AI tools and settings pages.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const q = (request.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  const EMPTY = { resumes: [], templates: [], jobs: [], companies: [], skills: [], atsReports: [], tools: [], settings: [] };

  // Static catalogs are matched without any DB round-trip.
  const matchStatic = (entry: { name: string; keywords: string[] }) =>
    entry.name.toLowerCase().includes(q) || entry.keywords.some((k) => k.includes(q));

  if (!q) {
    return NextResponse.json({ success: true, data: EMPTY });
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

    // ATS report history (real persisted scores)
    const { data: atsAnalyses } = await supabase
      .from("ats_analyses")
      .select("id, resume_id, resume_title, score, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

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

    // ATS reports: match by resume title or the score itself ("search 80")
    const matchedAtsReports = (atsAnalyses || [])
      .filter(
        (a) =>
          (a.resume_title || "").toLowerCase().includes(q) ||
          String(a.score).includes(q)
      )
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        title: a.resume_title || "Resume analysis",
        score: a.score,
        created_at: a.created_at,
        resume_id: a.resume_id,
      }));

    const matchedTools = TOOL_CATALOG.filter(matchStatic).map((t) => ({
      id: t.id,
      name: t.name,
      href: t.href,
    }));

    const matchedSettings = SETTINGS_CATALOG.filter(matchStatic).map((s) => ({
      id: s.id,
      name: s.name,
      href: s.href,
    }));

    return NextResponse.json({
      success: true,
      data: {
        resumes: matchedResumes,
        templates: matchedTemplates,
        jobs: matchedJobs,
        companies: matchedCompanies,
        skills: matchedSkills,
        atsReports: matchedAtsReports,
        tools: matchedTools,
        settings: matchedSettings,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
