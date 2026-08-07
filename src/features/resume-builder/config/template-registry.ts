import type { ImportedTemplateConfig } from "../templates/imported/catalog";
import { IMPORTED_TEMPLATES } from "../templates/imported/catalog";
import { TEMPLATE_LAYOUT, type TemplateLayoutType } from "./template-constants";
import { getFamilyForTemplate, familyIdForTemplate, isCanonicalTemplate, type FamilyCategory, type FamilyLevel } from "./template-families";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE REGISTRY — the single source of truth for template metadata.
 *
 * Every template (8 built-ins + 81 imported catalog designs) is described here
 * with honest, structure-derived metadata: category, career levels, estimated
 * ATS score, free/premium tier, layout, pages, and best-fit audience.
 *
 * ATS scores are HONEST, not marketing:
 *   - Built-ins: hand-assigned from their actual layout structure (a pure
 *     single-column parser-friendly layout scores 98–99; a creative sidebar
 *     with graphics scores ~62).
 *   - Imported: computed deterministically from each config's structure
 *     (columns, sidebar, icons, dark backgrounds, banner headers, skill
 *     meters all deduct — exactly the things real ATS parsers choke on).
 *
 * This registry drives the landing-page gallery, the templates catalog,
 * badges, filters, and recommendations — one place to change, everywhere
 * reflects it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type TemplateCategory =
  | "ats-friendly"
  | "professional"
  | "modern"
  | "minimal"
  | "creative"
  | "executive"
  | "student"
  | "premium";

export type TemplateLevel = "student" | "internship" | "fresher" | "experienced" | "executive";

export type TemplateTier = "free" | "premium";

export type TemplatePages = "one" | "two";

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  /** Primary category for badges/filtering. */
  category: TemplateCategory;
  /** Every category this template matches. */
  categories: TemplateCategory[];
  /** Career levels the layout adapts to best. */
  levels: TemplateLevel[];
  /** Honest estimated ATS score 0–100. */
  atsScore: number;
  /** Honest one-line ATS verdict. */
  atsLabel: string;
  tier: TemplateTier;
  layout: TemplateLayoutType;
  pages: TemplatePages;
  bestFor: string;
  /** Brand accent hex used for card shells / thumbnails. */
  accent: string;
  source: string;
  /** Curated layout family (30-family product catalog). */
  family: string;
  /** Whether this is its family's canonical (hero) representative. */
  isCanonical: boolean;
  /** Primary family category (may include academic/technical/designer). */
  familyCategory: FamilyCategory;
  /** Career levels the family was designed for. */
  familyLevels: FamilyLevel[];
}

/* ── Honest ATS scoring ───────────────────────────────────────────────────── */

/**
 * Structural ATS score estimator for imported configs. Real parsers struggle
 * with multi-column reading order, icons, graphics, dark full-page
 * backgrounds, banner mastheads, and skill meters — each deducts.
 */
