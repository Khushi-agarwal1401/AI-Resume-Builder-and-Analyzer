import { describe, expect, it } from "vitest";
import {
  searchTemplates,
  templateMatchesRole,
  templateMatchesExperience,
  allTargetRoles,
} from "./template-search";
import { TEMPLATE_REGISTRY, TEMPLATE_ROLE_OPTIONS } from "./template-registry";

describe("searchTemplates — free-text query", () => {
  it("matches 'developer' against target roles and names", () => {
    const ids = searchTemplates({ query: "developer" }).map((t) => t.id);
    expect(ids).toContain("modern");
    expect(ids).toContain("ats-professional");
    expect(ids).toContain("modern-card");
  });

  it("matches 'ats' case-insensitively across categories and labels", () => {
    const ids = searchTemplates({ query: "ATS" }).map((t) => t.id);
    expect(ids).toContain("ats-professional");
    expect(ids).toContain("minimal");
    expect(ids).toContain("modern");
  });

  it("matches 'student' via name and target roles", () => {
    const ids = searchTemplates({ query: "student" }).map((t) => t.id);
    expect(ids).toContain("student");
    expect(ids).toContain("ats-professional");
  });

  it("matches 'executive' via name/category/description", () => {
    const ids = searchTemplates({ query: "executive" }).map((t) => t.id);
    expect(ids).toContain("executive");
    expect(ids).toContain("executive-sidebar");
  });

  it("matches 'senior' via best-for phrases", () => {
    const ids = searchTemplates({ query: "senior" }).map((t) => t.id);
    expect(ids).toContain("executive");
    expect(ids).toContain("executive-sidebar");
  });

  it("tokenizes multi-word queries (AND across words)", () => {
    // "senior" + "backend" must both appear in the haystack → ATS Professional
    // (Backend Developer role + broad best-fit) matches; plain Modern doesn't
    // mention seniority.
    const ids = searchTemplates({ query: "senior backend" }).map((t) => t.id);
    expect(ids).toContain("ats-professional");

    // "product manager" matches templates naming the role.
    const pm = searchTemplates({ query: "product manager" }).map((t) => t.id);
    expect(pm).toEqual(expect.arrayContaining(["modern", "modern-card"]));
  });

  it("returns every template for an empty query", () => {
    const results = searchTemplates({ query: "" });
    expect(results.length).toBe(TEMPLATE_REGISTRY.length);
  });

  it("never throws on gibberish queries and returns no matches", () => {
    expect(searchTemplates({ query: "zzqqxxyy" })).toEqual([]);
  });
});

describe("searchTemplates — category filter", () => {
  it("filters by primary category", () => {
    const ids = searchTemplates({ category: "executive" }).map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(["executive", "executive-sidebar"]));
  });

  it("resolves technical/academic/designer to their best-fit built-ins", () => {
    expect(searchTemplates({ category: "technical" }).map((t) => t.id)).toEqual(
      expect.arrayContaining(["ats-professional", "modern", "minimal"])
    );
    expect(searchTemplates({ category: "academic" }).map((t) => t.id)).toEqual(
      expect.arrayContaining(["student", "minimal"])
    );
    expect(searchTemplates({ category: "designer" }).map((t) => t.id)).toEqual(
      expect.arrayContaining(["creative"])
    );
  });

  it("'all' behaves like no category filter", () => {
    expect(searchTemplates({ category: "all" }).length).toBe(TEMPLATE_REGISTRY.length);
  });
});

describe("searchTemplates — role filter", () => {
  it("filters by exact role label", () => {
    const ids = searchTemplates({ role: "Product Manager" }).map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(["modern", "modern-card"]));
    expect(ids).not.toContain("creative");
  });

  it("software engineers get ATS + Modern + Card Modern recommended first", () => {
    const ids = searchTemplates({ role: "Software Engineer" }).map((t) => t.id);
    // The 8 original templates are the whole catalog; Recommended order ranks
    // ATS Professional, Modern, then Card Modern first for this role.
    expect(ids.slice(0, 3)).toEqual(["ats-professional", "modern", "modern-card"]);
  });

  it("matches broad role fragments (engineer, design)", () => {
    const ids = searchTemplates({ role: "Engineer" }).map((t) => t.id);
    expect(ids.length).toBeGreaterThan(1);
    expect(ids).toContain("modern");

    const designers = searchTemplates({ role: "Design" }).map((t) => t.id);
    expect(designers).toContain("creative");
    expect(designers).toContain("minimal");
  });

  it("all roles yields every template", () => {
    expect(searchTemplates({ role: "all" }).length).toBe(TEMPLATE_REGISTRY.length);
  });
});

