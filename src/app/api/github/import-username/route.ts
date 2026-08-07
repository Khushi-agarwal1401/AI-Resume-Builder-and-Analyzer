import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGitHubAccessToken } from "@/lib/github";

export const dynamic = "force-dynamic";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}[a-zA-Z0-9])?$/;

/**
 * POST /api/github/import-username
 * Body: { username: string }
 * Fetches a GitHub user's public repositories by username — no OAuth
 * required. Uses the connected token when available for higher rate
 * limits, otherwise falls back to the public (unauthenticated) API.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body?.username === "string" ? body.username.trim() : "";

  if (!username) {
    return NextResponse.json(
      { success: false, error: "A GitHub username is required." },
      { status: 400 }
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { success: false, error: "That doesn't look like a valid GitHub username." },
      { status: 400 }
    );
  }

  // Use the connected token when present (higher rate limit), else anonymous
  let token: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("github_connected")
      .eq("id", session.user.id)
      .single();
    if (profile?.github_connected) {
      token = await getGitHubAccessToken(session.user.id);
    }
  } catch {
    token = null;
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ai-resume-builder",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      { headers, cache: "no-store" }
    );

    if (res.status === 404) {
      return NextResponse.json(
        { success: false, error: `No GitHub user named "${username}" was found.` },
        { status: 404 }
      );
    }
    if (res.status === 403 || res.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: token
            ? "GitHub rate limit reached. Please try again later."
            : "GitHub's anonymous rate limit was reached. Connect your GitHub account to import more.",
        },
        { status: 403 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "GitHub API request failed. Please try again." },
        { status: 502 }
      );
    }

    const repos = (await res.json()) as GitHubRepo[];

    if (repos.length === 0) {
      return NextResponse.json(
        { success: false, error: `"${username}" has no public repositories.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      username,
      data: {
        username,
        repos: repos.map((r) => ({
          id: r.id,
          name: r.full_name || r.name,
          description: r.description || "",
          url: r.html_url,
          language: r.language || "",
          stars: r.stargazers_count || 0,
          forks: r.forks_count || 0,
        })),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not reach GitHub. Please try again." },
      { status: 502 }
    );
  }
}
