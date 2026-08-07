import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { insertProjectFromRepo } from "@/services/resume-updates/service";
import { fail, logError } from "@/lib/api";

export const dynamic = "force-dynamic";

const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}[a-zA-Z0-9])?$/;

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
 * GET /api/github/contributions?username=octocat&per_page=30
 * Detect open-source repos the user recently contributed to (PushEvent /
 * PullRequestEvent / IssueCommentEvent / IssuesEvent) via the PUBLIC
 * /users/{username}/events endpoint — no OAuth token required.
 *
 * POST /api/github/contributions
 * Body: { repoName, repoUrl?, resumeId } — insert the contribution as a
 * project on the chosen resume (A-20).
 */
export async function GET(request: NextRequest) {
  const username = (request.nextUrl.searchParams.get("username") || "").trim();
  if (!username) {
    return NextResponse.json(
      { success: false, error: "username query param is required" },
      { status: 400 }
    );
  }
  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { success: false, error: "That doesn't look like a valid GitHub username." },
      { status: 400 }
    );
  }

  try {
    const perPage = Math.min(Math.max(Number(request.nextUrl.searchParams.get("per_page") || 30), 1), 100);

    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/events?per_page=${perPage}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "ai-resume-builder",
        },
        cache: "no-store",
      }
    );

    if (res.status === 404) {
      return NextResponse.json(
        { success: false, error: `No GitHub user named "${username}" was found.` },
        { status: 404 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            res.status === 403 || res.status === 429
              ? "GitHub's anonymous rate limit was reached. Please try again in a minute."
              : "GitHub API request failed. Please try again.",
        },
        { status: res.status === 403 || res.status === 429 ? 403 : 502 }
      );
    }

    const events = (await res.json()) as GitHubEvent[];

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
    await logError(err, "github contributions");
    return fail("Failed to load GitHub contributions. Please try again.");
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
    await logError(err, "add contribution to resume");
    return fail("Failed to add the contribution to your resume. Please try again.");
  }
}
