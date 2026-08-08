import { describe, expect, it } from "vitest";
import { Packer, type Document } from "docx";
import JSZip from "jszip";
import type { ResumeData } from "@/types/resume";
import { ALL_TEMPLATE_IDS } from "@/features/resume-builder/templates/imported/catalog";
import { renderResumeToLatex } from "./latexRenderer";
import { buildDocx, generateDocxBuffer } from "./docxGenerator";
import { buildTxt, generateTxtBuffer } from "./txtGenerator";
import { generatePdfBuffer } from "./pdfRenderer";

/** Every catalog template key — export parity is asserted for each one. */
const ALL_TEMPLATES = ALL_TEMPLATE_IDS;

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

/** Fully empty resume — exercises every missing-data guard in each exporter. */
function createEmptyResume(): ResumeData {
  return createMockResume({
    summary: "",
    education: [],
    experience: [],
    projects: [],
    skills: { technical: [], soft: [], tools: [], frameworks: [] },
    certifications: [],
    achievements: [],
    languages: [],
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      linkedin: "",
      github: "",
      portfolio: "",
      photo: "",
    },
  });
}

describe("export parity — LaTeX generator across all built-in templates", () => {
  it("renders a complete LaTeX document for every template", () => {
    for (const id of ALL_TEMPLATES) {
      const latex = renderResumeToLatex({ ...createMockResume(), template: id });
      expect(latex.trim(), `${id} should open a document`).toMatch(/^\\documentclass/);
      expect(latex, `${id} should close the document`).toContain("\\end{document}");
      // Case-insensitive: some designs (e.g. Minimal) set the masthead in
      // uppercase/small-caps by design, but the name must always be present.
      expect(latex.toLowerCase(), `${id} should embed the candidate name`).toContain("jane doe");
      expect(latex.length, `${id} should produce real content`).toBeGreaterThan(500);
      // No runtime artifacts from template dispatch.
      expect(latex).not.toContain("undefined");
    }
  });

  it("produces distinct output per template — the dispatcher never collapses", () => {
    const outputs = ALL_TEMPLATES.map((id) => renderResumeToLatex({ ...createMockResume(), template: id }));
    expect(new Set(outputs).size).toBe(ALL_TEMPLATES.length);
  });

  it("falls back to Modern for unknown template keys", () => {
    const modern = renderResumeToLatex({ ...createMockResume(), template: "modern" });
    const unknown = renderResumeToLatex({ ...createMockResume(), template: "unknown-template" });
    expect(unknown).toBe(modern);
  });

  it("escapes LaTeX special characters in content", () => {
    const nasty = createMockResume({ summary: "R&D at 100% — 50% & 40% #2 {core}" });
    const latex = renderResumeToLatex({ ...nasty, template: "modern" });
    expect(latex).toContain("R\\&D");
    expect(latex).toContain("100\\%");
    expect(latex).toContain("\\#2");
  });

  it("renders a valid skeleton for an empty resume on every template", () => {
    for (const id of ALL_TEMPLATES) {
      const latex = renderResumeToLatex({ ...createEmptyResume(), template: id });
      expect(latex.trim(), `${id} should still open a document`).toMatch(/^\\documentclass/);
      expect(latex, `${id} should still close the document`).toContain("\\end{document}");
      expect(latex, `${id} must not leak 'undefined'`).not.toContain("undefined");
    }
  });
});

