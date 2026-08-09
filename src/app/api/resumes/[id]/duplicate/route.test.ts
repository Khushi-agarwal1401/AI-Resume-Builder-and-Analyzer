import { describe, it, expect, vi, beforeEach } from "vitest";
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

vi.mock("@/lib/admin", () => ({
  isAdmin: vi.fn(),
}));

vi.mock("@/services/resume/service", () => ({
  duplicateResume: vi.fn(),
  getResumes: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getUserPlanLimits } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";
import { duplicateResume, getResumes } from "@/services/resume/service";
import { POST } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetUserPlanLimits = vi.mocked(getUserPlanLimits);
const mockIsAdmin = vi.mocked(isAdmin);
const mockDuplicateResume = vi.mocked(duplicateResume);
const mockGetResumes = vi.mocked(getResumes);

/** Free-plan limits: 1 resume cap, no premium features. */
const FREE_LIMITS = { maxResumes: 1 } as never;

function postRequest(body?: unknown) {
  return new NextRequest("http://localhost:3000/api/resumes/r-1/duplicate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

const params = Promise.resolve({ id: "r-1" });

describe("POST /api/resumes/[id]/duplicate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserPlanLimits.mockResolvedValue(FREE_LIMITS);
    mockIsAdmin.mockResolvedValue(false);
    mockGetResumes.mockResolvedValue([] as never);
    mockDuplicateResume.mockResolvedValue({ id: "r-1-copy", title: "My Resume (Copy)" } as never);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(postRequest(), { params });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ success: false, error: "Unauthorized" });
    expect(mockDuplicateResume).not.toHaveBeenCalled();
  });

  it("blocks free users at the resume cap with a 403 upgrade prompt", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u-1" } });
    mockGetResumes.mockResolvedValue([{ id: "r-0" }] as never);

    const res = await POST(postRequest(), { params });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Maximum resume limit (1) reached");
    expect(mockDuplicateResume).not.toHaveBeenCalled();
  });

  it("duplicates with no custom title when no body is sent", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u-1" } });

    const res = await POST(postRequest(), { params });

    expect(res.status).toBe(200);
    expect(mockDuplicateResume).toHaveBeenCalledWith("r-1", "u-1", undefined);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("r-1-copy");
  });

  it("passes a trimmed custom title from the request body", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u-1" } });

    const res = await POST(postRequest({ title: "  Engineering Copy  " }), { params });

    expect(res.status).toBe(200);
    expect(mockDuplicateResume).toHaveBeenCalledWith("r-1", "u-1", "Engineering Copy");
  });

  it("ignores a malformed body and falls back to the default title", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u-1" } });
    const malformed = new NextRequest("http://localhost:3000/api/resumes/r-1/duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });

    const res = await POST(malformed, { params });

    expect(res.status).toBe(200);
    expect(mockDuplicateResume).toHaveBeenCalledWith("r-1", "u-1", undefined);
  });

  it("exempts admins from the resume cap even on the free plan at the limit", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "admin-1", email: "admin@example.com" } });
    mockIsAdmin.mockResolvedValue(true);
    // At the cap: 1 existing resume with a free-plan max of 1.
    mockGetResumes.mockResolvedValue([{ id: "r-0" }] as never);

    const res = await POST(postRequest({ title: "Admin Copy" }), { params });

    expect(res.status).toBe(200);
    expect(mockDuplicateResume).toHaveBeenCalledWith("r-1", "admin-1", "Admin Copy");
  });

  it("maps a duplicate failure to a 404 without leaking details", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u-1" } });
    mockDuplicateResume.mockRejectedValue(new Error("boom"));

    const res = await POST(postRequest(), { params });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("unexpected error");
  });
});
