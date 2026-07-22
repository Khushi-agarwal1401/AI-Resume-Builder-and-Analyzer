import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { callGemini } from "@/services/ai/client";
import { extractKeywords, matchResumeKeywords, analyzeSkillGaps, analyzeExperienceGap } from "@/services/jd-analyzer/engine";
import type { AiRequest } from "@/types/ai";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const jdText = (formData.get("jd") as string || "").trim();
    const resumeId = (formData.get("resumeId") as string || "").trim();

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
      const supabase = await createServerSupabaseClient();
      const { data: resume } = await supabase
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

        const experiences = resume.experience || [];
        resumeExperience = (Array.isArray(experiences) ? experiences : []).map(
          (e: Record<string, unknown>) => ({
            role: (e.role as string) || "",
            years: e.years ? Number(e.years) : undefined,
          })
        );
      }
    }

    const keywordMatch = matchResumeKeywords(resumeSkills, jdKeywords);
    const skillGaps = analyzeSkillGaps(resumeSkills, jdKeywords);
    const experienceGap = analyzeExperienceGap(resumeExperience, inputText);

    let aiOutput = "";
    try {
      const aiPayload: AiRequest = {
        action: "analyze-jd",
        input: inputText.substring(0, 3000),
        context: resumeSkills.length > 0
          ? `Resume skills: ${resumeSkills.join(", ")}. Experience roles: ${resumeExperience.map((e) => e.role).join(", ")}`
          : "No resume provided",
      };
      const aiResult = await callGemini(aiPayload);
      if (aiResult.success) aiOutput = aiResult.output;
    } catch {
      aiOutput = "";
    }

    const aiData = aiOutput ? tryParseJson(aiOutput) : null;

    const result = {
      matchPercentage: aiData?.matchPercentage ?? keywordMatch.matchPercentage,
      overallMatch: aiData?.matchPercentage ?? keywordMatch.matchPercentage,
      totalJdKeywords: jdKeywords.length,
      matchedKeywords: keywordMatch.matched,
      missingKeywords: keywordMatch.missing,
      matchedSkills: skillGaps.matchedSkills,
      missingSkills: skillGaps.missingSkills,
      missingTools: skillGaps.missingTools,
      otherMissing: skillGaps.otherMissing,
      experienceGap: experienceGap.gap,
      requiredYears: experienceGap.requiredYears,
      hasRelevantExperience: experienceGap.hasRelevantExperience,
      relevantRoles: experienceGap.relevantRoles,
      extractedKeywords: jdKeywords,
      aiSuggestions: aiData?.suggestions || [],
    };

    if (resumeId) {
      const supabase = await createServerSupabaseClient();
      await supabase.from("job_analyses").insert({
        user_id: session.user.id,
        resume_id: resumeId,
        jd_snippet: inputText.substring(0, 500),
        match_percentage: result.matchPercentage,
        result: JSON.stringify(result),
      }).select();
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Analysis failed" },
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

  const supabase = await createServerSupabaseClient();
  let query = supabase
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
