import { describe, it, expect } from "vitest";
import type { ResumeData } from "@/types/resume";
import { generatePdfBuffer } from "./pdfRenderer";

// ══════════════════════════════════════════════════════════════════════════
//  Mock resume data factory
// ══════════════════════════════════════════════════════════════════════════

function createMockResume(overrides?: Partial<ResumeData>): ResumeData {
  return {
    id: "res-1",
    userId: "user-1",
    title: "Software Engineer Resume",
    template: "modern",
    targetLevel: "experienced",
    sectionOrder: [],
    personalInfo: {
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
      phone: "+1-555-123-4567",
      linkedin: "linkedin.com/in/janedoe",
      github: "github.com/janedoe",
      portfolio: "janedoe.dev",
      photo: "",
    },
    summary:
      "Results-driven software engineer with 5+ years building scalable web applications.",
    education: [
      {
        id: "edu-1",
        institution: "Stanford University",
        degree: "B.S. Computer Science",
        field: "Artificial Intelligence",
        startDate: "2016-09",
        endDate: "2020-06",
        cgpa: "3.8",
      },
    ],
    experience: [
      {
        id: "exp-1",
        company: "TechCorp Inc.",
        role: "Senior Software Engineer",
        location: "San Francisco, CA",
        startDate: "2022-03",
        endDate: "",
        current: true,
        responsibilities: [
          "Led a team of 4 engineers to build a real-time analytics dashboard",
          "Reduced API response times by 40% through query optimization",
        ],
        achievements: [],
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: "Open Source CLI Tool",
        description: "A CLI tool for automating project scaffolding",
        technologies: ["Node.js", "TypeScript"],
        liveUrl: "",
        githubUrl: "github.com/janedoe/cli-tool",
      },
    ],
    skills: {
      technical: ["JavaScript", "TypeScript", "Python"],
      frameworks: ["React", "Next.js"],
      tools: ["Docker", "AWS"],
      soft: ["Leadership", "Communication"],
    },
    certifications: [
      {
        id: "cert-1",
        name: "AWS Solutions Architect",
        issuer: "Amazon Web Services",
        date: "2023-06",
        url: "",
      },
    ],
    achievements: [
      {
        id: "ach-1",
        title: "Employee of the Quarter",
        description: "Recognized for outstanding product launch contribution",
        date: "2023-Q1",
      },
    ],
    languages: [
      { id: "lang-1", name: "English", proficiency: "native" },
      { id: "lang-2", name: "Spanish", proficiency: "advanced" },
    ],
    codingProfiles: [],
    leadership: [],
    openSource: [],
    publications: [],
    volunteer: [],
    activities: [],
    coursework: [],
    interests: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════
//  generatePdfBuffer — PDF output validation
// ══════════════════════════════════════════════════════════════════════════
//  Note: PDF content streams are FlateDecode-compressed by @react-pdf/renderer,
//  so we validate structure (header, length, no throw) rather than raw text.
// ══════════════════════════════════════════════════════════════════════════

describe("generatePdfBuffer — PDF output", () => {
  it.each([
    "modern",
    "ats-professional",
    "student",
    "minimal",
    "executive",
    "creative",
  ] as const)("produces valid PDF buffer for %s template", async (template) => {
    const resume = createMockResume({ template });
    const buffer = await generatePdfBuffer(resume);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("defaults to modern layout for unknown template value", async () => {
    // Cast needed to test runtime fallback even though TypeScript prevents it at compile time
    const resume = createMockResume({ template: "unknown" as ResumeData["template"] });
    const buffer = await generatePdfBuffer(resume);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("generatePdfBuffer — each template produces unique PDF", () => {
  it("different templates produce different PDF buffers", async () => {
    const baseResume = createMockResume();
    const modern = await generatePdfBuffer(baseResume);
    const creative = await generatePdfBuffer({ ...baseResume, template: "creative" });

    // Different templates should produce different byte content
    expect(modern.equals(creative)).toBe(false);
  });
});

describe("generatePdfBuffer — edge cases", () => {
  it("handles empty experience array", async () => {
    const resume = createMockResume({ experience: [] });
    const buffer = await generatePdfBuffer(resume);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles empty education array", async () => {
    const resume = createMockResume({ education: [] });
    const buffer = await generatePdfBuffer(resume);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles empty skills arrays", async () => {
    const resume = createMockResume({
      skills: { technical: [], frameworks: [], tools: [], soft: [] },
    });
    const buffer = await generatePdfBuffer(resume);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles empty projects array", async () => {
    const resume = createMockResume({ projects: [] });
    const buffer = await generatePdfBuffer(resume);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles empty certifications array", async () => {
    const resume = createMockResume({ certifications: [] });
    const buffer = await generatePdfBuffer(resume);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles empty achievements array", async () => {
    const resume = createMockResume({ achievements: [] });
    const buffer = await generatePdfBuffer(resume);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles empty languages array", async () => {
    const resume = createMockResume({ languages: [] });
    const buffer = await generatePdfBuffer(resume);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles missing summary", async () => {
    const resume = createMockResume({ summary: "" });
    const buffer = await generatePdfBuffer(resume);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles empty optional contact fields", async () => {
    const resume = createMockResume({
      personalInfo: {
        ...createMockResume().personalInfo,
        phone: "",
        linkedin: "",
        github: "",
        portfolio: "",
      },
    });
    const buffer = await generatePdfBuffer(resume);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles all sections empty simultaneously", async () => {
    const resume = createMockResume({
      summary: "",
      education: [],
      experience: [],
      projects: [],
      skills: { technical: [], frameworks: [], tools: [], soft: [] },
      certifications: [],
      achievements: [],
      languages: [],
    });
    const buffer = await generatePdfBuffer(resume);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("generatePdfBuffer — minimal resume (name + email only)", () => {
  it("produces valid PDF with only personal info", async () => {
    const resume = createMockResume({
      summary: "",
      education: [],
      experience: [],
      projects: [],
      skills: { technical: [], frameworks: [], tools: [], soft: [] },
      certifications: [],
      achievements: [],
      languages: [],
    });
    const buffer = await generatePdfBuffer(resume);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(50);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
