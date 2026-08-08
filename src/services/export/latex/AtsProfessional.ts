import type { ResumeData } from "@/types/resume";
import {
  latexEscape,
  latexDateRange,
  latexBulletList,
  latexSection,
  latexName,
  latexContactLine,
  latexSkillLine,
  latexCertification,
  latexLanguage,
  latexAchievement,
  latexVspace,
  latexCenter,
  latexPreamble,
  latexClose,
  getAccent,
  getFontFamily,
} from "./common";

/**
 * Renders the ATS Professional template as LaTeX.
 * Features: Pure single-column, monochrome-ready, standard section headings,
 * zero icons/graphics/sidebars. Maximum parser compatibility.
 */
export function renderAtsProfessionalLatex(resume: ResumeData): string {
  const accent = getAccent(resume, "#334155");
  const fontFamily = getFontFamily(resume);
  const { personalInfo, summary, experience, education, projects, skills, certifications, achievements, languages, codingProfiles, leadership, openSource, publications, volunteer, activities, coursework, interests } = resume;

  let body = "";

  // ── Preamble ──
  body += latexPreamble(accent, fontFamily, false);

  // ── Centered Header ──
  body += latexCenter(
    latexName(personalInfo.fullName, "accent") + "\n\n" +
    latexContactLine([
      personalInfo.email,
      personalInfo.phone,
      personalInfo.linkedin,
      personalInfo.github,
    ].filter(Boolean))
  ) + "\n\n";

  body += `{\\color{heading}\\hrule height 2pt}\n\n`;

  // ── Summary ──
  if (summary) {
    body += latexSection("Summary", "heading") + "\n";
    body += latexEscape(summary) + "\n\n";
  }

  // ── Experience ──
  if (experience.length > 0) {
    body += latexSection("Experience", "heading") + "\n";
    for (const exp of experience) {
      body += `\\noindent {\\textbf{${latexEscape(exp.role)}}} \\hfill {\\small ${latexDateRange(exp.startDate, exp.endDate, exp.current)}}\\\\\n`;
      body += `${latexEscape(exp.company)}\\\\\n`;
      if (exp.responsibilities.length > 0) {
        body += latexBulletList(exp.responsibilities) + "\n";
      }
      body += latexVspace("6pt");
    }
    body += "\n";
  }

  // ── Education ──
  if (education.length > 0) {
    body += latexSection("Education", "heading") + "\n";
    for (const edu of education) {
      const parts = [];
      parts.push(`\\textbf{${latexEscape(edu.degree)}}`);
      parts.push(latexEscape(edu.institution));
      if (edu.branch) parts.push(latexEscape(edu.branch));
      if (edu.field) parts.push(latexEscape(edu.field));
      if (edu.semester) parts.push(`Sem ${latexEscape(edu.semester)}`);
      if (edu.cgpa) parts.push(`CGPA: ${latexEscape(edu.cgpa)}`);
      if (edu.classXII) parts.push(`Class XII: ${latexEscape(edu.classXII)}%`);
      if (edu.classX) parts.push(`Class X: ${latexEscape(edu.classX)}%`);
      body += parts.join(" --- ") + ` (${latexEscape(edu.endDate)})\\\\\n`;
    }
    body += "\n";
  }

  // ── Projects ──
  if (projects.length > 0) {
    body += latexSection("Projects", "heading") + "\n";
    for (const proj of projects) {
      body += `\\noindent {\\textbf{${latexEscape(proj.name)}}}\\\\\n`;
      const meta = [];
      if (proj.client) meta.push(`Client: ${latexEscape(proj.client)}`);
      if (proj.teamSize) meta.push(`Team: ${latexEscape(proj.teamSize)}`);
      if (proj.impact) meta.push(`Impact: ${latexEscape(proj.impact)}`);
      if (meta.length) body += `{\\itshape ${meta.join(" | ")}}\\\\\n`;
      body += `${latexEscape(proj.description)}\\\\\n`;
      if (proj.technologies.length > 0) {
        body += `{\\small Tech: ${proj.technologies.map(latexEscape).join(", ")}}\\\\\n`;
      }
      body += latexVspace("4pt");
    }
    body += "\n";
  }

  // ── Skills ──
  if (skills) {
    body += latexSection("Skills", "heading") + "\n";
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
    body += latexSection("Certifications", "heading") + "\n";
    for (const cert of certifications) {
      body += latexCertification(cert.name, cert.issuer) + "\\\\\n";
    }
    body += "\n";
  }

  // ── Achievements ──
  if (achievements.length > 0) {
    body += latexSection("Achievements", "heading") + "\n";
    for (const ach of achievements) {
      body += latexAchievement(ach.title, ach.description) + "\\\\\n";
    }
    body += "\n";
  }

  // ── Languages ──
  if (languages.length > 0) {
    body += latexSection("Languages", "heading") + "\n";
    body += languages.map((l) => latexLanguage(l.name, l.proficiency)).join(", ") + "\n\n";
  }

  // ── Coding Profiles ──
  if (codingProfiles.length > 0) {
    body += latexSection("Coding Profiles", "heading") + "\n";
    body += codingProfiles.map((cp) => `${latexEscape(cp.platform)}: ${latexEscape(cp.handle)}`).join(" | ") + "\n\n";
  }

  // ── Leadership ──
  if (leadership.length > 0) {
    body += latexSection("Leadership", "heading") + "\n";
    for (const item of leadership) {
      body += `\\noindent {\\textbf{${latexEscape(item.title)} at ${latexEscape(item.organization)}}} \\hfill {\\small ${latexEscape(item.startDate)} -- ${latexEscape(item.endDate)}}\\\\\n`;
      body += `${latexEscape(item.description)}\\\\\n`;
      body += latexVspace("4pt");
    }
    body += "\n";
  }

  // ── Open Source ──
  if (openSource.length > 0) {
    body += latexSection("Open Source", "heading") + "\n";
    for (const item of openSource) {
      body += `\\noindent {\\textbf{${latexEscape(item.projectName)} --- ${latexEscape(item.role)}}}\\\\\n`;
      body += `${latexEscape(item.description)}\\\\\n`;
      body += latexVspace("4pt");
    }
    body += "\n";
  }

  // ── Publications ──
  if (publications.length > 0) {
    body += latexSection("Publications", "heading") + "\n";
    for (const item of publications) {
      body += `\\noindent {\\textbf{${latexEscape(item.title)}}}\\\\\n`;
      body += `${latexEscape(item.publisher)} | ${latexEscape(item.date)}\\\\\n`;
      body += latexVspace("4pt");
    }
    body += "\n";
  }

  // ── Volunteer ──
  if (volunteer.length > 0) {
    body += latexSection("Volunteer Experience", "heading") + "\n";
    for (const item of volunteer) {
      body += `\\noindent {\\textbf{${latexEscape(item.role)} at ${latexEscape(item.organization)}}} \\hfill {\\small ${latexEscape(item.startDate)} -- ${latexEscape(item.endDate)}}\\\\\n`;
      body += `${latexEscape(item.description)}\\\\\n`;
      body += latexVspace("4pt");
    }
    body += "\n";
  }

  // ── Activities ──
  if (activities.length > 0) {
    body += latexSection("Extra Curricular Activities", "heading") + "\n";
    for (const item of activities) {
      body += `\\noindent {\\textbf{${latexEscape(item.title)}}} \\hfill {\\small ${latexEscape(item.date)}}\\\\\n`;
      body += `${latexEscape(item.description)}\\\\\n`;
      body += latexVspace("4pt");
    }
    body += "\n";
  }

  // ── Coursework ──
  if (coursework.length > 0) {
    body += latexSection("Relevant Coursework", "heading") + "\n";
    body += coursework.map(latexEscape).join(", ") + "\n\n";
  }

  // ── Interests ──
  if (interests.length > 0) {
    body += latexSection("Interests", "heading") + "\n";
    body += interests.map(latexEscape).join(", ") + "\n\n";
  }

  // ── Custom Sections (K-04) ──
  if (resume.customSections) {
    for (const [id, cs] of Object.entries(resume.customSections)) {
      if (!cs.items.length) continue;
      body += latexSection(cs.title || "Custom Section", "heading") + "\n";
      for (const item of cs.items) {
        body += `\\noindent {\\textbf{${latexEscape(item.title)}${item.date ? ` \\hfill {\\small ${latexEscape(item.date)}}` : ""}}}\\\\\n`;
        if (item.subtitle) body += `${latexEscape(item.subtitle)}\\\\\n`;
        if (item.description) body += `${latexEscape(item.description)}\\\\\n`;
        body += latexVspace("4pt");
      }
      body += "\n";
    }
  }

  body += latexClose();
  return body;
}