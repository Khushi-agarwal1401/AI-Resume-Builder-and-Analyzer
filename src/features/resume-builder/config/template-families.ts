/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE FAMILIES — Simplified to only the 8 working built-in templates.
 * 
 * Removed 83 imported templates that were duplicates/non-working.
 * Only 8 families remain, each with one canonical working template.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BUILTIN_TEMPLATE_IDS } from "../templates/imported/catalog";

/** Product categories a family can belong to. */
export type FamilyCategory =
  | "ats-friendly"
  | "professional"
  | "modern"
  | "minimal"
  | "creative"
  | "executive"
  | "student";

/** Career levels a family was designed for. */
export type FamilyLevel =
  | "student"
  | "internship"
  | "graduate"
  | "experienced"
  | "senior"
  | "manager"
  | "executive";

export interface TemplateFamily {
  /** Stable kebab id, e.g. "ats-pro". */
  id: string;
  name: string;
  category: FamilyCategory;
  levels: FamilyLevel[];
  /** One-line audience description. */
  bestFor: string;
  /** Longer catalog description. */
  description: string;
  /** Structural fingerprint: "columns | sidebar | header | section | skills | font class" */
  signature: string;
  /** Brand accent used for card shells / thumbnails. */
  accent: string;
  /** The single hero template id for this family. */
  canonicalId: string;
}

/* ── The 8 families (one per working built-in template) ────────────────────── */

const FAMILIES: TemplateFamily[] = [
  // ── ATS FRIENDLY ──────────────────────────────────────────────────────────
  {
    id: "ats-pro",
    name: "ATS Professional",
    category: "ats-friendly",
    levels: ["graduate", "experienced", "senior", "executive"],
    bestFor: "Compliance-critical roles: government, healthcare, enterprise",
    description: "Pure single column, gray section bars, zero decoration. The layout parsers read flawlessly.",
    signature: "single|none|centered|bar|inline|sans",
    accent: "#334155",
    canonicalId: "ats-professional",
  },
  // ── PROFESSIONAL / MODERN ────────────────────────────────────────────────
  {
    id: "prof-modern",
    name: "Modern",
    category: "professional",
    levels: ["graduate", "experienced", "senior"],
    bestFor: "Software, business, generalists",
    description: "Split header, accent rule titles, left-rule bullets. The safe-modern reference point.",
    signature: "single|none|split|accent-rule|left-rule|sans",
    accent: "#2563eb",
    canonicalId: "modern",
  },
  // ── MINIMAL ───────────────────────────────────────────────────────────────
  {
    id: "prof-minimal",
    name: "Minimal",
    category: "minimal",
    levels: ["graduate", "experienced", "senior"],
    bestFor: "Designers, PMs, clean-first professionals",
    description: "Small-caps micro-labels, hairline rules, generous whitespace, monochrome.",
    signature: "single|none|centered|small-caps|inline|sans",
    accent: "#64748b",
    canonicalId: "minimal",
  },
  // ── MODERN CARDS ──────────────────────────────────────────────────────────
  {
    id: "mod-cards",
    name: "Card Modern",
    category: "modern",
    levels: ["graduate", "experienced"],
    bestFor: "Tech, product, startups",
    description: "Stacked white cards on a light canvas; each section is a bordered rounded card.",
    signature: "single|none|cards|cards|chips|sans",
    accent: "#6366f1",
    canonicalId: "modern-card",
  },
  // ── CREATIVE ──────────────────────────────────────────────────────────────
  {
    id: "cr-pop",
    name: "Creative Pop",
    category: "creative",
    levels: ["internship", "graduate", "experienced"],
    bestFor: "Marketers, social media, brand roles",
    description: "Bold colored sidebar plus main column with timeline dots and skill tags.",
    signature: "sidebar|left|sidebar|timeline|tags|sans",
    accent: "#db2777",
    canonicalId: "creative",
  },
  // ── EXECUTIVE ─────────────────────────────────────────────────────────────
  {
    id: "ex-serif",
    name: "Executive Serif",
    category: "executive",
    levels: ["senior", "manager", "executive"],
    bestFor: "Directors, VPs, C-suite",
    description: "Centered serif masthead, leadership summary block, metric-forward entries.",
    signature: "single|none|centered|masthead|inline|serif",
    accent: "#312e81",
    canonicalId: "executive",
  },
  {
    id: "ex-sidebar",
    name: "Executive Sidebar",
    category: "executive",
    levels: ["senior", "manager", "executive"],
    bestFor: "Executives who want a modern dark touch",
    description: "Dark slate sidebar with contact, skills and certs; light main column.",
    signature: "sidebar|left|sidebar|underline|chips|sans|dark",
    accent: "#0f172a",
    canonicalId: "executive-sidebar",
  },
  // ── STUDENT ───────────────────────────────────────────────────────────────
  {
    id: "st-band",
    name: "Student Band",
    category: "student",
    levels: ["student", "internship", "graduate"],
    bestFor: "Students and recent graduates",
    description: "Colored header band, education-first card grid, skill chips, project cards.",
    signature: "single|none|band|cards|chips|sans",
    accent: "#059669",
    canonicalId: "student",
  },
];

