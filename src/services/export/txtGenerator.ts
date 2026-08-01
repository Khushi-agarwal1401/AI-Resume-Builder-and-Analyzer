import type { ResumeData } from "@/types/resume";

// ── Helpers ───────────────────────────────────────────────────────────────

function dateRange(start: string, end: string, current?: boolean): string {
  const parts = [start, current ? "Present" : end].filter(Boolean);
  return parts.join(" – ");
}

function section(lines: string[], title: string): string[] {
  if (lines.length === 0) return [];
  return [
    "",
    title.toUpperCase(),
    "=".repeat(Math.max(title.length + 2, 30)),
    ...lines,
  ];
}

function bullet(items: string[]): string[] {
  return items.map((item) => `  • ${item}`);
}

// ── Public API ────────────────────────────────────────────────────────────

/** Plain-text resume optimized for ATS parsing (no tables, no graphics). */
export function buildTxt(resume: ResumeData): string {
  const { personalInfo, summary, experience, education, projects, skills, certifications, achievements, languages } = resume;

  const lines: string[] = [];

  // Header
  lines.push(personalInfo.fullName);
  const contactParts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.portfolio,
  ].filter(Boolean);
  if (contactParts.length > 0) lines.push(contactParts.join("  |  "));
  lines.push("");

  // Summary
  lines.push(...section(summary ? [summary] : [], "Professional Summary"));

  // Experience
  const expLines: string[] = [];
  for (const exp of experience) {
    expLines.push(exp.role);
    expLines.push(`${[exp.company, exp.location].filter(Boolean).join(", ")}  (${dateRange(exp.startDate, exp.endDate, exp.current)})`);
    expLines.push(...bullet([...exp.responsibilities, ...exp.achievements]));
    expLines.push("");
  }
  lines.push(...section(expLines, "Experience"));

  // Education
  const eduLines: string[] = [];
  for (const edu of education) {
    const detail = [edu.degree, edu.field ? `in ${edu.field}` : "", edu.cgpa ? `CGPA: ${edu.cgpa}` : ""].filter(Boolean).join(" | ");
    eduLines.push(`${edu.institution}  (${dateRange(edu.startDate, edu.endDate)})`);
    if (detail) eduLines.push(`  ${detail}`);
  }
  lines.push(...section(eduLines, "Education"));

  // Projects
  const projLines: string[] = [];
  for (const proj of projects) {
    projLines.push(proj.name);
    if (proj.technologies.length > 0) projLines.push(`  ${proj.technologies.join(", ")}`);
    if (proj.description) projLines.push(`  ${proj.description}`);
    const links = [proj.liveUrl, proj.githubUrl].filter(Boolean).join(" | ");
    if (links) projLines.push(`  ${links}`);
  }
  lines.push(...section(projLines, "Projects"));

  // Skills
  const skillLines: string[] = [];
  const skillGroups: Array<[string, string[]]> = [
    ["Technical", skills.technical],
    ["Frameworks", skills.frameworks],
    ["Tools", skills.tools],
    ["Soft Skills", skills.soft],
  ].filter(([, items]) => items.length > 0) as Array<[string, string[]]>;
  for (const [label, items] of skillGroups) {
    skillLines.push(`${label}: ${items.join(", ")}`);
  }
  lines.push(...section(skillLines, "Skills"));

  // Certifications
  const certLines: string[] = [];
  for (const cert of certifications) {
    certLines.push([cert.name, cert.issuer, cert.date].filter(Boolean).join(" — "));
  }
  lines.push(...section(certLines, "Certifications"));

  // Achievements
  const achLines: string[] = [];
  for (const ach of achievements) {
    achLines.push(`${ach.title}${ach.date ? ` (${ach.date})` : ""}`);
    if (ach.description) achLines.push(`  ${ach.description}`);
  }
  lines.push(...section(achLines, "Achievements"));

  // Languages
  lines.push(...section(
    languages.length > 0 ? [languages.map((l) => `${l.name} (${l.proficiency})`).join(", ")] : [],
    "Languages"
  ));

  return lines.join("\n").trim() + "\n";
}

export function generateTxtBuffer(resume: ResumeData): Buffer {
  return Buffer.from(buildTxt(resume), "utf-8");
}
