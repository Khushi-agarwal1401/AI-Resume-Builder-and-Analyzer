import { TEMPLATE_LAYOUT, type TemplateLayoutType } from "./template-constants";
import { templateAtsScore, getTemplateMetadata } from "./template-registry";
import { archetypeForTemplate } from "./template-variants";

/**
 * Resolve a hand-curated per-key map with an archetype fallback: variants
 * inherit their archetype's popularity/rating/tagline/etc. unless they have
 * their own entry. Truly unknown keys (not in the catalog) return undefined so
 * callers fall back to their empty defaults rather than inheriting modern's.
 */
function resolveMap<T>(map: Record<string, T>, key: string): T | undefined {
  if (key in map) return map[key];
  if (!getTemplateMetadata(key)) return undefined;
  return map[archetypeForTemplate(key)];
}

/**
 * Template discovery metadata + pure logic for the template catalog page:
 * search (by name), category filters, and sorting.
 *
 * All maps are keyed by a stable kebab-case template key (e.g. "modern",
 * "ats-professional", "executive-sidebar") that works for both the hardcoded
 * fallback templates and API rows (whose component_key is camelCase).
 */

// ── Category filters ────────────────────────────────────────────────────────
export type TemplateFilterId =
  | "ats-friendly"
  | "student"
  | "professional"
  | "modern"
  | "minimal"
  | "creative"
  | "executive"
  | "premium"
  | "free";

export const TEMPLATE_FILTERS: { id: TemplateFilterId; label: string }[] = [
  { id: "ats-friendly", label: "ATS Friendly" },
  { id: "student", label: "Student" },
  { id: "professional", label: "Professional" },
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "creative", label: "Creative" },
  { id: "executive", label: "Executive" },
  { id: "premium", label: "Premium" },
  { id: "free", label: "Free" },
];

/** Filter tags per template key (honest categories from the registry). */
export const TEMPLATE_TAGS: Record<string, TemplateFilterId[]> = Object.fromEntries(
  [...new Set([...Object.keys(TEMPLATE_LAYOUT)])].map((key) => {
    const meta = getTemplateMetadata(key);
    if (!meta) return [key, ["free"] as TemplateFilterId[]];
    const tags = new Set<TemplateFilterId>();
    for (const c of meta.categories) {
      if (c === "ats-friendly" || c === "student" || c === "professional" || c === "modern" || c === "minimal" || c === "creative" || c === "executive" || c === "premium") tags.add(c as TemplateFilterId);
    }
    tags.add(meta.tier === "free" ? "free" : "premium");
    return [key, [...tags]];
  })
);

// ── Sorting ─────────────────────────────────────────────────────────────────
export type TemplateSortId =
  | "popular"
  | "recommended"
  | "recent"
  | "rating"
  | "ats"
  | "alpha";

export const TEMPLATE_SORTS: { id: TemplateSortId; label: string }[] = [
  { id: "popular", label: "Most Popular" },
  { id: "recommended", label: "Recommended" },
  { id: "recent", label: "Recently Added" },
  { id: "rating", label: "Highest Rated" },
  { id: "ats", label: "ATS Score" },
  { id: "alpha", label: "Alphabetical" },
];

/** Most Popular rank (higher = more popular). */
export const TEMPLATE_POPULARITY: Record<string, number> = {
  modern: 98,
  "ats-professional": 95,
  executive: 92,
  "executive-sidebar": 90,
  student: 82,
  minimal: 78,
  "modern-card": 74,
  creative: 72,
  "graduate-cv": 76,
  "classic-academic": 70,
  deedy: 68,
};

/** Curated "Recommended" order (higher = more recommended). */
export const TEMPLATE_RECOMMENDED: Record<string, number> = {
  "ats-professional": 100,
  modern: 96,
  executive: 92,
  "executive-sidebar": 88,
  minimal: 84,
  student: 80,
  "graduate-cv": 78,
  creative: 76,
  "modern-card": 72,
  "classic-academic": 71,
  deedy: 70,
};

/** Fallback "added" dates (ISO) used when API created_at is unavailable. */
export const TEMPLATE_ADDED_AT: Record<string, string> = {
  "ats-professional": "2024-01-15",
  modern: "2024-01-20",
  student: "2024-02-10",
  minimal: "2024-03-05",
  executive: "2024-04-12",
  creative: "2024-05-20",
  "executive-sidebar": "2025-01-10",
  "modern-card": "2025-02-14",
  "graduate-cv": "2025-03-05",
  "classic-academic": "2025-03-08",
  deedy: "2025-03-12",
};