/* ── Family membership (only built-in templates) ──────────────────────────── */

const FAMILY_MEMBERS: Record<string, string[]> = {
  "ats-pro": ["ats-professional"],
  "prof-modern": ["modern"],
  "prof-minimal": ["minimal"],
  "mod-cards": ["modern-card"],
  "cr-pop": ["creative"],
  "ex-serif": ["executive"],
  "ex-sidebar": ["executive-sidebar"],
  "st-band": ["student"],
};

/** Canonical representative per family (the hero card shown in the catalog). */
export const FAMILY_CANONICAL: Record<string, string> = Object.fromEntries(
  FAMILIES.map((f) => [f.id, f.canonicalId])
);

/* ── Public API ───────────────────────────────────────────────────────────── */

/** All 8 family definitions, in catalog order. */
export const TEMPLATE_FAMILIES: TemplateFamily[] = [...FAMILIES];

/** Look up family metadata by family id. */
export function getFamily(familyId: string): TemplateFamily | undefined {
  return FAMILIES.find((f) => f.id === familyId);
}

/**
 * Family metadata for any template key (built-in only).
 * Unknown keys resolve to the default family so callers never have to handle missing.
 */
export function getFamilyForTemplate(templateId: string): TemplateFamily {
  const familyId = TEMPLATE_FAMILY[templateId] ?? "prof-modern";
  return FAMILIES.find((f) => f.id === familyId) ?? FAMILIES[0];
}

/** Family id for any template key. */
export function familyIdForTemplate(templateId: string): string {
  return TEMPLATE_FAMILY[templateId] ?? "prof-modern";
}

/** Every template id in a family (canonical only since no variants). */
export function getFamilyMembers(familyId: string): string[] {
  return FAMILY_MEMBERS[familyId] ?? [];
}

/** The duplicate siblings of a family (none since we removed variants). */
export function getFamilyVariants(_familyId: string): string[] {
  return [];
}

/** The hero template id for a family. */
export function getCanonicalTemplate(familyId: string): string {
  return FAMILY_CANONICAL[familyId] ?? FAMILIES[0].canonicalId;
}

/** Whether a template is its family's canonical (hero) representative. */
export function isCanonicalTemplate(templateId: string): boolean {
  return FAMILY_CANONICAL[familyIdForTemplate(templateId)] === templateId;
}

/** The 8 curated catalog entries: family + canonical id. */
export function getCatalogFamilies(): { family: TemplateFamily; canonicalId: string; variantIds: string[] }[] {
  return FAMILIES.map((family) => ({
    family,
    canonicalId: family.canonicalId,
    variantIds: [],
  }));
}

/** Map a family category to the legacy discovery-filter vocabulary. */
export function familyCategoryToFilter(category: FamilyCategory): string {
  return category;
}

/** id → family id, resolved for every known built-in template key. */
export const TEMPLATE_FAMILY: Record<string, string> = Object.fromEntries(
  BUILTIN_TEMPLATE_IDS.map((id) => [id, idToFamily(FAMILY_MEMBERS, id)])
);

function idToFamily(members: Record<string, string[]>, id: string): string {
  for (const [family, ids] of Object.entries(members)) {
    if (ids.includes(id)) return family;
  }
  return "prof-modern";
}