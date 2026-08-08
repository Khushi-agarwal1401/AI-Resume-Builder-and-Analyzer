import {
  TEMPLATE_REGISTRY,
  TEMPLATE_ROLE_OPTIONS,
  type TemplateExperienceLevel,
  type TemplateMetadata,
} from "./template-registry";
import { TEMPLATE_RECOMMENDED } from "./template-discovery";
import { getFamilyForTemplate } from "./template-families";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE SEARCH — the marketplace's search + filter engine.
 *
 * `searchTemplates()` is a pure, unit-testable function that filters the full
 * built-in registry by free-text query, category, job role, experience level,
 * and ATS friendliness. Results keep a stable "Recommended" order so the same
 * input always produces the same output.
 *
 * The query haystack covers: name, description, every category the template
 * matches, target roles, best-for phrase, family name, and display tags — so
 * "developer", "ATS", "senior backend", "student", and "executive" all work.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface TemplateSearchFilters {
  /** Free-text query matched against name/description/roles/tags. */
  query?: string;
  /** Primary category id, e.g. "ats-friendly" | "modern" | "executive". */
  category?: string;
  /** A role label from `TEMPLATE_ROLE_OPTIONS`, e.g. "Software Engineer". */
  role?: string;
  /** Career-experience bucket: student | entry | mid | senior | executive. */
  experienceLevel?: TemplateExperienceLevel;
  /** Restrict to layouts that genuinely follow ATS parsing rules. */
  atsFriendly?: boolean;
  /** Restrict to the free or premium tier. */
  tier?: "free" | "premium";
}

/** Map the marketplace experience vocabulary onto legacy registry levels. */
const EXPERIENCE_TO_LEVELS: Record<TemplateExperienceLevel, string[]> = {
  student: ["student"],
  entry: ["internship", "fresher"],
  mid: ["experienced"],
  senior: ["experienced", "executive"],
  executive: ["executive"],
};

/** All the searchable filter values a user can pick from. */
export { TEMPLATE_ROLE_OPTIONS };

/** Every distinct role label a template can target. */
export function allTargetRoles(): string[] {
  return [...new Set(TEMPLATE_REGISTRY.flatMap((t) => t.targetRoles))];
}

/** True when the template targets (or approximately covers) the given role. */
export function templateMatchesRole(template: TemplateMetadata, role: string): boolean {
  const normalized = role.trim().toLowerCase();
  if (!normalized) return true;
  const direct = template.targetRoles.some((r) => r.toLowerCase() === normalized);
  if (direct) return true;
  // Fall back to a loose substring match so broad roles ("engineer", "design")
  // still surface relevant templates.
  return template.targetRoles.some((r) => {
    const a = r.toLowerCase();
    return a.includes(normalized) || normalized.includes(a);
  });
}

/** True when the template fits the requested career-experience bucket. */
export function templateMatchesExperience(template: TemplateMetadata, level: TemplateExperienceLevel): boolean {
  const levels = EXPERIENCE_TO_LEVELS[level];
  return levels.some((l) => template.levels.includes(l as TemplateMetadata["levels"][number]));
}

/** Build the free-text searchable haystack for one template. */
function templateHaystack(template: TemplateMetadata): string {
  return [
    template.name,
    template.description,
    ...template.categories,
    template.category,
    ...template.targetRoles,
    template.bestFor,
    template.atsLabel,
    getFamilyForTemplate(template.id).name,
    getFamilyForTemplate(template.id).category,
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Search and filter the built-in template catalog.
 *
 * ```ts
 * searchTemplates({ query: "senior backend", category: "ats-friendly", atsFriendly: true })
 * searchTemplates({ role: "Product Manager", experienceLevel: "mid" })
 * ```
 *
 * All filters are AND-ed; an empty filter set returns every active template in
 * recommended order. Never throws and never mutates the registry.
 */
export function searchTemplates(filters: TemplateSearchFilters = {}): TemplateMetadata[] {
  const query = (filters.query ?? "").trim().toLowerCase();
  // Tokenize the query so multi-word searches work: "senior backend" requires
  // both words somewhere in the haystack (AND semantics across words).
  const queryTokens = query ? query.split(/\s+/).filter(Boolean) : [];
  const role = (filters.role ?? "").trim();

  const matches = TEMPLATE_REGISTRY.filter((template) => {
    // Free-text query — every token must appear somewhere in the haystack
    if (queryTokens.length > 0) {
      const haystack = templateHaystack(template);
      if (!queryTokens.every((token) => haystack.includes(token))) return false;
    }

    // Category (primary OR any matching secondary category)
    if (filters.category && filters.category !== "all") {
      const categories = template.categories as string[];
      if (template.category !== filters.category && !categories.includes(filters.category)) {
        return false;
      }
    }

    // Job role ("all" behaves like no role filter, matching the category pill)
    if (role && role !== "all" && !templateMatchesRole(template, role)) return false;

    // Experience level
    if (filters.experienceLevel && !templateMatchesExperience(template, filters.experienceLevel)) return false;

    // ATS friendly toggle
    if (filters.atsFriendly && !template.atsFriendly) return false;

    // Tier
    if (filters.tier && template.tier !== filters.tier) return false;

    return true;
  });

  // Stable "Recommended" ordering (ties broken by registry order).
  return matches.sort((a, b) => {
    const diff = (TEMPLATE_RECOMMENDED[b.id] ?? 0) - (TEMPLATE_RECOMMENDED[a.id] ?? 0);
    if (diff !== 0) return diff;
    return TEMPLATE_REGISTRY.indexOf(a) - TEMPLATE_REGISTRY.indexOf(b);
  });
}
