import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";
import type { ResumeData } from "@/types/resume";
import { defaultAccentForTemplate } from "@/features/resume-builder/templates/theme";

// ── Helpers ───────────────────────────────────────────────────────────────

function dateRange(start: string, end: string, current?: boolean): string {
  const parts = [start, current ? "Present" : end].filter(Boolean);
  return parts.join(" – ");
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

function sectionHeading(text: string, accentHex?: string | null): Paragraph {
  const accent = (accentHex || "#2563eb").replace("#", "").toUpperCase();
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    border: {
      bottom: {
        color: accent,
        space: 2,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: 20, color: "1F2937" }),
    ],
  });
}

function entryTitle(title: string, date: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 40 },
    children: [
      new TextRun({ text: title, bold: true, size: 22 }),
      date
        ? new TextRun({ text: `    ${date}`, size: 18, color: "6B7280" })
        : undefined,
    ].filter((r): r is TextRun => Boolean(r)),
  });
}

function entrySubtitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 20, color: "4B5563" })],
  });
}

function plain(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 20 })],
  });
}

// ── Public API ────────────────────────────────────────────────────────────

export function buildDocx(resume: ResumeData): Document {
  const { personalInfo, summary, experience, education, projects, skills, certifications, achievements, languages } = resume;
  // Variant-aware accent: the user's choice wins; otherwise the variant's
  // default accent tints the section rules so DOCX matches the other formats.
  const accent = defaultAccentForTemplate(resume);

  const children: Paragraph[] = [];

  // Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: personalInfo.fullName, bold: true, size: 40 })],
    })
  );
  const contactParts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.portfolio,
  ].filter(Boolean);
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({ text: contactParts.join("  |  "), size: 18, color: "6B7280" })],
      })
    );
  }

  // Summary
  if (summary) {
    children.push(sectionHeading("Professional Summary", accent));
    children.push(plain(summary));
  }

  // Experience
  if (experience.length > 0) {
    children.push(sectionHeading("Experience", accent));
    for (const exp of experience) {
      children.push(entryTitle(exp.role, dateRange(exp.startDate, exp.endDate, exp.current)));
      children.push(entrySubtitle([exp.company, exp.location].filter(Boolean).join(", ")));
      for (const r of exp.responsibilities) children.push(bullet(r));
      for (const a of exp.achievements) children.push(bullet(a));
    }
  }

  // Education
  if (education.length > 0) {
    children.push(sectionHeading("Education", accent));
    for (const edu of education) {
      children.push(entryTitle(edu.institution, dateRange(edu.startDate, edu.endDate)));
      const detail = [edu.degree, edu.field ? `in ${edu.field}` : "", edu.cgpa ? `CGPA: ${edu.cgpa}` : ""].filter(Boolean);
      if (detail.length > 0) children.push(entrySubtitle(detail.join(" | ")));
    }
  }

  // Projects
  if (projects.length > 0) {
    children.push(sectionHeading("Projects", accent));
    for (const proj of projects) {
      children.push(entryTitle(proj.name, ""));
      if (proj.technologies.length > 0) {
        children.push(entrySubtitle(proj.technologies.join(", ")));
      }
      if (proj.description) children.push(plain(proj.description));
      const links = [proj.liveUrl, proj.githubUrl].filter(Boolean);
      if (links.length > 0) children.push(entrySubtitle(links.join(" | ")));
    }
  }

  // Skills
  const skillGroups: Array<[string, string[]]> = [
    ["Technical", skills.technical],
    ["Frameworks", skills.frameworks],
    ["Tools", skills.tools],
    ["Soft Skills", skills.soft],
  ].filter(([, items]) => items.length > 0) as Array<[string, string[]]>;
  if (skillGroups.length > 0) {
    children.push(sectionHeading("Skills", accent));
    for (const [label, items] of skillGroups) {
      children.push(entrySubtitle(`${label}: ${items.join(", ")}`));
    }
  }

  // Certifications
  if (certifications.length > 0) {
    children.push(sectionHeading("Certifications", accent));
    for (const cert of certifications) {
      children.push(entryTitle(cert.name, cert.date));
      if (cert.issuer) children.push(entrySubtitle(cert.issuer));
    }
  }

  // Achievements
  if (achievements.length > 0) {
    children.push(sectionHeading("Achievements", accent));
    for (const ach of achievements) {
      children.push(entryTitle(ach.title, ach.date));
      if (ach.description) children.push(plain(ach.description));
    }
  }

  // Languages
  if (languages.length > 0) {
    children.push(sectionHeading("Languages", accent));
    children.push(plain(languages.map((l) => `${l.name} (${l.proficiency})`).join(", ")));
  }

  // Custom sections (K-04)
  const customSections = Object.values(resume.customSections ?? {}).filter((cs) => cs.items.length > 0);
  for (const cs of customSections) {
    children.push(sectionHeading(cs.title || "Custom Section", accent));
    for (const item of cs.items) {
      if (item.title) children.push(entryTitle(item.title, item.date));
      if (item.subtitle) children.push(entrySubtitle(item.subtitle));
      if (item.description) children.push(plain(item.description));
    }
  }

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

export async function generateDocxBuffer(resume: ResumeData): Promise<Buffer> {
  return Packer.toBuffer(buildDocx(resume));
}
