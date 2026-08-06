import { describe, expect, it } from "vitest";
import { ALL_TEMPLATE_IDS, BUILTIN_TEMPLATE_IDS, getImportedTemplate } from "../templates/imported/catalog";
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

/** Structural fingerprint of a template: columns|sidebar|header|section|skills|font|photo|mono|icons. */
function structuralTuple(id: string): string {
  const imported = getImportedTemplate(id);
  if (!imported) return `custom:${id}`;
  const t = imported;
  const fontText = `${t.typography.fontFamily} ${t.typography.headingFamily} ${t.typography.nameFamily}`.toLowerCase();
  const fontClass = fontText.includes("mono")
    ? "mono"
    : /serif|garamond|playfair|cormorant|times|tinos|charter|computer modern|fontin|gentium|latin modern|spectral/.test(fontText)
      ? "serif"
      : "sans";
  return [
    t.layout.columns,
    t.layout.sidebar ?? "none",
    t.header,
    t.section,
    t.skills,
    fontClass,
    t.layout.showPhoto ? "photo" : "no-photo",
    t.layout.monogram ? "monogram" : "no-mono",
    t.layout.icons || t.sectionIcons ? "icons" : "no-icons",
  ].join("|");
}

describe("template families — curation integrity", () => {
  it("declares exactly 30 families with unique ids", () => {
    expect(TEMPLATE_FAMILIES).toHaveLength(30);
    const ids = TEMPLATE_FAMILIES.map((f) => f.id);
    expect(new Set(ids).size).toBe(30);
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

  it("collapses known duplicates into variants — only one canonical per family", () => {
    // The three Open Resume designs are identical except accent hex.
    for (const id of ["or-blue", "or-green", "or-indigo"]) {
      expect(getFamilyForTemplate(id)?.id).toBe("prof-modern");
    }
    expect(getFamilyVariants("prof-modern")).toContain("or-green");
    expect(getFamilyVariants("prof-modern")).toContain("or-indigo");
    expect(isCanonicalTemplate("or-green")).toBe(false);
  });

  it("every imported duplicate is listed as a variant somewhere", () => {
    const canonicalIds = new Set(Object.values(FAMILY_CANONICAL));
    const nonCanonical = ALL_TEMPLATE_IDS.filter((id) => !canonicalIds.has(id));
    for (const id of nonCanonical) {
      const familyId = TEMPLATE_FAMILY[id];
      expect(getFamilyVariants(familyId), `${id} should be a variant of ${familyId}`).toContain(id);
    }
  });
});

describe("template families — category & level coverage", () => {
  it("every category has at least two families", () => {
    const categories: FamilyCategory[] = [
      "ats-friendly", "professional", "modern", "minimal", "creative",
      "executive", "student", "academic", "technical", "designer",
    ];
    for (const category of categories) {
      const count = TEMPLATE_FAMILIES.filter((f) => f.category === category).length;
      expect(count, `category ${category}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("every career level is covered by at least two families", () => {
    const levels: FamilyLevel[] = [
      "student", "internship", "graduate", "experienced", "senior", "manager", "executive",
    ];
    for (const level of levels) {
      const count = TEMPLATE_FAMILIES.filter((f) => f.levels.includes(level)).length;
      expect(count, `level ${level}`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("template families — structural diversity (QA Phase 8)", () => {
  it("canonical templates are structurally diverse (≥25 distinct fingerprints)", () => {
    const tuples = new Set(
      Object.values(FAMILY_CANONICAL).map((id) => structuralTuple(id))
    );
    expect(tuples.size).toBeGreaterThanOrEqual(25);
  });

  it("the 8 built-in templates each anchor a distinct family", () => {
    const builtinFamilies = BUILTIN_TEMPLATE_IDS.map((id) => TEMPLATE_FAMILY[id]);
    expect(new Set(builtinFamilies).size).toBe(BUILTIN_TEMPLATE_IDS.length);
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
    const creativeFamilies = TEMPLATE_FAMILIES.filter((f) => f.category === "creative" || f.category === "designer");
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

  it("exactly 30 templates are canonical", () => {
    const canonicalCount = TEMPLATE_REGISTRY.filter((m) => m.isCanonical).length;
    expect(canonicalCount).toBe(30);
  });

  it("the four freebuff original families ship with canonical designs", () => {
    for (const id of ["fb-exec-band", "fb-showcase", "fb-mono-grid", "fb-color-field"]) {
      expect(ALL_TEMPLATE_IDS).toContain(id);
      expect(isCanonicalTemplate(id)).toBe(true);
    }
  });

  it("the catalog surfaces 30 entries", () => {
    expect(getCatalogFamilies()).toHaveLength(30);
  });
});

describe("template families — render smoke test (new families)", () => {
  it("the four freebuff originals render through the generic renderer", async () => {
    const React = await import("react");
    // ImportedTemplate uses the classic JSX transform (React in scope), which
    // the vitest node transform does not auto-provide — expose it globally.
    (globalThis as Record<string, unknown>).React = React;
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { ImportedTemplate } = await import("../templates/imported/ImportedTemplate");
    const { SAMPLE_RESUME } = await import("./sample-resume");

    for (const id of ["fb-exec-band", "fb-showcase", "fb-mono-grid", "fb-color-field"]) {
      const config = getImportedTemplate(id);
      expect(config, id).toBeTruthy();
      const html = renderToStaticMarkup(
        React.createElement(ImportedTemplate, { resume: SAMPLE_RESUME, config: config! })
      );
      expect(html.length, `${id} should render real markup`).toBeGreaterThan(500);
      expect(html).toContain("Radheshyam");
    }
  });
});
