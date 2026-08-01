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

/** Filter tags per template key. */
export const TEMPLATE_TAGS: Record<string, TemplateFilterId[]> = {
  modern: ["professional", "modern", "ats-friendly", "free"],
  "ats-professional": ["professional", "ats-friendly", "free"],
  student: ["student", "ats-friendly", "free"],
  minimal: ["minimal", "professional", "ats-friendly", "free"],
  executive: ["executive", "professional", "premium"],
  creative: ["creative", "modern", "free"],
  "executive-sidebar": ["executive", "professional", "premium"],
  "modern-card": ["modern", "creative", "premium"],
};

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
};

/** Curated "Recommended" order (higher = more recommended). */
export const TEMPLATE_RECOMMENDED: Record<string, number> = {
  "ats-professional": 100,
  modern: 96,
  executive: 92,
  "executive-sidebar": 88,
  minimal: 84,
  student: 80,
  creative: 76,
  "modern-card": 72,
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
};

/** ATS Score (out of 100). */
export const TEMPLATE_ATS_SCORE: Record<string, number> = {
  "ats-professional": 98,
  modern: 95,
  minimal: 93,
  student: 92,
  executive: 90,
  "executive-sidebar": 88,
  "modern-card": 85,
  creative: 82,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

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
  const score = (key: string, map: Record<string, number>) => map[key] ?? 0;

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
