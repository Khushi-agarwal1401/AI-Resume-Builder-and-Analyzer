/**
 * Built-in template keys that keep their dedicated components.
 * All 83 imported templates removed - they were duplicates/non-working.
 */
export interface ImportedTemplateConfig {
  // No imported templates - this is intentionally empty
  id: never;
  name: never;
}

export const BUILTIN_TEMPLATE_IDS: string[] = [
  "ats-professional",
  "modern",
  "student",
  "minimal",
  "executive",
  "creative",
  "executive-sidebar",
  "modern-card",
];

/** Every template the app can render: only the 8 working built-ins. */
export const ALL_TEMPLATE_IDS: string[] = [...BUILTIN_TEMPLATE_IDS];

/** Empty imported template map - no imported templates. */
export const IMPORTED_TEMPLATE_MAP: Record<string, ImportedTemplateConfig> = {};

/** Empty imported template ids. */
export const IMPORTED_TEMPLATE_IDS: string[] = [];

/** Empty imported templates array. */
export const IMPORTED_TEMPLATES: ImportedTemplateConfig[] = [];

/** Look up an imported config; always returns undefined (no imported templates). */
export function getImportedTemplate(_id: string): ImportedTemplateConfig | undefined {
  return undefined;
}

/** Whether a template key is part of the imported (data-driven) catalog. Always false. */
export function isImportedTemplate(_id: string): boolean {
  return false;
}

/** Human-readable display name for any template key (built-in only). */
export function templateDisplayName(id: string): string {
  const builtinNames: Record<string, string> = {
    "ats-professional": "ATS Professional",
    modern: "Modern",
    student: "Student",
    minimal: "Minimal",
    executive: "Executive",
    creative: "Creative",
    "executive-sidebar": "Executive Sidebar",
    "modern-card": "Modern Card",
  };
  return builtinNames[id] ?? id;
}

/** Source repo label (not used since no imported templates). */
export function sourceLabel(source: string): string {
  return source;
}

/**
 * Map any template to itself (no imported templates to map).
 * Kept for compatibility with export renderers.
 */
export function exportedStyleForTemplate(id: string): string {
  return id;
}