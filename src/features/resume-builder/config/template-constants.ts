import type { ResumeTemplate } from "@/types/resume";

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

/** Longer formal names shown in the preview page toolbar */
export const TEMPLATE_NAMES: Record<ResumeTemplate, string> = {
  "ats-professional": "ATS Professional",
  modern: "Modern",
  student: "Student",
  minimal: "Minimal",
  executive: "Executive",
  creative: "Creative",
  "executive-sidebar": "Executive Sidebar",
  "modern-card": "Modern Card",
};

/** All template variant keys, for iterating in selectors */
export const TEMPLATE_VARIANTS: ResumeTemplate[] = [
  "ats-professional",
  "modern",
  "student",
  "minimal",
  "executive",
  "creative",
  "executive-sidebar",
  "modern-card",
];

/** Layout type for each template */
export type TemplateLayoutType = "single" | "two-column" | "sidebar";

export interface TemplateLayoutStyle {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

/** Layout classification for each template */
export const TEMPLATE_LAYOUT: Record<string, TemplateLayoutType> = {
  modern: "single",
  "ats-professional": "single",
  student: "single",
  minimal: "single",
  executive: "two-column",
  creative: "sidebar",
  "executive-sidebar": "sidebar",
  "modern-card": "single",
};

/** Pre-styled badge properties for each layout type */
export const LAYOUT_BADGE: Record<TemplateLayoutType, TemplateLayoutStyle> = {
  "single": { label: "1 Col", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  "two-column": { label: "2 Col", bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  "sidebar": { label: "Side", bg: "bg-slate-200", text: "text-slate-800", dot: "bg-slate-500" },
};
