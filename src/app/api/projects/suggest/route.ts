import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callGemini } from "@/services/ai/client";
import type { AiRequest } from "@/types/ai";
import {
  suggestProjectsDeterministic,
  type RepoCandidate,
  type ProjectSuggestions,
} from "@/services/projects/suggest";

export const dynamic = "force-dynamic";

interface SuggestBody {
  jobTitle?: string;
  jobDescription?: string;
  repos?: RepoCandidate[];
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

/** Validate and normalize an AI-shaped suggestions object against the repo list. */
function normalizeSuggestions(
  parsed: unknown,
  repos: RepoCandidate[]
): ProjectSuggestions | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const validNames = new Set(repos.map((r) => r.name));

  const rankingsRaw = Array.isArray(obj.rankings) ? obj.rankings : [];
  const additionsRaw = Array.isArray(obj.suggestedAdditions) ? obj.suggestedAdditions : [];

  const rankings = rankingsRaw
    .map((r) => {
      const item = r as Record<string, unknown>;
      const repo = typeof item.repo === "string" ? item.repo.trim() : "";
      if (!validNames.has(repo)) return null;
      const score = Number(item.score);
      return {
        repo,
        score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
        reason: typeof item.reason === "string" ? item.reason : "",
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.score - a.score);

  const suggestedAdditions = additionsRaw
    .map((a) => {
      const item = a as Record<string, unknown>;
      const repo = typeof item.repo === "string" ? item.repo.trim() : "";
      if (!validNames.has(repo)) return null;
      return {
        repo,
        reason: typeof item.reason === "string" ? item.reason : "",
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  if (rankings.length === 0) return null;
  return { rankings: rankings.slice(0, 8), suggestedAdditions: suggestedAdditions.slice(0, 4) };
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as SuggestBody;
  const repos = Array.isArray(body.repos) ? body.repos.slice(0, 60) : [];
  if (repos.length === 0) {
    return NextResponse.json(
      { success: false, error: "Provide at least one repository to rank." },
      { status: 400 }
    );
  }

  const jobTitle = (body.jobTitle || "").trim();
  const jobDescription = (body.jobDescription || "").trim();
  const jobText = [jobTitle, jobDescription].filter(Boolean).join("\n");

  // No job context → nothing meaningful to rank against.
  if (!jobText) {
    return NextResponse.json(
      {
        success: false,
        error: "Add a job title or job description to rank your projects against.",
      },
      { status: 400 }
    );
  }

  const aiRequest: AiRequest = {
    action: "suggest-projects",
    input: jobText,
    context: repos
      .map((r) => `${r.name} | ${r.description || "no description"} | ${r.language || "n/a"}`)
      .join("\n"),
  };

  try {
    const ai = await callGemini(aiRequest);
    if (ai.success && ai.output) {
      const parsed = extractJson(ai.output);
      const normalized = normalizeSuggestions(parsed, repos);
      if (normalized) {
        return NextResponse.json({ success: true, data: normalized, source: "ai" });
      }
    }
  } catch {
    // fall through to deterministic
  }

  // Deterministic fallback (AI down, quota exceeded, or garbage response).
  return NextResponse.json({
    success: true,
    data: suggestProjectsDeterministic(repos, jobText),
    source: "deterministic",
  });
}
