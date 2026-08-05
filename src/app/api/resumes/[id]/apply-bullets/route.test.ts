import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { ResumeData } from "@/types/resume";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/services/resume/service", () => ({
  getResume: vi.fn(),
  updateSections: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getResume, updateSections } from "@/services/resume/service";
import { POST } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetResume = vi.mocked(getResume);
const mockUpdateSections = vi.mocked(updateSections);

function bulletRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/resumes/res-1/apply-bullets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "res-1" });

function resumeWithExperience(experience: unknown[]) {
  return {
    id: "res-1",
    userId: "user-123",
    title: "My Resume",
    template: "modern",
    targetLevel: "experienced",
    sectionOrder: [],
    personalInfo: {},
    summary: "",
    education: [],
    experience,
    projects: [],
    skills: { technical: [], soft: [], tools: [], frameworks: [] },
    certifications: [],
    achievements: [],
    languages: [],
    codingProfiles: [],
    leadership: [],
    openSource: [],
    publications: [],
    volunteer: [],
    activities: [],
    coursework: [],
    interests: [],
    createdAt: "",
    updatedAt: "",
  };
}

describe("POST /api/resumes/[id]/apply-bullets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateSections.mockResolvedValue(undefined as never);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(bulletRequest({ bullets: [{ original: "a", rewrite: "b" }] }), { params });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns 400 for an unparseable body", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    const res = await POST(
      new NextRequest("http://localhost:3000/api/resumes/res-1/apply-bullets", {
        method: "POST",
        body: "{not-json",
      }),
      { params }
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when no bullets are provided", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });

    const res = await POST(bulletRequest({ bullets: [] }), { params });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: "No bullet rewrites selected" });
    expect(mockGetResume).not.toHaveBeenCalled();
  });

  it("returns 400 when bullets have no valid original", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });

    const res = await POST(bulletRequest({ bullets: [{ original: "", rewrite: "b" }] }), { params });

    expect(res.status).toBe(400);
    expect(mockGetResume).not.toHaveBeenCalled();
  });

  it("returns 404 when the resume is not found", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockRejectedValue(new Error("Resume not found"));

    const res = await POST(bulletRequest({ bullets: [{ original: "a", rewrite: "b" }] }), { params });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ success: false, error: "Resume not found" });
  });

  it("replaces matching bullets and persists via updateSections", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(
      resumeWithExperience([
        {
          id: "exp-1",
          resume_id: "res-1",
          company: "Acme",
          role: "Engineer",
          responsibilities: ["Built REST APIs", "Worked on frontend"],
          achievements: ["Led team"],
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          sort_order: 0,
        },
      ]) as unknown as ResumeData
    );

    const res = await POST(
      bulletRequest({
        bullets: [
          { original: "Built REST APIs", rewrite: "Architected REST APIs serving 1M users" },
          { original: "Led team", rewrite: "Led team of 8 engineers" },
          { original: "Nope", rewrite: "Doesn't matter" },
        ],
      }),
      { params }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.applied).toEqual(["Built REST APIs", "Led team"]);
    expect(json.notFound).toEqual(["Nope"]);

    // Persisted experience is clean (no DB metadata) and carries the rewrites.
    expect(mockUpdateSections).toHaveBeenCalledTimes(1);
    const [calledId, calledUserId, sectionType, data] = mockUpdateSections.mock.calls[0];
    expect(calledId).toBe("res-1");
    expect(calledUserId).toBe("user-123");
    expect(sectionType).toBe("experience");

    const entry = (data as { responsibilities: string[]; achievements: string[] }[])[0];
    expect(entry.responsibilities[0]).toBe("Architected REST APIs serving 1M users");
    expect(entry.achievements[0]).toBe("Led team of 8 engineers");
    expect(entry).not.toHaveProperty("id");
    expect(entry).not.toHaveProperty("resume_id");
    expect(entry).not.toHaveProperty("created_at");
    expect(entry).not.toHaveProperty("updated_at");
    expect(entry).not.toHaveProperty("sort_order");
  });

  it("returns success with applied:[] and a message when nothing matches", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(
      resumeWithExperience([{ responsibilities: ["Completely different"], achievements: [] }]) as unknown as ResumeData
    );

    const res = await POST(bulletRequest({ bullets: [{ original: "No match", rewrite: "R" }] }), { params });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.applied).toEqual([]);
    expect(json.message).toContain("could be matched");
    expect(mockUpdateSections).not.toHaveBeenCalled();
  });

  it("returns 500 when updateSections fails", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(
      resumeWithExperience([{ responsibilities: ["Built APIs"], achievements: [] }]) as unknown as ResumeData
    );
    mockUpdateSections.mockRejectedValue(new Error("db down"));

    const res = await POST(bulletRequest({ bullets: [{ original: "Built APIs", rewrite: "Rewritten" }] }), { params });

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ success: false, error: "Failed to update the resume. Please try again." });
  });
});
