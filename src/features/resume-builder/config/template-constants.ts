import type { ResumeFont } from "@/types/resume";
import { ALL_TEMPLATE_IDS, IMPORTED_TEMPLATES, templateDisplayName } from "../templates/imported/catalog";

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

/** Color-coded badge styles for each template */
export const TEMPLATE_BADGE: Record<string, TemplateBadgeStyle> = {
  modern: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "ats-professional": { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
  student: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  minimal: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  executive: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  creative: { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-500" },
  "executive-sidebar": { bg: "bg-slate-800", text: "text-slate-100", dot: "bg-slate-400" },
  "modern-card": { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
};

const IMPORTED_BADGE: TemplateBadgeStyle = { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" };

/** Longer formal names shown in the preview page toolbar (all 96 templates). */
export const TEMPLATE_NAMES: Record<string, string> = Object.fromEntries(
  ALL_TEMPLATE_IDS.map((id) => [id, templateDisplayName(id)])
);

/** All template variant keys, for iterating in selectors (all 96). */
export const TEMPLATE_VARIANTS: string[] = [...ALL_TEMPLATE_IDS];

/** Layout type for each template */
export type TemplateLayoutType = "single" | "two-column" | "sidebar";

export interface TemplateLayoutStyle {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

/** Layout classification for each template (built-ins + imported). */
export const TEMPLATE_LAYOUT: Record<string, TemplateLayoutType> = {
  modern: "single",
  "ats-professional": "single",
  student: "single",
  minimal: "single",
  executive: "two-column",
  creative: "sidebar",
  "executive-sidebar": "sidebar",
  "modern-card": "single",
  ...Object.fromEntries(
    IMPORTED_TEMPLATES.map((t) => [
      t.id,
      t.layout.columns === 2 ? "two-column" : "single",
    ])
  ),
};

/** Pre-styled badge properties for each layout type */
export const LAYOUT_BADGE: Record<TemplateLayoutType, TemplateLayoutStyle> = {
  "single": { label: "1 Col", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  "two-column": { label: "2 Col", bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  "sidebar": { label: "Side", bg: "bg-slate-200", text: "text-slate-800", dot: "bg-slate-500" },
};

/**
 * Default font for each template. Imported configs carry real families, so the
 * font-family selector matches the design (serif/mono when the source family
 * is serif or monospace, sans otherwise).
 */
export const TEMPLATE_DEFAULT_FONT: Record<string, ResumeFont> = {
  modern: "sans",
  "ats-professional": "sans",
  student: "sans",
  minimal: "sans",
  executive: "serif",
  creative: "sans",
  "executive-sidebar": "sans",
  "modern-card": "sans",
  ...Object.fromEntries(
    IMPORTED_TEMPLATES.map((t) => {
      const f = `${t.typography.fontFamily} ${t.typography.headingFamily} ${t.typography.nameFamily}`.toLowerCase();
      const font: ResumeFont = f.includes("mono")
        ? "mono"
        : /serif|garamond|playfair|cormorant|times|tinos|charter|computer modern|fontin|gentium|latin modern|spectral/.test(f)
          ? "serif"
          : "sans";
      return [t.id, font];
    })
  ),
};

export { ALL_TEMPLATE_IDS, IMPORTED_TEMPLATES };
