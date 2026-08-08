/**
 * Template keys that keep dedicated archetype components.
 * These are the 8 real rendering engines every variant renders through.
 */
export interface ImportedTemplateConfig {
  // No imported templates - this is intentionally empty
  id: never;
  name: never;
}

import {
  TEMPLATE_VARIANTS,
  variantDisplayName,
  variantAccent,
  archetypeForTemplate,
} from "../../config/template-variants";

/** The 8 archetype ids (real rendering engines). */
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

/**
 * Every template the app can render: the 8 archetypes plus every catalog
 * variant (55+ marketplace choices). All variants render through their
 * archetype component with their own accent/font/theme.
 */
export const ALL_TEMPLATE_IDS: string[] = TEMPLATE_VARIANTS.map((v) => v.id);

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

/** Human-readable display name for any template key (variant-aware). */
export function templateDisplayName(id: string): string {
  return variantDisplayName(id);
}

/** Source repo label (not used since no imported templates). */
export function sourceLabel(source: string): string {
  return source;
}

/**
 * Map any template to the archetype style that renders it. Variants map to
 * their archetype; archetypes map to themselves; unknown keys map to "modern".
 * Kept for compatibility with export renderers (PDF/HTML/LaTeX dispatch).
 */
export function exportedStyleForTemplate(id: string): string {
  return archetypeForTemplate(id);
}

/** Default accent for a template key (variant-aware). */
export function defaultAccentForTemplate(id: string): string {
  return variantAccent(id) ?? "#2563eb";
}
