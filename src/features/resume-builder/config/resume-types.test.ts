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
});