function estimateImportedAts(config: ImportedTemplateConfig): number {
  let s = 98;
  if (config.layout.columns === 2 || config.layout.sidebar) s -= 14;
  if (config.header === "banner") s -= 12;
  if (config.sectionIcons || config.layout.icons) s -= 8;
  if (config.layout.showPhoto || config.layout.monogram) s -= 5;
  if (config.skills === "bars" || config.skills === "dots") s -= 8;
  // Only 6-digit hex backgrounds are inspected; named/rgb/3-digit values are
  // ignored rather than mis-parsed (parseInt of non-hex → NaN → no deduction).
  const bg = config.theme.background ?? "";
  if (/^#[0-9a-fA-F]{6}$/.test(bg) && parseInt(bg.slice(1, 3), 16) < 0x30) s -= 18;
  return Math.max(45, Math.min(99, s));
}

function atsLabelFor(score: number, category: TemplateCategory): string {
  if (score >= 96) return "Parser Perfect";
  if (score >= 90) return "Parser Friendly";
  if (score >= 80) return "Recruiter Approved";
  if (category === "creative") return "Creative Layout";
  return "Design Forward";
}

/* ── Built-in metadata (hand-assigned, honest) ────────────────────────────── */

interface BuiltinMeta {
  name: string;
  description: string;
  category: TemplateCategory;
  categories: TemplateCategory[];
  levels: TemplateLevel[];
  atsScore: number;
  tier: TemplateTier;
  pages: TemplatePages;
  bestFor: string;
  accent: string;
}

const BUILTIN_META: Record<string, BuiltinMeta> = {
  "ats-professional": {
    name: "ATS Professional",
    description:
      "A pure single-column, monochrome layout with standard section headings and zero icons, graphics, or sidebars. The layout parsers read flawlessly.",
    category: "ats-friendly",
    categories: ["ats-friendly", "professional"],
    levels: ["fresher", "experienced", "executive", "internship"],
    atsScore: 99,
    tier: "free",
    pages: "one",
    bestFor: "Job seekers who must pass automated screening",
    accent: "#334155",
  },
  minimal: {
    name: "Minimal",
    description:
      "Ultra-clean, generous whitespace, thin hairlines, and a light typographic hierarchy. Monochrome and parser-friendly with an editorial calm.",
    category: "minimal",
    categories: ["minimal", "professional", "ats-friendly"],
    levels: ["fresher", "experienced", "internship"],
    atsScore: 96,
    tier: "free",
    pages: "one",
    bestFor: "Designers, minimalists, and clean-first professionals",
    accent: "#64748b",
  },
  modern: {
    name: "Modern",
    description:
      "A balanced single-column layout with a split header, accent-colored section titles, and crisp dividers. Modern hierarchy that stays parser-friendly.",
    category: "modern",
    categories: ["modern", "professional", "ats-friendly"],
    levels: ["fresher", "experienced", "executive", "internship"],
    atsScore: 95,
    tier: "free",
    pages: "one",
    bestFor: "Software engineers, business, and general roles",
    accent: "#2563eb",
  },
  student: {
    name: "Student",
    description:
      "Education-first design with a colored header band, academic projects as cards, and skill chips. Built for students and recent graduates.",
    category: "student",
    categories: ["student", "ats-friendly"],
    levels: ["student", "internship", "fresher"],
    atsScore: 93,
    tier: "free",
    pages: "one",
    bestFor: "Students, interns, and recent graduates",
    accent: "#059669",
  },
  executive: {
    name: "Executive",
    description:
      "A serif, editorial layout with a commanding name header, executive summary, quantified achievements, and a two-column competencies area.",
    category: "executive",
    categories: ["executive", "premium", "professional"],
    levels: ["executive", "experienced"],
    atsScore: 88,
    tier: "premium",
    pages: "two",
    bestFor: "Senior leaders, directors, and C-suite candidates",
    accent: "#4338ca",
  },
  "executive-sidebar": {
    name: "Executive Sidebar",
    description:
      "A premium two-column layout with a dark sidebar for contact, skills, and certifications, and a focused main column for experience and impact.",
    category: "executive",
    categories: ["executive", "premium", "professional"],
    levels: ["executive", "experienced"],
    atsScore: 86,
    tier: "premium",
    pages: "two",
    bestFor: "Senior leadership and C-suite candidates",
    accent: "#0f172a",
  },
  "modern-card": {
    name: "Card Modern",
    description:
      "Rounded card sections with colored left borders and skill chips on a soft gray canvas. A fresh product-minded look for tech and product roles.",
    category: "modern",
    categories: ["modern", "creative", "premium"],
    levels: ["internship", "fresher", "experienced"],
    atsScore: 84,
    tier: "premium",
    pages: "one",
    bestFor: "Tech, product, and startup professionals",
    accent: "#6366f1",
  },
  creative: {
    name: "Creative",
    description:
      "A bold sidebar layout with a profile card, skill meters, and a timeline of experience. Maximum visual identity — not ATS-first.",
    category: "creative",
    categories: ["creative", "modern"],
    levels: ["internship", "fresher", "experienced"],
    atsScore: 62,
    tier: "free",
    pages: "two",
    bestFor: "Designers, marketers, and creative roles",
    accent: "#db2777",
  },
};

/* ── Registry assembly ────────────────────────────────────────────────────── */

function importedCategories(config: ImportedTemplateConfig): TemplateCategory[] {
  const cats: TemplateCategory[] = [];
  const t = config.tags ?? [];
  if (t.includes("ats-safe")) cats.push("ats-friendly");
  if (t.includes("classic")) cats.push("professional");
  if (t.includes("elegant")) cats.push("executive");
  if (t.includes("minimal")) cats.push("minimal");
  if (t.includes("creative")) cats.push("creative");
  if (t.includes("executive")) cats.push("executive");
  if (t.includes("student")) cats.push("student");
  if (t.includes("premium")) cats.push("premium");
  if (t.includes("modern")) cats.push("modern");
  if (t.includes("technical")) cats.push("professional");
  if (cats.length === 0) cats.push(config.layout.columns === 2 ? "professional" : "modern");
  return cats;
}

function importedLevels(config: ImportedTemplateConfig): TemplateLevel[] {
  const t = config.tags ?? [];
  if (t.includes("student")) return ["student", "internship"];
  if (t.includes("executive")) return ["executive", "experienced"];
  if (t.includes("classic") || t.includes("technical")) return ["experienced", "fresher"];
  if (config.layout.columns === 2 || config.layout.sidebar) return ["experienced", "executive"];
  return ["internship", "fresher", "experienced"];
}

function importedTier(config: ImportedTemplateConfig): TemplateTier {
  return config.tags?.includes("premium") ? "premium" : "free";
}

const REGISTRY: Record<string, TemplateMetadata> = {};

for (const [id, meta] of Object.entries(BUILTIN_META)) {
  REGISTRY[id] = {
    id,
    name: meta.name,
    description: meta.description,
    category: meta.category,
    categories: meta.categories,
    levels: meta.levels,
    atsScore: meta.atsScore,
    atsLabel: atsLabelFor(meta.atsScore, meta.category),
    tier: meta.tier,
    layout: TEMPLATE_LAYOUT[id] ?? "single",
    pages: meta.pages,
    bestFor: meta.bestFor,
    accent: meta.accent,
    source: "built-in",
    family: familyIdForTemplate(id),
    isCanonical: isCanonicalTemplate(id),
    familyCategory: familyCategoryOf(id),
    familyLevels: familyLevelsOf(id),
  };
}

for (const config of IMPORTED_TEMPLATES) {
  const score = estimateImportedAts(config);
  const cats = importedCategories(config);
  REGISTRY[config.id] = {
    id: config.id,
    name: config.name,
    description: config.description,
    category: cats[0] ?? "modern",
    categories: cats,
    levels: importedLevels(config),
    atsScore: score,
    atsLabel: atsLabelFor(score, cats[0] ?? "modern"),
    tier: importedTier(config),
    layout: config.layout.columns === 2 || config.layout.sidebar ? "two-column" : "single",
    pages: config.layout.columns === 2 ? "two" : "one",
    bestFor: config.tags?.includes("student")
      ? "Students and recent graduates"
      : config.tags?.includes("executive")
        ? "Senior leaders and executives"
        : config.tags?.includes("creative")
          ? "Designers and creative roles"
          : config.tags?.includes("classic")
            ? "Timeless professional roles"
            : "Professional roles across industries",
    accent: config.theme.primary,
    source: config.source,
    family: familyIdForTemplate(config.id),
    isCanonical: isCanonicalTemplate(config.id),
    familyCategory: familyCategoryOf(config.id),
    familyLevels: familyLevelsOf(config.id),
  };
}

/** Family category for a template key (falls back to the default family). */
function familyCategoryOf(id: string): FamilyCategory {
  return getFamilyForTemplate(id).category;
}

/** Family career levels for a template key. */
function familyLevelsOf(id: string): FamilyLevel[] {
  return getFamilyForTemplate(id).levels;
}

/** Full metadata for any template key (built-in or imported). */
export function getTemplateMetadata(id: string): TemplateMetadata | undefined {
  return REGISTRY[id];
}

/** All registered metadata, in catalog order (built-ins first, then imports). */
export const TEMPLATE_REGISTRY: TemplateMetadata[] = Object.values(REGISTRY);

/** ATS score for any template key. */
export function templateAtsScore(id: string): number {
  return REGISTRY[id]?.atsScore ?? 90;
}

/** Star rating (0–5) from an ATS score. */
export function atsStars(score: number): number {
  if (score >= 96) return 5;
  if (score >= 90) return 4.5;
  if (score >= 84) return 4;
  if (score >= 78) return 3.5;
  if (score >= 70) return 3;
  if (score >= 60) return 2.5;
  return 2;
}

/** Display categories for filter pills. */
export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: "ats-friendly", label: "ATS Friendly" },
  { id: "professional", label: "Professional" },
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "creative", label: "Creative" },
  { id: "executive", label: "Executive" },
  { id: "student", label: "Student" },
  { id: "premium", label: "Premium" },
];

/** Career-level filter pills. */
export const TEMPLATE_LEVELS: { id: TemplateLevel | "all"; label: string }[] = [
  { id: "all", label: "All Levels" },
  { id: "student", label: "Student" },
  { id: "internship", label: "Internship" },
  { id: "fresher", label: "Fresher" },
  { id: "experienced", label: "Experienced" },
  { id: "executive", label: "Executive" },
];
