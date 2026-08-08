import { describe, expect, it } from "vitest";
import { ALL_TEMPLATE_IDS, BUILTIN_TEMPLATE_IDS } from "../templates/imported/catalog";
import {
  TEMPLATE_FAMILIES,
  TEMPLATE_FAMILY,
  FAMILY_CANONICAL,
  getFamily,
  getFamilyForTemplate,
  getFamilyMembers,
  getFamilyVariants,
  getCatalogFamilies,
  isCanonicalTemplate,
  type FamilyCategory,
  type FamilyLevel,
} from "./template-families";

import { TEMPLATE_REGISTRY, templateAtsScore } from "./template-registry";

describe("template families — curation integrity", () => {
  it("declares exactly 8 families with unique ids", () => {
    expect(TEMPLATE_FAMILIES).toHaveLength(8);
    const ids = TEMPLATE_FAMILIES.map((f) => f.id);
    expect(new Set(ids).size).toBe(8);
  });

  it("every family has a unique structural signature (no two families look alike)", () => {
    const signatures = TEMPLATE_FAMILIES.map((f) => f.signature);
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it("no template is orphaned — every known id resolves to a declared family", () => {
    for (const id of ALL_TEMPLATE_IDS) {
      const familyId = TEMPLATE_FAMILY[id];
      expect(familyId, `no family for ${id}`).toBeTruthy();
      expect(getFamily(familyId), `unknown family ${familyId} for ${id}`).toBeTruthy();
    }
  });

  it("every family has exactly one canonical member that exists and belongs to the family", () => {
    for (const family of TEMPLATE_FAMILIES) {
      const canonical = FAMILY_CANONICAL[family.id];
      expect(canonical, `missing canonical for ${family.id}`).toBeTruthy();
      expect(ALL_TEMPLATE_IDS).toContain(canonical);
      expect(getFamilyMembers(family.id)).toContain(canonical);
      // Only the canonical of this family may be canonical.
      for (const member of getFamilyMembers(family.id)) {
        if (member === canonical) expect(isCanonicalTemplate(member)).toBe(true);
        else expect(isCanonicalTemplate(member)).toBe(false);
      }
    }
  });

  it("getFamilyForTemplate returns the same family for every member", () => {
    for (const family of TEMPLATE_FAMILIES) {
      for (const member of getFamilyMembers(family.id)) {
        expect(getFamilyForTemplate(member)?.id).toBe(family.id);
      }
    }
  });

  it("the 8 built-in templates each anchor a distinct family", () => {
    const builtinFamilies = BUILTIN_TEMPLATE_IDS.map((id) => TEMPLATE_FAMILY[id]);
    expect(new Set(builtinFamilies).size).toBe(BUILTIN_TEMPLATE_IDS.length);
  });
});

describe("template families — category & level coverage", () => {
  it("every declared family category is covered by at least one family", () => {
    const categories: FamilyCategory[] = [
      "ats-friendly",
      "professional",
      "modern",
      "minimal",
      "creative",
      "executive",
      "student",
    ];
    for (const category of categories) {
      const count = TEMPLATE_FAMILIES.filter((f) => f.category === category).length;
      expect(count, `category ${category}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("every career level is covered by at least one family", () => {
    const levels: FamilyLevel[] = [
      "student",
      "internship",
      "graduate",
      "experienced",
      "senior",
      "manager",
      "executive",
    ];
    for (const level of levels) {
      const count = TEMPLATE_FAMILIES.filter((f) => f.levels.includes(level)).length;
      expect(count, `level ${level}`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("template families — ATS contract", () => {
  it("every canonical template carries an ATS score within the estimator contract [45,99]", () => {
    for (const canonicalId of Object.values(FAMILY_CANONICAL)) {
      const score = templateAtsScore(canonicalId);
      expect(score, canonicalId).toBeGreaterThanOrEqual(45);
      expect(score, canonicalId).toBeLessThanOrEqual(99);
    }
  });

  it("preserves the hand-assigned built-in ATS scores", () => {
    expect(templateAtsScore("ats-professional")).toBe(99);
    expect(templateAtsScore("minimal")).toBe(96);
    expect(templateAtsScore("modern")).toBe(95);
    expect(templateAtsScore("student")).toBe(93);
    expect(templateAtsScore("executive")).toBe(88);
    expect(templateAtsScore("creative")).toBe(62);
  });

  it("ATS-first families actually score highest", () => {
    const atsFamilies = TEMPLATE_FAMILIES.filter((f) => f.category === "ats-friendly");
    const creativeFamilies = TEMPLATE_FAMILIES.filter((f) => f.category === "creative");
    const minAts = Math.min(...atsFamilies.map((f) => templateAtsScore(FAMILY_CANONICAL[f.id])));
    const maxCreative = Math.max(...creativeFamilies.map((f) => templateAtsScore(FAMILY_CANONICAL[f.id])));
    expect(minAts).toBeGreaterThanOrEqual(maxCreative);
  });
});

describe("template families — registry integration", () => {
  it("every registered template has family metadata", () => {
    for (const meta of TEMPLATE_REGISTRY) {
      expect(meta.family, meta.id).toBeTruthy();
      expect(meta.familyLevels.length, meta.id).toBeGreaterThan(0);
      expect(typeof meta.isCanonical, meta.id).toBe("boolean");
    }
  });

  it("exactly one canonical representative per family, every template registered", () => {
    // Only the 8 archetypes anchor their families; the remaining catalog
    // entries are non-canonical variants of those archetypes.
    const canonicalCount = TEMPLATE_REGISTRY.filter((m) => m.isCanonical).length;
    expect(canonicalCount).toBe(8);
    // Every catalog template (archetypes + variants) is registered.
    expect(TEMPLATE_REGISTRY.length).toBe(ALL_TEMPLATE_IDS.length);
    // Every canonical is registered and belongs to its family.
    for (const canonicalId of Object.values(FAMILY_CANONICAL)) {
      expect(TEMPLATE_REGISTRY.map((m) => m.id)).toContain(canonicalId);
      expect(isCanonicalTemplate(canonicalId)).toBe(true);
    }
  });

  it("the catalog surfaces 8 entries, one per family", () => {
    expect(getCatalogFamilies()).toHaveLength(8);
  });

  it("unknown keys fall back to the default family without throwing", () => {
    expect(getFamilyForTemplate("does-not-exist").id).toBeTruthy();
    expect(getFamilyVariants("does-not-exist")).toEqual([]);
    expect(getFamilyMembers("does-not-exist")).toEqual([]);
  });
});
