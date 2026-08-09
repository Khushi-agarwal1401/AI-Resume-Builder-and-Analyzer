import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/subscription", () => ({
  getUserPlanLimits: vi.fn(),
  checkPremiumAccess: vi.fn(),
  recordPremiumUse: vi.fn(),
}));

vi.mock("@/lib/admin", () => ({
  isAdmin: vi.fn(),
}));

vi.mock("@/services/github/sync", () => ({
  syncGitHubForUser: vi.fn(),
}));

// Chainable db stub resolving per-table (profiles vs resume_updates).
const mockDbFrom = vi.fn();
vi.mock("@/lib/db/server", () => ({
  createServerClient: vi.fn(async () => ({ from: mockDbFrom })),
}));

import { getServerSession } from "next-auth";
import { getUserPlanLimits, checkPremiumAccess, recordPremiumUse } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";
import { syncGitHubForUser } from "@/services/github/sync";
import { GET } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetUserPlanLimits = vi.mocked(getUserPlanLimits);
const mockCheckPremiumAccess = vi.mocked(checkPremiumAccess);
const mockRecordPremiumUse = vi.mocked(recordPremiumUse);
const mockIsAdmin = vi.mocked(isAdmin);
const mockSyncGitHubForUser = vi.mocked(syncGitHubForUser);

const tableData: Record<string, { data?: unknown; error?: unknown }> = {
  profiles: { data: { github_token: "gh-token", github_connected: true }, error: null },
  resume_updates: { data: [{ id: "update-1", repo: "octocat/hello" }], error: null },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetServerSession.mockResolvedValue({ user: { id: "u-1", email: "user@example.com" } });
  mockIsAdmin.mockResolvedValue(false);
  mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: true } as never);
  // Default: within the trial — a free user below the 3-sync cap is allowed.
  mockCheckPremiumAccess.mockResolvedValue(true);
  mockSyncGitHubForUser.mockResolvedValue({ newFound: 0 });
  mockDbFrom.mockImplementation((table: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self: Record<string, any> = {
      select: vi.fn(() => self),
      eq: vi.fn(() => self),
      single: vi.fn(() => self),
      order: vi.fn(() => self),
      limit: vi.fn(() => self),
      then: (resolve: (v: unknown) => void) => resolve(tableData[table] ?? { data: null, error: null }),
    };
    return self;
  });
});

describe("GET /api/github/poll", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("allows a free user's first sync within the 3-free-trial and records the use", async () => {
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: false } as never);
    mockSyncGitHubForUser.mockResolvedValue({ newFound: 2 });

    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.newFound).toBe(2);
    expect(json.data).toEqual([{ id: "update-1", repo: "octocat/hello" }]);
    // A successful trial sync burns one free use.
    expect(mockRecordPremiumUse).toHaveBeenCalledWith("u-1", "github_syncs", false, false);
  });

  it("blocks free users with an upgrade prompt (403) once their 3 trial syncs are used up", async () => {
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: false } as never);
    mockCheckPremiumAccess.mockResolvedValue(false); // trial exhausted

    const res = await GET();
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.upgradeRequired).toBe(true);
    // A gated sync neither runs the sync nor burns a trial use.
    expect(mockSyncGitHubForUser).not.toHaveBeenCalled();
    expect(mockRecordPremiumUse).not.toHaveBeenCalled();
  });

  it("exempts admins from the sync gate even on the free plan", async () => {
    mockIsAdmin.mockResolvedValue(true);
    mockGetUserPlanLimits.mockResolvedValue({ hasGitHubSync: false } as never);
    mockSyncGitHubForUser.mockResolvedValue({ newFound: 1 });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(mockSyncGitHubForUser).toHaveBeenCalled();
    expect(mockRecordPremiumUse).not.toHaveBeenCalled();
  });

  it("returns 400 when GitHub is not connected (no trial burned)", async () => {
    tableData.profiles = { data: { github_token: null, github_connected: false }, error: null };

    const res = await GET();
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("GitHub not connected");
    expect(mockRecordPremiumUse).not.toHaveBeenCalled();
    expect(mockSyncGitHubForUser).not.toHaveBeenCalled();
  });
});
