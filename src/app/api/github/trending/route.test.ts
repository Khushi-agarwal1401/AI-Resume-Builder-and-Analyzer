import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/services/resume-updates/service", () => ({
  insertProjectFromRepo: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { insertProjectFromRepo } from "@/services/resume-updates/service";
import { GET, POST } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockInsertProjectFromRepo = vi.mocked(insertProjectFromRepo);

const originalFetch = global.fetch;

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

function mockFetchSuccess(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status,
    json: vi.fn().mockResolvedValue(data),
    headers: { get: () => null },
  });
}

function mockFetchError(status = 500, errorMsg = "GitHub API error") {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: vi.fn().mockResolvedValue({ message: errorMsg }),
    headers: { get: () => null },
  });
}

describe("GET /api/github/trending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllGlobals();
  });

  it("returns 400 when the search query is missing", async () => {
    const res = await GET(trendingRequest("http://localhost:3000/api/github/trending"));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("search query is required");
  });

  it("clamps per_page to the 1..30 range", async () => {
    global.fetch = mockFetchSuccess({ items: [] });

    await GET(trendingRequest("http://localhost:3000/api/github/trending?q=react&per_page=999"));

    const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callUrl).toContain("per_page=30");
  });

  it("maps search results to the camelCase repo shape", async () => {
    global.fetch = mockFetchSuccess(SEARCH_REPOS);

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
    const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callUrl).toContain("q=react");
    expect(callUrl).toContain("sort=stars");
    expect(callUrl).toContain("order=desc");
    const callHeaders = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]?.headers;
    expect(callHeaders).toEqual(expect.objectContaining({ "User-Agent": "ai-resume-builder" }));
  });

  it("returns 403 when anonymous rate limit hit", async () => {
    global.fetch = mockFetchError(403, "API rate limit exceeded");

    const res = await GET(trendingRequest("http://localhost:3000/api/github/trending?q=react"));

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      success: false,
      error: "GitHub's anonymous rate limit was reached. Please try again in a minute.",
    });
  });

  it("returns 500 when the GitHub search fails with unexpected error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    const res = await GET(trendingRequest("http://localhost:3000/api/github/trending?q=react"));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to search GitHub repositories. Please try again.");
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
    expect((await res.json()).error).toBe("Failed to add the repository to your resume. Please try again.");
  });
});