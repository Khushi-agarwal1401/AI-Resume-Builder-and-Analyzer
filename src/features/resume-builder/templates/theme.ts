import type { ResumeData, ResumeFont, ResumeTemplate } from "@/types/resume";

/**
 * Built-in default font per template (the design's natural font before the
 * user customizes). Executive is serif by design; everything else is sans.
 */
export const DEFAULT_FONT_BY_TEMPLATE: Record<ResumeTemplate, ResumeFont> = {
  "ats-professional": "sans",
  modern: "sans",
  student: "sans",
  minimal: "sans",
  executive: "serif",
  creative: "sans",
  "executive-sidebar": "sans",
  "modern-card": "sans",
};

export const FONT_FAMILY_OPTIONS: { value: ResumeFont; label: string; webClass: string; pdfFont: string }[] = [
  { value: "sans", label: "Sans (clean)", webClass: "font-sans", pdfFont: "Helvetica" },
  { value: "serif", label: "Serif (classic)", webClass: "font-serif", pdfFont: "Times-Roman" },
  { value: "mono", label: "Mono (technical)", webClass: "font-mono", pdfFont: "Courier" },
];

export function fontFamilyClass(fontFamily: ResumeFont | undefined): string {
  const match = FONT_FAMILY_OPTIONS.find((f) => f.value === fontFamily);
  return match?.webClass ?? "font-sans";
}

export function pdfFontFamily(fontFamily: ResumeFont | undefined): string {
  const match = FONT_FAMILY_OPTIONS.find((f) => f.value === fontFamily);
  return match?.pdfFont ?? "Helvetica";
}

/**
 * The accent color to use for a resume, falling back to the template's
 * built-in accent when the user hasn't chosen one.
 */
export function getAccent(resume: ResumeData, templateDefault: string): string {
  return resume.accentColor || templateDefault;
}

/**
 * A translucent version of the accent (e.g. background chips).
 */
export function accentWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
