import { describe, expect, it } from "vitest";
import {
  getRecommendedSectionOrder,
  getTemplateSectionPreset,
  presetSectionLabels,
  SECTION_LABELS,
  TEMPLATE_SECTION_PRESETS,
} from "./template-section-presets";
import { BUILTIN_TEMPLATE_IDS } from "../templates/imported/catalog";
import { ALL_TEMPLATE_IDS } from "../templates/imported/catalog";

describe("getTemplateSectionPreset", () => {
  it("provides a preset for every built-in template", () => {
    for (const id of BUILTIN_TEMPLATE_IDS) {
      const preset = getTemplateSectionPreset(id);
      expect(preset.id).toBe(id);
      expect(preset.sections.length).toBeGreaterThan(0);
    }
  });

  it("falls back to the Modern preset for unknown keys", () => {
    expect(getTemplateSectionPreset("not-a-template").id).toBe("modern");
  });

  it("variants inherit their archetype's preset (role-appropriate structure)", () => {
    // A student archetype variant must NOT fall back to the Modern preset.
    expect(getTemplateSectionPreset("student-developer").sections).toEqual(
      getTemplateSectionPreset("student").sections
    );
    expect(getTemplateSectionPreset("ats-software-engineer").sections).toEqual(
      getTemplateSectionPreset("ats-professional").sections
    );
    expect(getTemplateSectionPreset("executive-tech").sections).toEqual(
      getTemplateSectionPreset("executive").sections
    );
  });

  it("every catalog variant resolves to a real preset with known sections", () => {
    for (const id of ALL_TEMPLATE_IDS) {
      const preset = getTemplateSectionPreset(id);
      expect(preset.sections.length, `${id} resolved to empty preset`).toBeGreaterThan(0);
      for (const section of preset.sections) {
        expect(SECTION_LABELS, `${id} uses unknown section ${section}`).toHaveProperty(section);
      }
    }
  });

  it("never includes personalInfo (it is always pinned by the renderer)", () => {
    for (const preset of TEMPLATE_SECTION_PRESETS) {
      expect(preset.sections).not.toContain("personalInfo");
    }
  });

  it("contains only known section ids", () => {
    for (const preset of TEMPLATE_SECTION_PRESETS) {
      for (const section of preset.sections) {
        expect(SECTION_LABELS, `${preset.id} uses unknown section ${section}`).toHaveProperty(section);
      }
    }
  });
});

describe("presetSectionLabels", () => {
  it("maps section ids to human-readable labels", () => {
    const labels = presetSectionLabels(getTemplateSectionPreset("executive"));
    expect(labels[0].label).toBe("Summary");
    expect(labels.map((l) => l.label)).toContain("Leadership");
  });
});

describe("getRecommendedSectionOrder", () => {
  it("returns the template's default order without refinement", () => {
    expect(getRecommendedSectionOrder("executive")).toEqual(
      getTemplateSectionPreset("executive").sections
    );
  });

  it("promotes education, publications and coursework for academic roles", () => {
    const order = getRecommendedSectionOrder("modern", { role: "Academic Researcher" });
    expect(order.indexOf("education")).toBeLessThan(order.indexOf("experience"));
    expect(order.indexOf("publications")).toBeLessThan(order.indexOf("languages"));
    expect(order.indexOf("coursework")).toBeLessThan(order.indexOf("interests"));
  });

  it("promotes experience and achievements for executive roles", () => {
    const order = getRecommendedSectionOrder("modern", { role: "CTO" });
    expect(order[0]).toBe("summary");
    expect(order.indexOf("experience")).toBeLessThan(order.indexOf("education"));
    expect(order.indexOf("achievements")).toBeLessThan(order.indexOf("languages"));
  });

  it("keeps education early for student target levels", () => {
    const order = getRecommendedSectionOrder("modern", { targetLevel: "student" });
    expect(order.indexOf("education")).toBeLessThan(order.indexOf("experience"));
  });

  it("falls back to the template's base order when the role matches no rule", () => {
    expect(getRecommendedSectionOrder("modern", { role: "Sales Operations" })).toEqual(
      getTemplateSectionPreset("modern").sections
    );
  });

  it("is deterministic for the same inputs", () => {
    const a = getRecommendedSectionOrder("executive", { role: "Engineering Director", targetLevel: "experienced" });
    const b = getRecommendedSectionOrder("executive", { role: "Engineering Director", targetLevel: "experienced" });
    expect(a).toEqual(b);
  });

  it("every refined order preserves all preset sections without duplicates or losses", () => {
    for (const id of BUILTIN_TEMPLATE_IDS) {
      const order = getRecommendedSectionOrder(id, { role: "Software Engineer", targetLevel: "experienced" });
      expect(order).toHaveLength(getTemplateSectionPreset(id).sections.length);
      expect(new Set(order)).toEqual(new Set(getTemplateSectionPreset(id).sections));
    }
  });
});
