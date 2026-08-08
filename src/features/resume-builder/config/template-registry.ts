import { TEMPLATE_LAYOUT, type TemplateLayoutType } from "./template-constants";
import { getFamilyForTemplate, familyIdForTemplate, isCanonicalTemplate, type FamilyCategory, type FamilyLevel } from "./template-families";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE REGISTRY — only 8 working built-in templates.
 * 
 * Removed 83 imported templates that were duplicates/non-working.
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
  | "technical"
  | "academic"
  | "designer"
  | "premium";

export type TemplateLevel = "student" | "internship" | "fresher" | "experienced" | "executive";

export type TemplateTier = "free" | "premium";

export type TemplatePages = "one" | "two";

/** Career-experience vocabulary used by the marketplace search/filters. */
export type TemplateExperienceLevel = "student" | "entry" | "mid" | "senior" | "executive";

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  /** Primary category for badges/filtering. */
  category: TemplateCategory;
  /** Every category this template matches. */
  categories: TemplateCategory[];
  /** Career levels the layout adapts to best (legacy registry vocabulary). */
  levels: TemplateLevel[];
  /** Job roles the template is a strong fit for (marketplace role filter). */
  targetRoles: string[];
  /** Honest estimated ATS score 0–100. */
  atsScore: number;
  /** Honest one-line ATS verdict. */
  atsLabel: string;
  /** True only when the layout follows ATS parsing rules (single column,
   * selectable text, standard headings, no essential icons/images). */
  atsFriendly: boolean;
  tier: TemplateTier;
  layout: TemplateLayoutType;
  pages: TemplatePages;
  bestFor: string;
  /** Brand accent hex used for card shells / thumbnails. */
  accent: string;
  source: string;
  /** Curated layout family (8-family product catalog). */
  family: string;
  /** Whether this is its family's canonical (hero) representative. */
  isCanonical: boolean;
  /** Primary family category (may include academic/technical/designer). */
  familyCategory: FamilyCategory;
  /** Career levels the family was designed for. */
  familyLevels: FamilyLevel[];
}

/**
 * Curated role options for the marketplace role filter. Each option maps to a
 * set of templates via their `targetRoles` metadata. Role-specific templates
 * share the same visual archetype but carry different recommended content
 * structure, so they still read as distinct options to the user.
 */
export const TEMPLATE_ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "Software Engineer", label: "Software Engineer" },
  { value: "Full Stack Developer", label: "Full Stack Developer" },
  { value: "Frontend Developer", label: "Frontend Developer" },
  { value: "Backend Developer", label: "Backend Developer" },
  { value: "DevOps Engineer", label: "DevOps Engineer" },
  { value: "Cloud Engineer", label: "Cloud Engineer" },
  { value: "Data Engineer", label: "Data Engineer" },
  { value: "Machine Learning Engineer", label: "Machine Learning Engineer" },
  { value: "AI Engineer", label: "AI Engineer" },
  { value: "Security Engineer", label: "Security Engineer" },
  { value: "Mobile Developer", label: "Mobile Developer" },
  { value: "SRE / Platform Engineer", label: "SRE / Platform Engineer" },
  { value: "Data Scientist / Analyst", label: "Data Scientist / Analyst" },
  { value: "Product Manager", label: "Product Manager" },
  { value: "Product / UX Designer", label: "Product / UX Designer" },
  { value: "Engineering Manager", label: "Engineering Manager" },
  { value: "Engineering Director / Tech Lead", label: "Engineering Director / Tech Lead" },
  { value: "CTO / VP Engineering", label: "CTO / VP Engineering" },
  { value: "CEO / Founder / Executive", label: "CEO / Founder / Executive" },
  { value: "Marketing / Sales", label: "Marketing / Sales" },
  { value: "Finance / Consultant", label: "Finance / Consultant" },
  { value: "HR / Recruiter", label: "HR / Recruiter" },
  { value: "Academic / Researcher / Professor", label: "Academic / Researcher / Professor" },
  { value: "Student / Intern / Fresher", label: "Student / Intern / Fresher" },
];

