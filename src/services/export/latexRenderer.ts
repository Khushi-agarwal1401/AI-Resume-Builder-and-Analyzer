import type { ResumeData } from "@/types/resume";
import { archetypeForTemplate, variantAccent, variantFont } from "@/features/resume-builder/config/template-variants";
import { renderModernLatex } from "./latex/Modern";
import { renderAtsProfessionalLatex } from "./latex/AtsProfessional";
import { renderStudentLatex } from "./latex/Student";
import { renderMinimalLatex } from "./latex/Minimal";
import { renderExecutiveLatex } from "./latex/Executive";
import { renderCreativeLatex } from "./latex/Creative";
import { renderExecutiveSidebarLatex } from "./latex/ExecutiveSidebar";
import { renderModernCardLatex } from "./latex/ModernCard";
import { renderGraduateCvLatex } from "./latex/GraduateCv";
import { renderClassicAcademicLatex } from "./latex/ClassicAcademic";
import { renderDeedyLatex } from "./latex/Deedy";

/**
 * Main LaTeX renderer entry point.
 *
 * Every catalog variant renders through its archetype's LaTeX engine while
 * keeping the ORIGINAL template key, so the variant's accent color and font
 * default flow into the preamble (each renderer reads resume.accentColor /
 * resume.fontFamily via getAccent / getFontFamily).
 */
export function renderResumeToLatex(resume: ResumeData): string {
  // Pre-resolve the variant theme so the archetype renderers pick it up.
  const themed: ResumeData = {
    ...resume,
    accentColor: resume.accentColor ?? variantAccent(resume.template) ?? null,
    fontFamily: resume.fontFamily ?? variantFont(resume.template),
  };

  switch (archetypeForTemplate(resume.template)) {
    case "modern":
      return renderModernLatex(themed);

    case "ats-professional":
      return renderAtsProfessionalLatex(themed);

    case "student":
      return renderStudentLatex(themed);

    case "minimal":
      return renderMinimalLatex(themed);

    case "executive":
      return renderExecutiveLatex(themed);

    case "creative":
      return renderCreativeLatex(themed);

    case "executive-sidebar":
      return renderExecutiveSidebarLatex(themed);

    case "modern-card":
      return renderModernCardLatex(themed);

    case "graduate-cv":
      return renderGraduateCvLatex(themed);

    case "classic-academic":
      return renderClassicAcademicLatex(themed);

    case "deedy":
      return renderDeedyLatex(themed);

    default:
      // Fallback to Modern for any unknown template
      return renderModernLatex(themed);
  }
}

/**
 * Sanitizes a filename for LaTeX export.
 */
export function sanitizeLatexFilename(name: string): string {
  return name
    .replace(/["\r\n\\]/g, "")
    .replace(/\s+/g, "_")
    .trim();
}

/**
 * Generates a LaTeX export filename from resume data.
 */
export function generateLatexFilename(resume: ResumeData): string {
  const name = sanitizeLatexFilename(resume.personalInfo.fullName) || "Resume";
  return `${name}_Resume.tex`;
}