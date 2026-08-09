import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => true),
}));

vi.mock("@/lib/subscription", () => ({
  getUserPlanLimits: vi.fn(),
  checkPremiumAccess: vi.fn(),
  recordPremiumUse: vi.fn(),
}));

vi.mock("@/lib/admin", () => ({
  isAdmin: vi.fn(),
}));

vi.mock("@/services/resume/service", () => ({
  getResume: vi.fn(),
  updateResume: vi.fn(),
  deleteResume: vi.fn(),
  updateSections: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getUserPlanLimits, checkPremiumAccess, recordPremiumUse } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";
import { updateResume } from "@/services/resume/service";
import { PUT } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetUserPlanLimits = vi.mocked(getUserPlanLimits);
const mockCheckPremiumAccess = vi.mocked(checkPremiumAccess);
const mockRecordPremiumUse = vi.mocked(recordPremiumUse);
const mockIsAdmin = vi.mocked(isAdmin);
const mockUpdateResume = vi.mocked(updateResume);

function putRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/resumes/r-1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "r-1" });

describe("PUT /api/resumes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserPlanLimits.mockResolvedValue({ hasAdvancedTemplates: false } as never);
    mockIsAdmin.mockResolvedValue(false);
    mockUpdateResume.mockResolvedValue(undefined as never);
    // Default: within the trial — a free user below the 3-switch cap is allowed.
    mockCheckPremiumAccess.mockResolvedValue(true);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await PUT(putRequest({ template: "modern" }), { params });

    expect(res.status).toBe(401);
  });

  it("rejects switching to a premium template once a free user's 3 trial switches are used up", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u-1" } });
    mockCheckPremiumAccess.mockResolvedValue(false); // trial exhausted

    const res = await PUT(putRequest({ template: "executive" }), { params });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.upgradeRequired).toBe(true);
    expect(mockUpdateResume).not.toHaveBeenCalled();
  });

  it("allows a free user's first premium template switch within the 3-free-trial and records it", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u-1" } });

    const res = await PUT(putRequest({ template: "executive" }), { params });

    expect(res.status).toBe(200);
    expect(mockUpdateResume).toHaveBeenCalledTimes(1);
    // A successful trial switch burns one free use.
    expect(mockRecordPremiumUse).toHaveBeenCalledWith("u-1", "premium_templates", false, false);
  });

  it("allows a free template for free users", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u-1" } });

    const res = await PUT(putRequest({ template: "modern" }), { params });

    expect(res.status).toBe(200);
    expect(mockUpdateResume).toHaveBeenCalledTimes(1);
  });

  it("allows premium templates for Pro users", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u-1" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasAdvancedTemplates: true } as never);

    const res = await PUT(putRequest({ template: "executive-sidebar" }), { params });

    expect(res.status).toBe(200);
    expect(mockUpdateResume).toHaveBeenCalledTimes(1);
  });

  it("allows premium templates for admins even on the free plan", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u-1", email: "admin@example.com" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasAdvancedTemplates: false } as never);
    mockIsAdmin.mockResolvedValue(true);

    const res = await PUT(putRequest({ template: "executive" }), { params });

    expect(res.status).toBe(200);
    expect(mockUpdateResume).toHaveBeenCalledTimes(1);
  });
});
