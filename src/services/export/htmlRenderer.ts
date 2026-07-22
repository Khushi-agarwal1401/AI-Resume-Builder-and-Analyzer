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

function renderExecutive(resume: ResumeData): string {
  const { personalInfo, summary, experience, education, skills, certifications, languages, achievements, projects } = resume;

  return `
    <div class="template-executive">
      <div class="exec-header">
        <h1>${escapeHtml(personalInfo.fullName)}</h1>
        <div class="contact-line">
          ${escapeHtml(personalInfo.email)}${personalInfo.phone ? ` • ${escapeHtml(personalInfo.phone)}` : ""}
        </div>
        <div class="contact-line" style="font-size: 8pt; margin-top: 4px;">
          ${personalInfo.linkedin ? escapeHtml(personalInfo.linkedin) + " " : ""}
          ${personalInfo.github ? `• ${escapeHtml(personalInfo.github)} ` : ""}
          ${personalInfo.portfolio ? `• ${escapeHtml(personalInfo.portfolio)}` : ""}
        </div>
      </div>

      ${summary ? `
        <div class="section">
          <h2 class="exec-section-title">Executive Summary</h2>
          <p>${escapeHtml(summary)}</p>
        </div>
      ` : ""}

      ${experience.length > 0 ? `
        <div class="section">
          <h2 class="exec-section-title">Professional Experience</h2>
          ${experience.map((exp) => `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${escapeHtml(exp.role)}</span>
                <span class="entry-date">${escapeHtml(exp.startDate)} – ${exp.current ? "Present" : escapeHtml(exp.endDate)}</span>
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
          <h2 class="exec-section-title">Education</h2>
          ${education.map((edu) => `
            <div class="entry" style="margin-bottom: 8px;">
              <div class="entry-header">
                <span class="entry-title">${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ""}</span>
                <span class="entry-date">${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}</span>
              </div>
              <div class="entry-subtitle" style="margin-bottom: 0;">${escapeHtml(edu.institution)}</div>
              ${edu.cgpa ? `<div style="color: #64748b; font-size: 10pt; margin-top: 2px;">CGPA: ${escapeHtml(edu.cgpa)}</div>` : ""}
            </div>
          `).join("")}
        </div>
      ` : ""}

      <div class="grid-2">
        ${skills ? `
          <div>
            <h2 class="exec-section-title">Core Competencies</h2>
            <div class="skills-list">
              ${skills.technical.length > 0 ? `<div style="margin-bottom: 8px;"><span style="font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Technical:</span> ${escapeHtml(skills.technical.join(", "))}</div>` : ""}
              ${skills.frameworks.length > 0 ? `<div style="margin-bottom: 8px;"><span style="font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Frameworks:</span> ${escapeHtml(skills.frameworks.join(", "))}</div>` : ""}
              ${skills.tools.length > 0 ? `<div style="margin-bottom: 8px;"><span style="font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Tools:</span> ${escapeHtml(skills.tools.join(", "))}</div>` : ""}
            </div>
          </div>
        ` : ""}
        
        ${certifications.length > 0 || languages.length > 0 ? `
          <div>
            <h2 class="exec-section-title">Additional Value</h2>
            ${certifications.length > 0 ? `
              <div style="margin-bottom: 12px;">
                <div style="font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Certifications</div>
                ${certifications.map((c) => `<div style="color: #334155;">${escapeHtml(c.name)}${c.issuer ? ` — ${escapeHtml(c.issuer)}` : ""}</div>`).join("")}
              </div>
            ` : ""}
            ${languages.length > 0 ? `
              <div style="margin-bottom: 12px;">
                <div style="font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Languages</div>
                ${languages.map((l) => `<div style="color: #334155;">${escapeHtml(l.name)} <span style="color: #64748b;">— ${l.proficiency}</span></div>`).join("")}
              </div>
            ` : ""}
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

function renderCreative(resume: ResumeData): string {
  const { personalInfo, summary, experience, education, skills, projects, languages } = resume;

  return `
    <div class="template-creative">
      <div class="sidebar">
        <h1>${escapeHtml(personalInfo.fullName)}</h1>
        <div class="divider"></div>
        
        <div class="contact-info">
          ${personalInfo.email ? `<div>${escapeHtml(personalInfo.email)}</div>` : ""}
          ${personalInfo.phone ? `<div>${escapeHtml(personalInfo.phone)}</div>` : ""}
          ${personalInfo.linkedin ? `<div>${escapeHtml(personalInfo.linkedin)}</div>` : ""}
          ${personalInfo.github ? `<div>${escapeHtml(personalInfo.github)}</div>` : ""}
        </div>

        ${skills ? `
          <h2 class="sidebar-title">Skills</h2>
          ${skills.technical.length > 0 ? `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 8pt; font-weight: 700; color: #831843; opacity: 0.8; margin-bottom: 4px;">TECHNICAL</div>
              <div>${skills.technical.map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`).join("")}</div>
            </div>
          ` : ""}
          ${skills.frameworks.length > 0 ? `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 8pt; font-weight: 700; color: #831843; opacity: 0.8; margin-bottom: 4px;">FRAMEWORKS</div>
              <div>${skills.frameworks.map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`).join("")}</div>
            </div>
          ` : ""}
        ` : ""}

        ${languages.length > 0 ? `
          <h2 class="sidebar-title">Languages</h2>
          ${languages.map((l) => `
            <div style="font-size: 10pt; font-weight: 500; color: #831843; opacity: 0.8; margin-bottom: 4px; display: flex; justify-content: space-between;">
              <span>${escapeHtml(l.name)}</span>
              <span style="opacity: 0.7; font-size: 8pt;">${escapeHtml(l.proficiency)}</span>
            </div>
          `).join("")}
        ` : ""}
      </div>

      <div class="main-content">
        ${summary ? `
          <div class="section">
            <h2 class="main-title">About Me</h2>
            <p>${escapeHtml(summary)}</p>
          </div>
        ` : ""}

        ${experience.length > 0 ? `
          <div class="section">
            <h2 class="main-title">Experience</h2>
            ${experience.map((exp) => `
              <div class="entry">
                <div class="entry-title">${escapeHtml(exp.role)}</div>
                <div class="entry-subtitle">${escapeHtml(exp.company)} <span>| ${escapeHtml(exp.startDate)} - ${exp.current ? "Present" : escapeHtml(exp.endDate)}</span></div>
                ${exp.responsibilities.length > 0 ? `
                  <ul>
                    ${exp.responsibilities.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
                  </ul>
                ` : ""}
              </div>
            `).join("")}
          </div>
        ` : ""}

        ${projects.length > 0 ? `
          <div class="section">
            <h2 class="main-title">Projects</h2>
            <div class="projects-grid">
              ${projects.map((proj) => `
                <div class="project-card">
                  <h3>${escapeHtml(proj.name)}</h3>
                  <p>${escapeHtml(proj.description)}</p>
                  ${proj.technologies.length > 0 ? `
                    <div class="tech">${escapeHtml(proj.technologies.join(", "))}</div>
                  ` : ""}
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        ${education.length > 0 ? `
          <div class="section">
            <h2 class="main-title">Education</h2>
            ${education.map((edu) => `
              <div style="margin-bottom: 12px;">
                <div style="font-weight: 700; color: #111827;">${escapeHtml(edu.degree)}</div>
                <div style="font-size: 10pt; color: #4b5563;">${escapeHtml(edu.institution)} <span style="color: #9ca3af;">| ${escapeHtml(edu.startDate)} - ${escapeHtml(edu.endDate)}</span></div>
              </div>
            `).join("")}
          </div>
        ` : ""}
      </div>
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

  /* ---- Executive Template ---- */
  .template-executive { font-family: 'Georgia', serif; border-top: 8px solid #1e1b4b; padding-top: 20px; }
  .template-executive .exec-header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #e0e7ff; padding-bottom: 16px; }
  .template-executive h1 { font-size: 26pt; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1e1b4b; margin: 0 0 8px 0; }
  .template-executive .contact-line { font-family: 'Inter', sans-serif; color: #475569; font-size: 10pt; letter-spacing: 1px; }
  .template-executive h2.exec-section-title { font-size: 13pt; font-weight: 700; color: #1e1b4b; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #e0e7ff; padding-bottom: 6px; margin: 0 0 16px 0; }
  .template-executive .section { margin-bottom: 24px; }
  .template-executive .entry { margin-bottom: 16px; }
  .template-executive .entry-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
  .template-executive .entry-title { font-weight: 700; font-size: 12pt; color: #1e293b; }
  .template-executive .entry-date { color: #3730a3; font-family: 'Inter', sans-serif; font-size: 9pt; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
  .template-executive .entry-subtitle { color: #475569; font-weight: 600; margin-bottom: 8px; }
  .template-executive p { color: #334155; line-height: 1.8; margin: 0 0 12px 0; }
  .template-executive ul { padding-left: 20px; margin: 0; color: #334155; }
  .template-executive li { margin-bottom: 4px; }
  .template-executive .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .template-executive .skills-list span { font-family: 'Inter', sans-serif; }

  /* ---- Creative Template ---- */
  .template-creative { display: flex; font-family: 'Inter', sans-serif; min-height: 100vh; }
  .template-creative .sidebar { width: 33.333%; background: #fdf2f8; padding: 24px; border-right: 1px solid #fce7f3; }
  .template-creative .main-content { width: 66.666%; padding: 32px; }
  .template-creative h1 { font-size: 28pt; font-weight: 900; letter-spacing: -1px; color: #db2777; line-height: 1; margin: 0 0 8px 0; }
  .template-creative .divider { width: 48px; height: 6px; background: #f472b6; border-radius: 999px; margin-bottom: 16px; }
  .template-creative .contact-info div { font-size: 9pt; font-weight: 500; color: #831843; opacity: 0.8; margin-bottom: 8px; }
  .template-creative h2.sidebar-title { font-size: 12pt; font-weight: 700; color: #db2777; text-transform: uppercase; letter-spacing: 2px; margin: 32px 0 12px 0; }
  .template-creative .skill-tag { display: inline-block; background: #fce7f3; color: #9d174d; padding: 2px 8px; border-radius: 4px; font-size: 8pt; margin: 0 4px 4px 0; }
  .template-creative h2.main-title { font-size: 18pt; font-weight: 900; color: #111827; letter-spacing: -0.5px; margin: 0 0 16px 0; }
  .template-creative .section { margin-bottom: 32px; }
  .template-creative p { color: #4b5563; font-weight: 500; line-height: 1.6; }
  .template-creative .entry { position: relative; padding-left: 16px; border-left: 2px solid #fbcfe8; margin-bottom: 24px; }
  .template-creative .entry::before { content: ""; position: absolute; width: 10px; height: 10px; background: #ec4899; border-radius: 50%; left: -6px; top: 6px; box-shadow: 0 0 0 4px #fff; }
  .template-creative .entry-title { font-weight: 700; font-size: 13pt; color: #111827; line-height: 1; margin-bottom: 4px; }
  .template-creative .entry-subtitle { color: #db2777; font-weight: 500; font-size: 10pt; margin-bottom: 8px; }
  .template-creative .entry-subtitle span { color: #9ca3af; font-weight: 400; }
  .template-creative ul { padding-left: 16px; color: #4b5563; margin: 0; }
  .template-creative li { margin-bottom: 4px; }
  .template-creative .projects-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .template-creative .project-card { background: #f9fafb; padding: 16px; border-radius: 12px; border: 1px solid #f3f4f6; }
  .template-creative .project-card h3 { font-weight: 700; color: #111827; margin: 0 0 4px 0; }
  .template-creative .project-card p { font-size: 9pt; color: #4b5563; margin-bottom: 8px; }
  .template-creative .project-card .tech { font-size: 7pt; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }

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
    case "executive":
      bodyHtml = renderExecutive(resume);
      break;
    case "creative":
      bodyHtml = renderCreative(resume);
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
