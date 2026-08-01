import { describe, it, expect } from "vitest";
import { Packer, type Document } from "docx";
import JSZip from "jszip";
import type { ResumeData } from "@/types/resume";
import { buildTxt, generateTxtBuffer } from "./txtGenerator";
import { buildDocx, generateDocxBuffer } from "./docxGenerator";

/** Extract word/document.xml from a built DOCX so tests can assert on real content. */
async function extractDocxXml(doc: Document): Promise<string> {
  const buffer = await Packer.toBuffer(doc);
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file("word/document.xml");
  if (!file) throw new Error("word/document.xml not found in DOCX");
  return file.async("string");
}

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

  it("renders 'Present' for current roles and the end date otherwise", () => {
    const current = buildTxt(createMockResume());
    expect(current).toContain("TechNova, San Francisco  (2021 – Present)");

    const ended = createMockResume();
    ended.experience[0].current = false;
    expect(buildTxt(ended)).toContain("TechNova, San Francisco  (2021 – 2026)");
  });

  it("labels each non-empty skill group and skips empty ones", () => {
    const txt = buildTxt(createMockResume());
    expect(txt).toContain("Technical: TypeScript, Go");
    expect(txt).toContain("Frameworks: React");
    expect(txt).toContain("Tools: Docker");
    expect(txt).toContain("Soft Skills: Leadership");

    const sparse = createMockResume();
    sparse.skills.tools = [];
    sparse.skills.soft = [];
    const txt2 = buildTxt(sparse);
    expect(txt2).toContain("Technical: TypeScript, Go");
    expect(txt2).not.toContain("Tools:");
    expect(txt2).not.toContain("Soft Skills:");
  });

  it("joins all non-empty contact fields with a separator and omits the line when all empty", () => {
    const txt = buildTxt(createMockResume());
    expect(txt).toContain("jane.doe@example.com  |  +1-555-123-4567");
    expect(txt).toContain("linkedin.com/in/janedoe");

    const bare = createMockResume();
    bare.personalInfo = {
      ...bare.personalInfo,
      email: "",
      phone: "",
      linkedin: "",
      github: "",
      portfolio: "",
    };
    const txt2 = buildTxt(bare);
    expect(txt2).toContain("Jane Doe");
    // The contact separator only appears on the contact line; education uses " | " (single spaces)
    expect(txt2).not.toContain("  |  ");
  });

  it("renders education with degree, field, and CGPA detail", () => {
    const txt = buildTxt(createMockResume());
    expect(txt).toContain("Stanford University  (2016-09 – 2020-06)");
    expect(txt).toContain("  B.S. Computer Science | in Artificial Intelligence | CGPA: 3.8");
  });

  it("renders projects with name, technologies, description, and links", () => {
    const txt = buildTxt(createMockResume());
    expect(txt).toContain("AI Analyzer");
    expect(txt).toContain("  Python, React");
    expect(txt).toContain("  ML resume analysis tool");
    expect(txt).toContain("  github.com/janedoe/ai-analyzer");
  });

  it("formats certifications as name — issuer — date", () => {
    expect(buildTxt(createMockResume())).toContain("AWS Solutions Architect — Amazon — 2024");
  });

  it("formats achievements with title, date, and description", () => {
    const txt = buildTxt(createMockResume());
    expect(txt).toContain("Best Engineer Award (2025)");
    expect(txt).toContain("  Platform reliability");
  });

  it("formats languages as name (proficiency)", () => {
    expect(buildTxt(createMockResume())).toContain("English (native)");
  });

  it("omits the summary section when summary is empty", () => {
    const resume = createMockResume();
    resume.summary = "";
    expect(buildTxt(resume)).not.toContain("PROFESSIONAL SUMMARY");
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

  it("generateDocxBuffer returns a ZIP buffer", async () => {
    const buffer = await generateDocxBuffer(createMockResume());
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
  });

  it("embeds resume content in the exported XML", async () => {
    const xml = await extractDocxXml(buildDocx(createMockResume()));
    expect(xml).toContain("Jane Doe");
    expect(xml).toContain("PROFESSIONAL SUMMARY");
    expect(xml).toContain("TechNova");
    expect(xml).toContain("TypeScript");
    expect(xml).toContain("Stanford University");
    expect(xml).toContain("AWS Solutions Architect");
  });

  it("renders 'Present' for current experience dates", async () => {
    const xml = await extractDocxXml(buildDocx(createMockResume()));
    expect(xml).toContain("2021 – Present");
  });

  it("applies the accent color to section heading borders", async () => {
    const xml = await extractDocxXml(buildDocx(createMockResume({ accentColor: "#FF0000" })));
    expect(xml).toContain("FF0000");
    expect(xml).not.toContain("2563EB");
  });

  it("builds a valid document from a fully empty resume", async () => {
    const empty = createMockResume({
      summary: "",
      experience: [],
      education: [],
      projects: [],
      skills: { technical: [], soft: [], tools: [], frameworks: [] },
      certifications: [],
      achievements: [],
      languages: [],
    });
    const doc = buildDocx(empty);
    const buffer = await Packer.toBuffer(doc);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
  });
});
