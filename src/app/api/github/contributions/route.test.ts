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

function contributionsRequest(url: string, init?: RequestInit) {
  return new NextRequest(
    url,
    init as unknown as ConstructorParameters<typeof NextRequest>[1]
  );
}

const EVENTS = [
  { type: "PushEvent", repo: { name: "octocat/repo-a", url: "https://api.github.com/repos/octocat/repo-a" } },
  { type: "PullRequestEvent", repo: { name: "octocat/repo-b", url: "https://api.github.com/repos/octocat/repo-b" } },
  { type: "WatchEvent", repo: { name: "someuser/starred", url: "https://api.github.com/repos/someuser/starred" } },
  { type: "MemberEvent", repo: { name: "someuser/other", url: "https://api.github.com/repos/someuser/other" } },
  { type: "PushEvent", repo: { name: "octocat/repo-a", url: "https://api.github.com/repos/octocat/repo-a" } },
  { type: "IssueCommentEvent", repo: { name: "octocat/repo-c", url: "https://api.github.com/repos/octocat/repo-c" } },
];

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

describe("GET /api/github/contributions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllGlobals();
  });

  it("returns 400 when username param is missing", async () => {
    const res = await GET(contributionsRequest("http://localhost:3000/api/github/contributions"));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ success: false, error: "username query param is required" });
  });

  it("returns 400 when username format is invalid", async () => {
    const res = await GET(contributionsRequest("http://localhost:3000/api/github/contributions?username=@invalid!"));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ success: false, error: "That doesn't look like a valid GitHub username." });
  });

  it("filters contribution-relevant event types, dedupes repos, and rewrites URLs", async () => {
    global.fetch = mockFetchSuccess(EVENTS);

    const res = await GET(contributionsRequest("http://localhost:3000/api/github/contributions?username=octocat&per_page=30"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual([
      { name: "octocat/repo-a", url: "https://github.com/octocat/repo-a", type: "PushEvent" },
      { name: "octocat/repo-b", url: "https://github.com/octocat/repo-b", type: "PullRequestEvent" },
      { name: "octocat/repo-c", url: "https://github.com/octocat/repo-c", type: "IssueCommentEvent" },
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/users/octocat/events?per_page=30",
      expect.objectContaining({ headers: expect.objectContaining({ "User-Agent": "ai-resume-builder" }) })
    );
  });

  it("clamps per_page to the 1..100 range", async () => {
    global.fetch = mockFetchSuccess([]);

    await GET(contributionsRequest("http://localhost:3000/api/github/contributions?username=octocat&per_page=500"));

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/users/octocat/events?per_page=100",
      expect.any(Object)
    );
  });

  it("caps the contributions list at 20 repos", async () => {
    const manyEvents = Array.from({ length: 30 }, (_, i) => ({
      type: "PushEvent",
      repo: { name: `octocat/repo-${i}`, url: `https://api.github.com/repos/octocat/repo-${i}` },
    }));
    global.fetch = mockFetchSuccess(manyEvents);

    const res = await GET(contributionsRequest("http://localhost:3000/api/github/contributions?username=octocat"));

    const json = await res.json();
    expect(json.data).toHaveLength(20);
  });

  it("returns 404 when GitHub user not found", async () => {
    global.fetch = mockFetchError(404, "Not Found");

    const res = await GET(contributionsRequest("http://localhost:3000/api/github/contributions?username=nonexistent"));

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ success: false, error: 'No GitHub user named "nonexistent" was found.' });
  });

  it("returns 403 when anonymous rate limit hit", async () => {
    global.fetch = mockFetchError(403, "API rate limit exceeded");

    const res = await GET(contributionsRequest("http://localhost:3000/api/github/contributions?username=octocat"));

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      success: false,
      error: "GitHub's anonymous rate limit was reached. Please try again in a minute.",
    });
  });

  it("returns 500 when the GitHub events request fails with unexpected error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    const res = await GET(contributionsRequest("http://localhost:3000/api/github/contributions?username=octocat"));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to load GitHub contributions. Please try again.");
  });
});

describe("POST /api/github/contributions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(
      contributionsRequest("http://localhost:3000/api/github/contributions", {
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
      contributionsRequest("http://localhost:3000/api/github/contributions", {
        method: "POST",
        body: JSON.stringify({ repoName: "octocat/repo-a" }),
      })
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("repoName and resumeId are required");
    expect(mockInsertProjectFromRepo).not.toHaveBeenCalled();
  });

  it("inserts the contribution as a project and returns success", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockInsertProjectFromRepo.mockResolvedValue({ resumeId: "r1" });

    const res = await POST(
      contributionsRequest("http://localhost:3000/api/github/contributions", {
        method: "POST",
        body: JSON.stringify({
          repoName: " octocat/repo-a ",
          repoUrl: "https://github.com/octocat/repo-a",
          resumeId: "r1",
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockInsertProjectFromRepo).toHaveBeenCalledWith("user-123", "r1", {
      name: "octocat/repo-a",
      description: "",
      url: "https://github.com/octocat/repo-a",
      language: "",
    });
  });

  it("returns 500 when the insert fails", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockInsertProjectFromRepo.mockRejectedValue(new Error("Resume not found"));

    const res = await POST(
      contributionsRequest("http://localhost:3000/api/github/contributions", {
        method: "POST",
        body: JSON.stringify({ repoName: "octocat/repo-a", resumeId: "r1" }),
      })
    );

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to add the contribution to your resume. Please try again.");
  });
});