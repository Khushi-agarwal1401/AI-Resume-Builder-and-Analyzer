import type { DbClient } from "@/lib/db/query-builder";
import type { Database } from "@/lib/db/types";
import { analyzeDeepAts, type DeepAtsReport, type DeepAtsOptions, type WeakBullet } from "./deep-ats";
import { callAi } from "../ai/client";
import type { AiRequest } from "../../types/ai";

export interface AtsPipelineInput {
  text: string;
  category: DeepAtsOptions["category"];
  jobTitle?: string;
  jobDescription?: string;
}

export interface AtsPipelineResult {
  report: DeepAtsReport;
  ai: {
    status: "ai" | "heuristic";
    semanticMatch?: number;
    keywordMatch?: number;
    keywordDensityNote?: string;
  };
}

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
}function extractJson(text: string): unknown {
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

  // Blend the AI's JD keyword match with the deterministic weighted match so
  // the headline "job match" number benefits from both signals.
  if (ai.keywordMatch !== undefined && merged.jdMatchScore > 0) {
    merged.jdMatchScore = Math.round(ai.keywordMatch * 0.5 + merged.jdMatchScore * 0.5);
    merged.subscores.keywordRelevance = merged.jdMatchScore;
  }

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

/**
 * Full ATS analysis: deterministic deep scan, then best-effort Gemini
 * enrichment. Shared by the sync route and the background worker so both
 * produce identical reports.
 */
export async function runAtsPipeline(input: AtsPipelineInput): Promise<AtsPipelineResult> {
  const { text, category, jobTitle, jobDescription } = input;

  let report = analyzeDeepAts({ text, category, jobTitle, jobDescription });

  let aiStatus: "ai" | "heuristic" = "heuristic";
  let semanticMatch: number | undefined;
  let keywordMatch: number | undefined;
  let keywordDensityNote: string | undefined;

  try {
    const contextParts = [text.substring(0, 8000)];
    if (jobDescription) contextParts.push(`\nJOB DESCRIPTION:\n${jobDescription.substring(0, 3000)}`);
    const aiRequest: AiRequest = {
      action: "ats-deep-analyze",
      input: jobTitle || (jobDescription ? "Not provided" : "Not provided — score the resume on its own headings and keywords"),
      context: contextParts.join("\n\n"),
    };
    const ai = await callAi(aiRequest);
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

  return { report, ai: { status: aiStatus, semanticMatch, keywordMatch, keywordDensityNote } };
}

/** Persist analysis history + the stored ATS score on the resume. */
export async function persistAtsResult(
  db: DbClient<Database>,
  input: {
    userId: string;
    resumeId: string;
    resumeTitle: string;
    report: DeepAtsReport;
    aiStatus: string;
  }
): Promise<void> {
  const breakdown = {
    recruiter: input.report.recruiterScore,
    hiringProbability: input.report.hiringProbability,
    grade: input.report.grade,
    ai: input.aiStatus,
    keywordScan: input.report.keywordScan,
    jdMatch: input.report.jdMatchScore,
    jobTitleMatched: input.report.jobTitleMatched,
  };
  await db.from("ats_analyses").insert({
    user_id: input.userId,
    resume_id: input.resumeId,
    resume_title: input.resumeTitle,
    score: input.report.atsScore,
    breakdown,
  });
  // Scope by user_id even through the service-role client so we never touch
  // another user's resume.
  await db
    .from("resumes")
    .update({ ats_score: input.report.atsScore, ats_breakdown: breakdown })
    .eq("id", input.resumeId)
    .eq("user_id", input.userId);
}