describe("searchTemplates — experience level", () => {
  it("student level surfaces the education-first layout", () => {
    const ids = searchTemplates({ experienceLevel: "student" }).map((t) => t.id);
    // Only the Student archetype advertises the student bucket — the removed
    // student variants (student-developer, graduate, internship, …) all
    // rendered through it and are no longer separate marketplace entries.
    expect(ids).toEqual(["student"]);
  });

  it("entry level surfaces internship/fresher-friendly layouts", () => {
    const ids = searchTemplates({ experienceLevel: "entry" }).map((t) => t.id);
    expect(ids).toContain("student");
    expect(ids).toContain("modern-card");
  });

  it("executive level surfaces leadership layouts", () => {
    const ids = searchTemplates({ experienceLevel: "executive" }).map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(["executive", "executive-sidebar"]));
  });
});

describe("searchTemplates — ATS + tier toggles", () => {
  it("atsFriendly: true keeps only layouts that follow ATS parsing rules", () => {
    const ids = searchTemplates({ atsFriendly: true }).map((t) => t.id);
    // Every result genuinely claims ATS safety, and the honest count equals
    // the number of atsFriendly templates in the registry.
    expect(ids.length).toBe(TEMPLATE_REGISTRY.filter((t) => t.atsFriendly).length);
    for (const id of ids) {
      expect(TEMPLATE_REGISTRY.find((t) => t.id === id)?.atsFriendly).toBe(true);
    }
    expect(ids).toEqual(expect.arrayContaining(["ats-professional", "modern", "student", "minimal"]));
  });

  it("combines role + ATS into one pipeline", () => {
    const ids = searchTemplates({ role: "Product / UX Designer", atsFriendly: true }).map((t) => t.id);
    // Minimal is the only parser-safe original that targets designer roles.
    expect(ids).toEqual(["minimal"]);
  });

  it("tier: premium surfaces only premium designs", () => {
    const ids = searchTemplates({ tier: "premium" }).map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(["executive", "executive-sidebar", "modern-card"]));
    expect(ids).not.toContain("modern");
  });
});

describe("searchTemplates — helpers", () => {
  it("exposes a curated role vocabulary with stable labels", () => {
    expect(TEMPLATE_ROLE_OPTIONS.length).toBeGreaterThan(10);
    for (const option of TEMPLATE_ROLE_OPTIONS) {
      expect(option.value).toBe(option.label);
    }
  });

  it("allTargetRoles covers every role any template targets", () => {
    const all = allTargetRoles();
    for (const option of TEMPLATE_ROLE_OPTIONS) {
      expect(all).toContain(option.value);
    }
  });

  it("templateMatchesRole handles empty role as match-all", () => {
    const template = TEMPLATE_REGISTRY[0];
    expect(templateMatchesRole(template, "")).toBe(true);
    expect(templateMatchesRole(template, "   ")).toBe(true);
  });

  it("templateMatchesExperience covers every bucket without throwing", () => {
    for (const template of TEMPLATE_REGISTRY) {
      for (const level of ["student", "entry", "mid", "senior", "executive"] as const) {
        expect(typeof templateMatchesExperience(template, level)).toBe("boolean");
      }
    }
  });

  it("is deterministic — same input, same order", () => {
    const a = searchTemplates({ query: "developer", role: "Software Engineer" });
    const b = searchTemplates({ query: "developer", role: "Software Engineer" });
    expect(a.map((t) => t.id)).toEqual(b.map((t) => t.id));
  });

  it("does not mutate the registry", () => {
    const before = TEMPLATE_REGISTRY.map((t) => t.id);
    searchTemplates({ query: "executive" });
    expect(TEMPLATE_REGISTRY.map((t) => t.id)).toEqual(before);
  });
});
