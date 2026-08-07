import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockFrom = vi.fn();
const mockFetch = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/github", () => ({
  getGitHubAccessToken: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getGitHubAccessToken } from "@/lib/github";
import { POST } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetGitHubAccessToken = vi.mocked(getGitHubAccessToken);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function thenableChain<T = any>(resolveValue: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    single: vi.fn(() => self),
    then: (resolve: (val: T) => void) => resolve(resolveValue),
  };
  return self;
}

function usernameRequest(username: string) {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  };
  // NextRequest's RequestInit types `signal` as AbortSignal | undefined (no
  // null), which the global RequestInit doesn't satisfy — cast through the
  // constructor's parameter type.
  return new NextRequest(
    "http://localhost:3000/api/github/import-username",
    init as unknown as ConstructorParameters<typeof NextRequest>[1]
  );
}

const GITHUB_REPOS = [
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
];

function gitHubResponse(status: number, body: unknown) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

describe("POST /api/github/import-username", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(usernameRequest("octocat"));

    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 when the username is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });

    const res = await POST(usernameRequest("   "));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ success: false });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid username format", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });

    const res = await POST(usernameRequest("not valid!"));

    expect(res.status).toBe(400);
  });

  it("returns 400 for a username with a leading dash", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });

    const res = await POST(usernameRequest("-octocat"));

    expect(res.status).toBe(400);
  });

  it("fetches anonymously (no Authorization header) when GitHub is not connected", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({ data: { github_connected: false }, error: null })
    );
    mockFetch.mockResolvedValue(gitHubResponse(200, GITHUB_REPOS));

    const res = await POST(usernameRequest("octocat"));

    expect(res.status).toBe(200);
    expect(mockGetGitHubAccessToken).not.toHaveBeenCalled();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/users/octocat/repos");
    expect((init as RequestInit).headers).not.toHaveProperty("Authorization");
  });

  it("uses the connected token (Bearer header) when GitHub is connected", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({ data: { github_connected: true }, error: null })
    );
    mockGetGitHubAccessToken.mockResolvedValue("test-token");
    mockFetch.mockResolvedValue(gitHubResponse(200, GITHUB_REPOS));

    const res = await POST(usernameRequest("octocat"));

    expect(res.status).toBe(200);
    expect(mockGetGitHubAccessToken).toHaveBeenCalledWith("user-123");
    const [, init] = mockFetch.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer test-token" });
  });

  it("fetches anonymously when the profile row is missing (no github_connected)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(thenableChain({ data: null, error: null }));
    mockFetch.mockResolvedValue(gitHubResponse(200, GITHUB_REPOS));

    const res = await POST(usernameRequest("octocat"));

    expect(res.status).toBe(200);
    expect(mockGetGitHubAccessToken).not.toHaveBeenCalled();
    const [, init] = mockFetch.mock.calls[0];
    expect((init as RequestInit).headers).not.toHaveProperty("Authorization");
  });

  it("falls back to anonymous when the connected token lookup throws", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({ data: { github_connected: true }, error: null })
    );
    mockGetGitHubAccessToken.mockRejectedValue(new Error("token broken"));
    mockFetch.mockResolvedValue(gitHubResponse(200, GITHUB_REPOS));

    const res = await POST(usernameRequest("octocat"));

    expect(res.status).toBe(200);
    const [, init] = mockFetch.mock.calls[0];
    expect((init as RequestInit).headers).not.toHaveProperty("Authorization");
  });

  it("returns 404 when the GitHub user does not exist", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({ data: { github_connected: false }, error: null })
    );
    mockFetch.mockResolvedValue(gitHubResponse(404, {}));

    const res = await POST(usernameRequest("ghost-user"));

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      success: false,
      error: 'No GitHub user named "ghost-user" was found.',
    });
  });

  it("explains the anonymous rate limit when unauthenticated to GitHub", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({ data: { github_connected: false }, error: null })
    );
    mockFetch.mockResolvedValue(gitHubResponse(403, {}));

    const res = await POST(usernameRequest("octocat"));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("anonymous rate limit");
  });

  it("mentions the connected account when the token-backed request is rate limited", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({ data: { github_connected: true }, error: null })
    );
    mockGetGitHubAccessToken.mockResolvedValue("test-token");
    mockFetch.mockResolvedValue(gitHubResponse(429, {}));

    const res = await POST(usernameRequest("octocat"));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("GitHub rate limit reached. Please try again later.");
  });

  it("returns 502 for an unexpected GitHub API error", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({ data: { github_connected: false }, error: null })
    );
    mockFetch.mockResolvedValue(gitHubResponse(500, {}));

    const res = await POST(usernameRequest("octocat"));

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ success: false });
  });

  it("returns 404 when the user has no public repositories", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({ data: { github_connected: false }, error: null })
    );
    mockFetch.mockResolvedValue(gitHubResponse(200, []));

    const res = await POST(usernameRequest("octocat"));

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('"octocat" has no public repositories.');
  });

  it("returns the mapped repo list on success", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({ data: { github_connected: false }, error: null })
    );
    mockFetch.mockResolvedValue(gitHubResponse(200, GITHUB_REPOS));

    const res = await POST(usernameRequest("octocat"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.username).toBe("octocat");
    expect(json.data).toEqual({
      username: "octocat",
      repos: [
        {
          id: 1,
          name: "octocat/repo-a",
          description: "A great repo",
          url: "https://github.com/octocat/repo-a",
          language: "TypeScript",
          stars: 42,
          forks: 3,
        },
      ],
    });
  });
});
