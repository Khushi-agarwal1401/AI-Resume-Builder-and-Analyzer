import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callGemini } from "@/services/ai/client";
import type { AiRequest } from "@/types/ai";
import { TEMPLATE_VARIANTS, TEMPLATE_NAMES } from "@/features/resume-builder/config/template-constants";
import { getTemplateInfo } from "@/features/resume-builder/config/template-discovery";
import {
  recommendTemplate,
  type ExperienceLevel,
} from "@/features/resume-builder/config/template-recommendation";

export const dynamic = "force-dynamic";

interface RecommendBody {
  jobTitle?: string;
  jobDescription?: string;
  targetLevel?: string;
  /** Selected projects the candidate plans to showcase (name | description | language). */
  projects?: { name?: string; description?: string; language?: string }[];
}

interface TemplateRecommendationData {
  templateId: string;
  name: string;
  score: number;
  reason: string;
  bullets: string[];
  atsScore: number;
  recruiterAppeal: string;
  source: "ai" | "deterministic";
}

/** Parse and validate a Gemini-shaped recommendation against the known catalog. */
function normalizeRecommendation(parsed: unknown): Pick<TemplateRecommendationData, "templateId" | "score" | "reason" | "bullets"> | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  const templateId = typeof obj.templateId === "string" ? obj.templateId.trim() : "";
  // Accept a kebab/camel mismatch from the model by normalizing to kebab-case.
  const normalized = templateId.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  if (!TEMPLATE_VARIANTS.includes(normalized as (typeof TEMPLATE_VARIANTS)[number])) return null;

  const score = Number(obj.score);
  const reason = typeof obj.reason === "string" ? obj.reason : "";
  const bullets = Array.isArray(obj.bullets)
    ? obj.bullets.filter((b): b is string => typeof b === "string").slice(0, 4)
    : [];

  return { templateId: normalized, score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0, reason, bullets };
}

function extractJson(text: string): unknown {
  // Gemini sometimes wraps JSON in ```json fences — strip them.
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

/** Map a resume target level to the recommendation engine's experience bucket. */
function mapTargetLevel(targetLevel?: string): ExperienceLevel {
  switch (targetLevel) {
    case "student":
      return "student";
    case "student_internship":
      return "entry";
    case "experienced":
      return "senior";
    case "fresher":
    default:
      return "entry";
  }
}

function buildFallback(body: RecommendBody): TemplateRecommendationData {
  const jobTitle = (body.jobTitle || "").trim();
  const jobDescription = (body.jobDescription || "").trim();
  // The engine scores industry keywords; pass the description as industry text
  // so terms like "fintech" or "edtech" nudge the layout correctly.
  const recommendation = recommendTemplate({
    role: jobTitle,
    experience: mapTargetLevel(body.targetLevel),
    industry: jobDescription,
  });
  return {
    templateId: recommendation.key,
    name: recommendation.name,
    score: recommendation.atsScore,
    reason: recommendation.reason,
    bullets: recommendation.bullets,
    atsScore: recommendation.atsScore,
    recruiterAppeal: recommendation.recruiterAppeal,
    source: "deterministic",
  };
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as RecommendBody;
  const jobTitle = (body.jobTitle || "").trim();
  const jobDescription = (body.jobDescription || "").trim();
  const jobText = [jobTitle, jobDescription].filter(Boolean).join("\n");

  if (!jobText) {
    return NextResponse.json(
      { success: false, error: "Add a job title or job description so the AI can recommend a template." },
      { status: 400 }
    );
  }

  // Build the template catalog context for the model.
  const templateLines = TEMPLATE_VARIANTS.map((key) => {
    const info = getTemplateInfo(key, TEMPLATE_NAMES[key]);
    return `${key} | ${info.name} | ATS ${info.atsScore}/100 | ${info.layout} | ${info.bestFor} | ${info.tags.join(", ")}`;
  }).join("\n");

  const projects = Array.isArray(body.projects) ? body.projects.slice(0, 30) : [];
  const projectLines = projects
    .map((p) => `${p.name || "unnamed"} | ${p.description || "no description"} | ${p.language || "n/a"}`)
    .join("\n");

  const context = projectLines
    ? `${templateLines}\n\nCandidate's selected projects (name | description | language):\n${projectLines}`
    : templateLines;

  const aiRequest: AiRequest = {
    action: "recommend-template",
    input: jobText,
    context,
  };

  try {
    const ai = await callGemini(aiRequest);
    if (ai.success && ai.output) {
      const normalized = normalizeRecommendation(extractJson(ai.output));
      if (normalized) {
        const name = TEMPLATE_NAMES[normalized.templateId as (typeof TEMPLATE_VARIANTS)[number]];
        const info = getTemplateInfo(normalized.templateId, name);
        return NextResponse.json({
          success: true,
          data: {
            templateId: normalized.templateId,
            name,
            score: normalized.score,
            reason: normalized.reason || `Best fit — ${info.bestFor}.`,
            bullets: normalized.bullets,
            atsScore: info.atsScore,
            recruiterAppeal: info.recruiterAppeal,
            source: "ai",
          } satisfies TemplateRecommendationData,
        });
      }
    }
  } catch {
    // fall through to deterministic
  }

  // Deterministic fallback (AI down, quota exceeded, or garbage response).
  return NextResponse.json({ success: true, data: buildFallback(body) });
}
