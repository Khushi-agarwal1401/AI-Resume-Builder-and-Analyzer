import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/services/github/sync", () => ({
  syncGitHubForUser: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getPlanLimits: vi.fn(),
}));

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { syncGitHubForUser } from "@/services/github/sync";
import { getPlanLimits } from "@/lib/stripe";
import { GET } from "./route";

const mockSyncGitHubForUser = vi.mocked(syncGitHubForUser);
const mockGetPlanLimits = vi.mocked(getPlanLimits);
const mockCreateServerSupabaseClient = vi.mocked(createServerSupabaseClient);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function thenableChain<T = any>(resolveValue: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    in: vi.fn(() => self),
    then: (resolve: (val: T) => void) => resolve(resolveValue),
  };
  return self;
}

function cronRequest(secret: string | null) {
  const headers: Record<string, string> = {};
  if (secret !== null) headers["x-cron-secret"] = secret;
  return new NextRequest("http://localhost:3000/api/cron/github-poll", { headers });
}

describe("GET /api/cron/github-poll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    process.env.CRON_SECRET = "cron-secret-123";
    mockGetPlanLimits.mockImplementation(
      ((planId: string) => ({ hasGitHubSync: planId === "pro" })) as never
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.CRON_SECRET;
  });

  it("returns 401 when no CRON_SECRET is configured", async () => {
    delete process.env.CRON_SECRET;

    const res = await GET(cronRequest("cron-secret-123"));

    expect(res.status).toBe(401);
    expect(mockCreateServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("returns 401 when the x-cron-secret header is missing or wrong", async () => {
    const res = await GET(cronRequest(null));

    expect(res.status).toBe(401);
    expect(mockCreateServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("syncs only Pro users who connected GitHub and reports per-user results", async () => {
    mockFrom
      .mockReturnValueOnce(
        thenableChain({ data: [{ id: "u-pro" }, { id: "u-free" }, { id: "u-pro2" }], error: null })
      )
      .mockReturnValueOnce(
        thenableChain({
          data: [
            { user_id: "u-pro", plan_id: "pro" },
            { user_id: "u-free", plan_id: "free" },
            { user_id: "u-pro2", plan_id: "pro" },
          ],
          error: null,
        })
      );
    mockSyncGitHubForUser
      .mockResolvedValueOnce({ newFound: 2 } as never)
      .mockResolvedValueOnce({ newFound: 0 } as never);

    const res = await GET(cronRequest("cron-secret-123"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      checked: 2,
      synced: 2,
      newRepos: 2,
      failures: [],
    });
    expect(mockSyncGitHubForUser).toHaveBeenCalledTimes(2);
    expect(mockSyncGitHubForUser).toHaveBeenCalledWith("u-pro");
    expect(mockSyncGitHubForUser).toHaveBeenCalledWith("u-pro2");
    expect(mockSyncGitHubForUser).not.toHaveBeenCalledWith("u-free");
    expect(mockGetPlanLimits).toHaveBeenCalledWith("pro");
  });

  it("collects user ids whose sync throws into failures", async () => {
    mockFrom
      .mockReturnValueOnce(thenableChain({ data: [{ id: "u-pro" }, { id: "u-broken" }], error: null }))
      .mockReturnValueOnce(
        thenableChain({
          data: [
            { user_id: "u-pro", plan_id: "pro" },
            { user_id: "u-broken", plan_id: "pro" },
          ],
          error: null,
        })
      );
    mockSyncGitHubForUser
      .mockResolvedValueOnce({ newFound: 3 } as never)
      .mockRejectedValueOnce(new Error("sync failed"));

    const res = await GET(cronRequest("cron-secret-123"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      checked: 2,
      synced: 1,
      newRepos: 3,
      failures: ["u-broken"],
    });
  });

  it("returns 500 when the profile query throws", async () => {
    mockFrom.mockImplementation(() => {
      throw new Error("db down");
    });

    const res = await GET(cronRequest("cron-secret-123"));

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ success: false });
  });
});
