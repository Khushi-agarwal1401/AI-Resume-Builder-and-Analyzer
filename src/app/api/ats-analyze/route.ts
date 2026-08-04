import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getResume } from "@/services/resume/service";
import { analyzeResumeFile } from "@/services/resume-analyzer";
import { analyzeDeepAts, type DeepAtsReport, type DeepAtsOptions, type WeakBullet } from "@/services/resume-analyzer/deep-ats";
import { callGemini } from "@/services/ai/client";
import type { AiRequest } from "@/types/ai";
import { getUserPlanLimits, checkUsageLimit, incrementUsage } from "@/lib/subscription";

export const dynamic = "force-dynamic";

interface AiDeepData {
  atsScore?: number;
  recruiterScore?: number;
  hiringProbability?: number;
  parserConfidence?: number;
  keywordMatch?: number;
  semanticMatch?: number;
  missingKeywords?: string[];
  missingSkills?: string[];
  keywordDensity?: string;
  grammarScore?: number;
  formattingIssues?: string[];
  weakBullets?: { original: string; rewrite: string }[];
  topImprovements?: { text: string; impact: string }[];
  verdict?: string;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function clampNumber(value: unknown): number | undefined {
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseAiData(parsed: unknown): AiDeepData | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const data: AiDeepData = {};

  const score = clampNumber(obj.atsScore);
  if (score !== undefined) data.atsScore = score;
  const recruiter = clampNumber(obj.recruiterScore);
  if (recruiter !== undefined) data.recruiterScore = recruiter;
  const hiring = clampNumber(obj.hiringProbability);
  if (hiring !== undefined) data.hiringProbability = hiring;
  const parser = clampNumber(obj.parserConfidence);
  if (parser !== undefined) data.parserConfidence = parser;
  const kwMatch = clampNumber(obj.keywordMatch);
  if (kwMatch !== undefined) data.keywordMatch = kwMatch;
  const semMatch = clampNumber(obj.semanticMatch);
  if (semMatch !== undefined) data.semanticMatch = semMatch;
  const grammar = clampNumber(obj.grammarScore);
  if (grammar !== undefined) data.grammarScore = grammar;

  const strings = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").slice(0, 30) : undefined;

  const missingKeywords = strings(obj.missingKeywords);
  if (missingKeywords) data.missingKeywords = missingKeywords;
  const missingSkills = strings(obj.missingSkills);
  if (missingSkills) data.missingSkills = missingSkills;
  const formattingIssues = strings(obj.formattingIssues);
  if (formattingIssues) data.formattingIssues = formattingIssues;
  if (typeof obj.keywordDensity === "string") data.keywordDensity = obj.keywordDensity;

  if (Array.isArray(obj.weakBullets)) {
    const bullets = obj.weakBullets
      .map((b) => {
        const item = b as Record<string, unknown>;
        if (typeof item.original !== "string" || !item.original.trim()) return null;
        return {
          original: item.original,
          rewrite: typeof item.rewrite === "string" ? item.rewrite : "",
        };
      })
      .filter((b): b is { original: string; rewrite: string } => b !== null)
      .slice(0, 10);
    if (bullets.length > 0) data.weakBullets = bullets;
  }

  if (Array.isArray(obj.topImprovements)) {
    const improvements = obj.topImprovements
      .map((t) => {
        const item = t as Record<string, unknown>;
        if (typeof item.text !== "string" || !item.text.trim()) return null;
        return {
          text: item.text,
          impact: typeof item.impact === "string" ? item.impact : "",
        };
      })
      .filter((t): t is { text: string; impact: string } => t !== null)
      .slice(0, 20);
    if (improvements.length > 0) data.topImprovements = improvements;
  }

  if (typeof obj.verdict === "string") data.verdict = obj.verdict;

  return data;
}

/** Merge AI enrichment over the deterministic report where values are provided. */
function mergeAiReport(report: DeepAtsReport, ai: AiDeepData): DeepAtsReport {
  const merged: DeepAtsReport = { ...report, topImprovements: [...report.topImprovements] };

  if (ai.atsScore !== undefined) {
    merged.atsScore = ai.atsScore;
    merged.grade = gradeFor(ai.atsScore);
  }
  if (ai.recruiterScore !== undefined) merged.recruiterScore = ai.recruiterScore;
  if (ai.hiringProbability !== undefined) merged.hiringProbability = ai.hiringProbability;
  if (ai.parserConfidence !== undefined) merged.parserConfidence = ai.parserConfidence;
  if (ai.grammarScore !== undefined) merged.grammarScore = ai.grammarScore;
  if (ai.missingKeywords) merged.missingKeywords = ai.missingKeywords;
  if (ai.verdict) merged.verdict = ai.verdict;
  if (ai.formattingIssues && ai.formattingIssues.length > 0) merged.formattingIssues = ai.formattingIssues;

  if (ai.weakBullets && ai.weakBullets.length > 0) {
    const weak: WeakBullet[] = ai.weakBullets.map((b) => ({
      bullet: b.original,
      reason: "AI rewrite — see improved version",
      rewrite: b.rewrite,
    }));
    merged.bullets = {
      total: merged.bullets.total,
      strong: Math.max(0, merged.bullets.total - weak.length),
      weak,
    };
  }

  if (ai.topImprovements && ai.topImprovements.length > 0) {
    merged.topImprovements = ai.topImprovements.map((t) => ({
      text: t.text,
      impact: t.impact,
      points: parseImpactPoints(t.impact),
    }));
  }

  // Keep derived metrics consistent with the (possibly AI) recruiter score.
  merged.interviewChance = merged.recruiterScore >= 75 ? "YES" : merged.recruiterScore >= 55 ? "MAYBE" : "NO";
  merged.hiringProbability = Math.round(merged.atsScore * 0.5 + merged.recruiterScore * 0.5);
  return merged;
}

function gradeFor(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 50) return "C";
  if (score >= 40) return "D";
  return "F";
}

