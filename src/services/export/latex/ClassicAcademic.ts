import type { ResumeData } from "@/types/resume";
import {
  latexEscape,
  latexDateRange,
  latexBulletList,
  latexSection,
  latexSkillLine,
  latexVspace,
  latexPreamble,
  latexClose,
  getAccent,
  getFontFamily,
} from "./common";

/**
 * Renders the Classic Academic template as LaTeX.
 * Faithful to the sb2nov-style resume: a centered name header, colored
 * section headings with rules, education subheadings with right-aligned
 * dates, multi-column coursework, projects with tech stacks, experience,
 * grouped technical skills, extracurriculars, and certifications.
 */
export function renderClassicAcademicLatex(resume: ResumeData): string {
  const accent = getAccent(resume, "#0e5484");
  const fontFamily = getFontFamily(resume);
  const { personalInfo, summary, education, experience, projects, skills, certifications, achievements, activities, languages, coursework, codingProfiles } = resume;

  let body = "";

  body += latexPreamble(accent, fontFamily, false);

  // ── Centered name header ──
  body += `\\begin{center}\n`;
  body += `{\\Huge \\scshape ${latexEscape(personalInfo.fullName)}} \\\\ \\vspace{2pt}\n`;
  const contact = [personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean);
  body += `{\\small \\color{muted}${contact.map(latexEscape).join(" \\quad|\\quad ")}}\n`;
  body += `\\end{center}\n\n`;

  // ── Summary ──
  if (summary) {
    body += latexSection("Summary", "accent") + "\n";
    body += latexEscape(summary) + "\n\n";
  }

  // ── Education ──
  if (education.length > 0) {
    body += latexSection("Education", "accent") + "\n";
    for (const edu of education) {
      body += `\\noindent {\\textbf{${latexEscape(edu.institution)}}} \\hfill {\\small \\color{muted}${latexEscape(edu.startDate)} -- ${latexEscape(edu.endDate)}}\\\\\n`;
      body += `{\\small ${latexEscape(edu.degree)}${edu.field ? ` in ${latexEscape(edu.field)}` : ""}${edu.cgpa ? ` -- {\\bfseries ${latexEscape(edu.cgpa)}}` : ""}}\\\\\n`;
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // ── Coursework (two-column) ──
  if (coursework.length > 0) {
    body += latexSection("Relevant Coursework", "accent") + "\n";
    body += `\\begin{multicols}{2}\n\\begin{itemize}\n`;
    for (const c of coursework) {
      body += `  \\item \\small ${latexEscape(c)}\n`;
    }
    body += `\\end{itemize}\n\\end{multicols}\n\n`;
  }

  // ── Projects ──
  if (projects.length > 0) {
    body += latexSection("Projects", "accent") + "\n";
    for (const proj of projects) {
      body += `\\noindent {\\large \\textbf{${latexEscape(proj.name)}}} \\hfill {\\small \\color{muted}${latexEscape(proj.impact || "")}}\\\\\n`;
      body += `${latexEscape(proj.description)}\\\\\n`;
      if (proj.technologies.length > 0) {
        body += `{\\small {\\bfseries \\color{accent}Technologies:}} ${latexEscape(proj.technologies.join(", "))}\\\\\n`;
      }
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // ── Experience ──
  if (experience.length > 0) {
    body += latexSection("Experience", "accent") + "\n";
    for (const exp of experience) {
      body += `\\noindent {\\textbf{${latexEscape(exp.company)}${exp.location ? `, ${latexEscape(exp.location)}` : ""}}} \\hfill {\\small \\color{muted}${latexDateRange(exp.startDate, exp.endDate, exp.current)}}\\\\\n`;
      body += `{\\small \\textit{${latexEscape(exp.role)}}}\\\\\n`;
      if (exp.responsibilities.length > 0) {
        body += latexBulletList(exp.responsibilities) + "\n";
      }
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // ── Technical Skills ──
  if (skills) {
    body += latexSection("Technical Skills", "accent") + "\n";
    const skillGroups = [
      { label: "Languages", items: skills.technical },
      { label: "Frameworks", items: skills.frameworks },
      { label: "Developer Tools", items: skills.tools },
    ].filter((g) => g.items.length > 0);
    for (const group of skillGroups) {
      body += latexSkillLine(group.label, group.items) + "\\\\\n";
    }
    body += "\n";
  }

  // ── Certifications ──
  if (certifications.length > 0) {
    body += latexSection("Certifications", "accent") + "\n";
    for (const cert of certifications) {
      body += `\\noindent ${latexEscape(cert.name)}${cert.issuer ? ` --- ${latexEscape(cert.issuer)}` : ""}${cert.date ? ` (${latexEscape(cert.date)})` : ""}\\\\\n`;
    }
    body += "\n";
  }

  // ── Extracurricular / Activities ──
  if (activities.length > 0) {
    body += latexSection("Extracurricular", "accent") + "\n";
    for (const act of activities) {
      body += `\\noindent {\\textbf{${latexEscape(act.title)}}}${act.description ? ` --- ${latexEscape(act.description)}` : ""}\\\\\n`;
    }
    body += "\n";
  }

  // ── Achievements ──
  if (achievements.length > 0) {
    body += latexSection("Achievements", "accent") + "\n";
    for (const ach of achievements) {
      body += `\\noindent {\\textbf{${latexEscape(ach.title)}}}${ach.description ? ` --- ${latexEscape(ach.description)}` : ""}\\\\\n`;
    }
    body += "\n";
  }

  // ── Languages ──
  if (languages.length > 0) {
    body += latexSection("Languages", "accent") + "\n";
    body += languages.map((l) => `${latexEscape(l.name)} (${latexEscape(l.proficiency)})`).join(" \\quad ") + "\n\n";
  }

  // ── Coding profiles ──
  if (codingProfiles.length > 0) {
    body += latexSection("Profiles", "accent") + "\n";
    body += codingProfiles.map((p) => `${latexEscape(p.platform)}: ${latexEscape(p.handle)}`).join(" \\quad|\\quad ") + "\n\n";
  }

  // ── Custom Sections (K-04) ──
  if (resume.customSections) {
    for (const [, cs] of Object.entries(resume.customSections)) {
      if (!cs.items.length) continue;
      body += latexSection(cs.title || "Custom Section", "accent") + "\n";
      for (const item of cs.items) {
        body += `\\noindent {\\textbf{${latexEscape(item.title)}${item.date ? ` \\hfill {\\small \\color{muted}${latexEscape(item.date)}}` : ""}}}\\\\\n`;
        if (item.subtitle) body += `{\\small \\color{muted}${latexEscape(item.subtitle)}}\\\\\n`;
        if (item.description) body += `${latexEscape(item.description)}\\\\\n`;
        body += latexVspace("4pt");
      }
      body += "\n";
    }
  }

  body += latexClose();
  return body;
}
