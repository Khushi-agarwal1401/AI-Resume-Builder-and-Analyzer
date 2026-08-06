import { describe, expect, it } from "vitest";
import {
  TEMPLATE_FILTERS,
  TEMPLATE_SORTS,
  filterTemplates,
  getCompareRows,
  getTemplateInfo,
  normalizeTemplateKey,
  sortTemplates,
} from "./template-discovery";

interface TestTemplate {
  key: string;
  name: string;
  addedAt?: string;
}

const TEMPLATES: TestTemplate[] = [
  { key: "modern", name: "Modern" },
  { key: "ats-professional", name: "ATS Professional" },
  { key: "student", name: "Student" },
  { key: "minimal", name: "Minimal" },
  { key: "executive", name: "Executive" },
  { key: "creative", name: "Creative" },
  { key: "executive-sidebar", name: "Exec Sidebar" },
  { key: "modern-card", name: "Card Modern" },
];

describe("normalizeTemplateKey", () => {
  it("converts camelCase component keys to kebab-case", () => {
    expect(normalizeTemplateKey("Modern")).toBe("modern");
    expect(normalizeTemplateKey("AtsProfessional")).toBe("ats-professional");
    expect(normalizeTemplateKey("ExecutiveSidebar")).toBe("executive-sidebar");
    expect(normalizeTemplateKey("ModernCard")).toBe("modern-card");
  });

  it("leaves kebab-case keys unchanged", () => {
    expect(normalizeTemplateKey("modern")).toBe("modern");
    expect(normalizeTemplateKey("executive-sidebar")).toBe("executive-sidebar");
  });
});

describe("filterTemplates", () => {
  it("matches by name case-insensitively (substring)", () => {
    const q = filterTemplates(TEMPLATES, "MODERN", []);
    // "modern" and "Card Modern" both contain "modern"
    expect(q.map((t) => t.key).sort()).toEqual(["modern", "modern-card"]);
  });

  it("empty query returns all templates", () => {
    expect(filterTemplates(TEMPLATES, "", []).length).toBe(TEMPLATES.length);
  });

  it("filters by a single tag", () => {
    const result = filterTemplates(TEMPLATES, "", ["student"]);
    expect(result.map((t) => t.key)).toEqual(["student"]);
  });

  it("supports multiple filters (AND semantics)", () => {
    // executive + professional + premium → executive & executive-sidebar
    const result = filterTemplates(TEMPLATES, "", ["executive", "professional", "premium"]);
    expect(result.map((t) => t.key).sort()).toEqual(["executive", "executive-sidebar"]);
  });

  it("combines query + filters", () => {
    const result = filterTemplates(TEMPLATES, "exec", ["premium"]);
    expect(result.map((t) => t.key).sort()).toEqual(["executive", "executive-sidebar"]);
  });

  it("free filter returns the free tier (excludes premium designs)", () => {
    const free = filterTemplates(TEMPLATES, "", ["free"]);
    expect(free.map((t) => t.key).sort()).toEqual([
      "ats-professional", "creative", "minimal", "modern", "student",
    ]);
  });

  it("unknown tag filters yield nothing", () => {
    expect(filterTemplates(TEMPLATES, "", ["student", "premium"])).toEqual([]);
  });
});

describe("sortTemplates", () => {
  it("sorts alphabetically by name", () => {
    const sorted = sortTemplates(TEMPLATES, "alpha");
    expect(sorted[0].key).toBe("ats-professional"); // "ATS Professional"
    expect(sorted[sorted.length - 1].key).toBe("student");
  });

  it("sorts by popularity", () => {
    const sorted = sortTemplates(TEMPLATES, "popular");
    expect(sorted[0].key).toBe("modern");
  });

  it("sorts by recommended", () => {
    const sorted = sortTemplates(TEMPLATES, "recommended");
    expect(sorted[0].key).toBe("ats-professional");
  });

  it("sorts by recently added", () => {
    const sorted = sortTemplates(TEMPLATES, "recent");
    expect(sorted[0].key).toBe("modern-card");
  });

  it("sorts by rating", () => {
    const sorted = sortTemplates(TEMPLATES, "rating");
    expect(sorted[0].key).toBe("ats-professional");
  });

  it("sorts by ats score", () => {
    const sorted = sortTemplates(TEMPLATES, "ats");
    expect(sorted[0].key).toBe("ats-professional");
  });

  it("does not mutate the input array", () => {
    const input = [...TEMPLATES];
    sortTemplates(input, "alpha");
    expect(input.map((t) => t.key)).toEqual(TEMPLATES.map((t) => t.key));
  });

  it("exposes all required filters and sorts", () => {
    const filterLabels = TEMPLATE_FILTERS.map((f) => f.label);
    expect(filterLabels).toEqual([
      "ATS Friendly", "Student", "Professional", "Modern", "Minimal",
      "Creative", "Executive", "Premium", "Free",
    ]);
    const sortLabels = TEMPLATE_SORTS.map((s) => s.label);
    expect(sortLabels).toEqual([
      "Most Popular", "Recommended", "Recently Added", "Highest Rated", "ATS Score", "Alphabetical",
    ]);
  });
});

