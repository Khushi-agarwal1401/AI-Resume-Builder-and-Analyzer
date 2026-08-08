import type { ResumeData } from "@/types/resume";
import {
  latexEscape,
  latexDateRange,
  latexContactLine,
  latexVspace,
  latexCenter,
  latexPreamble,
  latexClose,
  getAccent,
  getFontFamily,
} from "./common";

/**
 * Renders the Minimal template as LaTeX.
 * Features: Monochrome, centered name under double hairline,
 * small-caps section titles with hairline rules, sparse label-value rhythm.
 */
export function renderMinimalLatex(resume: ResumeData): string {
  const accent = getAccent(resume, "#111827");
  const fontFamily = getFontFamily(resume);
  const { personalInfo, summary, experience, education, projects, skills, certifications, achievements, languages } = resume;

  let body = "";

  // ── Preamble ──
  body += latexPreamble(accent, fontFamily, false);

  // ── Monochrome Centered Masthead ──
  body += latexCenter(
    `{\\LARGE \\textsc{${latexEscape(personalInfo.fullName.toUpperCase())}}}\\\\[8pt]\n` +
    `{\\color{divider}\\rule{6cm}{0.5pt}}\\\\[4pt]\n` +
    `{\\color{divider}\\rule{2.5cm}{0.5pt}}\\\\[8pt]\n` +
    `{\\small \\textsc{${latexContactLine([personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean)).replace(/ \\\\quad\\\\|\\\\quad /g, " $ \\cdot $ ")}}}\n`
  ) + "\n\n";

  // ── Profile/Summary ──
  if (summary) {
    body += `{\\small \\textsc{Profile}}\\\\[2pt]\n`;
    body += `{\\color{divider}\\hrule height 0.25pt}\\\\[6pt]\n`;
    body += latexEscape(summary) + "\n\n";
  }

  // ── Experience ──
  if (experience.length > 0) {
    body += `{\\small \\textsc{Experience}}\\\\[2pt]\n`;
    body += `{\\color{divider}\\hrule height 0.25pt}\\\\[8pt]\n`;
    for (const exp of experience) {
      body += `\\noindent {\\textbf{${latexEscape(exp.role)}}} \\hfill {\\small \\textsc{${latexDateRange(exp.startDate, exp.endDate, exp.current).toUpperCase()}}}\\\\\n`;
      body += `{\\small \\textsc{${latexEscape(exp.company)}}}\\\\\n`;
      if (exp.responsibilities.length > 0) {
        for (const r of exp.responsibilities) {
          body += `\\noindent \\hangindent=1em \\hangafter=1 ${latexEscape(r)}\\\\\n`;
        }
      }
      body += latexVspace("8pt");
    }
    body += "\n";
  }

  // ── Education ──
  if (education.length > 0) {
    body += `{\\small \\textsc{Education}}\\\\[2pt]\n`;
    body += `{\\color{divider}\\hrule height 0.25pt}\\\\[8pt]\n`;
    for (const edu of education) {
      body += `\\noindent {\\textbf{${latexEscape(edu.institution)}}} \\hfill {\\small \\textsc{${latexEscape(edu.endDate).toUpperCase()}}}\\\\\n`;
      body += `{\\small ${latexEscape(edu.degree)}${edu.field ? ` in ${latexEscape(edu.field)}` : ""}${edu.cgpa ? ` $ \\cdot $ CGPA ${latexEscape(edu.cgpa)}` : ""}}\\\\\n`;
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // ── Projects ──
  if (projects.length > 0) {
    body += `{\\small \\textsc{Selected Projects}}\\\\[2pt]\n`;
    body += `{\\color{divider}\\hrule height 0.25pt}\\\\[8pt]\n`;
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

  // ── Skills ──
  if (skills) {
    body += `{\\small \\textsc{Skills}}\\\\[2pt]\n`;
    body += `{\\color{divider}\\hrule height 0.25pt}\\\\[6pt]\n`;
    const allSkills = [
      ...skills.technical,
      ...skills.frameworks,
      ...skills.tools,
      ...skills.soft,
    ].filter(Boolean);
    if (allSkills.length > 0) {
      body += allSkills.map(latexEscape).join("  /  ") + "\n\n";
    }
  }

  // ── Certifications ──
  if (certifications.length > 0) {
    body += `{\\small \\textsc{Certifications}}\\\\[2pt]\n`;
    body += `{\\color{divider}\\hrule height 0.25pt}\\\\[6pt]\n`;
    for (const c of certifications) {
      body += `\\noindent ${latexEscape(c.name)} --- ${latexEscape(c.issuer)}\\\\\n`;
    }
    body += "\n";
  }

  // ── Achievements ──
  if (achievements.length > 0) {
    body += `{\\small \\textsc{Honors}}\\\\[2pt]\n`;
    body += `{\\color{divider}\\hrule height 0.25pt}\\\\[6pt]\n`;
    for (const a of achievements) {
      body += `\\noindent {\\textbf{${latexEscape(a.title)}${a.description ? ` --- ${latexEscape(a.description)}` : ""}}}\\\\\n`;
    }
    body += "\n";
  }

  // ── Languages ──
  if (languages.length > 0) {
    body += `{\\small \\textsc{Languages}}\\\\[2pt]\n`;
    body += `{\\color{divider}\\hrule height 0.25pt}\\\\[6pt]\n`;
    body += languages.map((l) => `${latexEscape(l.name)} (${latexEscape(l.proficiency)})`).join(" $ \\cdot $ ") + "\n\n";
  }

  // ── Custom Sections (K-04) ──
  if (resume.customSections) {
    for (const [, cs] of Object.entries(resume.customSections)) {
      if (!cs.items.length) continue;
      const title = (cs.title || "Custom Section").toUpperCase();
      body += `{\\small \\textsc{${latexEscape(title)}}}\\\\[2pt]\n`;
      body += `{\\color{divider}\\hrule height 0.25pt}\\\\[6pt]\n`;
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