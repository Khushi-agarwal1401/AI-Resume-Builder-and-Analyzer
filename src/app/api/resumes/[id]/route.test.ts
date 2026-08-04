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
}));

vi.mock("@/services/resume/service", () => ({
  getResume: vi.fn(),
  updateResume: vi.fn(),
  deleteResume: vi.fn(),
  updateSections: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getUserPlanLimits } from "@/lib/subscription";
import { updateResume } from "@/services/resume/service";
import { PUT } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetUserPlanLimits = vi.mocked(getUserPlanLimits);
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
    mockUpdateResume.mockResolvedValue(undefined as never);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await PUT(putRequest({ template: "modern" }), { params });

    expect(res.status).toBe(401);
  });

  it("rejects switching to a premium template for free users", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u-1" } });

    const res = await PUT(putRequest({ template: "executive" }), { params });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.upgradeRequired).toBe(true);
    expect(mockUpdateResume).not.toHaveBeenCalled();
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
});
