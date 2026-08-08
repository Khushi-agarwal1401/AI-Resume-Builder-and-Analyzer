import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callGemini } from "@/services/ai/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUserPlanLimits, checkUsageLimit, incrementUsage } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";
import { getResumeUpdates } from "@/services/resume-updates/service";
import type { AiRequest } from "@/types/ai";

export const dynamic = "force-dynamic";

export interface RepoSuggestion {
  name: string;
  reason: string;
}

/**
 * POST /api/github/suggest
 * Body: { targetRole: string }
 * Uses Gemini to recommend 3-5 of the user's repos most relevant to a target
 * role, with one-line reasons. Results are returned as structured JSON.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const allowed = await checkRateLimit(`github-suggest:${ip}`, 10, 60000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please try again shortly." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const targetRole = (typeof body?.targetRole === "string" ? body.targetRole : "").trim();
  if (!targetRole) {
    return NextResponse.json(
      { success: false, error: "A target role is required." },
      { status: 400 }
    );
  }

  // Usage limit: suggestions consume the user's AI action quota (admins exempt)
  if (!(await isAdmin(session.user.id, session.user.email || ""))) {
    const limits = await getUserPlanLimits(session.user.id);
    const usageCheck = await checkUsageLimit(session.user.id, "ai_actions", limits.maxAiActions);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Monthly AI action limit reached. Upgrade to Pro for unlimited actions." },
        { status: 403 }
      );
    }
  }

  try {
    // Accept repos directly from the client (username-import flow, A-07):
    // [{ name, description?, language?, stars? }] — falls back to the user's
    // resume_updates rows when not provided.
    let repos: Array<{ name: string; description?: string; language?: string; stars?: number }> = [];
    if (Array.isArray(body?.repos) && body.repos.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repos = (body.repos as any[])
        .filter((r) => r && typeof r.name === "string")
        .map((r) => ({
          name: r.name,
          description: typeof r.description === "string" ? r.description : "",
          language: typeof r.language === "string" ? r.language : "",
          stars: Number(r.stars || 0),
        }))
        .slice(0, 30);
    } else {
      const updates = await getResumeUpdates(session.user.id);
      repos = updates.map((u: Record<string, unknown>) => ({
        name: String(u.repo_name || ""),
        description: (u.repo_description as string) || "",
        language: (u.repo_language as string) || "",
        stars: Number(u.repo_stars || 0),
      }));
    }

    if (repos.length === 0) {
      return NextResponse.json(
        { success: false, error: "No repositories to suggest from yet. Import a GitHub username first." },
        { status: 400 }
      );
    }

    const aiRequest: AiRequest = {
      action: "github-repo-suggest",
      input: JSON.stringify(repos),
      context: targetRole,
    };

    const result = await callGemini(aiRequest);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "AI request failed" }, { status: 502 });
    }

    await incrementUsage(session.user.id, "ai_actions");

    // Parse the JSON array from the model output (strip markdown fences if present)
    let suggestions: RepoSuggestion[] = [];
    const raw = result.output.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        suggestions = parsed
          .filter((s) => s && typeof s.name === "string" && typeof s.reason === "string")
          .map((s) => ({ name: s.name, reason: s.reason }))
          .slice(0, 5);
      }
    } catch {
      // Non-JSON output — fall back to line-based parsing
      suggestions = raw
        .split("\n")
        .filter((line) => line.includes(":"))
        .map((line) => {
          const [name, ...reasonParts] = line.split(":");
          return { name: name.trim(), reason: reasonParts.join(":").trim() };
        })
        .filter((s) => s.name && s.reason)
        .slice(0, 5);
    }

    if (suggestions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Could not parse AI suggestions. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: suggestions });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
