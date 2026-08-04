import { describe, it, expect } from "vitest";
import { getOrderedSections, RESUME_TYPES } from "./resume-types";
import type { ResumeData } from "@/types/resume";

const BASE: Pick<ResumeData, "sectionOrder" | "targetLevel"> = {
  sectionOrder: [],
  targetLevel: "fresher",
};

describe("getOrderedSections", () => {
  it("returns the resume type's default order when no custom order is saved", () => {
    const ordered = getOrderedSections(BASE);
    expect(ordered.map((s) => s.id)).toEqual(
      RESUME_TYPES.fresher.sections.map((s) => s.id)
    );
    expect(ordered[0].id).toBe("personalInfo");
  });

  it("applies a saved custom order", () => {
    const ordered = getOrderedSections({
      ...BASE,
      sectionOrder: ["personalInfo", "projects", "skills", "summary"],
    });
    expect(ordered.slice(0, 4).map((s) => s.id)).toEqual([
      "personalInfo",
      "projects",
      "skills",
      "summary",
    ]);
  });

  it("always pins the first section (personal info) at the top", () => {
    // Even if a custom order moves personalInfo elsewhere, it stays first.
    const ordered = getOrderedSections({
      ...BASE,
      sectionOrder: ["skills", "personalInfo", "summary"],
    });
    expect(ordered[0].id).toBe("personalInfo");
  });

  it("appends sections missing from the custom order so nothing disappears", () => {
    const ordered = getOrderedSections({
      ...BASE,
      sectionOrder: ["skills"],
    });
    const ids = ordered.map((s) => s.id);
    expect(ids[1]).toBe("skills");
    // Every default section is still present.
    for (const section of RESUME_TYPES.fresher.sections) {
      expect(ids).toContain(section.id);
    }
    // And nothing is duplicated.
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("skips unknown section ids", () => {
    const ordered = getOrderedSections({
      ...BASE,
      sectionOrder: ["summary", "does-not-exist", "skills"],
    });
    const ids = ordered.map((s) => s.id);
    expect(ids).not.toContain("does-not-exist");
    expect(ids.indexOf("summary")).toBeLessThan(ids.indexOf("skills"));
  });

  it("falls back to the default config when targetLevel is unknown", () => {
    const ordered = getOrderedSections({
      sectionOrder: [],
      targetLevel: "not-a-level" as ResumeData["targetLevel"],
    });
    expect(ordered).toEqual(RESUME_TYPES.fresher.sections);
  });

  it("appends custom sections after the defaults when no custom order is saved", () => {
    const ordered = getOrderedSections({
      ...BASE,
      customSections: {
        "custom-a": { title: "Awards", items: [] },
        "custom-b": { title: "Conferences", items: [] },
      },
    });
    const ids = ordered.map((s) => s.id);
    // Defaults first (in order), then customs appended.
    expect(ids.slice(0, RESUME_TYPES.fresher.sections.length)).toEqual(
      RESUME_TYPES.fresher.sections.map((s) => s.id)
    );
    expect(ids.slice(-2)).toEqual(["custom-a", "custom-b"]);
  });

  it("places custom sections according to a saved custom order", () => {
    const ordered = getOrderedSections({
      ...BASE,
      sectionOrder: ["custom-a", "projects"],
      customSections: { "custom-a": { title: "Awards", items: [] } },
    });
    const ids = ordered.map((s) => s.id);
    expect(ids[1]).toBe("custom-a");
    expect(ids.indexOf("custom-a")).toBeLessThan(ids.indexOf("projects"));
  });

  it("uses the custom section title as its label with a fallback", () => {
    const ordered = getOrderedSections({
      ...BASE,
      customSections: {
        "custom-a": { title: "  Awards  ", items: [] },
        "custom-b": { title: "", items: [] },
      },
    });
    const byId = new Map(ordered.map((s) => [s.id, s]));
    expect(byId.get("custom-a")?.label).toBe("Awards");
    expect(byId.get("custom-b")?.label).toBe("Custom Section");
    expect(byId.get("custom-a")?.isOptional).toBe(true);
  });
});
