import type { ResumeFont } from "@/types/resume";
import { ALL_TEMPLATE_IDS, templateDisplayName } from "../templates/imported/catalog";
import { variantFont, archetypeForTemplate } from "./template-variants";

export interface TemplateBadgeStyle {
  bg: string;
  text: string;
  dot: string;
}

/** Short display names shown on dashboard cards and badges */
export const TEMPLATE_DISPLAY: Record<string, string> = {
  modern: "Modern",
  "ats-professional": "ATS Pro",
  student: "Student",
  minimal: "Minimal",
  executive: "Executive",
  creative: "Creative",
  "executive-sidebar": "Exec Sidebar",
  "modern-card": "Card Modern",
};

/** Short display name for any catalog template (variant-aware fallback). */
export function templateShortName(id: string): string {
  return TEMPLATE_DISPLAY[id] ?? templateDisplayName(id);
}

/** Tailwind badge style per archetype (variants inherit their archetype's). */
const ARCHETYPE_BADGE: Record<string, TemplateBadgeStyle> = {
  modern: { bg: "bg-blue-50 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  "ats-professional": { bg: "bg-gray-100 dark:bg-gray-500/15", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" },
  student: { bg: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  minimal: { bg: "bg-slate-100 dark:bg-slate-500/15", text: "text-slate-600 dark:text-slate-300", dot: "bg-slate-400" },
  executive: { bg: "bg-indigo-50 dark:bg-indigo-500/15", text: "text-indigo-700 dark:text-indigo-300", dot: "bg-indigo-500" },
  creative: { bg: "bg-pink-50 dark:bg-pink-500/15", text: "text-pink-700 dark:text-pink-300", dot: "bg-pink-500" },
  "executive-sidebar": { bg: "bg-slate-800 dark:bg-slate-700", text: "text-slate-100 dark:text-slate-200", dot: "bg-slate-400" },
  "modern-card": { bg: "bg-purple-50 dark:bg-purple-500/15", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500" },
};

/** Color-coded badge styles for every catalog template (variant-aware). */
export const TEMPLATE_BADGE: Record<string, TemplateBadgeStyle> = Object.fromEntries(
  ALL_TEMPLATE_IDS.map((id) => {
    const arch = archetypeForTemplate(id);
    const badge = ARCHETYPE_BADGE[arch] ?? ARCHETYPE_BADGE.modern;
    return [id, badge];
  })
);

/** Longer formal names shown in the preview page toolbar (8 templates). */
export const TEMPLATE_NAMES: Record<string, string> = Object.fromEntries(
  ALL_TEMPLATE_IDS.map((id) => [id, templateDisplayName(id)])
);

/** All template variant keys, for iterating in selectors (8 templates). */
export const TEMPLATE_VARIANTS: string[] = [...ALL_TEMPLATE_IDS];

/** Layout type for each template */
export type TemplateLayoutType = "single" | "two-column" | "sidebar";

export interface TemplateLayoutStyle {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

/** Layout classification per archetype (variants inherit theirs). */
const ARCHETYPE_LAYOUT: Record<string, TemplateLayoutType> = {
  modern: "single",
  "ats-professional": "single",
  student: "single",
  minimal: "single",
  executive: "two-column",
  creative: "sidebar",
  "executive-sidebar": "sidebar",
  "modern-card": "single",
};

/** Layout classification for every catalog template (variant-aware). */
export const TEMPLATE_LAYOUT: Record<string, TemplateLayoutType> = Object.fromEntries(
  ALL_TEMPLATE_IDS.map((id) => [id, ARCHETYPE_LAYOUT[archetypeForTemplate(id)] ?? "single"])
);

/** Pre-styled badge properties for each layout type */
export const LAYOUT_BADGE: Record<TemplateLayoutType, TemplateLayoutStyle> = {
  "single": { label: "1 Col", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  "two-column": { label: "2 Col", bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  "sidebar": { label: "Side", bg: "bg-slate-200", text: "text-slate-800", dot: "bg-slate-500" },
};

/**
 * Default font per archetype (variants inherit theirs unless the variant
 * catalog overrides the font, e.g. Minimal Technical → mono).
 */
const ARCHETYPE_DEFAULT_FONT: Record<string, ResumeFont> = {
  modern: "sans",
  "ats-professional": "sans",
  student: "sans",
  minimal: "sans",
  executive: "serif",
  creative: "sans",
  "executive-sidebar": "sans",
  "modern-card": "sans",
};

/** Default font for every catalog template (variant-aware). */
export const TEMPLATE_DEFAULT_FONT: Record<string, ResumeFont> = Object.fromEntries(
  ALL_TEMPLATE_IDS.map((id) => [
    id,
    variantFont(id) ?? ARCHETYPE_DEFAULT_FONT[archetypeForTemplate(id)] ?? "sans",
  ])
);

export { ALL_TEMPLATE_IDS };