import type { ResumeData } from "@/types/resume";
import {
  latexEscape,
  latexDateRange,
  latexBulletList,
  latexVspace,
  latexPreamble,
  latexClose,
  getAccent,
  getFontFamily,
} from "./common";

/**
 * Renders the Executive Sidebar template as LaTeX.
 * Features: Two-column with dark sidebar (30%/70%), dark background sidebar
 * with white text, skills as tags, focused main content area.
 */
export function renderExecutiveSidebarLatex(resume: ResumeData): string {
  const accent = getAccent(resume, "#0f172a");
  const fontFamily = getFontFamily(resume);
  const { personalInfo, summary, education, experience, projects, skills, certifications, achievements, languages } = resume;

  let body = "";

  // ── Preamble (two-column) ──
  body += latexPreamble(accent, fontFamily, true);

  // ── Two Column Layout ──
  body += `\\begin{paracol}{2}\n`;
  body += `\\setcolumnwidth{0.3\\linewidth,}\n`;

  // ── Sidebar (Left Column - Dark) ──
  body += `{\\color{white}\\begin{minipage}[t]{\\linewidth}\n`;
  body += `  {\\pagecolor{accent}\\color{white}\n`;
  body += `  {\\large \\textbf{${latexEscape(personalInfo.fullName)}}}\\\\[4pt]\n`;
  body += `  {\\small Software Engineer}\\\\[12pt]\n`;
  body += `  {\\color{white!50}\\rule{\\linewidth}{0.5pt}}\\\\[8pt]\n`;

  // Contact
  body += `  {\\tiny \\bfseries \\uppercase{Contact}}\\\\[4pt]\n`;
  const contactItems = [personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean);
  for (const item of contactItems) {
    body += `  {\\tiny ${latexEscape(item)}}\\\\\n`;
  }
  body += `\\vspace{8pt}\n`;

  // Languages
  if (languages.length > 0) {
    body += `  {\\tiny \\bfseries \\uppercase{Languages}}\\\\[4pt]\n`;
    for (const l of languages) {
      body += `  {\\tiny ${latexEscape(l.name)} --- ${latexEscape(l.proficiency)}}\\\\\n`;
    }
    body += `\\vspace{8pt}\n`;
  }

  // Skills
  if (skills) {
    body += `  {\\tiny \\bfseries \\uppercase{Skills}}\\\\[4pt]\n`;
    if (skills.technical.length > 0) {
      for (const s of skills.technical) {
        body += `  {\\fboxsep=2pt\\fbox{\\tiny ${latexEscape(s)}}} `;
      }
      body += `\\vspace{4pt}\n`;
    }
    if (skills.frameworks.length > 0) {
      for (const s of skills.frameworks) {
        body += `  {\\fboxsep=2pt\\fbox{\\tiny ${latexEscape(s)}}} `;
      }
      body += `\\vspace{4pt}\n`;
    }
    if (skills.tools.length > 0) {
      for (const s of skills.tools) {
        body += `  {\\fboxsep=2pt\\fbox{\\tiny ${latexEscape(s)}}} `;
      }
      body += `\\vspace{4pt}\n`;
    }
    body += `\\vspace{8pt}\n`;
  }

  // Certifications
  if (certifications.length > 0) {
    body += `  {\\tiny \\bfseries \\uppercase{Certs}}\\\\[4pt]\n`;
    for (const cert of certifications) {
      body += `  {\\tiny ${latexEscape(cert.name)}}\\\\\n`;
    }
  }

  body += `  }\n`; // close pagecolor group
  body += `\\end{minipage}}\n`;

  body += `\\switchcolumn\n`;

  // ── Main Content (Right Column) ──
  body += `\\begin{minipage}[t]{\\linewidth}\n`;

  // Profile
  if (summary) {
    body += `{\\small \\bfseries \\uppercase{Profile}}\\\\[2pt]\n`;
    body += `{\\color{divider}\\hrule height 1pt}\\\\[6pt]\n`;
    body += `${latexEscape(summary)}\n\n`;
  }

  // Experience
  if (experience.length > 0) {
    body += `{\\small \\bfseries \\uppercase{Experience}}\\\\[2pt]\n`;
    body += `{\\color{divider}\\hrule height 1pt}\\\\[6pt]\n`;
    for (const exp of experience) {
      body += `\\noindent {\\textbf{${latexEscape(exp.role)}}} \\hfill {\\tiny ${latexDateRange(exp.startDate, exp.endDate, exp.current)}}\\\\\n`;
      body += `{\\tiny \\color{blue}${latexEscape(exp.company)}${exp.location ? `, ${latexEscape(exp.location)}` : ""}}\\\\\n`;
      if (exp.responsibilities.length > 0) {
        body += latexBulletList(exp.responsibilities) + "\n";
      }
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // Education
  if (education.length > 0) {
    body += `{\\small \\bfseries \\uppercase{Education}}\\\\[2pt]\n`;
    body += `{\\color{divider}\\hrule height 1pt}\\\\[6pt]\n`;
    for (const edu of education) {
      body += `\\noindent {\\textbf{${latexEscape(edu.institution)}}} \\hfill {\\tiny ${latexEscape(edu.startDate)} -- ${latexEscape(edu.endDate)}}\\\\\n`;
      body += `{\\tiny \\color{blue}${latexEscape(edu.degree)}${edu.field ? ` in ${latexEscape(edu.field)}` : ""}${edu.cgpa ? ` | CGPA: ${latexEscape(edu.cgpa)}` : ""}}\\\\\n`;
      body += latexVspace("4pt");
    }
    body += "\n";
  }

  // Projects + Achievements (Two-column within right column)
  if (projects.length > 0 || achievements.length > 0) {
    body += `\\begin{paracol}{2}\n`;
    body += `\\setcolumnwidth{0.5\\linewidth,}\n`;

    if (projects.length > 0) {
      body += `{\\small \\bfseries \\uppercase{Projects}}\\\\[2pt]\n`;
      body += `{\\color{divider}\\hrule height 1pt}\\\\[4pt]\n`;
      for (const proj of projects) {
        body += `\\noindent {\\textbf{${latexEscape(proj.name)}}}\\\\\n`;
        body += `{\\tiny ${latexEscape(proj.description)}}\\\\\n`;
        if (proj.technologies.length > 0) {
          body += `{\\tiny Tech: ${proj.technologies.map(latexEscape).join(", ")}}\\\\\n`;
        }
        body += latexVspace("4pt");
      }
    }

    body += `\\switchcolumn\n`;

    if (achievements.length > 0) {
      body += `{\\small \\bfseries \\uppercase{Achievements}}\\\\[2pt]\n`;
      body += `{\\color{divider}\\hrule height 1pt}\\\\[4pt]\n`;
      for (const ach of achievements) {
        body += `{\\textbf{${latexEscape(ach.title)}}}: ${latexEscape(ach.description)}\\\\\n`;
      }
    }

    body += `\\end{paracol}\n\n`;
  }

  // Custom Sections
  if (resume.customSections) {
    for (const [, cs] of Object.entries(resume.customSections)) {
      if (!cs.items.length) continue;
      body += `{\\small \\bfseries \\uppercase{${latexEscape(cs.title || "Custom Section")}}}\\\\[2pt]\n`;
      body += `{\\color{divider}\\hrule height 1pt}\\\\[4pt]\n`;
      for (const item of cs.items) {
        body += `\\noindent {\\textbf{${latexEscape(item.title)}${item.date ? ` \\hfill {\\tiny ${latexEscape(item.date)}}` : ""}}}\\\\\n`;
        if (item.subtitle) body += `{\\tiny ${latexEscape(item.subtitle)}}\\\\\n`;
        if (item.description) body += `${latexEscape(item.description)}\\\\\n`;
        body += latexVspace("4pt");
      }
      body += "\n";
    }
  }

  body += `\\end{minipage}\n`;
  body += `\\end{paracol}\n`;
  body += latexClose();
  return body;
}