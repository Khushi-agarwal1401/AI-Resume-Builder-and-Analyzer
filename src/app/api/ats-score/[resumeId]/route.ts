import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResume } from "@/services/resume/service";
import { analyzeDeepAts } from "@/services/resume-analyzer/deep-ats";
import type { ResumeCategory } from "@/services/resume-analyzer/ats-scorer";
import { createHash } from "crypto";
import { getUserPlanLimits, checkUsageLimit, incrementUsage } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";
import { createServerClient } from "@/lib/db/server";

/**
 * Best-effort persistence of a freshly computed score (K-07):
 * appends to ats_analyses (the analytics trend source) and updates the resume's
 * ats_score (dashboard badge). Never fails the response — the score itself is
 * the primary output.
 */
async function persistScore(
  userId: string,
  resumeId: string,
  resumeTitle: string,
  report: Awaited<ReturnType<typeof analyzeDeepAts>>
): Promise<void> {
  try {
    const db = await createServerClient();
    await db.from("ats_analyses").insert({
      user_id: userId,
      resume_id: resumeId,
      resume_title: resumeTitle,
      score: report.atsScore,
      breakdown: {
        category: report.keywordScan,
        grade: report.grade,
        jdMatch: report.jdMatchScore,
      } as never,
    });
    await db
      .from("resumes")
      .update({ ats_score: report.atsScore, ats_breakdown: { grade: report.grade, jdMatch: report.jdMatchScore } as never })
      .eq("id", resumeId)
      .eq("user_id", userId);
  } catch {
    // ignore — persistence is best-effort
  }
}

export const dynamic = "force-dynamic";

// In-memory cache for ATS scores keyed by content hash + category
const scoreCache = new Map<string, {
  result: Awaited<ReturnType<typeof analyzeDeepAts>>;
  cachedAt: number;
}>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function buildContentHash(resumeText: string, category?: string, jd?: string): string {
  const hash = createHash("sha256");
  hash.update(resumeText);
  if (category) hash.update(category);
  if (jd) hash.update(jd);
  return hash.digest("hex");
}

function buildResumeText(
  resume: Awaited<ReturnType<typeof getResume>>
): string {
  const parts: string[] = [];

  parts.push(resume.personalInfo.fullName);
  parts.push(resume.summary);

  for (const exp of resume.experience) {
    parts.push(`${exp.role} at ${exp.company}`);
    parts.push(...exp.responsibilities);
    parts.push(...exp.achievements);
  }

  for (const edu of resume.education) {
    parts.push(`${edu.degree} at ${edu.institution}`);
  }

  for (const proj of resume.projects) {
    parts.push(`${proj.name}: ${proj.description}`);
  }

  const skills = resume.skills;
  parts.push(...skills.technical, ...skills.soft, ...skills.tools, ...skills.frameworks);

  return parts.join("\n");
}

/**
 * GET /api/ats-score/[resumeId]?category=experienced&jobDescription=...
 * Returns cached score if available, otherwise computes and caches.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resumeId: string }> }
) {
  const { resumeId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") as ResumeCategory) || "experienced";
  const jobDescription = searchParams.get("jobDescription") || undefined;

  // Usage limit: check plan's max ATS checks per month (admins exempt)
  if (!(await isAdmin(session.user.id, session.user.email || ""))) {
    const limits = await getUserPlanLimits(session.user.id);
    const usageCheck = await checkUsageLimit(session.user.id, "ats_checks", limits.maxAtsChecks);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Monthly ATS check limit reached. Upgrade to Pro for unlimited checks." },
        { status: 403 }
      );
    }
  }

  try {
    const resume = await getResume(resumeId, session.user.id);
    const resumeText = buildResumeText(resume);
    const contentHash = buildContentHash(resumeText, category, jobDescription);

    // Check cache
    const cached = scoreCache.get(contentHash);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        data: cached.result,
        cached: true,
      });
    }

    // Compute score using the full deep ATS engine (weighted JD matching).
    const result = analyzeDeepAts({
      text: resumeText,
      category,
      jobDescription,
    });

    // Cache
    scoreCache.set(contentHash, { result, cachedAt: Date.now() });

    // Increment usage after successful score computation
    await incrementUsage(session.user.id, "ats_checks");

    // Persist so analytics + dashboard see this run (K-07)
    await persistScore(session.user.id, resumeId, resume.title, result);

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ats-score/[resumeId]
 * Same as GET but accepts jobDescription and category in the request body.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resumeId: string }> }
) {
  const { resumeId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const category = (body.category as ResumeCategory) || "experienced";
  const jobDescription = body.jobDescription as string | undefined;

  // Usage limit: check plan's max ATS checks per month (admins exempt)
  if (!(await isAdmin(session.user.id, session.user.email || ""))) {
    const limits = await getUserPlanLimits(session.user.id);
    const usageCheck = await checkUsageLimit(session.user.id, "ats_checks", limits.maxAtsChecks);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Monthly ATS check limit reached. Upgrade to Pro for unlimited checks." },
        { status: 403 }
      );
    }
  }

  try {
    const resume = await getResume(resumeId, session.user.id);
    const resumeText = buildResumeText(resume);
    const contentHash = buildContentHash(resumeText, category, jobDescription);

    const cached = scoreCache.get(contentHash);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        data: cached.result,
        cached: true,
      });
    }

    const result = analyzeDeepAts({
      text: resumeText,
      category,
      jobDescription,
    });

    scoreCache.set(contentHash, { result, cachedAt: Date.now() });

    // Increment usage after successful score computation
    await incrementUsage(session.user.id, "ats_checks");

    // Persist so analytics + dashboard see this run (K-07)
    await persistScore(session.user.id, resumeId, resume.title, result);

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
