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

describe("GET /api/github/contributions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(contributionsRequest("http://localhost:3000/api/github/contributions"));

    expect(res.status).toBe(401);
    expect(mockGithubFetch).not.toHaveBeenCalled();
  });

  it("returns 403 with upgradeRequired when GitHub sync is not in the plan", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: false } as never);

    const res = await GET(contributionsRequest("http://localhost:3000/api/github/contributions"));

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ success: false, upgradeRequired: true });
    expect(mockGithubFetch).not.toHaveBeenCalled();
  });

  it("filters contribution-relevant event types, dedupes repos, and rewrites URLs", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: true } as never);
    mockGithubFetch
      .mockResolvedValueOnce({ login: "octocat" })
      .mockResolvedValueOnce(EVENTS);

    const res = await GET(contributionsRequest("http://localhost:3000/api/github/contributions?per_page=30"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    // WatchEvent/MemberEvent filtered out; duplicate PushEvent on repo-a deduped
    expect(json.data).toEqual([
      {
        name: "octocat/repo-a",
        url: "https://github.com/octocat/repo-a",
        type: "PushEvent",
      },
      {
        name: "octocat/repo-b",
        url: "https://github.com/octocat/repo-b",
        type: "PullRequestEvent",
      },
      {
        name: "octocat/repo-c",
        url: "https://github.com/octocat/repo-c",
        type: "IssueCommentEvent",
      },
    ]);
    // First call: /user; second call: /users/octocat/events with per_page
    expect(mockGithubFetch.mock.calls[0][1]).toContain("/user");
    expect(mockGithubFetch.mock.calls[1][1]).toContain("/users/octocat/events");
    expect(mockGithubFetch.mock.calls[1][1]).toContain("per_page=30");
  });

  it("clamps per_page to the 1..100 range", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: true } as never);
    mockGithubFetch
      .mockResolvedValueOnce({ login: "octocat" })
      .mockResolvedValueOnce([]);

    await GET(
      contributionsRequest("http://localhost:3000/api/github/contributions?per_page=500")
    );

    expect(mockGithubFetch.mock.calls[1][1]).toContain("per_page=100");
  });

  it("caps the contributions list at 20 repos", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: true } as never);
    const manyEvents = Array.from({ length: 30 }, (_, i) => ({
      type: "PushEvent",
      repo: { name: `octocat/repo-${i}`, url: `https://api.github.com/repos/octocat/repo-${i}` },
    }));
    mockGithubFetch
      .mockResolvedValueOnce({ login: "octocat" })
      .mockResolvedValueOnce(manyEvents);

    const res = await GET(contributionsRequest("http://localhost:3000/api/github/contributions"));

    const json = await res.json();
    expect(json.data).toHaveLength(20);
  });

  it("returns 500 when the GitHub events request fails", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: true } as never);
    mockGithubFetch
      .mockResolvedValueOnce({ login: "octocat" })
      .mockRejectedValueOnce(new Error("GitHub API request failed. Please try again."));

    const res = await GET(contributionsRequest("http://localhost:3000/api/github/contributions"));

    expect(res.status).toBe(500);
    // Safe message — the raw error must not leak to the client.
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
    // Safe message — the raw error must not leak to the client.
    expect((await res.json()).error).toBe("Failed to add the contribution to your resume. Please try again.");
  });
});
