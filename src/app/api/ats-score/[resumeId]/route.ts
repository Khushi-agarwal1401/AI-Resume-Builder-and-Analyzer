import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResume } from "@/services/resume/service";
import { calculateAtsScore } from "@/services/resume-analyzer";
import type { ResumeCategory } from "@/services/resume-analyzer/ats-scorer";
import { createHash } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserPlanLimits, checkUsageLimit, incrementUsage } from "@/lib/subscription";

export const dynamic = "force-dynamic";

async function persistAtsScore(
  resumeId: string,
  userId: string,
  resumeTitle: string,
  result: ReturnType<typeof calculateAtsScore>
) {
  try {
    const supabase = await createServerSupabaseClient();
    // Update the resume row with the latest score + breakdown
    await supabase
      .from("resumes")
      .update({ ats_score: result.overall, ats_breakdown: result as unknown as Record<string, unknown> })
      .eq("id", resumeId)
      .eq("user_id", userId);
    // Append to score history so analytics can plot a real trend
    await supabase.from("ats_analyses").insert({
      user_id: userId,
      resume_id: resumeId,
      resume_title: resumeTitle,
      score: result.overall,
      breakdown: result as unknown as Record<string, unknown>,
    });
  } catch {
    // Persistence is best-effort; never fail the score request because of it
  }
}

// In-memory cache for ATS scores keyed by content hash + category
const scoreCache = new Map<string, {
  result: ReturnType<typeof calculateAtsScore>;
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

  // Usage limit: check plan's max ATS checks per month
  const limits = await getUserPlanLimits(session.user.id);
  const usageCheck = await checkUsageLimit(session.user.id, "ats_checks", limits.maxAtsChecks);
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Monthly ATS check limit reached. Upgrade to Pro for unlimited checks." },
      { status: 403 }
    );
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

    // Compute score
    const result = calculateAtsScore({
      text: resumeText,
      category,
      jobDescription,
    });

    // Cache
    scoreCache.set(contentHash, { result, cachedAt: Date.now() });

    // Persist real ATS score for dashboard + analytics (K-03/K-07)
    await persistAtsScore(resumeId, session.user.id, resume.title, result);

    // Increment usage after successful score computation
    await incrementUsage(session.user.id, "ats_checks");

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    });
  } catch (error) {
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

  // Usage limit: check plan's max ATS checks per month
  const limits = await getUserPlanLimits(session.user.id);
  const usageCheck = await checkUsageLimit(session.user.id, "ats_checks", limits.maxAtsChecks);
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Monthly ATS check limit reached. Upgrade to Pro for unlimited checks." },
      { status: 403 }
    );
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

    const result = calculateAtsScore({
      text: resumeText,
      category,
      jobDescription,
    });

    scoreCache.set(contentHash, { result, cachedAt: Date.now() });

    // Persist real ATS score for dashboard + analytics (K-03/K-07)
    await persistAtsScore(resumeId, session.user.id, resume.title, result);

    // Increment usage after successful score computation
    await incrementUsage(session.user.id, "ats_checks");

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
