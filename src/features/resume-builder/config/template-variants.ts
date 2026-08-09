import type { ResumeFont } from "@/types/resume";
import type { SectionId } from "./template-section-presets";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE CATALOG — the 11 templates (one real renderer each).
 *
 * The app renders 11 visual ARCHETYPES (real React components: ATS Professional,
 * Modern, Student, Minimal, Executive, Creative, Executive Sidebar, Card
 * Modern, Graduate CV, Classic Academic, Deedy). Each archetype ships its own
 * accent color, default font, section structure, target roles, and copy, and
 * renders everywhere (web/HTML/PDF/DOCX/TXT/LaTeX).
 *
 * The marketplace previously sold 55+ extra "variant" templates that were
 * duplicates of these 11 layouts (same renderer, different accent/font). Those
 * variants have been removed — only the 11 originals remain selectable.
 *
 * For backward compatibility, resumes that already used a removed variant key
 * still resolve to their original archetype via `LEGACY_VARIANTS`, so no
 * existing resume silently changes format.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** The 9 marketplace categories (spec §3). */
export type TemplateCategory9 =
  | "ats"
  | "modern"
  | "student"
  | "minimal"
  | "executive"
  | "creative"
  | "technical"
  | "academic"
  | "portfolio";

/** The 11 real rendering engines. */
export type ArchetypeId =
  | "ats-professional"
  | "modern"
  | "student"
  | "minimal"
  | "executive"
  | "creative"
  | "executive-sidebar"
  | "modern-card"
  | "graduate-cv"
  | "classic-academic"
  | "deedy";

export interface TemplateVariant {
  /** Stable kebab-case id, e.g. "ats-professional". */
  id: string;
  /** Marketplace display name, e.g. "ATS Professional". */
  name: string;
  /** The archetype renderer this template renders through (itself for originals). */
  archetype: ArchetypeId;
  /** Primary marketplace category (spec §3). */
  category: TemplateCategory9;
  layout: "single-column" | "two-column" | "sidebar";
  /** Honest ATS compatibility. */
  atsFriendly: boolean;
  /** Role labels from TEMPLATE_ROLE_OPTIONS where possible. */
  targetRoles: string[];
  experienceLevels: ("student" | "entry" | "mid" | "senior" | "executive")[];
  tier: "free" | "premium";
  /** Default accent color (hex). Used when the user hasn't picked one. */
  accent: string;
  /** Default font family. */
  fontFamily: ResumeFont;
  /** Discovery/tag vocabulary (ats-friendly, professional, …). */
  tags: string[];
  description: string;
  /** One-line "best for" pitch. */
  bestFor: string;
  sortOrder: number;
}

export const ARCHETYPE_IDS: ArchetypeId[] = [
  "ats-professional",
  "modern",
  "student",
  "minimal",
  "executive",
  "creative",
  "executive-sidebar",
  "modern-card",
  "graduate-cv",
  "classic-academic",
  "deedy",
];

/* ── The catalog — exactly the 11 templates ──────────────────────────────── */