describe("export parity — DOCX generator across all built-in templates", () => {
  it("produces a valid DOCX buffer for every template", async () => {
    for (const id of ALL_TEMPLATES) {
      const buffer = await generateDocxBuffer({ ...createMockResume(), template: id });
      expect(Buffer.isBuffer(buffer), `${id} should produce a buffer`).toBe(true);
      expect(buffer.subarray(0, 2).toString(), `${id} should be a ZIP`).toBe("PK");
      expect(buffer.length, `${id} should contain real content`).toBeGreaterThan(1000);
    }
  }, 60000);

  it("embeds resume content for every template", async () => {
    for (const id of ALL_TEMPLATES) {
      const xml = await extractDocxXml(buildDocx({ ...createMockResume(), template: id }));
      expect(xml, `${id} should embed the name`).toContain("Jane Doe");
      expect(xml, `${id} should embed experience`).toContain("TechNova");
      expect(xml, `${id} should embed the summary heading`).toContain("PROFESSIONAL SUMMARY");
      expect(xml, `${id} should embed skills`).toContain("TypeScript");
    }
  }, 60000);

  it("applies the user's accent color regardless of template", async () => {
    for (const id of ALL_TEMPLATES) {
      const xml = await extractDocxXml(
        buildDocx({ ...createMockResume(), template: id, accentColor: "#FF0000" })
      );
      expect(xml, `${id} should carry the custom accent`).toContain("FF0000");
      expect(xml, `${id} should not leak the default accent`).not.toContain("2563EB");
    }
  }, 60000);

  it("builds a valid DOCX from a fully empty resume on every template", async () => {
    for (const id of ALL_TEMPLATES) {
      const buffer = await generateDocxBuffer({ ...createEmptyResume(), template: id });
      expect(buffer.subarray(0, 2).toString(), `${id} should still be a ZIP`).toBe("PK");
      expect(Buffer.isBuffer(buffer)).toBe(true);
    }
  }, 60000);
});

describe("export parity — PDF generator across all built-in templates", () => {
  it("produces a valid PDF buffer for every template (incl. the premium variants)", async () => {
    for (const id of ALL_TEMPLATES) {
      const buffer = await generatePdfBuffer({ ...createMockResume(), template: id });
      expect(Buffer.isBuffer(buffer), `${id} should produce a buffer`).toBe(true);
      expect(buffer.subarray(0, 5).toString(), `${id} should be a PDF`).toBe("%PDF-");
      expect(buffer.length, `${id} should contain real content`).toBeGreaterThan(100);
    }
  }, 60000);

  it("produces distinct PDFs per template — the dispatcher never collapses", async () => {
    // Render SEQUENTIALLY: @react-pdf/renderer shares a font/store registry, so
    // concurrent renderToBuffer calls can race and emit identical bytes for
    // distinct inputs. Sequential rendering is deterministic.
    const fingerprints: string[] = [];
    for (const id of ALL_TEMPLATES) {
      fingerprints.push(
        (await generatePdfBuffer({ ...createMockResume(), template: id })).toString("hex")
      );
    }
    expect(new Set(fingerprints).size).toBe(ALL_TEMPLATES.length);
  }, 60000);

  it("renders a valid PDF for the premium variants from an empty resume", async () => {
    for (const id of ["executive-sidebar", "modern-card"] as const) {
      const buffer = await generatePdfBuffer({ ...createEmptyResume(), template: id });
      expect(buffer.subarray(0, 5).toString(), `${id} should still be a PDF`).toBe("%PDF-");
      expect(Buffer.isBuffer(buffer)).toBe(true);
    }
  });
});

describe("export parity — TXT generator is template-independent", () => {
  it("produces byte-identical plain text for every built-in template", () => {
    const baseline = buildTxt(createMockResume());
    expect(baseline).toContain("Jane Doe");
    for (const id of ALL_TEMPLATES) {
      const txt = buildTxt({ ...createMockResume(), template: id });
      expect(txt, `${id} must not change TXT output`).toBe(baseline);
    }
  });

  it("produces byte-identical UTF-8 buffers for every built-in template", () => {
    const baseline = generateTxtBuffer(createMockResume());
    for (const id of ALL_TEMPLATES) {
      const buffer = generateTxtBuffer({ ...createMockResume(), template: id });
      expect(buffer.equals(baseline), `${id} must not change TXT bytes`).toBe(true);
      expect(buffer.toString("utf-8")).toBe(baseline.toString("utf-8"));
    }
  });

  it("also stays identical for a fully empty resume", () => {
    const baseline = buildTxt(createEmptyResume());
    for (const id of ALL_TEMPLATES) {
      expect(buildTxt({ ...createEmptyResume(), template: id })).toBe(baseline);
    }
  });
});
