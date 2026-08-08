import type { ResumeData } from "@/types/resume";
import { renderModernLatex } from "./latex/Modern";
import { renderAtsProfessionalLatex } from "./latex/AtsProfessional";
import { renderStudentLatex } from "./latex/Student";
import { renderMinimalLatex } from "./latex/Minimal";
import { renderExecutiveLatex } from "./latex/Executive";
import { renderCreativeLatex } from "./latex/Creative";
import { renderExecutiveSidebarLatex } from "./latex/ExecutiveSidebar";
import { renderModernCardLatex } from "./latex/ModernCard";

/**
 * Main LaTeX renderer entry point.
 * Dispatches to the appropriate template-specific renderer based on resume.template.
 * Only 8 built-in templates supported (no imported templates).
 */
export function renderResumeToLatex(resume: ResumeData): string {
  switch (resume.template) {
    case "modern":
      return renderModernLatex(resume);

    case "ats-professional":
      return renderAtsProfessionalLatex(resume);

    case "student":
      return renderStudentLatex(resume);

    case "minimal":
      return renderMinimalLatex(resume);

    case "executive":
      return renderExecutiveLatex(resume);

    case "creative":
      return renderCreativeLatex(resume);

    case "executive-sidebar":
      return renderExecutiveSidebarLatex(resume);

    case "modern-card":
      return renderModernCardLatex(resume);

    default:
      // Fallback to Modern for any unknown template
      return renderModernLatex(resume);
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