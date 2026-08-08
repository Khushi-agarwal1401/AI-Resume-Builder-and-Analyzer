import type { ResumeData } from "@/types/resume";
import {
  latexEscape,
  latexDateRange,
  latexBulletList,
  latexSection,
  latexName,
  latexContactLine,
  latexSkillLine,
  latexTechList,
  latexCertification,
  latexLanguage,
  latexAchievement,
  latexVspace,
  latexFlushLeft,
  latexFlushRight,
  latexPreamble,
  latexClose,
  getAccent,
  getFontFamily,
} from "./common";

/**
 * Renders the Modern template as LaTeX.
 * Features: Split header (name left, contact right), accent-colored section titles,
 * left rule on experience entries, chip-style skills.
 */
export function renderModernLatex(resume: ResumeData): string {
  const accent = getAccent(resume, "#2563eb");
  const fontFamily = getFontFamily(resume);
  const { personalInfo, summary, experience, education, projects, skills, certifications, achievements, languages } = resume;

  let body = "";

  // ── Preamble ──
  body += latexPreamble(accent, fontFamily, false);

  // ── Header: Split layout (name left, contact right) ──
  body += latexFlushLeft(
    latexName(personalInfo.fullName, "accent") + "\n" +
    `{\\color{accent}\\rule{3.5cm}{1.5pt}}\n` +
    `\\vspace{4pt}\n` +
    `{\\large \\textbf{\\color{accent}${latexEscape(resume.experience?.[0]?.role || resume.summary?.slice(0, 48) || "Professional")}}}`
  ) + "\n\n";

  body += latexFlushRight(
    latexContactLine([
      personalInfo.email,
      personalInfo.phone,
      personalInfo.linkedin,
      personalInfo.github,
      personalInfo.portfolio,
    ].filter(Boolean))
  ) + "\n\n";

  body += `{\\color{accent}\\hrule height 1.5pt}\n\n`;

  // ── Summary ──
  if (summary) {
    body += latexSection("Summary", "accent") + "\n";
    body += latexEscape(summary) + "\n\n";
  }

  // ── Experience ──
  if (experience.length > 0) {
    body += latexSection("Experience", "accent") + "\n";
    for (const exp of experience) {
      body += `\\noindent\\begin{minipage}[t]{0.7\\linewidth}\n`;
      body += `  {\\large \\textbf{${latexEscape(exp.role)}}} \\hfill {\\small \\color{muted}${latexDateRange(exp.startDate, exp.endDate, exp.current)}}\\\\\n`;
      body += `  {\\color{accent}\\textbf{${latexEscape(exp.company)}${exp.location ? ` \\textbullet\ ${latexEscape(exp.location)}` : ""}}}\\\\\n`;
      if (exp.responsibilities.length > 0) {
        body += `  ${latexBulletList(exp.responsibilities)}\n`;
      }
      body += `\\end{minipage}\\\\\n`;
      body += `{\\color{divider}\\hrule height 0.5pt}\n`;
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // ── Education ──
  if (education.length > 0) {
    body += latexSection("Education", "accent") + "\n";
    for (const edu of education) {
      body += `\\noindent {\\textbf{${latexEscape(edu.institution)}}} \\hfill {\\small \\color{muted}${latexEscape(edu.startDate)} -- ${latexEscape(edu.endDate)}}\\\\\n`;
      body += `{\\small ${latexEscape(edu.degree)}${edu.field ? ` in ${latexEscape(edu.field)}` : ""}${edu.cgpa ? ` $ \\cdot $ CGPA ${latexEscape(edu.cgpa)}` : ""}}\\\\\n`;
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // ── Projects ──
  if (projects.length > 0) {
    body += latexSection("Projects", "accent") + "\n";
    for (const proj of projects) {
      body += `\\noindent {\\large \\textbf{${latexEscape(proj.name)}${proj.type && proj.type !== "personal" ? ` {\\small \\color{muted}(${latexEscape(proj.type)})}` : ""}}}\\\\\n`;
      body += `${latexEscape(proj.description)}\\\\\n`;
      if (proj.technologies.length > 0) {
        body += latexTechList(proj.technologies, "accent") + "\\\\\n";
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

  // ── Certifications ──
  if (certifications.length > 0) {
    body += latexSection("Certifications", "accent") + "\n";
    for (const cert of certifications) {
      body += latexCertification(cert.name, cert.issuer, cert.date) + "\\\\\n";
    }
    body += "\n";
  }

  // ── Achievements ──
  if (achievements.length > 0) {
    body += latexSection("Achievements", "accent") + "\n";
    for (const ach of achievements) {
      body += latexAchievement(ach.title, ach.description) + "\\\\\n";
    }
    body += "\n";
  }

  // ── Languages ──
  if (languages.length > 0) {
    body += latexSection("Languages", "accent") + "\n";
    body += languages.map((l) => latexLanguage(l.name, l.proficiency)).join(" \\quad $ \\cdot $ \\quad ") + "\n\n";
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