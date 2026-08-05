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
}));

vi.mock("@/services/export/pdfRenderer", () => ({
  generatePdfBuffer: vi.fn(async () => Buffer.from("%PDF-1.4 fake pdf")),
}));

vi.mock("@/services/export/docxGenerator", () => ({
  generateDocxBuffer: vi.fn(async () => Buffer.from("PK\x03\x04 fake docx")),
}));

import { getServerSession } from "next-auth";
import { getResume } from "@/services/resume/service";
import { GET } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetResume = vi.mocked(getResume);

function mockResume(): ResumeData {
  return {
    id: "res-1",
    userId: "user-123",
    title: "Software Engineer Resume",
    template: "modern",
    targetLevel: "fresher",
    sectionOrder: [],
    customSections: {},
    accentColor: "#2563eb",
    personalInfo: {
      fullName: "John Doe",
      email: "john@example.com",
      phone: "+1 555 0100",
      linkedin: "",
      github: "",
      portfolio: "",
      photo: "",
    },
    summary: "A summary.",
    experience: [],
    education: [],
    projects: [],
    skills: { technical: ["TypeScript"], soft: [], tools: [], frameworks: [] },
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
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function exportRequest(url: string) {
  return new NextRequest(url);
}

const params = Promise.resolve({ resumeId: "res-1" });

describe("export API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(exportRequest("http://localhost:3000/api/export/res-1"), { params });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns 404 when the resume is not found", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetResume.mockResolvedValue(null as any);

    const res = await GET(exportRequest("http://localhost:3000/api/export/res-1"), { params });

    expect(res.status).toBe(404);
  });

  it("exports PDF by default with a matching content type and filename", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(mockResume());

    const res = await GET(exportRequest("http://localhost:3000/api/export/res-1"), { params });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("John_Doe_Resume.pdf");
  });

  it("exports DOCX when format=docx", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(mockResume());

    const res = await GET(
      exportRequest("http://localhost:3000/api/export/res-1?format=docx"),
      { params }
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("wordprocessingml");
    expect(res.headers.get("Content-Disposition")).toContain("John_Doe_Resume.docx");
  });

  it("exports TXT when format=txt", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(mockResume());

    const res = await GET(
      exportRequest("http://localhost:3000/api/export/res-1?format=txt"),
      { params }
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    expect(res.headers.get("Content-Disposition")).toContain("John_Doe_Resume.txt");
  });

  it("exports HTML when format=html", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(mockResume());

    const res = await GET(
      exportRequest("http://localhost:3000/api/export/res-1?format=html"),
      { params }
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(res.headers.get("Content-Disposition")).toContain("John_Doe_Resume.html");

    const body = await res.text();
    expect(body).toContain("<!DOCTYPE html>");
    expect(body).toContain("John Doe");
  });

  it("falls back to PDF for unknown formats", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(mockResume());

    const res = await GET(
      exportRequest("http://localhost:3000/api/export/res-1?format=exe"),
      { params }
    );

    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("sanitizes unsafe characters out of the exported filename", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    const resume = mockResume();
    resume.personalInfo.fullName = 'John "Inject"\r\nDoe';
    mockGetResume.mockResolvedValue(resume);

    const res = await GET(exportRequest("http://localhost:3000/api/export/res-1"), { params });

    const disposition = res.headers.get("Content-Disposition") || "";
    // Header wraps the filename in quotes, so assert the inner value only.
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] || "";
    expect(filename).not.toContain('"');
    expect(filename).not.toContain("\r");
    expect(filename).not.toContain("\n");
    expect(filename).toBe("John_InjectDoe_Resume.pdf");
  });
});
