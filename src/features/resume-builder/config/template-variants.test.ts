import { describe, expect, it } from "vitest";
import {
  TEMPLATE_VARIANTS,
  ARCHETYPE_IDS,
  CATEGORY9_LABELS,
  archetypeForTemplate,
  getVariant,
  variantAccent,
  variantFont,
  variantDisplayName,
  variantsByCategory,
} from "./template-variants";
import { ALL_TEMPLATE_IDS, BUILTIN_TEMPLATE_IDS, templateDisplayName } from "../templates/imported/catalog";

describe("variant catalog — size & coverage", () => {
  it("ships 40+ marketplace templates across the 9 spec categories", () => {
    expect(TEMPLATE_VARIANTS.length).toBeGreaterThanOrEqual(40);
    const byCategory = variantsByCategory();
    // Every category in the spec is represented by at least one template.
    for (const category of Object.keys(CATEGORY9_LABELS)) {
      expect(byCategory[category as keyof typeof CATEGORY9_LABELS].length, category).toBeGreaterThan(0);
    }
  });

  it("every variant id is unique and every archetype id is registered", () => {
    const ids = TEMPLATE_VARIANTS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const arch of ARCHETYPE_IDS) {
      expect(getVariant(arch), `missing archetype ${arch}`).toBeTruthy();
    }
    expect(ALL_TEMPLATE_IDS).toEqual(ids);
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

describe("variant catalog — export parity contract", () => {
  it("archetype rendering covers every variant id (no orphan templates)", () => {
    for (const id of ALL_TEMPLATE_IDS) {
      const arch = archetypeForTemplate(id);
      expect(BUILTIN_TEMPLATE_IDS, `no renderer for ${id}`).toContain(arch);
    }
  });
});
