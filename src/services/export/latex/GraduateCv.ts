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
 * Renders the Graduate CV template as LaTeX.
 * Faithful to the RPI "Medium Length Graduate CV": a name header with
 * address blocks, then EDUCATION / PROJECTS / SKILLS / EXPERIENCE sections in
 * the classic academic order with a margin-style layout.
 */
export function renderGraduateCvLatex(resume: ResumeData): string {
  const accent = getAccent(resume, "#1e3a8a");
  const fontFamily = getFontFamily(resume);
  const { personalInfo, summary, education, experience, projects, skills, certifications, achievements, publications, languages, coursework, volunteer } = resume;

  let body = "";

  body += latexPreamble(accent, fontFamily, false);

  // ── Header: name + address block ──
  body += `\\noindent{\\LARGE \\textbf{${latexEscape(personalInfo.fullName)}}}\\hfill{\\small \\color{muted}\n`;
  const contact = [personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean);
  body += contact.map(latexEscape).join("\\\\\n");
  body += `}\\\\\n`;
  body += `{\\color{divider}\\hrule height 0.75pt}\n\n`;

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
      body += `{\\small \\textit{${latexEscape(edu.degree)}${edu.field ? ` in ${latexEscape(edu.field)}` : ""}${edu.cgpa ? `, GPA: ${latexEscape(edu.cgpa)}` : ""}}}\\\\\n`;
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // ── Projects ──
  if (projects.length > 0) {
    body += latexSection("Projects", "accent") + "\n";
    for (const proj of projects) {
      body += `\\noindent {\\textbf{${latexEscape(proj.name)}}}\\\\\n`;
      body += `${latexEscape(proj.description)}\\\\\n`;
      if (proj.technologies.length > 0) {
        body += `{\\small \\color{muted}\\textit{Technologies:} ${latexEscape(proj.technologies.join(", "))}}\\\\\n`;
      }
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // ── Skills ──
  if (skills) {
    body += latexSection("Skills", "accent") + "\n";
    const skillGroups = [
      { label: "Technical", items: skills.technical },
      { label: "Frameworks", items: skills.frameworks },
      { label: "Tools", items: skills.tools },
    ].filter((g) => g.items.length > 0);
    for (const group of skillGroups) {
      body += latexSkillLine(group.label, group.items) + "\\\\\n";
    }
    body += "\n";
  }

  // ── Experience ──
  if (experience.length > 0) {
    body += latexSection("Experience", "accent") + "\n";
    for (const exp of experience) {
      body += `\\noindent {\\textbf{${latexEscape(exp.role)}}} \\hfill {\\small \\color{muted}${latexDateRange(exp.startDate, exp.endDate, exp.current)}}\\\\\n`;
      body += `{\\small \\textit{${latexEscape(exp.company)}${exp.location ? `, ${latexEscape(exp.location)}` : ""}}}\\\\\n`;
      if (exp.responsibilities.length > 0) {
        body += latexBulletList(exp.responsibilities) + "\n";
      }
      body += latexVspace("6pt");
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

  // ── Publications ──
  if (publications.length > 0) {
    body += latexSection("Publications", "accent") + "\n";
    for (const pub of publications) {
      body += `\\noindent {\\textit{${latexEscape(pub.title)}}}${pub.publisher ? ` --- ${latexEscape(pub.publisher)}` : ""}${pub.date ? ` (${latexEscape(pub.date)})` : ""}\\\\\n`;
      if (pub.description) body += `${latexEscape(pub.description)}\\\\\n`;
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

  // ── Coursework ──
  if (coursework.length > 0) {
    body += latexSection("Coursework", "accent") + "\n";
    body += latexEscape(coursework.join(" \\textbullet\\ ")) + "\n\n";
  }

  // ── Languages ──
  if (languages.length > 0) {
    body += latexSection("Languages", "accent") + "\n";
    body += languages.map((l) => `${latexEscape(l.name)} (${latexEscape(l.proficiency)})`).join(" \\quad ") + "\n\n";
  }

  // ── Volunteer ──
  if (volunteer.length > 0) {
    body += latexSection("Volunteer", "accent") + "\n";
    for (const v of volunteer) {
      body += `\\noindent {\\textbf{${latexEscape(v.organization)}}}${v.role ? ` --- ${latexEscape(v.role)}` : ""}\\\\\n`;
      if (v.description) body += `${latexEscape(v.description)}\\\\\n`;
      body += latexVspace("4pt");
    }
    body += "\n";
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