/* ── Honest ATS scoring ───────────────────────────────────────────────────── */

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
  /** Job roles this layout fits best (marketplace role filter). */
  targetRoles: string[];
  atsScore: number;
  /** True only if the layout genuinely follows ATS parsing rules. */
  atsFriendly: boolean;
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
    categories: ["ats-friendly", "professional", "technical"],
    levels: ["fresher", "experienced", "executive", "internship"],
    targetRoles: [
      "Software Engineer",
      "Full Stack Developer",
      "Backend Developer",
      "Data Engineer",
      "Finance / Consultant",
      "HR / Recruiter",
      "Academic / Researcher / Professor",
      "Student / Intern / Fresher",
    ],
    atsScore: 99,
    atsFriendly: true,
    tier: "free",
    pages: "one",
    bestFor: "Candidates of any seniority who must pass automated screening",
    accent: "#334155",
  },
  minimal: {
    name: "Minimal",
    description:
      "Ultra-clean, generous whitespace, thin hairlines, and a light typographic hierarchy. Monochrome and parser-friendly with an editorial calm.",
    category: "minimal",
    categories: ["minimal", "professional", "ats-friendly", "academic", "technical"],
    levels: ["fresher", "experienced", "internship"],
    targetRoles: [
      "Product / UX Designer",
      "Marketing / Sales",
      "Data Scientist / Analyst",
      "SRE / Platform Engineer",
    ],
    atsScore: 96,
    atsFriendly: true,
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
    categories: ["modern", "professional", "ats-friendly", "technical"],
    levels: ["fresher", "experienced", "executive", "internship"],
    targetRoles: [
      "Software Engineer",
      "Full Stack Developer",
      "Frontend Developer",
      "Backend Developer",
      "DevOps Engineer",
      "Cloud Engineer",
      "Mobile Developer",
      "Security Engineer",
      "Data Scientist / Analyst",
      "Product Manager",
      "Marketing / Sales",
    ],
    atsScore: 95,
    atsFriendly: true,
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
    categories: ["student", "ats-friendly", "academic"],
    levels: ["student", "internship", "fresher"],
    targetRoles: ["Student / Intern / Fresher", "Academic / Researcher / Professor"],
    atsScore: 93,
    atsFriendly: true,
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
    targetRoles: [
      "CEO / Founder / Executive",
      "Finance / Consultant",
      "Engineering Director / Tech Lead",
      "CTO / VP Engineering",
    ],
    atsScore: 88,
    atsFriendly: false,
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
    targetRoles: [
      "CTO / VP Engineering",
      "Engineering Director / Tech Lead",
      "CEO / Founder / Executive",
      "Engineering Manager",
    ],
    atsScore: 86,
    atsFriendly: false,
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
    targetRoles: [
      "Product Manager",
      "Product / UX Designer",
      "Frontend Developer",
      "Software Engineer",
      "Full Stack Developer",
      "AI Engineer",
      "Machine Learning Engineer",
    ],
    atsScore: 84,
    atsFriendly: false,
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
    categories: ["creative", "modern", "designer"],
    levels: ["internship", "fresher", "experienced"],
    targetRoles: ["Product / UX Designer", "Marketing / Sales"],
    atsScore: 62,
    atsFriendly: false,
    tier: "free",
    pages: "two",
    bestFor: "Designers, marketers, and creative roles",
    accent: "#db2777",
  },
};

/* ── Registry assembly ────────────────────────────────────────────────────── */

const REGISTRY: Record<string, TemplateMetadata> = {};

for (const [id, meta] of Object.entries(BUILTIN_META)) {
  REGISTRY[id] = {
    id,
    name: meta.name,
    description: meta.description,
    category: meta.category,
    categories: meta.categories,
    levels: meta.levels,
    targetRoles: meta.targetRoles,
    atsScore: meta.atsScore,
    atsLabel: atsLabelFor(meta.atsScore, meta.category),
    atsFriendly: meta.atsFriendly,
    tier: meta.tier,
    layout: TEMPLATE_LAYOUT[id] ?? "single",
    pages: meta.pages,
    bestFor: meta.bestFor,
    accent: meta.accent,
    source: "built-in",
    family: familyIdForTemplate(id),
    isCanonical: isCanonicalTemplate(id),
    familyCategory: getFamilyForTemplate(id).category,
    familyLevels: getFamilyForTemplate(id).levels,
  };
}

/** Full metadata for any template key (built-in only). */
export function getTemplateMetadata(id: string): TemplateMetadata | undefined {
  return REGISTRY[id];
}

/** All registered metadata (8 built-ins only). */
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
  { id: "technical", label: "Technical" },
  { id: "academic", label: "Academic" },
  { id: "designer", label: "Designer" },
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