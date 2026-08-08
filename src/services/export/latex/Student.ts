import type { ResumeData } from "@/types/resume";
import {
  latexEscape,
  latexDateRange,
  latexBulletList,
  latexSection,
  latexLanguage,
  latexAchievement,
  latexVspace,
  latexPreamble,
  latexClose,
  getAccent,
  getFontFamily,
} from "./common";

/**
 * Renders the Student template as LaTeX.
 * Features: Education-first with colored header band, academic projects as cards,
 * skill chips, colored section markers.
 */
export function renderStudentLatex(resume: ResumeData): string {
  const accent = getAccent(resume, "#059669");
  const fontFamily = getFontFamily(resume);
  const { personalInfo, summary, education, projects, skills, certifications, achievements, languages, experience } = resume;

  let body = "";

  // ── Preamble ──
  body += latexPreamble(accent, fontFamily, false);

  // ── Colored Header Band ──
  body += `{\\pagecolor{white}\\color{white}\n`;
  body += `\\begin{center}\n`;
  body += `{\\Huge \\textbf{${latexEscape(personalInfo.fullName)}}}\\\\[8pt]\n`;
  body += `{\\large ${latexEscape(experience?.[0]?.role || (education[0]?.degree ? `${education[0].degree} Candidate` : "Student"))}}\\\\[12pt]\n`;
  const contactItems = [personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean);
  body += contactItems.map(latexEscape).join(" \\quad ") + "\n";
  body += `\\end{center}\n`;
  body += `}\\pagecolor{white}\\color{black}\n\n`;

  // ── Objective ──
  if (summary) {
    body += latexSection("Objective", "accent") + "\n";
    body += latexEscape(summary) + "\n\n";
  }

  // ── Education First (Hero Section) ──
  if (education.length > 0) {
    body += latexSection("Education", "accent") + "\n";
    for (const edu of education) {
      body += `\\noindent {\\large \\textbf{${latexEscape(edu.institution)}}} \\\\\n`;
      body += `{\\color{accent}\\textbf{${latexEscape(edu.degree)}${edu.field ? ` $ \\cdot $ ${latexEscape(edu.field)}` : ""}}} \\\\\n`;
      body += `{\\small ${latexEscape(edu.startDate)} -- ${latexEscape(edu.endDate)}${edu.cgpa ? ` $ \\cdot $ CGPA ${latexEscape(edu.cgpa)}` : ""}} \\\\\n`;
      body += latexVspace("8pt");
    }
    body += "\n";
  }

  // ── Skills as Chips ──
  if (skills) {
    body += latexSection("Skills", "accent") + "\n";
    const allSkills = [
      ...skills.technical,
      ...skills.frameworks,
      ...skills.tools,
    ].filter(Boolean);
    if (allSkills.length > 0) {
      body += allSkills.map((s) => `{\\color{accent}\\fboxsep=3pt\\fbox{\\small ${latexEscape(s)}}}`).join(" ") + "\n\n";
    }
  }

  // ── Projects as Cards ──
  if (projects.length > 0) {
    body += latexSection("Projects", "accent") + "\n";
    for (const proj of projects) {
      body += `\\noindent {\\large \\textbf{${latexEscape(proj.name)}}} \\\\\n`;
      body += `{\\small ${latexEscape(proj.description)}} \\\\\n`;
      if (proj.technologies.length > 0) {
        body += proj.technologies.map((t) => `{\\color{accent}\\fboxsep=2pt\\fbox{\\tiny ${latexEscape(t)}}} `).join("") + " \\\\\n";
      }
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // ── Experience (Internships) ──
  if (experience.length > 0) {
    body += latexSection("Experience", "accent") + "\n";
    for (const exp of experience) {
      body += `\\noindent {\\textbf{${latexEscape(exp.role)} --- ${latexEscape(exp.company)}}} \\hfill {\\small ${latexDateRange(exp.startDate, exp.endDate, exp.current)}}\\\\\n`;
      if (exp.responsibilities.length > 0) {
        body += latexBulletList(exp.responsibilities) + "\n";
      }
      body += latexVspace("4pt");
    }
    body += "\n";
  }

  // ── Certifications + Achievements + Languages (Two-column) ──
  const hasBottom = certifications.length > 0 || achievements.length > 0 || languages.length > 0;
  if (hasBottom) {
    body += `\\begin{minipage}[t]{0.48\\linewidth}\n`;
    if (certifications.length > 0) {
      body += latexSection("Certifications", "accent") + "\n";
      for (const c of certifications) {
        body += `\\noindent {\\textbf{${latexEscape(c.name)}${c.issuer ? ` --- ${latexEscape(c.issuer)}` : ""}}}\\\\\n`;
      }
    }
    body += `\\end{minipage}\\hfill\n`;
    body += `\\begin{minipage}[t]{0.48\\linewidth}\n`;
    if (achievements.length > 0) {
      body += latexSection("Achievements", "accent") + "\n";
      for (const a of achievements) {
        body += `\\textbullet\ ${latexAchievement(a.title, a.description)}\\\\\n`;
      }
    }
    if (languages.length > 0) {
      body += latexSection("Languages", "accent") + "\n";
      body += languages.map((l) => latexLanguage(l.name, l.proficiency)).join(" \\quad $ \\cdot $ \\quad ") + "\n";
    }
    body += `\\end{minipage}\n\n`;
  }

  // ── Custom Sections (K-04) ──
  if (resume.customSections) {
    for (const [, cs] of Object.entries(resume.customSections)) {
      if (!cs.items.length) continue;
      body += latexSection(cs.title || "Custom Section", "accent") + "\n";
      for (const item of cs.items) {
        body += `\\noindent {\\textbf{${latexEscape(item.title)}${item.date ? ` \\hfill {\\small ${latexEscape(item.date)}}` : ""}}}\\\\\n`;
        if (item.subtitle) body += `{\\small ${latexEscape(item.subtitle)}}\\\\\n`;
        if (item.description) body += `${latexEscape(item.description)}\\\\\n`;
        body += latexVspace("4pt");
      }
      body += "\n";
    }
  }

  body += latexClose();
  return body;
}