import type { ResumeData } from "@/types/resume";
import { exportedStyleForTemplate } from "@/features/resume-builder/templates/imported/catalog";
import { defaultAccentForTemplate, defaultFontForTemplate } from "@/features/resume-builder/templates/theme";

/**
 * Per-variant theme override injected into the exported HTML: the variant's
 * accent color is bound to `--accent` (and a soft tint to `--accent-soft`),
 * and the variant's default font family applies when the user hasn't chosen
 * one. The static STYLES below reference these variables so every catalog
 * variant exports its own colors/fonts.
 */
const FONT_STACKS: Record<string, string> = {
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', monospace",
};

function variantThemeCss(resume: ResumeData): string {
  const accent = defaultAccentForTemplate(resume);
  const hex = accent.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const fontStack = FONT_STACKS[defaultFontForTemplate(resume)] ?? FONT_STACKS.sans;
  return `
  :root {
    --accent: ${accent};
    --accent-soft: rgba(${r}, ${g}, ${b}, 0.12);
    --accent-border: rgba(${r}, ${g}, ${b}, 0.35);
  }
  body { font-family: ${fontStack}; }
  .template-modern h1 { color: var(--accent); }
  .template-modern h2 { color: var(--accent); border-bottom-color: var(--accent); }
  .template-executive { border-top-color: var(--accent); }
  .template-executive h1 { color: var(--accent); }
  .template-executive h2.exec-section-title { color: var(--accent); border-bottom-color: var(--accent-border); }
  .template-student h1 { color: var(--accent); }
  .template-student h2.uppercase { color: var(--accent); }
  .template-creative h1 { color: var(--accent); }
  .template-creative .divider { background: var(--accent); }
  .template-creative h2.sidebar-title { color: var(--accent); }
  .template-creative .skill-tag { background: var(--accent-soft); color: var(--accent); }
  .template-creative .entry { border-left-color: var(--accent-border); }
  .template-creative .entry::before { background: var(--accent); }
  .template-creative .entry-subtitle { color: var(--accent); }
  .template-creative .sidebar { background: var(--accent-soft); }
  .template-ats .ats-header { border-bottom-color: var(--accent); }
  .template-minimal .minimal-header h1 { color: var(--accent); }
  `;
}

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
  const { personalInfo, summary, experience, education, skills, certifications, languages } = resume;

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

