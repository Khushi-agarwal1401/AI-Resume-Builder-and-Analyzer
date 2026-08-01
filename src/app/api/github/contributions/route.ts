import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPlanLimits } from "@/lib/subscription";
import { githubFetch } from "@/lib/github";
import { insertProjectFromRepo } from "@/services/resume-updates/service";

export const dynamic = "force-dynamic";

interface GitHubEvent {
  type: string;
  repo?: { name?: string; url?: string };
}

function repoFromEvent(event: GitHubEvent): { name: string; url: string } | null {
  if (!event.repo?.name) return null;
  return {
    name: event.repo.name,
    url: event.repo.url?.replace("api.github.com/repos", "github.com") || "",
  };
}

/**
 * GET /api/github/contributions?per_page=30
 * Detect open-source repos the user recently contributed to (PushEvent /
 * PullRequestEvent / IssueCommentEvent / IssuesEvent) via /users/{login}/events.
 *
 * POST /api/github/contributions
 * Body: { repoName, repoUrl?, resumeId } — insert the contribution as a
 * project on the chosen resume (A-20).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const limits = await getUserPlanLimits(session.user.id);
  if (!limits.hasGitHubSync) {
    return NextResponse.json(
      {
        success: false,
        error: "GitHub sync is a Pro feature. Upgrade to Pro to use it.",
        upgradeRequired: true,
      },
      { status: 403 }
    );
  }

  try {
    const me = await githubFetch<{ login: string }>(session.user.id, "/user");
    const perPage = Math.min(Math.max(Number(request.nextUrl.searchParams.get("per_page") || 30), 1), 100);

    const events = await githubFetch<GitHubEvent[]>(session.user.id, `/users/${me.login}/events?per_page=${perPage}`);

    // Contribution-relevant event types; prefer commit pushes over everything
    const contributionTypes = new Set([
      "PushEvent",
      "PullRequestEvent",
      "PullRequestReviewEvent",
      "PullRequestReviewCommentEvent",
      "IssueCommentEvent",
      "IssuesEvent",
      "CreateEvent",
      "ForkEvent",
    ]);

    const seen = new Set<string>();
    const contributions: Array<{ name: string; url: string; type: string }> = [];

    for (const event of events) {
      if (!contributionTypes.has(event.type)) continue;
      const repo = repoFromEvent(event);
      if (!repo || seen.has(repo.name)) continue;
      seen.add(repo.name);
      contributions.push({ ...repo, type: event.type });
      if (contributions.length >= 20) break;
    }

    return NextResponse.json({ success: true, data: contributions });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const repoName = typeof body?.repoName === "string" ? body.repoName.trim() : "";
  const repoUrl = typeof body?.repoUrl === "string" ? body.repoUrl.trim() : "";
  const resumeId = typeof body?.resumeId === "string" ? body.resumeId : "";

  if (!repoName || !resumeId) {
    return NextResponse.json(
      { success: false, error: "repoName and resumeId are required." },
      { status: 400 }
    );
  }

  try {
    await insertProjectFromRepo(session.user.id, resumeId, {
      name: repoName,
      description: "",
      url: repoUrl,
      language: "",
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
