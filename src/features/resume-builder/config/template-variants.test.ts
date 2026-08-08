import { describe, expect, it } from "vitest";
import {
  TEMPLATE_VARIANTS,
  ARCHETYPE_IDS,
  archetypeForTemplate,
  getVariant,
  isVariant,
  variantAccent,
  variantFont,
  variantDisplayName,
} from "./template-variants";
import { ALL_TEMPLATE_IDS, BUILTIN_TEMPLATE_IDS, templateDisplayName } from "../templates/imported/catalog";

describe("variant catalog — size & coverage", () => {
  it("ships exactly the 8 original templates — one real renderer per archetype", () => {
    expect(TEMPLATE_VARIANTS).toHaveLength(8);
    // No duplicate variants remain: every catalog entry IS its archetype.
    for (const v of TEMPLATE_VARIANTS) {
      expect(v.id, v.id).toBe(v.archetype);
    }
    // The catalog is exactly the set of rendering archetypes (any order).
    expect(new Set(TEMPLATE_VARIANTS.map((v) => v.id))).toEqual(new Set(ARCHETYPE_IDS));
  });

  it("every variant id is unique and every archetype id is registered", () => {
    const ids = TEMPLATE_VARIANTS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const arch of ARCHETYPE_IDS) {
      expect(getVariant(arch), `missing archetype ${arch}`).toBeTruthy();
    }
    expect(ALL_TEMPLATE_IDS).toEqual(ids);
  });

  it("the 8 archetypes anchor every category that still has catalog entries", () => {
    // technical / academic / portfolio are covered via secondary categories and
    // the legacy map; the 8 originals populate the six primary categories.
    const ids = TEMPLATE_VARIANTS.map((v) => v.category);
    for (const expected of ["ats", "modern", "student", "minimal", "executive", "creative"]) {
      expect(ids, `category ${expected}`).toContain(expected);
    }
  });

  it("ALL_TEMPLATE_IDS covers built-ins plus variants with no duplicates", () => {
    for (const id of BUILTIN_TEMPLATE_IDS) {
      expect(ALL_TEMPLATE_IDS).toContain(id);
    }
    expect(new Set(ALL_TEMPLATE_IDS).size).toBe(ALL_TEMPLATE_IDS.length);
  });

  it("every variant's archetype is a real rendering engine", () => {
    for (const v of TEMPLATE_VARIANTS) {
      expect(ARCHETYPE_IDS, v.id).toContain(v.archetype);
    }
  });
});

describe("variant catalog — theme integrity", () => {
  it("no two variants of the same archetype share an accent (export parity guarantee)", () => {
    const seen = new Map<string, string[]>();
    for (const v of TEMPLATE_VARIANTS) {
      const key = `${v.archetype}|${v.accent}`;
      const list = seen.get(key) ?? [];
      list.push(v.id);
      seen.set(key, list);
    }
    for (const [key, ids] of seen) {
      expect(ids.length, `accent collision ${key} → ${ids.join(", ")}`).toBe(1);
    }
  });

  it("every variant carries a real accent, font, and honest ATS flag", () => {
    for (const v of TEMPLATE_VARIANTS) {
      expect(v.accent, v.id).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(["sans", "serif", "mono"]).toContain(v.fontFamily);
      expect(typeof v.atsFriendly, v.id).toBe("boolean");
      // ATS-friendly variants must be single-column (parsers read left→right
      // top→bottom), and sidebar/two-column layouts never claim parser safety.
      if (v.atsFriendly) {
        expect(v.layout, `${v.id} claims ATS-safe but layout is ${v.layout}`).toBe("single-column");
      }
      if (v.layout === "sidebar" || v.layout === "two-column") {
        expect(v.atsFriendly, `${v.id} is ${v.layout} but claims ATS-safe`).toBe(false);
      }
    }
  });

  it("lookup helpers resolve variants and fall back safely", () => {
    expect(variantAccent("ats-software-engineer")).toBe("#1e3a8a");
    expect(variantFont("minimal-technical")).toBe("mono");
    expect(variantDisplayName("frontend-developer")).toBe("Frontend Developer");
    expect(templateDisplayName("does-not-exist")).toBe("does-not-exist");
    expect(archetypeForTemplate("ats-software-engineer")).toBe("ats-professional");
    expect(archetypeForTemplate("modern")).toBe("modern");
    expect(archetypeForTemplate("unknown-key")).toBe("modern");
    expect(getVariant("unknown-key")).toBeUndefined();
  });
});

describe("legacy variants — removed duplicates stay resolvable", () => {
  it("removed variant keys resolve to their original archetype (format preserved)", () => {
    expect(archetypeForTemplate("ats-software-engineer")).toBe("ats-professional");
    expect(archetypeForTemplate("minimal-technical")).toBe("minimal");
    expect(archetypeForTemplate("student-developer")).toBe("student");
    expect(archetypeForTemplate("executive-tech")).toBe("executive");
    expect(archetypeForTemplate("frontend-developer")).toBe("modern-card");
    expect(archetypeForTemplate("cto")).toBe("executive-sidebar");
  });

  it("legacy keys keep their original name, accent, and font", () => {
    expect(variantDisplayName("ats-software-engineer")).toBe("ATS Software Engineer");
    expect(variantAccent("ats-software-engineer")).toBe("#1e3a8a");
    expect(variantAccent("minimal-technical")).toBe("#1e293b");
    expect(variantFont("minimal-technical")).toBe("mono");
  });

  it("isVariant recognizes catalog + legacy keys but not unknowns", () => {
    expect(isVariant("modern")).toBe(true);
    expect(isVariant("frontend-developer")).toBe(true);
    expect(isVariant("does-not-exist")).toBe(false);
  });
});

describe("variant catalog — export parity contract", () => {
  it("archetype rendering covers every variant id (no orphan templates)", () => {
    for (const id of ALL_TEMPLATE_IDS) {
      const arch = archetypeForTemplate(id);
      expect(BUILTIN_TEMPLATE_IDS, `no renderer for ${id}`).toContain(arch);
    }
  });
});
