import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/subscription", () => ({
  getUserPlanLimits: vi.fn(),
  checkUsageLimit: vi.fn(),
  incrementUsage: vi.fn(),
}));

vi.mock("@/services/ai/client", () => ({
  callGemini: vi.fn(),
}));

vi.mock("@/services/resume-updates/service", () => ({
  getResumeUpdates: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUserPlanLimits, checkUsageLimit, incrementUsage } from "@/lib/subscription";
import { callGemini } from "@/services/ai/client";
import { getResumeUpdates } from "@/services/resume-updates/service";
import { POST } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockGetUserPlanLimits = vi.mocked(getUserPlanLimits);
const mockCheckUsageLimit = vi.mocked(checkUsageLimit);
const mockIncrementUsage = vi.mocked(incrementUsage);
const mockCallGemini = vi.mocked(callGemini);
const mockGetResumeUpdates = vi.mocked(getResumeUpdates);

function suggestRequest(body: unknown) {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  return new NextRequest(
    "http://localhost:3000/api/github/suggest",
    init as unknown as ConstructorParameters<typeof NextRequest>[1]
  );
}

const UPDATES = [
  {
    repo_name: "octocat/repo-a",
    repo_description: "A great repo",
    repo_language: "TypeScript",
    repo_stars: 42,
  },
];

describe("POST /api/github/suggest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: true, maxAiActions: 10 } as never);
    mockCheckUsageLimit.mockResolvedValue({ allowed: true, current: 1, limit: 10 });
    mockCheckRateLimit.mockResolvedValue(true);
    mockGetResumeUpdates.mockResolvedValue(UPDATES as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(suggestRequest({ targetRole: "Full-Stack Engineer" }));

    expect(res.status).toBe(401);
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(false);

    const res = await POST(suggestRequest({ targetRole: "Full-Stack Engineer" }));

    expect(res.status).toBe(429);
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it("returns 400 when the target role is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });

    const res = await POST(suggestRequest({ targetRole: "   " }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("target role is required");
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it("returns 403 when the AI action quota is exhausted", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckUsageLimit.mockResolvedValue({ allowed: false, current: 10, limit: 10 });

    const res = await POST(suggestRequest({ targetRole: "Full-Stack Engineer" }));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("AI action limit reached");
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it("returns 400 when the user has no repos yet", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResumeUpdates.mockResolvedValue([] as never);

    const res = await POST(suggestRequest({ targetRole: "Full-Stack Engineer" }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("No repositories to suggest from yet");
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it("returns 502 when the AI call fails", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCallGemini.mockResolvedValue({ success: false, output: "", error: "AI extraction failed" });

    const res = await POST(suggestRequest({ targetRole: "Full-Stack Engineer" }));

    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("AI extraction failed");
    expect(mockIncrementUsage).not.toHaveBeenCalled();
  });

  it("returns 502 when the AI output cannot be parsed into suggestions", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCallGemini.mockResolvedValue({ success: true, output: "not json and no colons here" });

    const res = await POST(suggestRequest({ targetRole: "Full-Stack Engineer" }));

    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("Could not parse AI suggestions");
  });

  it("parses structured JSON suggestions, caps at 5, and increments usage", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCallGemini.mockResolvedValue({
      success: true,
      output: `\`\`\`json
[{"name":"octocat/repo-a","reason":"Great TypeScript"},{"name":"octocat/repo-b","reason":"Nice API design"},{"name":"octocat/repo-c","reason":"Good"},{"name":"octocat/repo-d","reason":"OK"},{"name":"octocat/repo-e","reason":"Fine"},{"name":"octocat/repo-f","reason":"Extra"}]
\`\`\``,
    });

    const res = await POST(suggestRequest({ targetRole: "Full-Stack Engineer" }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(5);
    expect(json.data[0]).toEqual({ name: "octocat/repo-a", reason: "Great TypeScript" });
    expect(mockIncrementUsage).toHaveBeenCalledWith("user-123", "ai_actions");
    expect(mockCallGemini.mock.calls[0][0]).toMatchObject({
      action: "github-repo-suggest",
      context: "Full-Stack Engineer",
    });
  });

  it("falls back to line-based parsing for non-JSON output", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCallGemini.mockResolvedValue({
      success: true,
      output: "octocat/repo-a: Great TypeScript work\nnot a suggestion line\noctocat/repo-b: Nice API design",
    });

    const res = await POST(suggestRequest({ targetRole: "Full-Stack Engineer" }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual([
      { name: "octocat/repo-a", reason: "Great TypeScript work" },
      { name: "octocat/repo-b", reason: "Nice API design" },
    ]);
  });

  it("returns 500 when the update lookup throws", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResumeUpdates.mockRejectedValue(new Error("boom"));

    const res = await POST(suggestRequest({ targetRole: "Full-Stack Engineer" }));

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ success: false });
  });
});
