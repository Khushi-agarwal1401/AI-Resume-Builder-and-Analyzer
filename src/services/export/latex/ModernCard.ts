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
  latexCenter,
  latexMinipage,
  latexPreamble,
  latexClose,
  getAccent,
  getFontFamily,
} from "./common";

/**
 * Renders the Modern Card template as LaTeX.
 * Features: Card-based sections with rounded borders, indigo accent,
 * skill chips, shadow-like separation between sections.
 */
export function renderModernCardLatex(resume: ResumeData): string {
  const accent = getAccent(resume, "#6366f1");
  const fontFamily = getFontFamily(resume);
  const { personalInfo, summary, education, experience, projects, skills, certifications, achievements, languages } = resume;

  let body = "";

  // ── Preamble ──
  body += latexPreamble(accent, fontFamily, false);

  // ── Header Card ──
  body += `\\noindent \\begin{tabular}{@{}p{\\linewidth}@{}}\n`;
  body += `  {\\color{accent}\\rule{\\linewidth}{0.5pt}}\\\\[4pt]\n`;
  body += `  {\\Large \\textbf{${latexEscape(personalInfo.fullName)}}}\\\\[6pt]\n`;
  body += `  {\\small ${latexEscape(personalInfo.email)}${personalInfo.phone ? ` | ${latexEscape(personalInfo.phone)}` : ""}}\\\\\n`;
  const socialItems = [personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean);
  if (socialItems.length > 0) {
    body += `  {\\tiny ${socialItems.map(latexEscape).join(" | ")}}\\\\\n`;
  }
  body += `  {\\color{accent}\\rule{\\linewidth}{0.5pt}}\n`;
  body += `\\end{tabular}\n\n`;

  // Helper to render a card section
  const renderCard = (title: string, content: string) => {
    return `\\noindent \\begin{tabular}{@{}p{\\linewidth}@{}}\n` +
           `  {\\color{divider}\\rule{\\linewidth}{0.5pt}}\\\\[4pt]\n` +
           `  {\\tiny \\bfseries \\uppercase{${latexEscape(title)}}}\\\\[8pt]\n` +
           `  ${content}\n` +
           `  {\\color{divider}\\rule{\\linewidth}{0.5pt}}\n` +
           `\\end{tabular}\n\n`;
  };

  // ── Summary Card ──
  if (summary) {
    body += renderCard("Summary", latexEscape(summary));
  }

  // ── Experience Card ──
  if (experience.length > 0) {
    let expContent = "";
    for (const exp of experience) {
      expContent += `\\noindent {\\textbf{${latexEscape(exp.role)}}} \\hfill {\\tiny ${latexDateRange(exp.startDate, exp.endDate, exp.current)}}\\\\\n`;
      expContent += `{\\tiny \\color{accent}${latexEscape(exp.company)}${exp.location ? `, ${latexEscape(exp.location)}` : ""}}\\\\\n`;
      if (exp.responsibilities.length > 0) {
        expContent += latexBulletList(exp.responsibilities) + "\n";
      }
      expContent += latexVspace("6pt");
    }
    body += renderCard("Experience", expContent);
  }

  // ── Education Card ──
  if (education.length > 0) {
    let eduContent = "";
    for (const edu of education) {
      eduContent += `\\noindent {\\textbf{${latexEscape(edu.institution)}}} \\hfill {\\tiny ${latexEscape(edu.startDate)} -- ${latexEscape(edu.endDate)}}\\\\\n`;
      eduContent += `{\\tiny \\color{accent}${latexEscape(edu.degree)}${edu.field ? ` in ${latexEscape(edu.field)}` : ""}${edu.cgpa ? ` | CGPA: ${latexEscape(edu.cgpa)}` : ""}}\\\\\n`;
      eduContent += latexVspace("4pt");
    }
    body += renderCard("Education", eduContent);
  }

  // ── Skills & Languages Card ──
  if (skills || languages.length > 0) {
    let skillContent = "";
    if (skills) {
      if (skills.technical.length > 0) {
        skillContent += `{\\tiny \\bfseries \\color{accent}Technical}\\\\[2pt]\n`;
        skillContent += skills.technical.map((s) => `{\\fboxsep=2pt\\fbox{\\tiny ${latexEscape(s)}}} `).join("") + "\\\\[6pt]\n";
      }
      if (skills.frameworks.length > 0) {
        skillContent += `{\\tiny \\bfseries \\color{accent}Frameworks}\\\\[2pt]\n`;
        skillContent += skills.frameworks.map((s) => `{\\fboxsep=2pt\\fbox{\\tiny ${latexEscape(s)}}} `).join("") + "\\\\[6pt]\n";
      }
      if (skills.tools.length > 0) {
        skillContent += `{\\tiny \\bfseries \\color{accent}Tools}\\\\[2pt]\n`;
        skillContent += skills.tools.map((s) => `{\\fboxsep=2pt\\fbox{\\tiny ${latexEscape(s)}}} `).join("") + "\\\\[6pt]\n";
      }
    }
    if (languages.length > 0) {
      skillContent += `{\\tiny \\bfseries \\color{accent}Languages}\\\\[2pt]\n`;
      for (const l of languages) {
        skillContent += `{\\small ${latexEscape(l.name)} --- ${latexEscape(l.proficiency)}}\\\\\n`;
      }
    }
    body += renderCard("Skills & Languages", skillContent);
  }

  // ── Projects Card ──
  if (projects.length > 0) {
    let projContent = "";
    for (const proj of projects) {
      projContent += `\\noindent {\\textbf{${latexEscape(proj.name)}}}\\\\\n`;
      projContent += `{\\tiny ${latexEscape(proj.description)}}\\\\\n`;
      if (proj.technologies.length > 0) {
        projContent += proj.technologies.map((t) => `{\\fboxsep=2pt\\fbox{\\tiny ${latexEscape(t)}}} `).join("") + "\\\\\n";
      }
      projContent += latexVspace("4pt");
    }
    body += renderCard("Projects", projContent);
  }

  // ── Certifications Card ──
  if (certifications.length > 0) {
    let certContent = "";
    for (const cert of certifications) {
      certContent += `\\noindent ${latexEscape(cert.name)}${cert.issuer ? ` --- ${latexEscape(cert.issuer)}` : ""}${cert.date ? ` (${latexEscape(cert.date)})` : ""}\\\\\n`;
    }
    body += renderCard("Certifications", certContent);
  }

  // ── Achievements Card ──
  if (achievements.length > 0) {
    let achContent = "";
    for (const ach of achievements) {
      achContent += `\\noindent {\\textbf{${latexEscape(ach.title)}}}: ${latexEscape(ach.description)}\\\\\n`;
    }
    body += renderCard("Achievements", achContent);
  }

  // ── Custom Sections (K-04) ──
  if (resume.customSections) {
    for (const [id, cs] of Object.entries(resume.customSections)) {
      if (!cs.items.length) continue;
      let csContent = "";
      for (const item of cs.items) {
        csContent += `\\noindent {\\textbf{${latexEscape(item.title)}${item.date ? ` \\hfill {\\tiny ${latexEscape(item.date)}}` : ""}}}\\\\\n`;
        if (item.subtitle) csContent += `{\\tiny ${latexEscape(item.subtitle)}}\\\\\n`;
        if (item.description) csContent += `${latexEscape(item.description)}\\\\\n`;
        csContent += latexVspace("4pt");
      }
      body += renderCard(cs.title || "Custom Section", csContent);
    }
  }

  body += latexClose();
  return body;
}