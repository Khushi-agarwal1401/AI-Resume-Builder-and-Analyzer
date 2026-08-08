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
  latexTwoColumn,
  latexMinipage,
  latexPreamble,
  latexClose,
  getAccent,
  getFontFamily,
} from "./common";

/**
 * Renders the Creative template as LaTeX.
 * Features: Two-column sidebar layout (33%/67%), pink accent,
 * skill tags in sidebar, profile card, timeline-style experience.
 */
export function renderCreativeLatex(resume: ResumeData): string {
  const accent = getAccent(resume, "#db2777");
  const fontFamily = getFontFamily(resume);
  const { personalInfo, summary, education, experience, projects, skills, languages } = resume;

  let body = "";

  // ── Preamble (two-column) ──
  body += latexPreamble(accent, fontFamily, true);

  // ── Two Column Layout ──
  body += `\\begin{paracol}{2}\n`;
  body += `\\setcolumnwidth{0.33\\linewidth,}\n`;

  // ── Sidebar (Left Column) ──
  body += `{\\color{white}\\pagecolor{accent!10!white}\\begin{minipage}[t]{\\linewidth}\n`;
  body += `  {\\Huge \\bfseries \\color{accent}${latexEscape(personalInfo.fullName)}}\\\\[8pt]\n`;
  body += `  {\\color{accent}\\rule{4cm}{5pt}}\\\\[12pt]\n`;

  // Contact info
  body += `  {\\small \\bfseries \\color{accent!80!black}Contact}\\\\[6pt]\n`;
  const contactItems = [personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean);
  for (const item of contactItems) {
    body += `  {\\small ${latexEscape(item)}}\\\\\n`;
  }
  body += `\\vspace{12pt}\n`;

  // Skills in sidebar
  if (skills) {
    body += `  {\\small \\bfseries \\color{accent}Skills}\\\\[6pt]\n`;
    if (skills.technical.length > 0) {
      body += `  {\\tiny \\bfseries Technical}\\\\[2pt]\n`;
      for (const s of skills.technical) {
        body += `  {\\color{accent!80!black}\\fboxsep=2pt\\fbox{\\tiny ${latexEscape(s)}}} `;
      }
      body += `\\vspace{6pt}\n`;
    }
    if (skills.frameworks.length > 0) {
      body += `  {\\tiny \\bfseries Frameworks}\\\\[2pt]\n`;
      for (const s of skills.frameworks) {
        body += `  {\\color{accent!80!black}\\fboxsep=2pt\\fbox{\\tiny ${latexEscape(s)}}} `;
      }
      body += `\\vspace{6pt}\n`;
    }
    if (skills.tools.length > 0) {
      body += `  {\\tiny \\bfseries Tools}\\\\[2pt]\n`;
      for (const s of skills.tools) {
        body += `  {\\color{accent!80!black}\\fboxsep=2pt\\fbox{\\tiny ${latexEscape(s)}}} `;
      }
      body += `\\vspace{6pt}\n`;
    }
  }

  // Languages in sidebar
  if (languages.length > 0) {
    body += `  {\\small \\bfseries \\color{accent}Languages}\\\\[6pt]\n`;
    for (const l of languages) {
      body += `  {\\small \\bfseries ${latexEscape(l.name)}} \\hfill {\\tiny ${latexEscape(l.proficiency)}}\\\\\n`;
    }
  }

  body += `\\end{minipage}}\n`;

  body += `\\switchcolumn\n`;

  // ── Main Content (Right Column) ──
  body += `\\begin{minipage}[t]{\\linewidth}\n`;

  // About Me
  if (summary) {
    body += latexSection("About Me", "accent") + "\n";
    body += `${latexEscape(summary)}\n\n`;
  }

  // Experience
  if (experience.length > 0) {
    body += latexSection("Experience", "accent") + "\n";
    for (const exp of experience) {
      body += `\\noindent {\\color{accent}\\rule{2pt}{10pt}}\\hspace{6pt}\n`;
      body += `\\begin{minipage}[t]{0.9\\linewidth}\n`;
      body += `  {\\large \\textbf{${latexEscape(exp.role)}}}\\\\\n`;
      body += `  {\\color{accent}\\textbf{${latexEscape(exp.company)}}} {\\small \\color{gray}| ${latexDateRange(exp.startDate, exp.endDate, exp.current)}}\\\\\n`;
      if (exp.responsibilities.length > 0) {
        body += latexBulletList(exp.responsibilities) + "\n";
      }
      body += `\\end{minipage}\n`;
      body += latexVspace("10pt");
    }
    body += "\n";
  }

  // Projects
  if (projects.length > 0) {
    body += latexSection("Projects", "accent") + "\n";
    for (const proj of projects) {
      body += `\\noindent \\begin{minipage}[t]{0.95\\linewidth}\n`;
      body += `  {\\large \\textbf{${latexEscape(proj.name)}}} \\\\\n`;
      body += `  {\\small ${latexEscape(proj.description)}} \\\\\n`;
      if (proj.technologies.length > 0) {
        body += `  {\\tiny \\bfseries ${proj.technologies.map(latexEscape).join(" $ \\cdot $ ")}} \\\\\n`;
      }
      body += `\\end{minipage}\n`;
      body += latexVspace("8pt");
    }
    body += "\n";
  }

  // Education
  if (education.length > 0) {
    body += latexSection("Education", "accent") + "\n";
    for (const edu of education) {
      body += `\\noindent {\\large \\textbf{${latexEscape(edu.degree)}}}\\\\\n`;
      body += `{\\small ${latexEscape(edu.institution)} {\\color{gray}| ${latexEscape(edu.startDate)} -- ${latexEscape(edu.endDate)}}}\\\\\n`;
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // Custom Sections
  if (resume.customSections) {
    for (const [id, cs] of Object.entries(resume.customSections)) {
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

  body += `\\end{minipage}\n`;
  body += `\\end{paracol}\n`;
  body += `\\pagecolor{white}\n`;
  body += latexClose();
  return body;
}