/** Highest Rated (out of 5). */
export const TEMPLATE_RATING: Record<string, number> = {
  "ats-professional": 4.9,
  modern: 4.8,
  executive: 4.7,
  "executive-sidebar": 4.7,
  minimal: 4.6,
  student: 4.5,
  "modern-card": 4.5,
  creative: 4.4,
  "graduate-cv": 4.6,
  "classic-academic": 4.3,
  deedy: 4.2,
};

/**
 * ATS Score (out of 100) — HONEST, sourced from the Template Registry
 * (structural estimator for imported designs, hand-assigned for built-ins).
 */
export const TEMPLATE_ATS_SCORE: Record<string, number> = Object.fromEntries(
  [...new Set([...Object.keys(TEMPLATE_TAGS)])].map((key) => [key, templateAtsScore(key)])
);

// ── Epic 2 — Detail metadata ────────────────────────────────────────────────

/** Who the template is designed for. */
export const TEMPLATE_BEST_FOR: Record<string, string> = {
  "ats-professional": "Job Seekers & Career Changers",
  modern: "Software Engineers & Generalists",
  student: "Students & Recent Graduates",
  minimal: "Designers & Minimalists",
  executive: "Senior Executives & Leaders",
  creative: "Designers & Creative Roles",
  "executive-sidebar": "Senior Leadership & C-Suite",
  "modern-card": "Tech & Product Professionals",
  "graduate-cv": "Graduate Students & Researchers",
  "classic-academic": "Students & Recent Graduates",
  deedy: "Engineers & Analysts",
};

/** Industries the template suits. */
export const TEMPLATE_INDUSTRY: Record<string, string> = {
  "ats-professional": "All Industries",
  modern: "Tech, Business, General",
  student: "Education, Entry-Level",
  minimal: "Design, Tech, Creative",
  executive: "Finance, Consulting, Leadership",
  creative: "Design, Marketing, Media",
  "executive-sidebar": "Finance, Consulting, Tech",
  "modern-card": "Tech, Product, Startups",
  "graduate-cv": "Academia, Research, Education",
  "classic-academic": "Education, Entry-Level, Tech",
  deedy: "Tech, Engineering, Data",
};

/** One-line description shown on the card. */
export const TEMPLATE_TAGLINE: Record<string, string> = {
  "ats-professional": "Single-column layout optimized for applicant tracking systems.",
  modern: "A clean, balanced layout that works for most industries.",
  student: "Education-first layout built for students and new graduates.",
  minimal: "Generous whitespace and clean typography for an uncluttered look.",
  executive: "Serif-based elegance with a navy accent for senior roles.",
  creative: "Bold, visually-driven layout with a pink accent sidebar.",
  "executive-sidebar": "Two-column layout with a dark sidebar for senior leaders.",
  "modern-card": "Rounded card sections with indigo chips for a fresh modern look.",
  "graduate-cv": "Classic academic CV with a margin-style layout and serif body text.",
  "classic-academic": "Coursework-first academic layout with colored section rules.",
  deedy: "Compact two-column design for maximum density on one page.",
};

/** Pages the template supports. */
export const TEMPLATE_PAGES: Record<string, string> = {
  "ats-professional": "One Page",
  modern: "One Page",
  student: "One Page",
  minimal: "One Page",
  executive: "1-2 Pages",
  creative: "1-2 Pages",
  "executive-sidebar": "1-2 Pages",
  "modern-card": "One Page",
  "graduate-cv": "1-2 Pages",
  "classic-academic": "One Page",
  deedy: "One Page",
};

/** Task 2.2 — scannable display tags per template. */
export const TEMPLATE_DISPLAY_TAGS: Record<string, string[]> = {
  "ats-professional": ["ATS Optimized", "HR Approved", "Recruiter Favorite"],
  modern: ["Modern", "ATS Optimized", "Recruiter Favorite"],
  student: ["Student Friendly", "ATS Optimized"],
  minimal: ["Minimal", "Modern", "ATS Optimized"],
  executive: ["Recruiter Favorite", "Professional"],
  creative: ["Modern", "Creative"],
  "executive-sidebar": ["Recruiter Favorite", "Professional"],
  "modern-card": ["Modern", "Creative"],
  "graduate-cv": ["Academic", "ATS Optimized"],
  "classic-academic": ["Student Friendly", "Academic", "ATS Optimized"],
  deedy: ["Modern", "Compact"],
};

/** Task 2.3 — usage statistics. */
export const TEMPLATE_USED_BY: Record<string, number> = {
  "ats-professional": 15200,
  modern: 12800,
  executive: 8900,
  "executive-sidebar": 8100,
  student: 9600,
  minimal: 7400,
  "modern-card": 7200,
  creative: 6800,
  "graduate-cv": 4100,
  "classic-academic": 3900,
  deedy: 3500,
};

