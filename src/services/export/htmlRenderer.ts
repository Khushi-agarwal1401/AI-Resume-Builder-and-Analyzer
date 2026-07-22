import type { ResumeData } from "@/types/resume";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderModern(resume: ResumeData): string {
  const { personalInfo, summary, education, experience, projects, skills, certifications, achievements, languages } = resume;

  return `
    <div class="template-modern">
      <div class="header">
        <h1>${escapeHtml(personalInfo.fullName)}</h1>
        <div class="contact-line">
          ${escapeHtml(personalInfo.email)}${personalInfo.phone ? ` | ${escapeHtml(personalInfo.phone)}` : ""}
        </div>
        <div class="contact-links">
          ${personalInfo.linkedin ? escapeHtml(personalInfo.linkedin) + " " : ""}
          ${personalInfo.github ? `| ${escapeHtml(personalInfo.github)} ` : ""}
          ${personalInfo.portfolio ? `| ${escapeHtml(personalInfo.portfolio)}` : ""}
        </div>
      </div>

      ${summary ? `
        <div class="section">
          <h2>Professional Summary</h2>
          <p>${escapeHtml(summary)}</p>
        </div>
      ` : ""}

      ${experience.length > 0 ? `
        <div class="section">
          <h2>Experience</h2>
          ${experience.map((exp) => `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${escapeHtml(exp.role)}</span>
                <span class="entry-date">${escapeHtml(exp.startDate)} - ${exp.current ? "Present" : escapeHtml(exp.endDate)}</span>
              </div>
              <div class="entry-subtitle">${escapeHtml(exp.company)}${exp.location ? `, ${escapeHtml(exp.location)}` : ""}</div>
              ${exp.responsibilities.length > 0 ? `
                <ul>
                  ${exp.responsibilities.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
                </ul>
              ` : ""}
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${education.length > 0 ? `
        <div class="section">
          <h2>Education</h2>
          ${education.map((edu) => `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${escapeHtml(edu.institution)}</span>
                <span class="entry-date">${escapeHtml(edu.startDate)} - ${escapeHtml(edu.endDate)}</span>
              </div>
              <div class="entry-subtitle">${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ""}${edu.cgpa ? ` | CGPA: ${escapeHtml(edu.cgpa)}` : ""}</div>
            </div>
          `).join("")}
        </div>
      ` : ""}

      <div class="section-grid">
        ${skills ? `
          <div class="section">
            <h2>Skills</h2>
            ${skills.technical.length > 0 ? `<div class="skill-group"><strong>Technical:</strong> ${escapeHtml(skills.technical.join(", "))}</div>` : ""}
            ${skills.frameworks.length > 0 ? `<div class="skill-group"><strong>Frameworks:</strong> ${escapeHtml(skills.frameworks.join(", "))}</div>` : ""}
            ${skills.tools.length > 0 ? `<div class="skill-group"><strong>Tools:</strong> ${escapeHtml(skills.tools.join(", "))}</div>` : ""}
          </div>
        ` : ""}
        ${languages.length > 0 ? `
          <div class="section">
            <h2>Languages</h2>
            ${languages.map((lang) => `<div>${escapeHtml(lang.name)} - ${lang.proficiency}</div>`).join("")}
          </div>
        ` : ""}
      </div>

      ${projects.length > 0 ? `
        <div class="section">
          <h2>Projects</h2>
          ${projects.map((proj) => `
            <div class="entry">
              <div class="entry-title">${escapeHtml(proj.name)}</div>
              <p>${escapeHtml(proj.description)}</p>
              ${proj.technologies.length > 0 ? `<div class="tech-list">${escapeHtml(proj.technologies.join(", "))}</div>` : ""}
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${certifications.length > 0 ? `
        <div class="section">
          <h2>Certifications</h2>
          ${certifications.map((cert) => `
            <div>${escapeHtml(cert.name)}${cert.issuer ? ` - ${escapeHtml(cert.issuer)}` : ""}${cert.date ? ` (${escapeHtml(cert.date)})` : ""}</div>
          `).join("")}
        </div>
      ` : ""}

      ${achievements.length > 0 ? `
        <div class="section">
          <h2>Achievements</h2>
          ${achievements.map((ach) => `
            <div class="entry">
              <div class="entry-title">${escapeHtml(ach.title)}</div>
              <p>${escapeHtml(ach.description)}</p>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

function renderAtsProfessional(resume: ResumeData): string {
  const { personalInfo, summary, experience, education, skills, certifications } = resume;

  return `
    <div class="template-ats">
      <div class="ats-header">
        <h1>${escapeHtml(personalInfo.fullName)}</h1>
        <div class="contact-line">
          ${escapeHtml(personalInfo.email)} | ${escapeHtml(personalInfo.phone)} | ${escapeHtml(personalInfo.linkedin)} | ${escapeHtml(personalInfo.github)}
        </div>
      </div>

      ${summary ? `
        <div class="section">
          <h2 class="bg-header">Summary</h2>
          <p>${escapeHtml(summary)}</p>
        </div>
      ` : ""}

      ${experience.length > 0 ? `
        <div class="section">
          <h2 class="bg-header">Experience</h2>
          ${experience.map((exp) => `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${escapeHtml(exp.role)}</span>
                <span class="entry-date">${escapeHtml(exp.startDate)} - ${exp.current ? "Present" : escapeHtml(exp.endDate)}</span>
              </div>
              <div class="entry-subtitle">${escapeHtml(exp.company)}</div>
              ${exp.responsibilities.length > 0 ? `
                <ul>
                  ${exp.responsibilities.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
                </ul>
              ` : ""}
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${education.length > 0 ? `
        <div class="section">
          <h2 class="bg-header">Education</h2>
          ${education.map((edu) => `
            <div class="entry">
              <strong>${escapeHtml(edu.degree)}</strong> - ${escapeHtml(edu.institution)}${edu.cgpa ? `, CGPA: ${escapeHtml(edu.cgpa)}` : ""} (${escapeHtml(edu.endDate)})
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${skills ? `
        <div class="section">
          <h2 class="bg-header">Skills</h2>
          ${skills.technical.length > 0 ? `<div><strong>Technical:</strong> ${escapeHtml(skills.technical.join(", "))}</div>` : ""}
          ${skills.frameworks.length > 0 ? `<div><strong>Frameworks:</strong> ${escapeHtml(skills.frameworks.join(", "))}</div>` : ""}
        </div>
      ` : ""}

      ${certifications.length > 0 ? `
        <div class="section">
          <h2 class="bg-header">Certifications</h2>
          ${certifications.map((cert) => `
            <div>${escapeHtml(cert.name)} - ${escapeHtml(cert.issuer)}</div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

function renderStudent(resume: ResumeData): string {
  const { personalInfo, summary, education, projects, skills, certifications, achievements, languages } = resume;

  return `
    <div class="template-student">
      <div class="header">
        <h1>${escapeHtml(personalInfo.fullName)}</h1>
        <div class="contact-line">${escapeHtml(personalInfo.email)} | ${escapeHtml(personalInfo.phone)}</div>
        <div class="contact-links">${escapeHtml(personalInfo.linkedin)}${personalInfo.github ? ` | ${escapeHtml(personalInfo.github)}` : ""}</div>
      </div>

      ${summary ? `
        <div class="section">
          <h2 class="uppercase">Summary</h2>
          <p>${escapeHtml(summary)}</p>
        </div>
      ` : ""}

      ${education.length > 0 ? `
        <div class="section">
          <h2 class="uppercase">Education</h2>
          ${education.map((edu) => `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${escapeHtml(edu.institution)}</span>
                <span class="entry-date">${escapeHtml(edu.endDate)}</span>
              </div>
              <div class="entry-subtitle">${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ""}${edu.cgpa ? ` - CGPA: ${escapeHtml(edu.cgpa)}` : ""}</div>
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${projects.length > 0 ? `
        <div class="section">
          <h2 class="uppercase">Projects</h2>
          ${projects.map((proj) => `
            <div class="entry">
              <div class="entry-title">${escapeHtml(proj.name)}</div>
              <p>${escapeHtml(proj.description)}</p>
              ${proj.technologies.length > 0 ? `<div class="tech-list">${escapeHtml(proj.technologies.join(", "))}</div>` : ""}
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${skills ? `
        <div class="section">
          <h2 class="uppercase">Skills</h2>
          ${skills.technical.length > 0 ? `<div><strong>Technical:</strong> ${escapeHtml(skills.technical.join(", "))}</div>` : ""}
          ${skills.tools.length > 0 ? `<div><strong>Tools:</strong> ${escapeHtml(skills.tools.join(", "))}</div>` : ""}
        </div>
      ` : ""}

      ${certifications.length > 0 ? `
        <div class="section">
          <h2 class="uppercase">Certifications</h2>
          ${certifications.map((cert) => `
            <div>${escapeHtml(cert.name)} - ${escapeHtml(cert.issuer)}</div>
          `).join("")}
        </div>
      ` : ""}

      ${achievements.length > 0 ? `
        <div class="section">
          <h2 class="uppercase">Achievements</h2>
          ${achievements.map((ach) => `
            <div class="entry">
              <div class="entry-title">${escapeHtml(ach.title)}</div>
              <p>${escapeHtml(ach.description)}</p>
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${languages.length > 0 ? `
        <div class="section">
          <h2 class="uppercase">Languages</h2>
          <div>${languages.map((l) => `${escapeHtml(l.name)} (${l.proficiency})`).join(", ")}</div>
        </div>
      ` : ""}
    </div>
  `;
}

function renderMinimal(resume: ResumeData): string {
  const { personalInfo, summary, experience, education, skills } = resume;

  return `
    <div class="template-minimal">
      <div class="minimal-header">
        <h1>${escapeHtml(personalInfo.fullName)}</h1>
        <div class="contact-line">${escapeHtml(personalInfo.email)}${personalInfo.phone ? ` / ${escapeHtml(personalInfo.phone)}` : ""}</div>
      </div>

      ${summary ? `
        <div class="section">
          <p>${escapeHtml(summary)}</p>
        </div>
      ` : ""}

      ${experience.length > 0 ? `
        <div class="section">
          <h2 class="section-label">Experience</h2>
          ${experience.map((exp) => `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${escapeHtml(exp.role)}</span>
                <span class="entry-date">${escapeHtml(exp.startDate)} - ${exp.current ? "Present" : escapeHtml(exp.endDate)}</span>
              </div>
              <div class="entry-subtitle">${escapeHtml(exp.company)}</div>
              ${exp.responsibilities.length > 0 ? `
                <div class="responsibilities">
                  ${exp.responsibilities.map((r) => `<div class="resp-item">${escapeHtml(r)}</div>`).join("")}
                </div>
              ` : ""}
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${education.length > 0 ? `
        <div class="section">
          <h2 class="section-label">Education</h2>
          ${education.map((edu) => `
            <div class="entry">
              <div class="entry-title">${escapeHtml(edu.institution)}</div>
              <div class="entry-subtitle">${escapeHtml(edu.degree)}${edu.cgpa ? `, CGPA: ${escapeHtml(edu.cgpa)}` : ""}</div>
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${skills ? `
        <div class="section">
          <h2 class="section-label">Skills</h2>
          <div class="skills-inline">
            ${escapeHtml([...skills.technical, ...skills.frameworks, ...skills.tools, ...skills.soft].join(" · "))}
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

const STYLES = `
  @page {
    margin: 0.75in 0.75in;
    size: letter;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #000;
    margin: 0;
    padding: 0;
  }

  /* ---- Modern Template ---- */
  .template-modern .header { text-align: center; margin-bottom: 20px; }
  .template-modern h1 { font-size: 22pt; font-weight: 700; margin: 0 0 4px 0; }
  .template-modern .contact-line { color: #555; font-size: 10pt; }
  .template-modern .contact-links { color: #777; font-size: 9pt; }
  .template-modern h2 { font-size: 11pt; font-weight: 700; border-bottom: 1px solid #000; padding-bottom: 3px; margin: 0 0 8px 0; }
  .template-modern .section { margin-bottom: 18px; }
  .template-modern .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
  .template-modern .entry { margin-bottom: 10px; }
  .template-modern .entry-header { display: flex; justify-content: space-between; }
  .template-modern .entry-title { font-weight: 600; }
  .template-modern .entry-date { color: #777; font-size: 9pt; }
  .template-modern .entry-subtitle { color: #555; font-size: 9pt; }
  .template-modern ul { margin: 4px 0 0 0; padding-left: 18px; }
  .template-modern li { margin-bottom: 2px; }
  .template-modern p { margin: 4px 0; color: #444; }
  .template-modern .tech-list { color: #888; font-size: 9pt; margin-top: 3px; }
  .template-modern .skill-group { margin-bottom: 4px; font-size: 10pt; }

  /* ---- ATS Professional Template ---- */
  .template-ats .ats-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 16px; }
  .template-ats .ats-header h1 { font-size: 20pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0; }
  .template-ats .ats-header .contact-line { color: #555; font-size: 9pt; }
  .template-ats h2.bg-header { font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; background: #f0f0f0; padding: 4px 8px; margin: 0 0 8px 0; }
  .template-ats .section { margin-bottom: 14px; }
  .template-ats .entry { margin-bottom: 10px; }
  .template-ats .entry-header { display: flex; justify-content: space-between; font-weight: 600; }
  .template-ats .entry-date { color: #777; font-size: 9pt; font-weight: 400; }
  .template-ats .entry-subtitle { color: #555; font-size: 9pt; }
  .template-ats ul { margin: 4px 0 0 0; padding-left: 18px; font-size: 9pt; }
  .template-ats li { margin-bottom: 2px; }
  .template-ats p { margin: 4px 0; }
  .template-ats div { font-size: 10pt; }

  /* ---- Student Template ---- */
  .template-student .header { text-align: center; margin-bottom: 18px; }
  .template-student h1 { font-size: 20pt; font-weight: 700; margin: 0 0 4px 0; }
  .template-student .contact-line { color: #555; font-size: 9pt; }
  .template-student .contact-links { color: #777; font-size: 9pt; }
  .template-student h2.uppercase { font-size: 10pt; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3px; margin: 0 0 8px 0; }
  .template-student .section { margin-bottom: 16px; }
  .template-student .entry { margin-bottom: 8px; }
  .template-student .entry-header { display: flex; justify-content: space-between; }
  .template-student .entry-title { font-weight: 600; }
  .template-student .entry-date { color: #777; font-size: 9pt; }
  .template-student .entry-subtitle { color: #555; font-size: 9pt; }
  .template-student p { margin: 4px 0; color: #444; font-size: 10pt; }
  .template-student .tech-list { color: #888; font-size: 9pt; margin-top: 2px; }
  .template-student div { font-size: 10pt; }

  /* ---- Minimal Template ---- */
  .template-minimal .minimal-header { margin-bottom: 20px; }
  .template-minimal .minimal-header h1 { font-size: 24pt; font-weight: 300; margin: 0 0 4px 0; }
  .template-minimal .minimal-header .contact-line { color: #888; font-size: 9pt; }
  .template-minimal .section { margin-bottom: 20px; }
  .template-minimal h2.section-label { font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #888; margin: 0 0 10px 0; }
  .template-minimal .entry { margin-bottom: 14px; }
  .template-minimal .entry-header { display: flex; justify-content: space-between; }
  .template-minimal .entry-title { font-weight: 600; }
  .template-minimal .entry-date { color: #999; font-size: 9pt; }
  .template-minimal .entry-subtitle { color: #777; font-size: 9pt; }
  .template-minimal .responsibilities { margin-top: 4px; }
  .template-minimal .resp-item { font-size: 9pt; color: #555; margin-bottom: 2px; }
  .template-minimal .skills-inline { color: #555; font-size: 9pt; }
  .template-minimal p { margin: 4px 0; color: #555; }

  /* ---- Print Utilities ---- */
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export function renderResumeToHtml(resume: ResumeData): string {
  let bodyHtml = "";

  switch (resume.template) {
    case "ats-professional":
      bodyHtml = renderAtsProfessional(resume);
      break;
    case "student":
      bodyHtml = renderStudent(resume);
      break;
    case "minimal":
      bodyHtml = renderMinimal(resume);
      break;
    case "modern":
    default:
      bodyHtml = renderModern(resume);
      break;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(resume.title)} - ${escapeHtml(resume.personalInfo.fullName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${STYLES}</style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}
