import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import React from "react";

// The template components use the classic JSX transform (React in scope),
// which the vitest node transform does not auto-provide — expose it globally.
(globalThis as Record<string, unknown>).React = React;
import { ALL_TEMPLATE_IDS } from "./imported/catalog";
import { TemplateRenderer } from "./TemplateRenderer";
import { previewResume } from "./previewResume";
import type { ResumeData } from "@/types/resume";

/** Local alias keeps the fixture readable across the suite. */
const SAMPLE_RESUME = previewResume;

/** Every catalog template key — archetypes AND their variants. */
const ALL_TEMPLATES = ALL_TEMPLATE_IDS;

/** A fully empty resume — exercises every missing-data guard. */
const EMPTY_RESUME: ResumeData = {
  ...SAMPLE_RESUME,
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    portfolio: "",
    photo: "",
  },
  summary: "",
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
  customSections: {},
};

function render(template: string, resume: ResumeData): string {
  return renderToStaticMarkup(
    createElement(TemplateRenderer, { resume: { ...resume, template } })
  );
}

describe("template render smoke test — every active template", () => {
  it("renders real markup for every built-in template with sample data", () => {
    for (const id of ALL_TEMPLATES) {
      const html = render(id, SAMPLE_RESUME);
      expect(html.length, `${id} should produce real markup`).toBeGreaterThan(500);
      expect(html, `${id} should render the sample name`).toContain("Radheshyam");
      // No runtime artifacts from undefined/empty values.
      expect(html, `${id} must not leak 'undefined'`).not.toContain("undefined");
      expect(html, `${id} must not leak 'NaN'`).not.toContain("NaN");
    }
  });

  it("handles a completely empty resume without crashing or leaking junk", () => {
    for (const id of ALL_TEMPLATES) {
      const html = render(id, EMPTY_RESUME);
      expect(typeof html, `${id} should still produce markup`).toBe("string");
      expect(html, `${id} must not leak 'undefined'`).not.toContain("undefined");
      expect(html, `${id} must not leak 'null'`).not.toContain("null");
      expect(html, `${id} must not leak 'NaN'`).not.toContain("NaN");
      expect(html, `${id} must not leak '[object Object]'`).not.toContain("[object Object]");
    }
  });

  it("renders contact-less resumes without broken links or empty headings", () => {
    const noContact: ResumeData = {
      ...SAMPLE_RESUME,
      personalInfo: { ...SAMPLE_RESUME.personalInfo, email: "", phone: "", linkedin: "", github: "", portfolio: "" },
    };
    for (const id of ALL_TEMPLATES) {
      const html = render(id, noContact);
      expect(html).not.toContain("undefined");
      // No empty anchor with just a href.
      expect(html).not.toMatch(/<a[^>]*href=""[^>]*>/);
    }
  });
});

describe("template switching is non-destructive", () => {
  it("changing resume.template never touches any content field", () => {
    for (const id of ALL_TEMPLATES) {
      const switched: ResumeData = { ...SAMPLE_RESUME, template: id };
      expect(switched.template).toBe(id);
      // Deep-equal every content field against the original.
      expect(switched.personalInfo).toEqual(SAMPLE_RESUME.personalInfo);
      expect(switched.summary).toBe(SAMPLE_RESUME.summary);
      expect(switched.experience).toEqual(SAMPLE_RESUME.experience);
      expect(switched.education).toEqual(SAMPLE_RESUME.education);
      expect(switched.projects).toEqual(SAMPLE_RESUME.projects);
      expect(switched.skills).toEqual(SAMPLE_RESUME.skills);
      expect(switched.certifications).toEqual(SAMPLE_RESUME.certifications);
      expect(switched.customSections).toEqual(SAMPLE_RESUME.customSections);
    }
  });

  it("switch round-trip Modern → ATS → Executive → Modern keeps all data", () => {
    let resume = { ...SAMPLE_RESUME };
    const originalContent = { ...resume };
    delete (originalContent as Partial<ResumeData>).template;

    resume = { ...resume, template: "modern" };
    resume = { ...resume, template: "ats-professional" };
    resume = { ...resume, template: "executive" };
    resume = { ...resume, template: "modern" };

    const after = { ...resume };
    delete (after as Partial<ResumeData>).template;
    expect(after).toEqual(originalContent);
    expect(resume.template).toBe("modern");
  });
});
