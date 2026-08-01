import { describe, expect, it } from "vitest";
import {
  TEMPLATE_FILTERS,
  TEMPLATE_SORTS,
  filterTemplates,
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
