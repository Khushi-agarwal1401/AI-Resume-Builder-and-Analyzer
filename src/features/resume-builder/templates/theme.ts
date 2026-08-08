import type { ResumeData, ResumeFont } from "@/types/resume";
import { variantAccent, variantFont } from "../config/template-variants";

/**
 * Built-in default font per template (the design's natural font before the
 * user customizes). Variants inherit their archetype's font unless the
 * variant catalog overrides it. Executive is serif by design; everything
 * else defaults to sans.
 */
export const DEFAULT_FONT_BY_TEMPLATE: Record<string, ResumeFont> = {
  "ats-professional": "sans",
  modern: "sans",
  student: "sans",
  minimal: "sans",
  executive: "serif",
  creative: "sans",
  "executive-sidebar": "sans",
  "modern-card": "sans",
};

/**
 * The effective default font for a resume's selected template — the user's
 * explicit choice wins; otherwise the variant's default font applies.
 */
export function defaultFontForTemplate(resume: Pick<ResumeData, "template" | "fontFamily">): ResumeFont {
  return resume.fontFamily ?? variantFont(resume.template) ?? DEFAULT_FONT_BY_TEMPLATE[resume.template] ?? "sans";
}

/**
 * The effective default accent for a resume's selected template — the user's
 * explicit choice wins; otherwise the variant's default accent applies.
 */
export function defaultAccentForTemplate(resume: Pick<ResumeData, "template" | "accentColor">): string {
  return resume.accentColor ?? variantAccent(resume.template) ?? "#2563eb";
}

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
 * Variant-aware accent: the user's chosen accent wins; otherwise the
 * variant's own default accent; otherwise the archetype fallback.
 */
export function getVariantAccent(resume: Pick<ResumeData, "template" | "accentColor">, archetypeFallback: string): string {
  return resume.accentColor ?? variantAccent(resume.template) ?? archetypeFallback;
}

/**
 * PDF theme defaults for a resume: the variant's accent (resolved with the
 * archetype fallback) plus the PDF font name for the variant's font.
 */
export function pdfThemeDefaults(
  resume: Pick<ResumeData, "template" | "accentColor" | "fontFamily">,
  archetypeAccent: string
): { accent: string; pdfFont: string } {
  return {
    accent: getVariantAccent(resume, archetypeAccent),
    pdfFont: pdfFontFamily(defaultFontForTemplate(resume)),
  };
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
