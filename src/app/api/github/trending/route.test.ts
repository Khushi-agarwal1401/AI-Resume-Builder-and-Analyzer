import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/subscription", () => ({
  getUserPlanLimits: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  githubFetch: vi.fn(),
}));

vi.mock("@/services/resume-updates/service", () => ({
  insertProjectFromRepo: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getUserPlanLimits } from "@/lib/subscription";
import { githubFetch } from "@/lib/github";
import { insertProjectFromRepo } from "@/services/resume-updates/service";
import { GET, POST } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetUserPlanLimits = vi.mocked(getUserPlanLimits);
const mockGithubFetch = vi.mocked(githubFetch);
const mockInsertProjectFromRepo = vi.mocked(insertProjectFromRepo);

function trendingRequest(url: string, init?: RequestInit) {
  return new NextRequest(
    url,
    init as unknown as ConstructorParameters<typeof NextRequest>[1]
  );
}

const SEARCH_REPOS = {
  items: [
    {
      id: 1,
      name: "repo-a",
      full_name: "octocat/repo-a",
      html_url: "https://github.com/octocat/repo-a",
      description: "A great repo",
      language: "TypeScript",
      stargazers_count: 42,
      forks_count: 3,
    },
  ],
};

describe("GET /api/github/trending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(trendingRequest("http://localhost:3000/api/github/trending?q=react"));

    expect(res.status).toBe(401);
    expect(mockGithubFetch).not.toHaveBeenCalled();
  });

  it("returns 403 with upgradeRequired when GitHub sync is not in the plan", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: false } as never);

    const res = await GET(trendingRequest("http://localhost:3000/api/github/trending?q=react"));

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ success: false, upgradeRequired: true });
    expect(mockGithubFetch).not.toHaveBeenCalled();
  });

  it("returns 400 when the search query is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: true } as never);

    const res = await GET(trendingRequest("http://localhost:3000/api/github/trending"));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("search query is required");
    expect(mockGithubFetch).not.toHaveBeenCalled();
  });

  it("clamps per_page to the 1..30 range", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: true } as never);
    mockGithubFetch.mockResolvedValue(SEARCH_REPOS);

    await GET(
      trendingRequest("http://localhost:3000/api/github/trending?q=react&per_page=999")
    );

    const [userId, path] = mockGithubFetch.mock.calls[0];
    expect(userId).toBe("user-123");
    expect(path).toContain("per_page=30");
  });

  it("maps search results to the camelCase repo shape", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: true } as never);
    mockGithubFetch.mockResolvedValue(SEARCH_REPOS);

    const res = await GET(
      trendingRequest("http://localhost:3000/api/github/trending?q=react&sort=stars&order=desc&per_page=10")
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual([
      {
        id: 1,
        name: "octocat/repo-a",
        description: "A great repo",
        url: "https://github.com/octocat/repo-a",
        language: "TypeScript",
        stars: 42,
        forks: 3,
      },
    ]);
    const [userId, path] = mockGithubFetch.mock.calls[0];
    expect(userId).toBe("user-123");
    expect(path).toContain("q=react");
    expect(path).toContain("sort=stars");
  });

  it("returns 500 when the GitHub search fails", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: true } as never);
    mockGithubFetch.mockRejectedValue(new Error("GitHub API request failed. Please try again."));

    const res = await GET(trendingRequest("http://localhost:3000/api/github/trending?q=react"));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("GitHub API request failed. Please try again.");
  });
});

describe("POST /api/github/trending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(
      trendingRequest("http://localhost:3000/api/github/trending", {
        method: "POST",
        body: JSON.stringify({ repoName: "octocat/repo-a", resumeId: "r1" }),
      })
    );

    expect(res.status).toBe(401);
    expect(mockInsertProjectFromRepo).not.toHaveBeenCalled();
  });

  it("returns 400 when repoName or resumeId is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });

    const res = await POST(
      trendingRequest("http://localhost:3000/api/github/trending", {
        method: "POST",
        body: JSON.stringify({ repoName: "octocat/repo-a" }),
      })
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("repoName and resumeId are required");
    expect(mockInsertProjectFromRepo).not.toHaveBeenCalled();
  });

  it("inserts the repo as a project and returns success", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockInsertProjectFromRepo.mockResolvedValue({ resumeId: "r1" });

    const res = await POST(
      trendingRequest("http://localhost:3000/api/github/trending", {
        method: "POST",
        body: JSON.stringify({
          repoName: " octocat/repo-a ",
          repoDescription: "A great repo",
          repoUrl: "https://github.com/octocat/repo-a",
          repoLanguage: "TypeScript",
          resumeId: "r1",
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockInsertProjectFromRepo).toHaveBeenCalledWith("user-123", "r1", {
      name: "octocat/repo-a",
      description: "A great repo",
      url: "https://github.com/octocat/repo-a",
      language: "TypeScript",
    });
  });

  it("returns 500 when the insert fails", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockInsertProjectFromRepo.mockRejectedValue(new Error("Resume not found"));

    const res = await POST(
      trendingRequest("http://localhost:3000/api/github/trending", {
        method: "POST",
        body: JSON.stringify({ repoName: "octocat/repo-a", resumeId: "r1" }),
      })
    );

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Resume not found");
  });
});
