import type { ResumeData } from "@/types/resume";
import {
  latexEscape,
  latexDateRange,
  latexBulletList,
  latexSection,
  latexContactLine,
  latexCertification,
  latexAchievement,
  latexVspace,
  latexCenter,
  latexPreamble,
  latexClose,
  getAccent,
  getFontFamily,
} from "./common";

/**
 * Renders the Executive template as LaTeX.
 * Features: Serif font, commanding centered masthead with double rule,
 * bordered Leadership Summary, metric-forward experience, two-column competencies.
 */
export function renderExecutiveLatex(resume: ResumeData): string {
  const accent = getAccent(resume, "#312e81");
  const fontFamily = getFontFamily(resume) || "serif";
  const { personalInfo, summary, experience, education, projects, skills, certifications, achievements, languages } = resume;

  let body = "";

  // ── Preamble (force serif) ──
  body += latexPreamble(accent, fontFamily, true);

  // ── Commanding Serif Masthead ──
  body += latexCenter(
    `{\\Huge \\textbf{\\color{accent}${latexEscape(personalInfo.fullName.toUpperCase())}}}\\\\[12pt]\n` +
    `{\\color{accent}\\rule{7cm}{2pt}}\\\\[4pt]\n` +
    `{\\color{accent}\\rule{10cm}{0.5pt}}\\\\[10pt]\n` +
    `{\\small \\textsc{${latexContactLine([personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean)).replace(/ \\quad\|\\quad /g, " \\quad $ \\cdot $ \\quad ")}}}\n`
  ) + "\n\n";

  // ── Leadership Summary ──
  if (summary) {
    body += latexSection("Leadership Summary", "accent") + "\n";
    body += `{\\color{accent}\\vrule width 3pt}\\hspace{8pt}\n`;
    body += `\\begin{minipage}[t]{0.95\\linewidth}\n`;
    body += `  {\\itshape ${latexEscape(summary)}}\n`;
    body += `\\end{minipage}\n\n`;
  }

  // ── Professional Experience ──
  if (experience.length > 0) {
    body += latexSection("Professional Experience", "accent") + "\n";
    for (const exp of experience) {
      body += `\\noindent {\\Large \\textbf{${latexEscape(exp.role)}}} \\hfill {\\small \\textsc{${latexDateRange(exp.startDate, exp.endDate, exp.current).toUpperCase()}}}\\\\\n`;
      body += `{\\color{accent}\\textbf{\\textsc{${latexEscape(exp.company)}${exp.location ? ` \\textbullet\ ${latexEscape(exp.location)}` : ""}}}}\\\\\n`;
      if (exp.responsibilities.length > 0) {
        body += latexBulletList(exp.responsibilities) + "\n";
      }
      body += latexVspace("8pt");
    }
    body += "\n";
  }

  // ── Education ──
  if (education.length > 0) {
    body += latexSection("Education", "accent") + "\n";
    for (const edu of education) {
      body += `\\noindent {\\textbf{${latexEscape(edu.institution)}}} \\hfill {\\small ${latexEscape(edu.startDate)} -- ${latexEscape(edu.endDate)}}\\\\\n`;
      body += `{\\textsc{${latexEscape(edu.degree)}${edu.field ? ` in ${latexEscape(edu.field)}` : ""}${edu.cgpa ? ` $ \\cdot $ ${latexEscape(edu.cgpa)}` : ""}}}\\\\\n`;
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // ── Key Initiatives / Projects ──
  if (projects.length > 0) {
    body += latexSection("Key Initiatives", "accent") + "\n";
    for (const proj of projects) {
      body += `\\noindent {\\textbf{${latexEscape(proj.name)}}}\\\\\n`;
      body += `{\\small ${latexEscape(proj.description)}}\\\\\n`;
      if (proj.technologies.length > 0) {
        body += `{\\small \\textsc{${proj.technologies.map(latexEscape).join(" $ \\cdot $ ")}}}\\\\\n`;
      }
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // ── Core Competencies (Two Column) ──
  const hasBottom = (skills && Object.values(skills).some((arr) => arr.length > 0)) || 
                    certifications.length > 0 || languages.length > 0 || 
                    projects.length > 0 || achievements.length > 0;
  
  if (hasBottom) {
    body += `\\begin{paracol}{2}\n`;
    body += `\\setcolumnwidth{0.55\\linewidth,}\n`;

    // Left column: Skills + Projects
    if (skills && Object.values(skills).some((arr) => arr.length > 0)) {
      body += latexSection("Core Competencies", "accent") + "\n";
      const skillGroups = [
        { label: "Leadership", items: skills.soft },
        { label: "Technical", items: skills.technical },
        { label: "Frameworks", items: skills.frameworks },
        { label: "Tools", items: skills.tools },
      ].filter((g) => g.items.length > 0);

      for (const group of skillGroups) {
        body += `\\noindent {\\small \\textsc{${latexEscape(group.label)}}}: ${group.items.map(latexEscape).join(", ")}\\\\\n`;
      }
    }

    if (projects.length > 0) {
      body += latexSection("Key Projects", "accent") + "\n";
      for (const proj of projects) {
        body += `\\noindent {\\textbf{${latexEscape(proj.name)}}}\\\\\n`;
        body += `{\\small ${latexEscape(proj.description)}}\\\\\n`;
        body += latexVspace("4pt");
      }
    }

    body += `\\switchcolumn\n`;

    // Right column: Certifications, Languages, Achievements
    if (certifications.length > 0) {
      body += latexSection("Certifications", "accent") + "\n";
      for (const cert of certifications) {
        body += latexCertification(cert.name, cert.issuer, cert.date) + "\\\\\n";
      }
    }

    if (languages.length > 0) {
      body += latexSection("Languages", "accent") + "\n";
      for (const l of languages) {
        body += `${latexEscape(l.name)} \\textbullet\ ${latexEscape(l.proficiency)}\\\\\n`;
      }
    }

    if (achievements.length > 0) {
      body += latexSection("Achievements", "accent") + "\n";
      for (const ach of achievements) {
        body += `{\\color{accent}\\textbullet}\ ${latexAchievement(ach.title, ach.description)}\\\\\n`;
      }
    }

    body += `\\end{paracol}\n\n`;
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