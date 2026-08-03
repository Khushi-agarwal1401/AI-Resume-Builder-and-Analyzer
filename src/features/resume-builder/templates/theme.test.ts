import { describe, it, expect } from "vitest";
import type { ResumeData } from "@/types/resume";
import {
  DEFAULT_FONT_BY_TEMPLATE,
  FONT_FAMILY_OPTIONS,
  fontFamilyClass,
  pdfFontFamily,
  getAccent,
  accentWithAlpha,
} from "./theme";

/** Minimal ResumeData — only the fields getAccet reads are populated. */
function resumeWith(overrides: Partial<Pick<ResumeData, "accentColor">> = {}): ResumeData {
  return {
    id: "r1",
    userId: "u1",
    title: "Test",
    template: "modern",
    targetLevel: "fresher",
    sectionOrder: [],
    accentColor: null,
    fontFamily: "sans",
    summary: "",
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      linkedin: "",
      github: "",
      portfolio: "",
      photo: "",
    },
    education: [],
    experience: [],
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
    ...overrides,
  };
}

describe("DEFAULT_FONT_BY_TEMPLATE", () => {
  it("covers every template id", () => {
    expect(Object.keys(DEFAULT_FONT_BY_TEMPLATE).sort()).toEqual([
      "ats-professional",
      "creative",
      "executive",
      "executive-sidebar",
      "minimal",
      "modern",
      "modern-card",
      "student",
    ]);
  });

  it("defaults every template to sans except executive (serif by design)", () => {
    for (const [template, font] of Object.entries(DEFAULT_FONT_BY_TEMPLATE)) {
      if (template === "executive") {
        expect(font).toBe("serif");
      } else {
        expect(font).toBe("sans");
      }
    }
  });
});

describe("FONT_FAMILY_OPTIONS", () => {
  it("exposes exactly the three fonts with matching web + PDF families", () => {
    expect(FONT_FAMILY_OPTIONS).toHaveLength(3);
    expect(FONT_FAMILY_OPTIONS.map((f) => f.value)).toEqual(["sans", "serif", "mono"]);
    const byValue = Object.fromEntries(FONT_FAMILY_OPTIONS.map((f) => [f.value, f]));
    expect(byValue.sans).toMatchObject({ webClass: "font-sans", pdfFont: "Helvetica" });
    expect(byValue.serif).toMatchObject({ webClass: "font-serif", pdfFont: "Times-Roman" });
    expect(byValue.mono).toMatchObject({ webClass: "font-mono", pdfFont: "Courier" });
  });
});

describe("fontFamilyClass", () => {
  it("maps each font to its tailwind class", () => {
    expect(fontFamilyClass("sans")).toBe("font-sans");
    expect(fontFamilyClass("serif")).toBe("font-serif");
    expect(fontFamilyClass("mono")).toBe("font-mono");
  });

  it("falls back to font-sans for unknown/undefined values", () => {
    expect(fontFamilyClass(undefined)).toBe("font-sans");
  });
});

describe("pdfFontFamily", () => {
  it("maps each font to its PDF font name", () => {
    expect(pdfFontFamily("sans")).toBe("Helvetica");
    expect(pdfFontFamily("serif")).toBe("Times-Roman");
    expect(pdfFontFamily("mono")).toBe("Courier");
  });

  it("falls back to Helvetica for unknown/undefined values", () => {
    expect(pdfFontFamily(undefined)).toBe("Helvetica");
  });
});

describe("getAccent", () => {
  it("uses the resume's accentColor when set", () => {
    expect(getAccent(resumeWith({ accentColor: "#FF0000" }), "#2563EB")).toBe("#FF0000");
  });

  it("falls back to the template default when accentColor is null", () => {
    expect(getAccent(resumeWith({ accentColor: null }), "#0A66C2")).toBe("#0A66C2");
  });

  it("falls back to the template default when accentColor is undefined", () => {
    expect(getAccent(resumeWith({ accentColor: undefined }), "#111827")).toBe("#111827");
  });
});

describe("accentWithAlpha", () => {
  it("converts a #-prefixed hex color to rgba with the given alpha", () => {
    expect(accentWithAlpha("#2563EB", 0.5)).toBe("rgba(37, 99, 235, 0.5)");
    expect(accentWithAlpha("#10B981", 0.1)).toBe("rgba(16, 185, 129, 0.1)");
  });

  it("also handles hex colors without the leading #", () => {
    expect(accentWithAlpha("2563EB", 0.25)).toBe("rgba(37, 99, 235, 0.25)");
  });

  it("supports full and transparent alpha", () => {
    expect(accentWithAlpha("#000000", 1)).toBe("rgba(0, 0, 0, 1)");
    expect(accentWithAlpha("#FFFFFF", 0)).toBe("rgba(255, 255, 255, 0)");
  });
});