function parseImpactPoints(impact: string): number {
  const match = impact.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function buildResumeText(resume: Awaited<ReturnType<typeof getResume>>): string {
  const parts: string[] = [];
  parts.push(resume.personalInfo.fullName);
  parts.push(resume.summary);
  for (const exp of resume.experience) {
    parts.push(`${exp.role} at ${exp.company} (${exp.startDate} - ${exp.current ? "Present" : exp.endDate})`);
    parts.push(...exp.responsibilities);
    parts.push(...exp.achievements);
  }
  for (const edu of resume.education) parts.push(`${edu.degree} at ${edu.institution} (${edu.endDate})`);
  for (const proj of resume.projects) parts.push(`${proj.name}: ${proj.description}`);
  const skills = resume.skills;
  parts.push([...skills.technical, ...skills.soft, ...skills.tools, ...skills.frameworks].join(", "));
  if (resume.certifications?.length) parts.push("Certifications: " + resume.certifications.map((c) => c.name).join(", "));
  if (resume.projects?.length) {
    for (const p of resume.projects) if (p.technologies?.length) parts.push(`Technologies: ${p.technologies.join(", ")}`);
  }
  return parts.join("\n");
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const limits = await getUserPlanLimits(session.user.id);
  const usageCheck = await checkUsageLimit(session.user.id, "ats_checks", limits.maxAtsChecks);
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Monthly ATS check limit reached. Upgrade to Pro for unlimited checks." },
      { status: 403 }
    );
  }

  const contentType = request.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  let text = "";
  let resumeId = "";
  let resumeTitle = "";
  let jobTitle = "";
  let jobDescription = "";
  let category: DeepAtsOptions["category"] = "experienced";

  try {
    if (isMultipart) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      resumeId = (formData.get("resumeId") as string | null) || "";
      jobTitle = ((formData.get("jobTitle") as string | null) || "").trim();
      jobDescription = ((formData.get("jobDescription") as string | null) || "").trim();
      const cat = formData.get("category") as string | null;
      if (cat && ["student", "fresher", "experienced", "internship"].includes(cat)) category = cat as DeepAtsOptions["category"];

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const parsed = await analyzeResumeFile(buffer, file.name, category).catch(() => null);
        if (!parsed) return NextResponse.json({ success: false, error: "Could not read the uploaded resume. Use PDF, DOCX, or TXT." }, { status: 400 });
        text = parsed.parsed.text;
        resumeTitle = file.name;
      } else if (resumeId) {
        const resume = await getResume(resumeId, session.user.id);
        text = buildResumeText(resume);
        resumeTitle = resume.title;
      } else {
        return NextResponse.json({ success: false, error: "Upload a file or select a resume." }, { status: 400 });
      }
    } else {
      const body = await request.json().catch(() => ({}));
      resumeId = typeof body.resumeId === "string" ? body.resumeId : "";
      jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
      jobDescription = typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
      const cat = body.category as string | undefined;
      if (cat && ["student", "fresher", "experienced", "internship"].includes(cat)) category = cat as DeepAtsOptions["category"];

      if (resumeId) {
        const resume = await getResume(resumeId, session.user.id);
        text = buildResumeText(resume);
        resumeTitle = resume.title;
      } else if (typeof body.text === "string" && body.text.trim().length >= 10) {
        text = body.text.trim();
        resumeTitle = "Pasted resume";
      } else {
        return NextResponse.json({ success: false, error: "Paste a resume, select one of your resumes, or upload a file." }, { status: 400 });
      }
    }

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ success: false, error: "Resume text must be at least 10 characters." }, { status: 400 });
    }

    // 1) Deterministic deep scan — always runs, works without a job description.
    let report = analyzeDeepAts({ text, category, jobTitle, jobDescription });

    // 2) AI enrichment — best-effort; failures fall back to the heuristic report.
    let aiStatus: "ai" | "heuristic" = "heuristic";
    let semanticMatch: number | undefined;
    let keywordMatch: number | undefined;
    let keywordDensityNote: string | undefined;

    try {
      const jobText = [jobTitle, jobDescription].filter(Boolean).join("\n");
      const contextParts = [text.substring(0, 8000)];
      if (jobDescription) contextParts.push(`\nJOB DESCRIPTION:\n${jobDescription.substring(0, 3000)}`);
      const aiRequest: AiRequest = {
        action: "ats-deep-analyze",
        input: jobTitle || (jobDescription ? "Not provided" : "Not provided — score the resume on its own headings and keywords"),
        context: contextParts.join("\n\n"),
      };
      const ai = await callGemini(aiRequest);
      if (ai.success && ai.output) {
        const parsed = parseAiData(extractJson(ai.output));
        if (parsed) {
          // Don't render AI weak bullets the resume doesn't actually contain.
          if (parsed.weakBullets) {
            parsed.weakBullets = parsed.weakBullets.filter((b) =>
              text.toLowerCase().includes(b.original.toLowerCase())
            );
          }
          report = mergeAiReport(report, parsed);
          aiStatus = "ai";
          semanticMatch = parsed.semanticMatch;
          keywordMatch = parsed.keywordMatch;
          keywordDensityNote = parsed.keywordDensity;
        }
      }
    } catch {
      aiStatus = "heuristic";
    }

    // 3) Persist history when the resume belongs to the user.
    if (resumeId) {
      try {
        const supabase = await createServerSupabaseClient();
        await supabase.from("ats_analyses").insert({
          user_id: session.user.id,
          resume_id: resumeId,
          resume_title: resumeTitle,
          score: report.atsScore,
          breakdown: JSON.stringify({
            recruiter: report.recruiterScore,
            hiringProbability: report.hiringProbability,
            grade: report.grade,
            ai: aiStatus,
            keywordScan: report.keywordScan,
          }),
        });
      } catch {
        // Non-fatal — analysis still succeeds.
      }
    }

    await incrementUsage(session.user.id, "ats_checks");

    return NextResponse.json({
      success: true,
      data: report,
      ai: { status: aiStatus, semanticMatch, keywordMatch, keywordDensityNote },
      resumeId: resumeId || null,
      resumeTitle,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
