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

vi.mock("@/lib/subscription", () => ({
  getUserPlanLimits: vi.fn(),
}));

vi.mock("@/lib/admin", () => ({
  isAdmin: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/services/notifications/service", () => ({
  createNotification: vi.fn(),
}));

// Chainable db stub for the download_count increment.
const mockDbFrom = vi.fn();
vi.mock("@/lib/db/server", () => ({
  createServerClient: vi.fn(async () => ({ from: mockDbFrom })),
}));

import { getServerSession } from "next-auth";
import { getResume } from "@/services/resume/service";
import { getUserPlanLimits } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { GET } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetResume = vi.mocked(getResume);
const mockGetUserPlanLimits = vi.mocked(getUserPlanLimits);
const mockIsAdmin = vi.mocked(isAdmin);
const mockCheckRateLimit = vi.mocked(checkRateLimit);

function mockDbChain(selectResolve: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    single: vi.fn(() => self),
    update: vi.fn(() => self),
    then: (resolve: (val: unknown) => void) => resolve(selectResolve),
  };
  return self;
}

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
    mockCheckRateLimit.mockResolvedValue(true);
    mockIsAdmin.mockResolvedValue(false);
    mockGetUserPlanLimits.mockResolvedValue({
      maxResumes: 99,
      maxAtsChecks: 99,
      maxJdAnalyses: 99,
      maxAiActions: 9999,
      hasAdvancedTemplates: true,
      hasExportPdf: true,
      hasCoverLetter: true,
      hasGitHubSync: true,
      hasLinkedinImport: true,
      hasPrioritySupport: true,
    });
    mockDbFrom.mockReturnValue(mockDbChain());
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

  it("gates PDF export behind Pro (403 upgradeRequired) for free users (K-10)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(mockResume());
    mockGetUserPlanLimits.mockResolvedValue({
      maxResumes: 1,
      maxAtsChecks: 3,
      maxJdAnalyses: 3,
      maxAiActions: 20,
      hasAdvancedTemplates: false,
      hasExportPdf: false,
      hasCoverLetter: false,
      hasGitHubSync: false,
      hasLinkedinImport: false,
      hasPrioritySupport: false,
    });

    const res = await GET(exportRequest("http://localhost:3000/api/export/res-1"), { params });

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ success: false, upgradeRequired: true });
    // The PDF renderer must not be invoked for a gated user.
    expect(mockGetResume).toHaveBeenCalledTimes(1);
  });

  it("exempts admins from the PDF Pro gate even on the free plan", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "admin-1", email: "admin@example.com" } });
    mockGetResume.mockResolvedValue(mockResume());
    mockGetUserPlanLimits.mockResolvedValue({
      maxResumes: 1,
      maxAtsChecks: 3,
      maxJdAnalyses: 3,
      maxAiActions: 20,
      hasAdvancedTemplates: false,
      hasExportPdf: false,
      hasCoverLetter: false,
      hasGitHubSync: false,
      hasLinkedinImport: false,
      hasPrioritySupport: false,
    });
    mockIsAdmin.mockResolvedValue(true);

    const res = await GET(exportRequest("http://localhost:3000/api/export/res-1"), { params });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("still exports DOCX for free users (only PDF is gated)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(mockResume());
    mockGetUserPlanLimits.mockResolvedValue({
      maxResumes: 1,
      maxAtsChecks: 3,
      maxJdAnalyses: 3,
      maxAiActions: 20,
      hasAdvancedTemplates: false,
      hasExportPdf: false,
      hasCoverLetter: false,
      hasGitHubSync: false,
      hasLinkedinImport: false,
      hasPrioritySupport: false,
    });

    const res = await GET(
      exportRequest("http://localhost:3000/api/export/res-1?format=docx"),
      { params }
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("wordprocessingml");
  });

  it("returns 429 when the export rate limit is hit (K-14)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(false);

    const res = await GET(exportRequest("http://localhost:3000/api/export/res-1"), { params });

    expect(res.status).toBe(429);
    expect(mockGetResume).not.toHaveBeenCalled();
  });

  it("exempts admins from the export rate limit (bypass flag passed)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "admin-1", email: "admin@example.com" } });
    mockGetResume.mockResolvedValue(mockResume());
    mockIsAdmin.mockResolvedValue(true);

    const res = await GET(exportRequest("http://localhost:3000/api/export/res-1"), { params });

    expect(res.status).toBe(200);
    // Admins pass the bypass flag so the limiter short-circuits — and they're
    // never throttled even if the limit would otherwise be hit. The actual
    // short-circuit (no Redis call, always allows) is unit-tested in
    // src/lib/rate-limit.test.ts; here we assert the route passes the flag.
    expect(mockCheckRateLimit).toHaveBeenCalledWith("export:admin-1", 60, 60000, {
      bypass: true,
    });
  });

  it("passes bypass:false for regular users so they stay rate limited", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(mockResume());

    const res = await GET(
      exportRequest("http://localhost:3000/api/export/res-1?format=txt"),
      { params }
    );

    expect(res.status).toBe(200);
    expect(mockCheckRateLimit).toHaveBeenCalledWith("export:user-123", 60, 60000, {
      bypass: false,
    });
  });

  it("increments download_count on a successful export (K-02)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(mockResume());
    const chain = mockDbChain({ data: { download_count: 3 }, error: null });
    mockDbFrom.mockReturnValue(chain);

    const res = await GET(exportRequest("http://localhost:3000/api/export/res-1"), { params });

    expect(res.status).toBe(200);
    expect(mockDbFrom).toHaveBeenCalledWith("resumes");
    expect(chain.select).toHaveBeenCalledWith("download_count");
    const updatePayload = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updatePayload.download_count).toBe(4);
  });

  it("still exports successfully when the download counter fails (best-effort)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResume.mockResolvedValue(mockResume());
    // Counter chain that rejects — the export must not fail with it.
    const failingChain = mockDbChain();
    failingChain.then = (_resolve: unknown, reject: (e: unknown) => void) => reject(new Error("db down"));
    mockDbFrom.mockReturnValue(failingChain);

    const res = await GET(exportRequest("http://localhost:3000/api/export/res-1"), { params });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });
});
