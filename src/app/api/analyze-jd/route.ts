import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/db/server";
import { callAi } from "@/services/ai/client";
import { extractKeywords, matchResumeKeywords, analyzeSkillGaps, analyzeExperienceGap } from "@/services/jd-analyzer/engine";
import { parseResumeText } from "@/services/resume-analyzer/deterministic-import";
import type { AiRequest } from "@/types/ai";
import { getUserPlanLimits, checkUsageLimit, incrementUsage } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Usage limit: check plan's max JD analyses per month (admins exempt)
  if (!(await isAdmin(session.user.id, session.user.email || ""))) {
    const limits = await getUserPlanLimits(session.user.id);
    const usageCheck = await checkUsageLimit(session.user.id, "jd_analyses", limits.maxJdAnalyses);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Monthly JD analysis limit reached. Upgrade to Pro for unlimited analyses." },
        { status: 403 }
      );
    }
  }

  try {
    const formData = await request.formData();
    const jdText = (formData.get("jd") as string || "").trim();
    const resumeId = (formData.get("resumeId") as string || "").trim();
    // Raw resume text (uploaded/pasted) — used when no saved resumeId exists,
    // so the Application Kit can analyze a resume the user uploads directly.
    const resumeText = (formData.get("resumeText") as string || "").trim();

    if (!jdText && !formData.has("file")) {
      return NextResponse.json({ success: false, error: "No job description or file provided" }, { status: 400 });
    }

    let fileContent = "";
    const file = formData.get("file") as File | null;
    if (file) {
      fileContent = await file.text();
    }

    const inputText = fileContent || jdText;
    if (!inputText || inputText.length < 10) {
      return NextResponse.json({ success: false, error: "Job description must be at least 10 characters" }, { status: 400 });
    }

    const jdKeywords = extractKeywords(inputText);

    let resumeData: Record<string, unknown> = {};
    let resumeSkills: string[] = [];
    let resumeExperience: { role: string; years?: number }[] = [];

    if (resumeId) {
      const db = await createServerClient();
      const { data: resume } = await db
        .from("resumes")
        .select("*, experience(*)")
        .eq("id", resumeId)
        .eq("user_id", session.user.id)
        .single();

      if (resume) {
        resumeData = resume as unknown as Record<string, unknown>;

        resumeSkills = [
          ...((resumeData.skills as Record<string, string[]>)?.technical || []),
          ...((resumeData.skills as Record<string, string[]>)?.frameworks || []),
          ...((resumeData.skills as Record<string, string[]>)?.tools || []),
        ];

        const experiences = resumeData.experience || [];
        resumeExperience = (Array.isArray(experiences) ? experiences : []).map(
          (e: Record<string, unknown>) => ({
            role: (e.role as string) || "",
            years: e.years ? Number(e.years) : undefined,
          })
        );
      }
    } else if (resumeText) {
      // No saved resume — deterministically parse the provided text (fully
      // offline) so keyword matching, skill gaps, and experience analysis all
      // work exactly like the saved-resume path.
      const parsed = parseResumeText(resumeText);
      resumeSkills = [
        ...parsed.skills.technical,
        ...parsed.skills.frameworks,
        ...parsed.skills.tools,
      ];
      resumeExperience = parsed.experience.map((e) => ({ role: e.role || "", years: undefined }));
      resumeData = {
        skills: parsed.skills,
        summary: parsed.summary,
        education: parsed.education,
      };
    }

    const keywordMatch = matchResumeKeywords(resumeSkills, jdKeywords);
    const skillGaps = analyzeSkillGaps(resumeSkills, jdKeywords);
    const experienceGap = analyzeExperienceGap(resumeExperience, inputText);

    let aiOutput = "";
    try {
      // Build rich context so the AI can do a thorough comparison.
      const resumeContextParts: string[] = [];
      if (resumeText) resumeContextParts.push(`Resume:\n${resumeText.substring(0, 8000)}`);
      if (resumeSkills.length > 0) resumeContextParts.push(`Skills: ${resumeSkills.join(", ")}`);
      if (resumeExperience.length > 0) {
        resumeContextParts.push(
          `Experience: ${resumeExperience.map((e) => `${e.role}${e.years ? ` (${e.years} years)` : ""}`).join(", ")}`
        );
      }
      const summary = (resumeData.summary as string) || "";
      if (summary) resumeContextParts.push(`Summary: ${summary.substring(0, 500)}`);
      const education = resumeData.education as { institution?: string; degree?: string; field?: string }[] | undefined;
      if (education?.length) {
        resumeContextParts.push(
          `Education: ${education.map((e) => `${e.degree || ""} in ${e.field || ""} from ${e.institution || ""}`).join(", ")}`
        );
      }

      const aiPayload: AiRequest = {
        action: "analyze-jd",
        input: inputText.substring(0, 3000),
        context: resumeContextParts.length > 0
          ? resumeContextParts.join("\n")
          : "No resume provided",
      };
      const aiResult = await callAi(aiPayload);
      if (aiResult.success) aiOutput = aiResult.output;
    } catch {
      aiOutput = "";
    }

    const aiData: Record<string, unknown> | null = aiOutput
      ? (tryParseJson(aiOutput) as Record<string, unknown> | null)
      : null;

    const result = {
      matchPercentage: (aiData?.matchPercentage as number) ?? keywordMatch.matchPercentage,
      overallMatch: (aiData?.matchPercentage as number) ?? keywordMatch.matchPercentage,
      overallAssessment: (aiData?.overallAssessment as string) || null,
      totalJdKeywords: jdKeywords.length,
      matchedKeywords: (aiData?.matchedKeywords as string[]) || keywordMatch.matched,
      missingKeywords: (aiData?.missingKeywords as string[]) || keywordMatch.missing,
      matchedSkills: skillGaps.matchedSkills,
      missingSkills: (aiData?.missingSkills as string[]) || skillGaps.missingSkills,
      missingTools: (aiData?.missingTools as string[]) || skillGaps.missingTools,
      otherMissing: skillGaps.otherMissing,
      experienceGap: (aiData?.experienceGap as string) || experienceGap.gap,
      requiredYears: experienceGap.requiredYears,
      hasRelevantExperience: experienceGap.hasRelevantExperience,
      relevantRoles: experienceGap.relevantRoles,
      extractedKeywords: jdKeywords,
      strengths: (aiData?.strengths as string[]) || [],
      weaknesses: (aiData?.weaknesses as string[]) || [],
      actionableSuggestions: (aiData?.actionableSuggestions as string[]) || (aiData?.suggestions as string[]) || [],
      rewrittenBullets: (aiData?.rewrittenBullets as string[]) || [],
      aiSuggestions: (aiData?.actionableSuggestions as string[]) || (aiData?.suggestions as string[]) || [],
    };

    if (resumeId) {
      const db = await createServerClient();
      await db.from("job_analyses").insert({
        user_id: session.user.id,
        resume_id: resumeId,
        jd_snippet: inputText.substring(0, 500),
        match_percentage: result.matchPercentage,
        result: JSON.stringify(result),
      }).select();
    }

    // Increment usage after successful analysis
    await incrementUsage(session.user.id, "jd_analyses");

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get("resumeId");

  const db = await createServerClient();
  let query = db
    .from("job_analyses")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (resumeId) {
    query = query.eq("resume_id", resumeId);
  }

  const { data } = await query;
  return NextResponse.json({ success: true, data: data || [] });
}

function tryParseJson(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