describe("getTemplateInfo", () => {
  it("returns full detail metadata for every template", () => {
    for (const t of TEMPLATES) {
      const info = getTemplateInfo(t.key, t.name);
      expect(info.atsScore).toBeGreaterThan(0);
      expect(info.rating).toBeGreaterThan(0);
      expect(info.bestFor.length).toBeGreaterThan(0);
      expect(info.industry.length).toBeGreaterThan(0);
      expect(info.tagline.length).toBeGreaterThan(0);
      expect(info.pages.length).toBeGreaterThan(0);
      expect(info.usedBy).toBeGreaterThan(0);
      expect(info.interviewSuccess).toBeGreaterThan(0);
    }
  });

  it("assigns premium tier to premium designs and free to the rest", () => {
    expect(getTemplateInfo("executive", "Executive").tier).toBe("premium");
    expect(getTemplateInfo("executive-sidebar", "Exec Sidebar").tier).toBe("premium");
    expect(getTemplateInfo("modern-card", "Card Modern").tier).toBe("premium");
    expect(getTemplateInfo("modern", "Modern").tier).toBe("free");
    expect(getTemplateInfo("student", "Student").tier).toBe("free");
  });

  it("covers every template with display tags", () => {
    for (const t of TEMPLATES) {
      expect(getTemplateInfo(t.key, t.name).tags.length).toBeGreaterThan(0);
    }
  });

  it("falls back gracefully for unknown keys", () => {
    const info = getTemplateInfo("unknown", "Unknown");
    expect(info.atsScore).toBe(0);
    expect(info.rating).toBe(0);
    expect(info.tier).toBe("free");
    expect(info.tags).toEqual([]);
    expect(info.font).toBe("");
    expect(info.layout).toBe("");
    expect(info.color).toBe("");
    expect(info.sections).toEqual([]);
  });

  it("exposes compare metadata for every template", () => {
    for (const t of TEMPLATES) {
      const info = getTemplateInfo(t.key, t.name);
      expect(info.font.length).toBeGreaterThan(0);
      expect(info.layout.length).toBeGreaterThan(0);
      expect(info.color.length).toBeGreaterThan(0);
      expect(info.sections.length).toBeGreaterThan(0);
    }
  });

  it("describes each template's layout type", () => {
    expect(getTemplateInfo("executive", "Executive").layout).toBe("Two column");
    expect(getTemplateInfo("creative", "Creative").layout).toBe("Sidebar");
    expect(getTemplateInfo("ats-professional", "ATS Professional").layout).toBe("Single column");
  });
});

describe("getCompareRows", () => {
  it("builds all six required comparison dimensions", () => {
    const rows = getCompareRows("modern", "Modern", "ats-professional", "ATS Professional");
    expect(rows.map((r) => r.label)).toEqual([
      "ATS Score", "Font", "Layout", "Color", "Sections", "Best Use Case",
    ]);
  });

  it("compares ATS scores as percentages", () => {
    const rows = getCompareRows("modern", "Modern", "ats-professional", "ATS Professional");
    const ats = rows.find((r) => r.label === "ATS Score")!;
    expect(ats.a).toBe("95%");
    expect(ats.b).toBe("99%");
  });

  it("compares font, layout, and color", () => {
    const rows = getCompareRows("modern", "Modern", "executive", "Executive");
    const font = rows.find((r) => r.label === "Font")!;
    const layout = rows.find((r) => r.label === "Layout")!;
    const color = rows.find((r) => r.label === "Color")!;
    expect(font.a).toContain("Inter");
    expect(font.b).toContain("Serif");
    expect(layout.a).toBe("Single column");
    expect(layout.b).toBe("Two column");
    expect(color.a).toBe("Blue accent");
    expect(color.b).toBe("Navy & white");
  });

  it("compares sections and best use case", () => {
    const rows = getCompareRows("student", "Student", "executive", "Executive");
    const sections = rows.find((r) => r.label === "Sections")!;
    const useCase = rows.find((r) => r.label === "Best Use Case")!;
    expect(sections.a).toContain("Education");
    expect(sections.b).toContain("Executive Summary");
    expect(useCase.a).toContain("Students");
    expect(useCase.b).toContain("Senior Executives");
  });
});
