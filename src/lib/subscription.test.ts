import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserPlanLimits } from "./subscription";

vi.mock("@/lib/admin", () => ({
  isAdmin: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getPlanLimits: vi.fn(),
}));

const mockFrom = vi.fn();
vi.mock("@/lib/db/server", () => ({
  createServerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { isAdmin } from "@/lib/admin";
import { getPlanLimits } from "@/lib/stripe";

const mockIsAdmin = vi.mocked(isAdmin);
const mockGetPlanLimits = vi.mocked(getPlanLimits);

/** Chainable db stub resolving to a single subscription row (or null). */
function mockChain(resolve: { data?: unknown; error?: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    single: vi.fn(() => self),
    then: (resolveFn: (v: unknown) => void) => resolveFn(resolve),
  };
  return self;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPlanLimits.mockImplementation((planId: string) => ({
    maxResumes: planId === "pro" ? 99 : 1,
    maxAtsChecks: planId === "pro" ? 99 : 3,
    maxJdAnalyses: planId === "pro" ? 99 : 3,
    maxAiActions: planId === "pro" ? 9999 : 20,
    hasAdvancedTemplates: planId === "pro",
    hasExportPdf: planId === "pro",
    hasCoverLetter: planId === "pro",
    hasGitHubSync: planId === "pro",
    hasLinkedinImport: planId === "pro",
    hasPrioritySupport: planId === "pro",
  }));
  mockFrom.mockReturnValue(mockChain({ data: null, error: null }));
});

describe("getUserPlanLimits", () => {
  it("returns full Pro limits for admins even without a subscription", async () => {
    mockIsAdmin.mockResolvedValue(true);

    const limits = await getUserPlanLimits("admin-1");

    // The admin shortcut returns before any subscription/db lookup.
    expect(mockIsAdmin).toHaveBeenCalledWith("admin-1", "");
    expect(mockFrom).not.toHaveBeenCalled();
    expect(limits.maxResumes).toBe(99);
    expect(limits.maxAiActions).toBe(9999);
    expect(limits.hasAdvancedTemplates).toBe(true);
    expect(limits.hasExportPdf).toBe(true);
    expect(limits.hasGitHubSync).toBe(true);
    expect(limits.hasLinkedinImport).toBe(true);
    expect(limits.hasCoverLetter).toBe(true);
    expect(limits.hasPrioritySupport).toBe(true);
  });

  it("returns free limits for non-admins without an active subscription", async () => {
    mockIsAdmin.mockResolvedValue(false);

    const limits = await getUserPlanLimits("user-1");

    expect(limits.maxResumes).toBe(1);
    expect(limits.maxAiActions).toBe(20);
    expect(limits.hasAdvancedTemplates).toBe(false);
    expect(limits.hasExportPdf).toBe(false);
    expect(limits.hasLinkedinImport).toBe(false);
  });
});
