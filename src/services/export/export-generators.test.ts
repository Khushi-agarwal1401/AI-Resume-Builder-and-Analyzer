import { describe, it, expect } from "vitest";
import { Packer } from "docx";
import type { ResumeData } from "@/types/resume";
import { buildTxt, generateTxtBuffer } from "./txtGenerator";
import { buildDocx } from "./docxGenerator";

function createMockResume(overrides?: Partial<ResumeData>): ResumeData {
  return {
    id: "res-1",
    userId: "user-1",
    title: "Software Engineer Resume",
    template: "modern",
    targetLevel: "experienced",
    personalInfo: {
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
      phone: "+1-555-123-4567",
      linkedin: "linkedin.com/in/janedoe",
      github: "github.com/janedoe",
      portfolio: "janedoe.dev",
      photo: "",
    },
    summary: "Results-driven software engineer with 5+ years building scalable web applications.",
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
        company: "TechNova",
        role: "Senior Engineer",
        location: "San Francisco",
        startDate: "2021",
        endDate: "2026",
        current: true,
        responsibilities: ["Built scalable APIs", "Improved performance 40%"],
        achievements: [],
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: "AI Analyzer",
        description: "ML resume analysis tool",
        technologies: ["Python", "React"],
        liveUrl: "",
        githubUrl: "github.com/janedoe/ai-analyzer",
      },
    ],
    skills: {
      technical: ["TypeScript", "Go"],
      soft: ["Leadership"],
      tools: ["Docker"],
      frameworks: ["React"],
    },
    certifications: [
      { id: "cert-1", name: "AWS Solutions Architect", issuer: "Amazon", date: "2024", url: "" },
    ],
    achievements: [
      { id: "ach-1", title: "Best Engineer Award", description: "Platform reliability", date: "2025" },
    ],
    languages: [{ id: "lang-1", name: "English", proficiency: "native" }],
    codingProfiles: [],
    leadership: [],
    openSource: [],
    publications: [],
    volunteer: [],
    activities: [],
    coursework: [],
    interests: [],
    createdAt: "2024-01-01",
    updatedAt: "2026-07-01",
    ...overrides,
  };
}

describe("txtGenerator", () => {
  it("produces ATS-parseable plain text with all sections", () => {
    const txt = buildTxt(createMockResume());
    expect(txt).toContain("Jane Doe");
    expect(txt).toContain("PROFESSIONAL SUMMARY");
    expect(txt).toContain("EXPERIENCE");
    expect(txt).toContain("Senior Engineer");
    expect(txt).toContain("EDUCATION");
    expect(txt).toContain("Stanford University");
    expect(txt).toContain("PROJECTS");
    expect(txt).toContain("AI Analyzer");
    expect(txt).toContain("SKILLS");
    expect(txt).toContain("TypeScript, Go");
    expect(txt).toContain("CERTIFICATIONS");
    expect(txt).toContain("ACHIEVEMENTS");
    expect(txt).toContain("LANGUAGES");
  });

  it("omits empty sections", () => {
    const resume = createMockResume();
    resume.languages = [];
    resume.certifications = [];
    const txt = buildTxt(resume);
    expect(txt).not.toContain("LANGUAGES");
    expect(txt).not.toContain("CERTIFICATIONS");
  });

  it("generates a UTF-8 buffer", () => {
    const buffer = generateTxtBuffer(createMockResume());
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString("utf-8")).toContain("Jane Doe");
  });
});

describe("docxGenerator", () => {
  it("builds a valid docx Document", async () => {
    const doc = buildDocx(createMockResume());
    expect(doc).toBeDefined();
    const buffer = await Packer.toBuffer(doc);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
  });
});
