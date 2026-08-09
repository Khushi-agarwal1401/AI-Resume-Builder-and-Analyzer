import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/services/resume/service", () => ({
  getResumes: vi.fn(),
  createResume: vi.fn(),
}));

vi.mock("@/lib/subscription", () => ({
  getUserPlanLimits: vi.fn(),
  checkPremiumAccess: vi.fn(),
  recordPremiumUse: vi.fn(),
}));

vi.mock("@/lib/admin", () => ({
  isAdmin: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getResumes, createResume } from "@/services/resume/service";
import { getUserPlanLimits, checkPremiumAccess, recordPremiumUse } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";
import { POST } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetResumes = vi.mocked(getResumes);
const mockCreateResume = vi.mocked(createResume);
const mockGetUserPlanLimits = vi.mocked(getUserPlanLimits);
const mockCheckPremiumAccess = vi.mocked(checkPremiumAccess);
const mockRecordPremiumUse = vi.mocked(recordPremiumUse);
const mockIsAdmin = vi.mocked(isAdmin);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/resumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetServerSession.mockResolvedValue({ user: { id: "u-1", email: "user@example.com" } });
  mockIsAdmin.mockResolvedValue(false);
  mockGetResumes.mockResolvedValue([]);
  mockCreateResume.mockResolvedValue({ id: "res-1", title: "Resume" } as never);
  mockGetUserPlanLimits.mockResolvedValue({
    maxResumes: 1,
    hasAdvancedTemplates: false,
  } as never);
  // Default: within the trial — a free user below the 3-use cap is allowed.
  mockCheckPremiumAccess.mockResolvedValue(true);
});

describe("POST /api/resumes (premium template create gate)", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(makeRequest({ title: "R", template: "modern" }), undefined as never);

    expect(res.status).toBe(401);
  });

  it("allows a free user's first premium-template create within the 3-free-trial and records it", async () => {
    const res = await POST(
      makeRequest({ title: "Executive Resume", template: "executive", targetLevel: "experienced" }),
      undefined as never
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("res-1");
    // A successful premium create burns one free use.
    expect(mockRecordPremiumUse).toHaveBeenCalledWith("u-1", "premium_templates", false, false);
  });

  it("blocks premium-template creates (403 upgradeRequired) once the 3 trial uses are used up", async () => {
    mockCheckPremiumAccess.mockResolvedValue(false); // trial exhausted

    const res = await POST(
      makeRequest({ title: "Executive Resume", template: "executive" }),
      undefined as never
    );

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.upgradeRequired).toBe(true);
    expect(mockCreateResume).not.toHaveBeenCalled();
    expect(mockRecordPremiumUse).not.toHaveBeenCalled();
  });

  it("creates with a free template without touching the trial counter", async () => {
    const res = await POST(makeRequest({ title: "Modern Resume", template: "modern" }), undefined as never);

    expect(res.status).toBe(201);
    expect(mockCreateResume).toHaveBeenCalledTimes(1);
    expect(mockCheckPremiumAccess).not.toHaveBeenCalled();
    expect(mockRecordPremiumUse).not.toHaveBeenCalled();
  });

  it("exempts admins from the premium-template gate even on the free plan", async () => {
    mockIsAdmin.mockResolvedValue(true);

    const res = await POST(
      makeRequest({ title: "Executive Resume", template: "executive" }),
      undefined as never
    );

    expect(res.status).toBe(201);
    expect(mockCreateResume).toHaveBeenCalledTimes(1);
    expect(mockRecordPremiumUse).not.toHaveBeenCalled();
  });

  it("still enforces the resume-count cap before the premium gate", async () => {
    mockGetResumes.mockResolvedValue([{ id: "existing-1" } as never]);

    const res = await POST(makeRequest({ title: "R", template: "modern" }), undefined as never);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Maximum resume limit");
    expect(mockCreateResume).not.toHaveBeenCalled();
  });
});