export const TEMPLATE_VARIANTS: TemplateVariant[] = [
  {
    id: "ats-professional",
    name: "ATS Professional",
    archetype: "ats-professional",
    category: "ats",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: [
      "Software Engineer", "Full Stack Developer", "Finance / Consultant",
      "HR / Recruiter", "Academic / Researcher / Professor", "Student / Intern / Fresher",
    ],
    experienceLevels: ["entry", "mid", "senior"],
    tier: "free",
    accent: "#334155",
    fontFamily: "sans",
    tags: ["ats-friendly", "professional"],
    description:
      "A pure single-column, monochrome layout with standard section headings, gray section bars, and zero icons or graphics. The layout parsers read flawlessly.",
    bestFor: "Candidates of any seniority who must pass automated screening",
    sortOrder: 1,
  },
  {
    id: "modern",
    name: "Modern",
    archetype: "modern",
    category: "modern",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: [
      "Software Engineer", "Full Stack Developer", "Product Manager",
      "Marketing / Sales", "Data Scientist / Analyst",
    ],
    experienceLevels: ["entry", "mid", "senior"],
    tier: "free",
    accent: "#2563eb",
    fontFamily: "sans",
    tags: ["modern", "professional", "ats-friendly"],
    description:
      "A balanced single-column layout with a split header, accent rule titles, and left-rule bullets. Modern hierarchy that stays parser-friendly.",
    bestFor: "Software engineers, business, and general roles",
    sortOrder: 20,
  },
  {
    id: "student",
    name: "Student",
    archetype: "student",
    category: "student",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Student / Intern / Fresher", "Academic / Researcher / Professor"],
    experienceLevels: ["student", "entry"],
    tier: "free",
    accent: "#059669",
    fontFamily: "sans",
    tags: ["student", "ats-friendly", "academic"],
    description:
      "An education-first layout with a colored header band, academic projects as cards, and skill chips. Built for students and recent graduates.",
    bestFor: "Students, interns, and recent graduates",
    sortOrder: 40,
  },
  {
    id: "minimal",
    name: "Minimal",
    archetype: "minimal",
    category: "minimal",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Product / UX Designer", "Marketing / Sales", "Data Scientist / Analyst", "SRE / Platform Engineer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#64748b",
    fontFamily: "sans",
    tags: ["minimal", "ats-friendly", "professional"],
    description:
      "Ultra-clean, generous whitespace, thin hairlines, and a light typographic hierarchy. Monochrome and parser-friendly with an editorial calm.",
    bestFor: "Designers, minimalists, and clean-first professionals",
    sortOrder: 60,
  },
  {
    id: "executive",
    name: "Executive",
    archetype: "executive",
    category: "executive",
    layout: "two-column",
    atsFriendly: false,
    targetRoles: ["CEO / Founder / Executive", "Finance / Consultant", "Engineering Director / Tech Lead", "CTO / VP Engineering"],
    experienceLevels: ["senior", "executive"],
    tier: "premium",
    accent: "#312e81",
    fontFamily: "serif",
    tags: ["executive", "premium", "professional"],
    description:
      "A serif, editorial layout with a commanding name header, executive summary block, quantified achievements, and a competencies area.",
    bestFor: "Senior leaders, directors, and C-suite candidates",
    sortOrder: 80,
  },
  {
    id: "executive-sidebar",
    name: "Executive Sidebar",
    archetype: "executive-sidebar",
    category: "executive",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["CTO / VP Engineering", "Engineering Director / Tech Lead", "CEO / Founder / Executive", "Engineering Manager"],
    experienceLevels: ["senior", "executive"],
    tier: "premium",
    accent: "#0f172a",
    fontFamily: "serif",
    tags: ["executive", "premium", "professional"],
    description:
      "A premium two-column layout with a dark slate sidebar for contact, skills, and certifications, and a focused main column for experience and impact.",
    bestFor: "Senior leadership and C-suite candidates",
    sortOrder: 81,
  },
  {
    id: "modern-card",
    name: "Card Modern",
    archetype: "modern-card",
    category: "modern",
    layout: "single-column",
    atsFriendly: false,
    targetRoles: ["Product Manager", "Product / UX Designer", "Frontend Developer", "Software Engineer", "Full Stack Developer"],
    experienceLevels: ["entry", "mid"],
    tier: "premium",
    accent: "#6366f1",
    fontFamily: "sans",
    tags: ["modern", "creative", "premium"],
    description:
      "Rounded card sections with colored left borders and skill chips on a soft gray canvas. A fresh product-minded look for tech and product roles.",
    bestFor: "Tech, product, and startup professionals",
    sortOrder: 27,
  },
  {
    id: "creative",
    name: "Creative",
    archetype: "creative",
    category: "creative",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["Product / UX Designer", "Marketing / Sales"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#db2777",
    fontFamily: "sans",
    tags: ["creative", "modern", "designer"],
    description:
      "A bold sidebar layout with a profile card, skill tags, a timeline of experience, and project cards. Maximum visual identity.",
    bestFor: "Designers, marketers, and creative roles",
    sortOrder: 100,
  },
  {
    id: "graduate-cv",
    name: "Graduate CV",
    archetype: "graduate-cv",
    category: "academic",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Academic / Researcher / Professor", "Student / Intern / Fresher"],
    experienceLevels: ["student", "entry", "mid"],
    tier: "free",
    accent: "#1e3a8a",
    fontFamily: "serif",
    tags: ["academic", "ats-friendly", "professional"],
    description:
      "A classic academic curriculum vitae with a margin-style layout, address blocks, bold section headings, and serif body text. Built for graduate applications and research roles.",
    bestFor: "Graduate students, researchers, and academics",
    sortOrder: 45,
  },
  {
    id: "classic-academic",
    name: "Classic Academic",
    archetype: "classic-academic",
    category: "academic",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Student / Intern / Fresher", "Academic / Researcher / Professor", "Software Engineer"],
    experienceLevels: ["student", "entry"],
    tier: "free",
    accent: "#0e5484",
    fontFamily: "sans",
    tags: ["academic", "student", "ats-friendly"],
    description:
      "A coursework-first academic resume with a centered name header, colored section rules, multi-column coursework, projects, internships, and certifications.",
    bestFor: "Students and recent graduates with coursework and projects",
    sortOrder: 46,
  },
  {
    id: "deedy",
    name: "Deedy",
    archetype: "deedy",
    category: "technical",
    layout: "two-column",
    atsFriendly: false,
    targetRoles: ["Software Engineer", "Full Stack Developer", "Data Scientist / Analyst", "Engineering Manager"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#b91c1c",
    fontFamily: "sans",
    tags: ["technical", "modern", "professional"],
    description:
      "A compact two-column design inspired by the Deedy resume: education, links, coursework, and skills in a narrow left rail with experience, research, and awards flowing down the main column.",
    bestFor: "Engineers and analysts who want maximum density on one page",
    sortOrder: 82,
  },
];

/* ── Legacy variants (removed from the marketplace, kept resolvable) ───────
 *
 * The 59 marketplace variants previously sold alongside the 11 originals were
 * duplicates of the archetype layouts and have been removed from the catalog.
 * Existing resumes that still carry a variant key keep rendering via their
 * original archetype component (same format, name, accent, and font) through
 * this map, so no resume changes format after the removal.
 * ────────────────────────────────────────────────────────────────────────── */

interface LegacyVariant {
  archetype: ArchetypeId;
  name: string;
  accent: string;
  fontFamily: ResumeFont;
}

const LEGACY_VARIANTS: Record<string, LegacyVariant> = {
  // ── ATS family (renders through ATS Professional) ──
  "ats-classic": { archetype: "ats-professional", name: "ATS Classic", accent: "#1f2937", fontFamily: "sans" },
  "ats-minimal": { archetype: "ats-professional", name: "ATS Minimal", accent: "#111827", fontFamily: "sans" },
  "ats-software-engineer": { archetype: "ats-professional", name: "ATS Software Engineer", accent: "#1e3a8a", fontFamily: "sans" },
  "ats-fullstack": { archetype: "ats-professional", name: "ATS Full Stack", accent: "#0f766e", fontFamily: "sans" },
  "ats-backend": { archetype: "ats-professional", name: "ATS Backend", accent: "#166534", fontFamily: "sans" },
  "ats-frontend": { archetype: "ats-professional", name: "ATS Frontend", accent: "#4338ca", fontFamily: "sans" },
  "ats-devops": { archetype: "ats-professional", name: "ATS DevOps", accent: "#b45309", fontFamily: "sans" },
  "ats-cloud": { archetype: "ats-professional", name: "ATS Cloud", accent: "#0284c7", fontFamily: "sans" },
  "ats-data-engineer": { archetype: "ats-professional", name: "ATS Data Engineer", accent: "#15803d", fontFamily: "sans" },
  "ats-ai-engineer": { archetype: "ats-professional", name: "ATS AI Engineer", accent: "#7c3aed", fontFamily: "sans" },
  "ats-security": { archetype: "ats-professional", name: "ATS Security", accent: "#be123c", fontFamily: "sans" },
  // ── Modern family ──
  "modern-developer": { archetype: "modern", name: "Modern Developer", accent: "#0ea5e9", fontFamily: "sans" },
  "modern-tech": { archetype: "modern", name: "Modern Tech", accent: "#0891b2", fontFamily: "sans" },
  "modern-startup": { archetype: "modern", name: "Modern Startup", accent: "#f59e0b", fontFamily: "sans" },
  "modern-product-engineer": { archetype: "modern", name: "Modern Product Engineer", accent: "#7c3aed", fontFamily: "sans" },
  "modern-fullstack": { archetype: "modern", name: "Modern Full Stack", accent: "#059669", fontFamily: "sans" },
  "modern-minimal": { archetype: "modern", name: "Modern Minimal", accent: "#64748b", fontFamily: "sans" },
  // ── Student family ──
  "student-developer": { archetype: "student", name: "Student Developer", accent: "#0d9488", fontFamily: "sans" },
  graduate: { archetype: "student", name: "Graduate", accent: "#0284c7", fontFamily: "sans" },
  internship: { archetype: "student", name: "Internship", accent: "#f97316", fontFamily: "sans" },
  "entry-level": { archetype: "student", name: "Entry Level", accent: "#16a34a", fontFamily: "sans" },
  "college-developer": { archetype: "student", name: "College Developer", accent: "#4f46e5", fontFamily: "sans" },
  "bootcamp-graduate": { archetype: "student", name: "Bootcamp Graduate", accent: "#db2777", fontFamily: "sans" },
  // ── Minimal family ──
  "minimal-developer": { archetype: "minimal", name: "Minimal Developer", accent: "#475569", fontFamily: "sans" },
  "minimal-ats": { archetype: "minimal", name: "Minimal ATS", accent: "#334155", fontFamily: "sans" },
  "minimal-one-page": { archetype: "minimal", name: "Minimal One Page", accent: "#0f172a", fontFamily: "sans" },
  "minimal-technical": { archetype: "minimal", name: "Minimal Technical", accent: "#1e293b", fontFamily: "mono" },
  "minimal-executive": { archetype: "minimal", name: "Minimal Executive", accent: "#312e81", fontFamily: "serif" },
  // ── Executive family ──
  "executive-tech": { archetype: "executive", name: "Executive Tech", accent: "#4338ca", fontFamily: "serif" },
  "engineering-manager": { archetype: "executive", name: "Engineering Manager", accent: "#1e40af", fontFamily: "serif" },
  "engineering-director": { archetype: "executive", name: "Engineering Director", accent: "#1e1b4b", fontFamily: "serif" },
  "technical-leader": { archetype: "executive", name: "Technical Leader", accent: "#0f766e", fontFamily: "serif" },
  "cto": { archetype: "executive-sidebar", name: "CTO", accent: "#111827", fontFamily: "serif" },
  "vp-engineering": { archetype: "executive-sidebar", name: "VP Engineering", accent: "#1e293b", fontFamily: "serif" },
  // ── Creative family ──
  "creative-developer": { archetype: "creative", name: "Creative Developer", accent: "#ea580c", fontFamily: "sans" },
  "portfolio-developer": { archetype: "creative", name: "Portfolio Developer", accent: "#7c3aed", fontFamily: "sans" },
  "designer-developer": { archetype: "creative", name: "Designer Developer", accent: "#c026d3", fontFamily: "sans" },
  "frontend-creative": { archetype: "creative", name: "Frontend Creative", accent: "#e11d48", fontFamily: "sans" },
  "modern-creative": { archetype: "creative", name: "Modern Creative", accent: "#9333ea", fontFamily: "sans" },
  // ── Card Modern family ──
  "frontend-developer": { archetype: "modern-card", name: "Frontend Developer", accent: "#4f46e5", fontFamily: "sans" },
  "cloud-engineer": { archetype: "modern-card", name: "Cloud Engineer", accent: "#0284c7", fontFamily: "sans" },
  "ai-engineer": { archetype: "modern-card", name: "AI Engineer", accent: "#6d28d9", fontFamily: "sans" },
  "platform-engineer": { archetype: "modern-card", name: "Platform Engineer", accent: "#475569", fontFamily: "sans" },
  "design-portfolio": { archetype: "modern-card", name: "Design Portfolio", accent: "#c026d3", fontFamily: "sans" },
  // ── Developer role variants (rendered through Modern / ATS Professional) ──
  "software-engineer": { archetype: "modern", name: "Software Engineer", accent: "#1d4ed8", fontFamily: "sans" },
  "fullstack-developer": { archetype: "modern", name: "Full Stack Developer", accent: "#0d9488", fontFamily: "sans" },
  "backend-developer": { archetype: "ats-professional", name: "Backend Developer", accent: "#14532d", fontFamily: "sans" },
  "devops-engineer": { archetype: "modern", name: "DevOps Engineer", accent: "#b45309", fontFamily: "sans" },
  "data-engineer": { archetype: "modern", name: "Data Engineer", accent: "#15803d", fontFamily: "sans" },
  "machine-learning-engineer": { archetype: "modern", name: "Machine Learning Engineer", accent: "#6d28d9", fontFamily: "sans" },
  "security-engineer": { archetype: "ats-professional", name: "Security Engineer", accent: "#9f1239", fontFamily: "sans" },
  "mobile-developer": { archetype: "modern", name: "Mobile Developer", accent: "#0e7490", fontFamily: "sans" },
  "sre": { archetype: "ats-professional", name: "SRE", accent: "#0e7490", fontFamily: "sans" },
  // ── Academic variants ──
  academic: { archetype: "minimal", name: "Academic", accent: "#92400e", fontFamily: "serif" },
  researcher: { archetype: "ats-professional", name: "Researcher", accent: "#92400e", fontFamily: "serif" },
  phd: { archetype: "minimal", name: "PhD", accent: "#7c2d12", fontFamily: "serif" },
  scientific: { archetype: "ats-professional", name: "Scientific", accent: "#3730a3", fontFamily: "serif" },
  // ── Portfolio variants ──
  portfolio: { archetype: "creative", name: "Portfolio", accent: "#6d28d9", fontFamily: "sans" },
  "case-study-portfolio": { archetype: "creative", name: "Case Study Portfolio", accent: "#be185d", fontFamily: "sans" },
};

/* ── Lookups ─────────────────────────────────────────────────────────────── */

const VARIANT_BY_ID = new Map(TEMPLATE_VARIANTS.map((v) => [v.id, v]));

/** Look up a catalog template by id (undefined for unknown keys). */
export function getVariant(id: string): TemplateVariant | undefined {
  return VARIANT_BY_ID.get(id);
}

/** Whether a key is a known template (catalog or legacy). */
export function isVariant(id: string): boolean {
  return VARIANT_BY_ID.has(id) || id in LEGACY_VARIANTS;
}

/**
 * Resolve any template key to its archetype id. Legacy variant keys removed
 * from the catalog map to their original archetype; truly unknown keys fall
 * back to "modern" so renderers and exporters never throw on legacy/mock data.
 */
export function archetypeForTemplate(id: string): ArchetypeId {
  const v = VARIANT_BY_ID.get(id);
  if (v) return v.archetype;
  // Known archetype ids map to themselves.
  if ((ARCHETYPE_IDS as string[]).includes(id)) return id as ArchetypeId;
  // Removed variants keep their original format for existing resumes.
  return LEGACY_VARIANTS[id]?.archetype ?? "modern";
}

/** All registered template ids (the 8-template marketplace catalog). */
export function allVariantIds(): string[] {
  return TEMPLATE_VARIANTS.map((v) => v.id);
}

/** Display name for a template key (catalog, legacy, or the key itself). */
export function variantDisplayName(id: string): string {
  return VARIANT_BY_ID.get(id)?.name ?? LEGACY_VARIANTS[id]?.name ?? id;
}

/** Default accent for a template key (catalog/legacy, else the archetype's). */
export function variantAccent(id: string): string | undefined {
  return VARIANT_BY_ID.get(id)?.accent ?? LEGACY_VARIANTS[id]?.accent;
}

/** Default font family for a template key. */
export function variantFont(id: string): ResumeFont | undefined {
  return VARIANT_BY_ID.get(id)?.fontFamily ?? LEGACY_VARIANTS[id]?.fontFamily;
}

/**
 * Section-order override for a template key. The 11 templates declare
 * no per-template override — they always use their archetype's preset — so
 * this returns undefined and section-preset resolution falls through to
 * `archetypeForTemplate`. Kept for compatibility with template-section-presets.
 */
export function variantSectionOrder(_id: string): SectionId[] | undefined {
  return undefined;
}

/** Category label for a catalog template key. */
export function variantCategory(id: string): TemplateCategory9 | undefined {
  return VARIANT_BY_ID.get(id)?.category;
}
