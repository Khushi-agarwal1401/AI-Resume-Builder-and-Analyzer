import type { ResumeData } from "@/types/resume";
import {
  latexEscape,
  latexDateRange,
  latexBulletList,
  latexSection,
  latexName,
  latexSkillLine,
  latexVspace,
  latexPreamble,
  latexClose,
  getAccent,
  getFontFamily,
} from "./common";

/**
 * Renders the Deedy template as LaTeX.
 * Faithful to the Deedy two-column design: a full-width name masthead, then a
 * narrow left rail (education, coursework, skills, languages) beside a main
 * column with experience, projects, publications, and awards.
 */
export function renderDeedyLatex(resume: ResumeData): string {
  const accent = getAccent(resume, "#b91c1c");
  const fontFamily = getFontFamily(resume);
  const { personalInfo, summary, education, experience, projects, skills, certifications, achievements, publications, languages, coursework, openSource } = resume;

  let body = "";

  body += latexPreamble(accent, fontFamily, true);

  // ── Masthead ──
  body += latexName(personalInfo.fullName, "accent") + "\\\\\n";
  const contact = [personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean);
  body += `{\\small \\color{muted}${contact.map(latexEscape).join(" | ")}}\\\\\n`;
  body += `{\\color{accent}\\rule{\\linewidth}{1.5pt}}\n\n`;

  // ── Summary (full width) ──
  if (summary) {
    body += latexSection("Profile", "accent") + "\n";
    body += latexEscape(summary) + "\n\n";
  }

  // ── Two columns: left rail + main ──
  let rail = "";
  let main = "";

  // Left rail: education / coursework / skills / languages
  if (education.length > 0) {
    rail += latexSection("Education", "accent") + "\n";
    for (const edu of education) {
      rail += `\\noindent {\\bfseries ${latexEscape(edu.institution)}}\\\\\n`;
      rail += `{\\small ${latexEscape(edu.degree)}${edu.field ? ` in ${latexEscape(edu.field)}` : ""}}\\\\\n`;
      rail += `{\\small \\color{muted}${latexEscape(edu.startDate)} -- ${latexEscape(edu.endDate)}}\\\\\n`;
      if (edu.cgpa) rail += `{\\small \\color{muted}GPA: ${latexEscape(edu.cgpa)}}\\\\\n`;
      rail += latexVspace("6pt");
    }
    rail += "\n";
  }

  if (coursework.length > 0) {
    rail += latexSection("Coursework", "accent") + "\n";
    for (const c of coursework) {
      rail += `\\noindent {\\small ${latexEscape(c)}}\\\\\n`;
    }
    rail += "\n";
  }

  if (skills) {
    rail += latexSection("Skills", "accent") + "\n";
    const skillGroups = [
      { label: "Programming", items: skills.technical },
      { label: "Frameworks", items: skills.frameworks },
      { label: "Tools", items: skills.tools },
    ].filter((g) => g.items.length > 0);
    for (const group of skillGroups) {
      rail += latexSkillLine(group.label, group.items) + "\\\\\n";
    }
    rail += "\n";
  }

  if (languages.length > 0) {
    rail += latexSection("Languages", "accent") + "\n";
    for (const l of languages) {
      rail += `\\noindent {\\small ${latexEscape(l.name)} (${latexEscape(l.proficiency)})}\\\\\n`;
    }
    rail += "\n";
  }

  // Main column: experience / projects / publications / awards / certifications
  if (experience.length > 0) {
    main += latexSection("Experience", "accent") + "\n";
    for (const exp of experience) {
      main += `\\noindent {\\bfseries ${latexEscape(exp.role)}} \\hfill {\\small \\color{muted}${latexDateRange(exp.startDate, exp.endDate, exp.current)}}\\\\\n`;
      main += `{\\small \\color{accent}${latexEscape(exp.company)}${exp.location ? `, ${latexEscape(exp.location)}` : ""}}\\\\\n`;
      if (exp.responsibilities.length > 0) {
        main += latexBulletList(exp.responsibilities) + "\n";
      }
      main += latexVspace("6pt");
    }
    main += "\n";
  }

  if (projects.length > 0) {
    main += latexSection("Projects", "accent") + "\n";
    for (const proj of projects) {
      main += `\\noindent {\\bfseries ${latexEscape(proj.name)}} \\hfill {\\small \\color{muted}${latexEscape(proj.impact || "")}}\\\\\n`;
      main += `${latexEscape(proj.description)}\\\\\n`;
      if (proj.technologies.length > 0) {
        main += `{\\small \\color{muted}${latexEscape(proj.technologies.join(" \\textbullet\\ "))}}\\\\\n`;
      }
      main += latexVspace("4pt");
    }
    main += "\n";
  }

  if (publications.length > 0) {
    main += latexSection("Publications", "accent") + "\n";
    for (const pub of publications) {
      main += `\\noindent {\\bfseries ${latexEscape(pub.title)}}${pub.publisher ? ` --- ${latexEscape(pub.publisher)}` : ""}${pub.date ? ` (${latexEscape(pub.date)})` : ""}\\\\\n`;
    }
    main += "\n";
  }

  if (achievements.length > 0) {
    main += latexSection("Awards", "accent") + "\n";
    for (const ach of achievements) {
      main += `\\noindent {\\bfseries ${latexEscape(ach.title)}}${ach.description ? ` --- ${latexEscape(ach.description)}` : ""}\\\\\n`;
    }
    main += "\n";
  }

  if (openSource.length > 0) {
    main += latexSection("Open Source", "accent") + "\n";
    for (const os of openSource) {
      main += `\\noindent {\\bfseries ${latexEscape(os.projectName)}}${os.role ? ` --- ${latexEscape(os.role)}` : ""}\\\\\n`;
      if (os.description) main += `{\\small ${latexEscape(os.description)}}\\\\\n`;
    }
    main += "\n";
  }

  if (certifications.length > 0) {
    main += latexSection("Certifications", "accent") + "\n";
    for (const cert of certifications) {
      main += `\\noindent {\\small ${latexEscape(cert.name)}}\\\\\n`;
    }
    main += "\n";
  }

  // ── Custom Sections (K-04) → main column ──
  if (resume.customSections) {
    for (const [, cs] of Object.entries(resume.customSections)) {
      if (!cs.items.length) continue;
      main += latexSection(cs.title || "Custom Section", "accent") + "\n";
      for (const item of cs.items) {
        main += `\\noindent {\\textbf{${latexEscape(item.title)}${item.date ? ` \\hfill {\\small \\color{muted}${latexEscape(item.date)}}` : ""}}}\\\\\n`;
        if (item.subtitle) main += `{\\small \\color{muted}${latexEscape(item.subtitle)}}\\\\\n`;
        if (item.description) main += `${latexEscape(item.description)}\\\\\n`;
        main += latexVspace("4pt");
      }
      main += "\n";
    }
  }

  body += `\\begin{paracol}{2}\n`;
  body += `\\setcolumnwidth{0.34\\linewidth,0.62\\linewidth}\n`;
  body += rail;
  body += `\\switchcolumn\n`;
  body += main;
  body += `\\end{paracol}\n\n`;

  body += latexClose();
  return body;
}