function renderExecutiveSidebar(resume: ResumeData): string {
  const { personalInfo, summary, experience, education, skills, certifications, achievements, languages, projects } = resume;

  return `
    <div class="template-exec-sidebar">
      <div class="exs-sidebar">
        <h1>${escapeHtml(personalInfo.fullName)}</h1>
        <div class="exs-divider"></div>

        <h2 class="exs-sidebar-title">Contact</h2>
        ${personalInfo.email ? `<p class="exs-text">${escapeHtml(personalInfo.email)}</p>` : ""}
        ${personalInfo.phone ? `<p class="exs-text">${escapeHtml(personalInfo.phone)}</p>` : ""}
        ${personalInfo.linkedin ? `<p class="exs-link">${escapeHtml(personalInfo.linkedin)}</p>` : ""}
        ${personalInfo.github ? `<p class="exs-link">${escapeHtml(personalInfo.github)}</p>` : ""}

        ${languages.length > 0 ? `
          <h2 class="exs-sidebar-title">Languages</h2>
          ${languages.map((l) => `<p class="exs-text">${escapeHtml(l.name)} — ${escapeHtml(l.proficiency)}</p>`).join("")}
        ` : ""}

        ${skills ? `
          <h2 class="exs-sidebar-title">Skills</h2>
          ${[skills.technical, skills.frameworks, skills.tools].filter((g) => g.length > 0).map((group) => `
            <div class="exs-tags">
              ${group.map((s) => `<span class="exs-tag">${escapeHtml(s)}</span>`).join("")}
            </div>
          `).join("")}
        ` : ""}

        ${certifications.length > 0 ? `
          <h2 class="exs-sidebar-title">Certifications</h2>
          ${certifications.map((cert) => `<p class="exs-text">${escapeHtml(cert.name)}</p>`).join("")}
        ` : ""}
      </div>

      <div class="exs-main">
        ${summary ? `
          <h2 class="exs-section-title">Profile</h2>
          <p class="exs-paragraph">${escapeHtml(summary)}</p>
        ` : ""}

        ${experience.length > 0 ? `
          <h2 class="exs-section-title">Experience</h2>
          ${experience.map((exp) => `
            <div class="exs-entry">
              <div class="exs-entry-header">
                <span class="exs-entry-title">${escapeHtml(exp.role)}</span>
                <span class="exs-entry-date">${escapeHtml(exp.startDate)} – ${exp.current ? "Present" : escapeHtml(exp.endDate)}</span>
              </div>
              <p class="exs-entry-subtitle">${escapeHtml(exp.company)}${exp.location ? `, ${escapeHtml(exp.location)}` : ""}</p>
              ${exp.responsibilities.length > 0 ? `
                <ul>
                  ${exp.responsibilities.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
                </ul>
              ` : ""}
            </div>
          `).join("")}
        ` : ""}

        ${education.length > 0 ? `
          <h2 class="exs-section-title">Education</h2>
          ${education.map((edu) => `
            <div class="exs-entry">
              <div class="exs-entry-header">
                <span class="exs-entry-title">${escapeHtml(edu.institution)}</span>
                <span class="exs-entry-date">${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}</span>
              </div>
              <p class="exs-entry-subtitle">${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ""}${edu.cgpa ? ` | CGPA: ${escapeHtml(edu.cgpa)}` : ""}</p>
            </div>
          `).join("")}
        ` : ""}

        <div class="exs-grid2">
          ${projects.length > 0 ? `
            <div>
              <h2 class="exs-section-title">Projects</h2>
              ${projects.map((proj) => `
                <div class="exs-entry">
                  <p class="exs-entry-title">${escapeHtml(proj.name)}</p>
                  <p class="exs-paragraph">${escapeHtml(proj.description)}</p>
                  ${proj.technologies.length > 0 ? `<p class="exs-tech">Tech: ${escapeHtml(proj.technologies.join(", "))}</p>` : ""}
                </div>
              `).join("")}
            </div>
          ` : ""}
          ${achievements.length > 0 ? `
            <div>
              <h2 class="exs-section-title">Achievements</h2>
              ${achievements.map((ach) => `<p class="exs-paragraph"><strong>${escapeHtml(ach.title)}</strong>: ${escapeHtml(ach.description)}</p>`).join("")}
            </div>
          ` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderModernCard(resume: ResumeData): string {
  const { personalInfo, summary, experience, education, projects, skills, certifications, achievements, languages } = resume;

  return `
    <div class="template-modern-card">
      <div class="card">
        <h1>${escapeHtml(personalInfo.fullName)}</h1>
        <p class="contact-line">${escapeHtml(personalInfo.email)}${personalInfo.phone ? ` | ${escapeHtml(personalInfo.phone)}` : ""}</p>
        ${(personalInfo.linkedin || personalInfo.github || personalInfo.portfolio) ? `<p class="contact-links">${[personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean).map(escapeHtml).join(" | ")}</p>` : ""}
      </div>

      ${summary ? `
        <div class="card">
          <h2 class="card-title">Summary</h2>
          <p>${escapeHtml(summary)}</p>
        </div>
      ` : ""}

      ${experience.length > 0 ? `
        <div class="card">
          <h2 class="card-title">Experience</h2>
          ${experience.map((exp) => `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${escapeHtml(exp.role)}</span>
                <span class="entry-date">${escapeHtml(exp.startDate)} – ${exp.current ? "Present" : escapeHtml(exp.endDate)}</span>
              </div>
              <p class="card-subtitle">${escapeHtml(exp.company)}${exp.location ? `, ${escapeHtml(exp.location)}` : ""}</p>
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
        <div class="card">
          <h2 class="card-title">Education</h2>
          ${education.map((edu) => `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${escapeHtml(edu.institution)}</span>
                <span class="entry-date">${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}</span>
              </div>
              <p class="card-subtitle">${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ""}${edu.cgpa ? ` | CGPA: ${escapeHtml(edu.cgpa)}` : ""}</p>
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${skills || languages.length > 0 ? `
        <div class="card">
          <h2 class="card-title">Skills & Languages</h2>
          <div class="grid-2">
            ${skills ? `
              <div>
                ${skills.technical.length > 0 ? `<p class="card-label">Technical</p><div class="chip-row">${skills.technical.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join("")}</div>` : ""}
                ${skills.frameworks.length > 0 ? `<p class="card-label">Frameworks</p><div class="chip-row">${skills.frameworks.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join("")}</div>` : ""}
                ${skills.tools.length > 0 ? `<p class="card-label">Tools</p><div class="chip-row">${skills.tools.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join("")}</div>` : ""}
              </div>
            ` : ""}
            ${languages.length > 0 ? `
              <div>
                <p class="card-label">Languages</p>
                ${languages.map((l) => `<p class="lang">${escapeHtml(l.name)} — ${escapeHtml(l.proficiency)}</p>`).join("")}
              </div>
            ` : ""}
          </div>
        </div>
      ` : ""}

      ${projects.length > 0 ? `
        <div class="card">
          <h2 class="card-title">Projects</h2>
          ${projects.map((proj) => `
            <div class="entry">
              <p class="entry-title">${escapeHtml(proj.name)}</p>
              <p>${escapeHtml(proj.description)}</p>
              ${proj.technologies.length > 0 ? `<div class="chip-row">${proj.technologies.map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${certifications.length > 0 ? `
        <div class="card">
          <h2 class="card-title">Certifications</h2>
          ${certifications.map((cert) => `<p class="cert">${escapeHtml(cert.name)}${cert.issuer ? ` — ${escapeHtml(cert.issuer)}` : ""}${cert.date ? ` (${escapeHtml(cert.date)})` : ""}</p>`).join("")}
        </div>
      ` : ""}

      ${achievements.length > 0 ? `
        <div class="card">
          <h2 class="card-title">Achievements</h2>
          ${achievements.map((ach) => `<p class="ach"><strong>${escapeHtml(ach.title)}</strong>: ${escapeHtml(ach.description)}</p>`).join("")}
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

  /* ---- Executive Sidebar Template ---- */
  .template-exec-sidebar { display: flex; min-height: 100vh; }
  .template-exec-sidebar .exs-sidebar { width: 30%; background: #1e293b; padding: 24px; color: #e2e8f0; }
  .template-exec-sidebar .exs-sidebar h1 { font-size: 18pt; font-weight: 700; color: #fff; margin: 0 0 4px 0; }
  .template-exec-sidebar .exs-divider { height: 1px; background: #334155; margin-bottom: 16px; }
  .template-exec-sidebar .exs-sidebar-title { font-size: 8pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin: 12px 0 8px 0; }
  .template-exec-sidebar .exs-text { font-size: 8pt; color: #cbd5e1; margin: 0 0 4px 0; }
  .template-exec-sidebar .exs-link { font-size: 8pt; color: var(--accent, #60a5fa); margin: 0 0 4px 0; }
  .template-exec-sidebar .exs-tags { margin-bottom: 6px; }
  .template-exec-sidebar .exs-tag { display: inline-block; font-size: 7pt; background: #334155; color: #cbd5e1; padding: 2px 6px; border-radius: 3px; margin: 0 4px 4px 0; }
  .template-exec-sidebar .exs-main { flex: 1; padding: 28px; }
  .template-exec-sidebar .exs-section-title { font-size: 10pt; font-weight: 700; color: var(--accent, #1e293b); text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 6px 0 10px 0; }
  .template-exec-sidebar .exs-paragraph { font-size: 9pt; color: #475569; margin: 0 0 6px 0; line-height: 1.5; }
  .template-exec-sidebar .exs-entry { margin-bottom: 12px; }
  .template-exec-sidebar .exs-entry-header { display: flex; justify-content: space-between; align-items: baseline; }
  .template-exec-sidebar .exs-entry-title { font-size: 10pt; font-weight: 700; color: #0f172a; }
  .template-exec-sidebar .exs-entry-date { font-size: 8pt; color: #64748b; }
  .template-exec-sidebar .exs-entry-subtitle { font-size: 9pt; color: var(--accent, #3b82f6); font-weight: 500; margin: 0 0 3px 0; }
  .template-exec-sidebar ul { margin: 4px 0 0 0; padding-left: 18px; font-size: 9pt; color: #475569; }
  .template-exec-sidebar .exs-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .template-exec-sidebar .exs-tech { font-size: 7pt; color: #64748b; }

  /* ---- Modern Card Template ---- */
  .template-modern-card { background: #f8fafc; padding: 16px; }
  .template-modern-card .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  .template-modern-card h1 { font-size: 24pt; font-weight: 700; color: #0f172a; margin: 0 0 2px 0; }
  .template-modern-card .contact-line { font-size: 9pt; color: #64748b; margin: 0; }
  .template-modern-card .contact-links { font-size: 9pt; color: #94a3b8; margin: 2px 0 0 0; }
  .template-modern-card .card-title { font-size: 11pt; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; }
  .template-modern-card .card p { font-size: 9pt; color: #475569; margin: 0 0 4px 0; }
  .template-modern-card .entry { margin-bottom: 10px; }
  .template-modern-card .entry-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
  .template-modern-card .entry-title { font-size: 10pt; font-weight: 700; color: #0f172a; }
  .template-modern-card .entry-date { font-size: 8pt; color: #94a3b8; }
  .template-modern-card .card-subtitle { color: var(--accent, #6366f1) !important; }
  .template-modern-card .card-label { font-size: 8pt; font-weight: 700; color: var(--accent, #6366f1) !important; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .template-modern-card .chip-row { margin-bottom: 8px; }
  .template-modern-card .chip { display: inline-block; font-size: 8pt; background: var(--accent-soft, #eef2ff); color: var(--accent, #4338ca); padding: 2px 6px; border-radius: 4px; margin: 0 4px 4px 0; }
  .template-modern-card .lang { font-size: 9pt; color: #64748b; margin-bottom: 4px; }
  .template-modern-card .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .template-modern-card .cert { font-size: 9pt; color: #64748b; margin-bottom: 4px; }
  .template-modern-card .ach { font-size: 9pt; color: #64748b; margin-bottom: 4px; }

  /* ---- Print Utilities ---- */
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export function renderResumeToHtml(resume: ResumeData): string {
  let bodyHtml = "";
  // Every catalog variant exports through its archetype style, but the resume
  // keeps its ORIGINAL template key so the variant's accent/font apply.
  const effectiveTemplate = exportedStyleForTemplate(resume.template);

  switch (effectiveTemplate) {
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
    case "executive-sidebar":
      bodyHtml = renderExecutiveSidebar(resume);
      break;
    case "modern-card":
      bodyHtml = renderModernCard(resume);
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
  <style>${STYLES}
  ${variantThemeCss(resume)}</style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}
// TODO: Replace string-based HTML renderers with React renderToStaticMarkup to eliminate duplication (see Issue #16)