/** Interview success rate (%). */
export const TEMPLATE_INTERVIEW_SUCCESS: Record<string, number> = {
  "ats-professional": 88,
  modern: 85,
  executive: 87,
  "executive-sidebar": 86,
  student: 82,
  minimal: 80,
  "modern-card": 83,
  creative: 78,
  "graduate-cv": 84,
  "classic-academic": 81,
  deedy: 79,
};

// ── Epic 4 — Compare metadata ──────────────────────────────────────────────

/** Font family the template is built around. */
export const TEMPLATE_FONT: Record<string, string> = {
  "ats-professional": "Sans-serif (Helvetica)",
  modern: "Sans-serif (Inter)",
  student: "Sans-serif (Poppins)",
  minimal: "Sans-serif (Helvetica Neue)",
  executive: "Serif (Georgia)",
  creative: "Sans-serif (Poppins)",
  "executive-sidebar": "Serif (Georgia)",
  "modern-card": "Sans-serif (Inter)",
  "graduate-cv": "Serif (Georgia)",
  "classic-academic": "Sans-serif (Inter)",
  deedy: "Sans-serif (Lato)",
};

/** Human-readable label per layout type (classification lives in template-constants). */
const LAYOUT_LABELS: Record<TemplateLayoutType, string> = {
  single: "Single column",
  "two-column": "Two column",
  sidebar: "Sidebar",
};

/** Dominant color scheme per template. */
export const TEMPLATE_COLOR: Record<string, string> = {
  "ats-professional": "Neutral gray",
  modern: "Blue accent",
  student: "Emerald green accent",
  minimal: "Black & white",
  executive: "Navy & white",
  creative: "Pink & white",
  "executive-sidebar": "Dark slate & navy",
  "modern-card": "Indigo & purple",
  "graduate-cv": "Navy & white",
  "classic-academic": "Blue & white",
  deedy: "Red & black",
};

