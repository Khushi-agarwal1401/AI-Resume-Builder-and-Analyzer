import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPlanLimits } from "@/lib/subscription";
import { githubFetch } from "@/lib/github";
import { insertProjectFromRepo } from "@/services/resume-updates/service";

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

interface SearchResponse {
  items?: GitHubRepo[];
}

/**
 * GET /api/github/trending?q=react&sort=stars&order=desc&per_page=10
 * Search GitHub's public repo index for trending repositories (A-20).
 *
 * POST /api/github/trending
 * Body: { repoName, repoDescription?, repoUrl?, repoLanguage?, resumeId }
 * Insert the selected repo as a project on the chosen resume.
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

  const query = (request.nextUrl.searchParams.get("q") || "").trim();
  if (!query) {
    return NextResponse.json(
      { success: false, error: "A search query is required (e.g. ?q=react)." },
      { status: 400 }
    );
  }

  try {
    const sort = request.nextUrl.searchParams.get("sort") || "stars";
    const order = request.nextUrl.searchParams.get("order") || "desc";
    const perPage = Math.min(Math.max(Number(request.nextUrl.searchParams.get("per_page") || 10), 1), 30);

    const data = await githubFetch<SearchResponse>(
      session.user.id,
      `/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&per_page=${perPage}`
    );

    const repos = (data.items || []).map((r) => ({
      id: r.id,
      name: r.full_name || r.name,
      description: r.description || "",
      url: r.html_url,
      language: r.language || "",
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
    }));

    return NextResponse.json({ success: true, data: repos });
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
  const repoDescription = typeof body?.repoDescription === "string" ? body.repoDescription : "";
  const repoUrl = typeof body?.repoUrl === "string" ? body.repoUrl.trim() : "";
  const repoLanguage = typeof body?.repoLanguage === "string" ? body.repoLanguage : "";
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
      description: repoDescription,
      url: repoUrl,
      language: repoLanguage,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
