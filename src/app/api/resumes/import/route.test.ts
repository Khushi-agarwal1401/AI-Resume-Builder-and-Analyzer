import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/services/ai/client", () => ({
  callGemini: vi.fn(),
}));

vi.mock("@/services/resume-analyzer/parser", () => ({
  parseResumeFile: vi.fn(),
}));

vi.mock("@/services/resume-analyzer/deterministic-import", () => ({
  parseResumeText: vi.fn(),
}));

vi.mock("@/services/resume/service", () => ({
  createResume: vi.fn(),
  getResumes: vi.fn(),
  updateSections: vi.fn(),
}));

vi.mock("@/lib/subscription", () => ({
  getUserPlanLimits: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { callGemini } from "@/services/ai/client";
import { parseResumeFile } from "@/services/resume-analyzer/parser";
import { parseResumeText } from "@/services/resume-analyzer/deterministic-import";
import { createResume, getResumes, updateSections } from "@/services/resume/service";
import { getUserPlanLimits } from "@/lib/subscription";
import { POST } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockCallGemini = vi.mocked(callGemini);
const mockParseResumeFile = vi.mocked(parseResumeFile);
const mockParseResumeText = vi.mocked(parseResumeText);
const mockCreateResume = vi.mocked(createResume);
const mockGetResumes = vi.mocked(getResumes);
const mockUpdateSections = vi.mocked(updateSections);
const mockGetUserPlanLimits = vi.mocked(getUserPlanLimits);

function uploadRequest(fileName: string, content: string, template?: string) {
  const formData = new FormData();
  formData.append("file", new File([content], fileName, { type: "text/plain" }));
  if (template !== undefined) formData.append("template", template);
  return new NextRequest(
    "http://localhost:3000/api/resumes/import",
    { method: "POST", body: formData } as unknown as ConstructorParameters<typeof NextRequest>[1]
  );
}

const SAMPLE_RESUME_JSON = JSON.stringify({
  targetLevel: "experienced",
  personalInfo: { fullName: "Jane Doe", email: "jane@acme.com", phone: "+1 555 0100", linkedin: "linkedin.com/in/jane", github: "github.com/jane", portfolio: "" },
  summary: "Senior engineer with 6 years of experience.",
  experience: [{ company: "Acme", role: "Senior Engineer", location: "NYC", startDate: "2020", endDate: "2026", current: true, responsibilities: ["Built x", "Led y"] }],
  education: [{ institution: "MIT", degree: "B.Tech", field: "CS", startDate: "2014", endDate: "2018", cgpa: "3.8" }],
  skills: { technical: ["TypeScript"], soft: ["Leadership"], tools: [], frameworks: [] },
  projects: [{ name: "Open Source Tool", description: "A tool", technologies: ["Go"], liveUrl: "", githubUrl: "github.com/jane/tool" }],
  certifications: [{ name: "AWS", issuer: "Amazon", date: "2022" }],
  achievements: [{ title: "Award", description: "Won", date: "2023" }],
  languages: [{ name: "English", proficiency: "native" }],
});

describe("POST /api/resumes/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCallGemini.mockReset();
    mockCheckRateLimit.mockReset();
    mockParseResumeFile.mockReset();
    mockParseResumeText.mockReset();
    mockCreateResume.mockReset();
    mockGetResumes.mockReset();
    mockUpdateSections.mockReset();
    mockGetUserPlanLimits.mockReset();
    mockUpdateSections.mockResolvedValue(undefined);
    mockGetUserPlanLimits.mockResolvedValue({ maxResumes: 5 } as Awaited<ReturnType<typeof getUserPlanLimits>>);
    mockGetResumes.mockResolvedValue([]);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(uploadRequest("resume.txt", "Some resume text"));

    expect(res.status).toBe(401);
    expect(mockParseResumeFile).not.toHaveBeenCalled();
  });

  it("returns 403 when the user has reached their plan's resume limit", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetUserPlanLimits.mockResolvedValue({ maxResumes: 1 } as Awaited<ReturnType<typeof getUserPlanLimits>>);
    mockGetResumes.mockResolvedValue([{ id: "existing-1", title: "Existing", template: "modern", view_count: 0, download_count: 0, created_at: "", updated_at: "" }]);

    const res = await POST(uploadRequest("resume.txt", "Some resume text"));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("Maximum resume limit");
    expect(mockParseResumeFile).not.toHaveBeenCalled();
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(false);

    const res = await POST(uploadRequest("resume.txt", "Some resume text"));

    expect(res.status).toBe(429);
    expect(mockParseResumeFile).not.toHaveBeenCalled();
  });

  it("returns 400 when the file cannot be parsed (unsupported type)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockParseResumeFile.mockResolvedValue({ text: "", error: "Unsupported file type: .exe. Please upload PDF, DOCX, or TXT." });

    const res = await POST(uploadRequest("resume.exe", "whatever"));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Unsupported file type");
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it("returns 400 when the extracted text is empty", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockParseResumeFile.mockResolvedValue({ text: "" });

    const res = await POST(uploadRequest("resume.txt", ""));

    expect(res.status).toBe(400);
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it("falls back to deterministic parsing when the AI call fails", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockParseResumeFile.mockResolvedValue({ text: "Jane Doe — Senior Engineer at Acme" });
    mockCallGemini.mockResolvedValue({ success: false, output: "", error: "AI extraction failed" });
    mockParseResumeText.mockReturnValue({
      targetLevel: "experienced",
      personalInfo: { fullName: "Jane Doe", email: "jane@acme.com", phone: "", linkedin: "", github: "", portfolio: "", photo: "" },
      summary: "Senior engineer with 6 years of experience.",
      experience: [{ company: "Acme", role: "Senior Engineer", location: "", startDate: "2020", endDate: "", current: true, responsibilities: ["Built x", "Led y"] }],
      education: [],
      skills: { technical: ["TypeScript"], soft: [], tools: [], frameworks: [] },
      projects: [],
      certifications: [],
      achievements: [],
      languages: [],
    });
    mockCreateResume.mockResolvedValue({ id: "resume-fallback" });

    const res = await POST(uploadRequest("resume.txt", "Jane Doe — Senior Engineer at Acme"));

    // Offline path still imports the resume — no 502 when AI is down.
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("resume-fallback");

    // The deterministic parser was used instead of the AI.
    expect(mockParseResumeText).toHaveBeenCalledWith("Jane Doe — Senior Engineer at Acme");
    expect(mockCreateResume).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({
        title: "Jane Doe's Resume",
        personalInfo: expect.objectContaining({ fullName: "Jane Doe", email: "jane@acme.com" }),
        summary: "Senior engineer with 6 years of experience.",
      })
    );
    expect(mockUpdateSections).toHaveBeenCalledWith("resume-fallback", "user-123", "experience", expect.any(Array));
    expect(mockUpdateSections).toHaveBeenCalledWith("resume-fallback", "user-123", "skills", expect.any(Object));
  });

  it("falls back to deterministic parsing when the AI output is not valid JSON", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockParseResumeFile.mockResolvedValue({ text: "John Smith — john@example.com" });
    mockCallGemini.mockResolvedValue({ success: true, output: "not json at all" });
    mockParseResumeText.mockReturnValue({
      targetLevel: "experienced",
      personalInfo: { fullName: "John Smith", email: "john@example.com", phone: "", linkedin: "", github: "", portfolio: "", photo: "" },
      summary: "",
      experience: [],
      education: [],
      skills: { technical: ["Python"], soft: [], tools: ["Git"], frameworks: [] },
      projects: [],
      certifications: [],
      achievements: [],
      languages: [],
    });
    mockCreateResume.mockResolvedValue({ id: "resume-fallback-2" });

    const res = await POST(uploadRequest("resume.txt", "John Smith — john@example.com"));

    expect(res.status).toBe(201);
    expect(mockCreateResume).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({
        personalInfo: expect.objectContaining({ fullName: "John Smith", email: "john@example.com" }),
      })
    );
  });

  it("returns 422 when nothing usable was extracted", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockParseResumeFile.mockResolvedValue({ text: "Jane Doe, Senior Engineer at Acme." });
    mockCallGemini.mockResolvedValue({
      success: true,
      output: JSON.stringify({ targetLevel: "fresher", personalInfo: {}, summary: "", experience: [], education: [], skills: {}, projects: [], certifications: [], achievements: [], languages: [] }),
    });

    const res = await POST(uploadRequest("resume.txt", "Jane Doe, Senior Engineer at Acme."));

    expect(res.status).toBe(422);
    expect((await res.json()).error).toContain("No usable resume content");
    expect(mockCreateResume).not.toHaveBeenCalled();
  });

  it("parses the AI output, creates a resume, and fills its sections", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockParseResumeFile.mockResolvedValue({ text: "Jane Doe — Senior Engineer at Acme" });
    mockCallGemini.mockResolvedValue({ success: true, output: `\`\`\`json\n${SAMPLE_RESUME_JSON}\n\`\`\`` });
    mockCreateResume.mockResolvedValue({ id: "resume-1" });

    const res = await POST(uploadRequest("jane-resume.pdf", "Jane Doe — Senior Engineer at Acme"));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ id: "resume-1", title: "Jane Doe's Resume" });

    // The AI is invoked with the resume-import-upload action and the parsed text.
    expect(mockCallGemini.mock.calls[0][0]).toMatchObject({
      action: "resume-import-upload",
      input: "Jane Doe — Senior Engineer at Acme",
    });

    // Resume created with the sanitized top-level data, no profile pre-fill.
    expect(mockCreateResume).toHaveBeenCalledWith("user-123", {
      title: "Jane Doe's Resume",
      template: "modern",
      targetLevel: "experienced",
      personalInfo: {
        fullName: "Jane Doe",
        email: "jane@acme.com",
        phone: "+1 555 0100",
        linkedin: "linkedin.com/in/jane",
        github: "github.com/jane",
        portfolio: "",
        photo: "",
      },
      summary: "Senior engineer with 6 years of experience.",
      prefill: false,
    });

    // Each populated section is written through updateSections.
    expect(mockUpdateSections).toHaveBeenCalledWith("resume-1", "user-123", "experience", [
      { company: "Acme", role: "Senior Engineer", location: "NYC", startDate: "2020", endDate: "2026", current: true, responsibilities: ["Built x", "Led y"], achievements: [] },
    ]);
    expect(mockUpdateSections).toHaveBeenCalledWith("resume-1", "user-123", "education", [
      { institution: "MIT", degree: "B.Tech", field: "CS", startDate: "2014", endDate: "2018", cgpa: "3.8" },
    ]);
    expect(mockUpdateSections).toHaveBeenCalledWith("resume-1", "user-123", "skills", {
      technical: ["TypeScript"],
      soft: ["Leadership"],
      tools: [],
      frameworks: [],
    });
    expect(mockUpdateSections).toHaveBeenCalledWith("resume-1", "user-123", "languages", [
      { name: "English", proficiency: "native" },
    ]);
  });

  it("passes a template override from the form to createResume", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockParseResumeFile.mockResolvedValue({ text: "Jane Doe — Senior Engineer at Acme" });
    mockCallGemini.mockResolvedValue({ success: true, output: `\`\`\`json\n${SAMPLE_RESUME_JSON}\n\`\`\`` });
    mockCreateResume.mockResolvedValue({ id: "resume-tpl" });

    const res = await POST(uploadRequest("jane-resume.pdf", "Jane Doe — Senior Engineer at Acme", "executive"));

    expect(res.status).toBe(201);
    // The chosen template is forwarded to createResume instead of the default.
    expect(mockCreateResume).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({ template: "executive" })
    );
  });

  it("trims whitespace around the template override", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockParseResumeFile.mockResolvedValue({ text: "Jane Doe — Senior Engineer at Acme" });
    mockCallGemini.mockResolvedValue({ success: true, output: `\`\`\`json\n${SAMPLE_RESUME_JSON}\n\`\`\`` });
    mockCreateResume.mockResolvedValue({ id: "resume-tpl-trim" });

    const res = await POST(uploadRequest("jane-resume.pdf", "Jane Doe — Senior Engineer at Acme", "  executive  "));

    expect(res.status).toBe(201);
    // Surrounding whitespace is stripped before forwarding to createResume.
    expect(mockCreateResume).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({ template: "executive" })
    );
  });

  it("falls back to the default template when the override is blank", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockParseResumeFile.mockResolvedValue({ text: "Jane Doe — Senior Engineer at Acme" });
    mockCallGemini.mockResolvedValue({ success: true, output: `\`\`\`json\n${SAMPLE_RESUME_JSON}\n\`\`\`` });
    mockCreateResume.mockResolvedValue({ id: "resume-tpl-blank" });

    const res = await POST(uploadRequest("jane-resume.pdf", "Jane Doe — Senior Engineer at Acme", "   "));

    expect(res.status).toBe(201);
    // Whitespace-only template values are treated as absent → "modern" default.
    expect(mockCreateResume).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({ template: "modern" })
    );
  });

  it("fills empty sections from the deterministic parser when AI output is thin", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockParseResumeFile.mockResolvedValue({ text: "Jane Doe — Senior Engineer at Acme" });
    // AI succeeds but returns no projects or languages.
    mockCallGemini.mockResolvedValue({
      success: true,
      output: JSON.stringify({
        targetLevel: "experienced",
        personalInfo: { fullName: "Jane Doe", email: "jane@acme.com" },
        summary: "Senior engineer.",
        experience: [{ company: "Acme", role: "Senior Engineer" }],
        education: [],
        skills: { technical: ["TypeScript"], soft: [], tools: [], frameworks: [] },
        projects: [],
        certifications: [],
        achievements: [],
        languages: [],
      }),
    });
    // Deterministic parser catches the sections the AI missed.
    mockParseResumeText.mockReturnValue({
      targetLevel: "experienced",
      personalInfo: { fullName: "Jane Doe", email: "jane@acme.com", phone: "", linkedin: "", github: "", portfolio: "", photo: "" },
      summary: "",
      experience: [],
      education: [],
      skills: { technical: [], soft: [], tools: [], frameworks: [] },
      projects: [{ name: "Resume Builder", description: "A tool", technologies: ["React"], liveUrl: "", githubUrl: "" }],
      certifications: [],
      achievements: [],
      languages: [{ name: "English", proficiency: "native" }],
    });
    mockCreateResume.mockResolvedValue({ id: "resume-merged" });

    const res = await POST(uploadRequest("resume.txt", "Jane Doe — Senior Engineer at Acme"));

    expect(res.status).toBe(201);
    // The empty AI sections were filled from the deterministic parser.
    expect(mockUpdateSections).toHaveBeenCalledWith("resume-merged", "user-123", "projects", [
      { name: "Resume Builder", description: "A tool", technologies: ["React"], liveUrl: "", githubUrl: "" },
    ]);
    expect(mockUpdateSections).toHaveBeenCalledWith("resume-merged", "user-123", "languages", [
      { name: "English", proficiency: "native" },
    ]);
    // Non-empty AI sections are kept as-is (no duplication).
    expect(mockUpdateSections).toHaveBeenCalledWith("resume-merged", "user-123", "experience", [
      { company: "Acme", role: "Senior Engineer", location: "", startDate: "", endDate: "", current: false, responsibilities: [], achievements: [] },
    ]);
  });

  it("coerces malformed AI output to safe empty values and skips empty sections", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockParseResumeFile.mockResolvedValue({ text: "Some resume text" });
    mockCallGemini.mockResolvedValue({
      success: true,
      output: JSON.stringify({
        targetLevel: "not-a-level",
        personalInfo: { fullName: null, email: 42 },
        summary: "",
        experience: [{ company: "", role: "", responsibilities: "not-an-array" }],
        education: [{ institution: "MIT" }],
        skills: { technical: "nope", soft: ["A"], tools: [], frameworks: [] },
        projects: [],
        certifications: [],
        achievements: [],
        languages: [],
      }),
    });
    mockCreateResume.mockResolvedValue({ id: "resume-2" });

    const res = await POST(uploadRequest("resume.txt", "Some resume text"));

    expect(res.status).toBe(201);
    // Invalid level falls back to fresher; malformed personalInfo is coerced.
    expect(mockCreateResume).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({
        targetLevel: "fresher",
        title: "Imported Resume",
        personalInfo: expect.objectContaining({ fullName: "", email: "" }),
      })
    );
    // Empty experience entry is dropped → no experience write at all.
    expect(mockUpdateSections).not.toHaveBeenCalledWith("resume-2", "user-123", "experience", expect.anything());
    // Only soft skills survive the string-array coercion.
    expect(mockUpdateSections).toHaveBeenCalledWith("resume-2", "user-123", "skills", {
      technical: [],
      soft: ["A"],
      tools: [],
      frameworks: [],
    });
  });
});