/** Sections the template renders prominently. */
export const TEMPLATE_SECTIONS: Record<string, string[]> = {
  "ats-professional": ["Contact", "Summary", "Experience", "Education", "Skills", "Certifications"],
  modern: ["Contact", "Summary", "Experience", "Education", "Skills", "Projects"],
  student: ["Contact", "Education", "Projects", "Certifications", "Skills"],
  minimal: ["Contact", "Summary", "Experience", "Education", "Skills"],
  executive: ["Executive Summary", "Experience", "Education", "Skills", "Achievements"],
  creative: ["Contact", "Skills", "Experience", "Projects", "Achievements"],
  "executive-sidebar": ["Contact", "Skills", "Certifications", "Summary", "Experience", "Achievements"],
  "modern-card": ["Summary", "Experience", "Skills", "Projects", "Certifications"],
  "graduate-cv": ["Contact", "Education", "Projects", "Skills", "Experience"],
  "classic-academic": ["Contact", "Education", "Coursework", "Projects", "Experience", "Skills", "Certifications"],
  deedy: ["Education", "Links", "Coursework", "Skills", "Experience", "Achievements"],
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Free vs Premium tier for a template key (premium if tagged "premium"). */
export type TemplateTier = "free" | "premium";

/** One-line recruiter-appeal pitch per template (used by the recommend API). */
export const TEMPLATE_RECRUITER_APPEAL: Record<string, string> = {
  "ats-professional": "Single-column layout that parsers and recruiters read instantly.",
  modern: "Clean, balanced layout that reads well across industries.",
  student: "Education-first layout recruiters expect from new graduates.",
  minimal: "Generous whitespace that keeps the focus on your content.",
  executive: "Serif elegance that signals seniority and leadership.",
  creative: "Bold visual identity that stands out in creative fields.",
  "executive-sidebar": "Dark sidebar layout that projects senior-leadership polish.",
  "modern-card": "Rounded modern cards with a fresh, product-minded look.",
  "graduate-cv": "A classic CV format that graduate committees and researchers recognize.",
  "classic-academic": "A coursework-first format that showcases academic foundations.",
  deedy: "A dense two-column format that fits a strong profile on one page.",
};

/** All Epic 2 + Epic 4 metadata for one template, composed from the maps above. */
export interface TemplateInfo {
  key: string;
  name: string;
  atsScore: number;
  rating: number;
  bestFor: string;
  industry: string;
  tagline: string;
  pages: string;
  tier: TemplateTier;
  tags: string[];
  usedBy: number;
  interviewSuccess: number;
  font: string;
  layout: string;
  color: string;
  sections: string[];
  recruiterAppeal: string;
}

export function getTemplateInfo(key: string, name: string): TemplateInfo {
  // Unknown keys stay "" rather than defaulting to a real layout label
  const layoutKey = TEMPLATE_LAYOUT[key];
  return {
    key,
    name,
    atsScore: TEMPLATE_ATS_SCORE[key] ?? 0,
    rating: resolveMap(TEMPLATE_RATING, key) ?? 0,
    bestFor: resolveMap(TEMPLATE_BEST_FOR, key) ?? "",
    industry: resolveMap(TEMPLATE_INDUSTRY, key) ?? "",
    tagline: resolveMap(TEMPLATE_TAGLINE, key) ?? "",
    pages: resolveMap(TEMPLATE_PAGES, key) ?? "One Page",
    // Tier resolves through the registry so legacy variant keys inherit their
    // archetype's tier (keeps the premium gate honest for existing resumes).
    tier: getTemplateMetadata(key)?.tier === "premium" ? "premium" : "free",
    tags: resolveMap(TEMPLATE_DISPLAY_TAGS, key) ?? [],
    usedBy: resolveMap(TEMPLATE_USED_BY, key) ?? 0,
    interviewSuccess: resolveMap(TEMPLATE_INTERVIEW_SUCCESS, key) ?? 0,
    font: resolveMap(TEMPLATE_FONT, key) ?? "",
    layout: layoutKey ? (LAYOUT_LABELS[layoutKey] ?? "") : "",
    color: resolveMap(TEMPLATE_COLOR, key) ?? "",
    sections: resolveMap(TEMPLATE_SECTIONS, key) ?? [],
    recruiterAppeal: resolveMap(TEMPLATE_RECRUITER_APPEAL, key) ?? "",
  };
}

/** One dimension of the A-vs-B comparison table. */
export interface TemplateCompareRow {
  label: string;
  a: string;
  b: string;
}

/**
 * Build the six comparison rows (ATS Score, Font, Layout, Color, Sections,
 * Best Use Case) for the two selected templates. Purely presentational data.
 */
export function getCompareRows(keyA: string, nameA: string, keyB: string, nameB: string): TemplateCompareRow[] {
  const a = getTemplateInfo(keyA, nameA);
  const b = getTemplateInfo(keyB, nameB);
  return [
    { label: "ATS Score", a: `${a.atsScore}%`, b: `${b.atsScore}%` },
    { label: "Font", a: a.font, b: b.font },
    { label: "Layout", a: a.layout, b: b.layout },
    { label: "Color", a: a.color, b: b.color },
    { label: "Sections", a: a.sections.join(", "), b: b.sections.join(", ") },
    { label: "Best Use Case", a: a.bestFor, b: b.bestFor },
  ];
}

/** Normalize a camelCase component key (or kebab id) to a stable kebab key. */
export function normalizeTemplateKey(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export interface DiscoverableTemplate {
  key: string;
  name: string;
  addedAt?: string;
}

/** Filter by name query (case-insensitive) and tags (AND semantics). */
export function filterTemplates<T extends DiscoverableTemplate>(
  templates: T[],
  query: string,
  activeFilters: TemplateFilterId[]
): T[] {
  const q = query.trim().toLowerCase();
  return templates.filter((t) => {
    if (q && !t.name.toLowerCase().includes(q)) return false;
    if (activeFilters.length === 0) return true;
    const tags = TEMPLATE_TAGS[t.key] ?? [];
    return activeFilters.every((f) => tags.includes(f));
  });
}

/** Sort a copy of the list by the given sort id. Never mutates the input. */
export function sortTemplates<T extends DiscoverableTemplate>(
  templates: T[],
  sortBy: TemplateSortId
): T[] {
  const arr = [...templates];
  const score = (key: string, map: Record<string, number>) => resolveMap(map, key) ?? 0;

  switch (sortBy) {
    case "alpha":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "recent": {
      const added = (t: T) => t.addedAt ?? TEMPLATE_ADDED_AT[t.key] ?? "";
      return arr.sort((a, b) => added(b).localeCompare(added(a)));
    }
    case "rating":
      return arr.sort((a, b) => score(b.key, TEMPLATE_RATING) - score(a.key, TEMPLATE_RATING));
    case "ats":
      return arr.sort((a, b) => score(b.key, TEMPLATE_ATS_SCORE) - score(a.key, TEMPLATE_ATS_SCORE));
    case "recommended":
      return arr.sort((a, b) => score(b.key, TEMPLATE_RECOMMENDED) - score(a.key, TEMPLATE_RECOMMENDED));
    case "popular":
    default:
      return arr.sort((a, b) => score(b.key, TEMPLATE_POPULARITY) - score(a.key, TEMPLATE_POPULARITY));
  }
}
