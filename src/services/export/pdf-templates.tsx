import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumeData } from "@/types/resume";
import { pdfFontFamily, accentWithAlpha } from "@/features/resume-builder/templates/theme";

type PdfStyle = Record<string, unknown>;

/** Style object type actually accepted by @react-pdf View/Text props. */
type PdfComponentStyle = React.ComponentProps<typeof View>["style"];

/**
 * Merges per-resume theme overrides (accent color, font) into a static
 * StyleSheet.create result without mutating the original.
 */
function withTheme<T extends Record<string, unknown>>(base: T, overrides: Partial<Record<keyof T, PdfStyle>>): T {
  const merged = { ...base };
  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const o = overrides[key];
    if (o) merged[key] = { ...(base[key] as PdfStyle), ...o } as T[keyof T];
  }
  return merged;
}

// ══════════════════════════════════════════════════════════════════════════
//  Shared sub-components
// ══════════════════════════════════════════════════════════════════════════

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={sharedStyles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={sharedStyles.bulletLine}>
          <Text style={sharedStyles.bulletPoint}>{"\u2022"}</Text>
          <Text style={sharedStyles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const sharedStyles = StyleSheet.create({
  bulletList: { marginLeft: 14, marginTop: 2 },
  bulletLine: { flexDirection: "row", marginBottom: 1 },
  bulletPoint: { width: 8, fontSize: 9, color: "#374151" },
  bulletText: { fontSize: 9, color: "#374151", flex: 1 },
});

/**
 * Renders user-created custom sections (K-04) in PDF exports.
 * Styles are injected per template so the block matches each theme.
 */
function CustomSectionsPdf({
  resume,
  styles,
}: {
  resume: ResumeData;
  styles: {
    section: PdfComponentStyle;
    sectionTitle: PdfComponentStyle;
    entry: PdfComponentStyle;
    entryTitle: PdfComponentStyle;
    entryDate: PdfComponentStyle;
    entrySubtitle: PdfComponentStyle;
    paragraph: PdfComponentStyle;
  };
}) {
  const customSections = Object.entries(resume.customSections ?? {}).filter(([, cs]) => cs.items.length > 0);
  if (customSections.length === 0) return null;

  return (
    <>
      {customSections.map(([id, cs]) => (
        <View key={id} style={styles.section}>
          <Text style={styles.sectionTitle}>{cs.title || "Custom Section"}</Text>
          {cs.items.map((item) => (
            <View key={item.id} style={styles.entry}>
              {item.title ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.entryTitle}>{item.title}</Text>
                  {item.date ? <Text style={styles.entryDate}>{item.date}</Text> : null}
                </View>
              ) : null}
              {item.subtitle ? <Text style={styles.entrySubtitle}>{item.subtitle}</Text> : null}
              {item.description ? <Text style={styles.paragraph}>{item.description}</Text> : null}
            </View>
          ))}
        </View>
      ))}
    </>
  );
}



// ══════════════════════════════════════════════════════════════════════════
//  1. MODERN TEMPLATE – Blue accent, clean headers with bottom border
// ══════════════════════════════════════════════════════════════════════════

const modernStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.5 },
  header: { marginBottom: 16, borderBottomWidth: 1.5, borderBottomColor: "#2563eb", paddingBottom: 10 },
  name: { fontSize: 22, fontWeight: "bold", marginBottom: 3 },
  contactLine: { fontSize: 9, color: "#6b7280", flexDirection: "row", gap: 4 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: "#2563eb", textTransform: "uppercase", marginBottom: 6, borderBottomWidth: 0.5, borderBottomColor: "#d1d5db", paddingBottom: 3 },
  entry: { marginBottom: 10 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  entryTitle: { fontSize: 10, fontWeight: "bold", color: "#111827" },
  entryDate: { fontSize: 8, color: "#9ca3af" },
  entrySubtitle: { fontSize: 9, color: "#4b5563", marginBottom: 3 },
  twoColumn: { flexDirection: "row", gap: 16 },
  column: { flex: 1 },
  paragraph: { fontSize: 9, color: "#374151", marginBottom: 4 },
  skillGroup: { marginBottom: 4 },
  skillLabel: { fontSize: 9, fontWeight: "bold", color: "#374151" },
  skillItems: { fontSize: 9, color: "#4b5563" },
});

function ModernPdf({ resume }: { resume: ResumeData }) {
  const accent = resume.accentColor || "#2563eb";
  const styles = withTheme(modernStyles, {
    page: { fontFamily: pdfFontFamily(resume.fontFamily) },
    header: { borderBottomColor: accent },
    sectionTitle: { color: accent },
  });
  const { personalInfo, summary, experience, education, projects, skills, certifications, achievements, languages } = resume;

  return (
    <Page size="LETTER" style={styles.page}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.name}>{personalInfo.fullName}</Text>
        <View style={styles.contactLine}>
          <Text>{personalInfo.email}</Text>
          {personalInfo.phone ? <Text> | {personalInfo.phone}</Text> : null}
        </View>
        {personalInfo.linkedin || personalInfo.github || personalInfo.portfolio ? (
          <View style={styles.contactLine}>
            <Text>
              {[personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean).join(" | ")}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Summary ── */}
      {summary ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.paragraph}>{summary}</Text>
        </View>
      ) : null}

      {/* ── Experience ── */}
      {experience.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {experience.map((exp) => (
            <View key={exp.id} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{exp.role}</Text>
                <Text style={styles.entryDate}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</Text>
              {exp.responsibilities.length > 0 ? <BulletList items={exp.responsibilities} /> : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Education ── */}
      {education.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {education.map((edu) => (
            <View key={edu.id} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{edu.institution}</Text>
                <Text style={styles.entryDate}>{edu.startDate} – {edu.endDate}</Text>
              </View>
              <Text style={styles.entrySubtitle}>
                {edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.cgpa ? ` | CGPA: ${edu.cgpa}` : ""}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Two-column: Skills / Languages ── */}
      {(skills || languages.length > 0) ? (
        <View style={styles.twoColumn}>
          {skills ? (
            <View style={[styles.section, styles.column]}>
              <Text style={styles.sectionTitle}>Skills</Text>
              {skills.technical.length > 0 ? (
                <View style={styles.skillGroup}>
                  <Text><Text style={styles.skillLabel}>Technical: </Text><Text style={styles.skillItems}>{skills.technical.join(", ")}</Text></Text>
                </View>
              ) : null}
              {skills.frameworks.length > 0 ? (
                <View style={styles.skillGroup}>
                  <Text><Text style={styles.skillLabel}>Frameworks: </Text><Text style={styles.skillItems}>{skills.frameworks.join(", ")}</Text></Text>
                </View>
              ) : null}
              {skills.tools.length > 0 ? (
                <View style={styles.skillGroup}>
                  <Text><Text style={styles.skillLabel}>Tools: </Text><Text style={styles.skillItems}>{skills.tools.join(", ")}</Text></Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {languages.length > 0 ? (
            <View style={[styles.section, styles.column]}>
              <Text style={styles.sectionTitle}>Languages</Text>
              {languages.map((lang) => (
                <Text key={lang.id} style={styles.paragraph}>{lang.name} — {lang.proficiency}</Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ── Projects ── */}
      {projects.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {projects.map((proj) => (
            <View key={proj.id} style={styles.entry}>
              <Text style={styles.entryTitle}>{proj.name}</Text>
              <Text style={styles.paragraph}>{proj.description}</Text>
              {proj.technologies.length > 0 ? (
                <Text style={styles.entrySubtitle}>Technologies: {proj.technologies.join(", ")}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Certifications ── */}
      {certifications.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {certifications.map((cert) => (
            <Text key={cert.id} style={styles.paragraph}>
              {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}{cert.date ? ` (${cert.date})` : ""}
            </Text>
          ))}
        </View>
      ) : null}

      {/* ── Achievements ── */}
      {achievements.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {achievements.map((ach) => (
            <View key={ach.id} style={styles.entry}>
              <Text style={styles.entryTitle}>{ach.title}</Text>
              <Text style={styles.paragraph}>{ach.description}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <CustomSectionsPdf
        resume={resume}
        styles={{
          section: styles.section,
          sectionTitle: styles.sectionTitle,
          entry: styles.entry,
          entryTitle: styles.entryTitle,
          entryDate: styles.entryDate,
          entrySubtitle: styles.entrySubtitle,
          paragraph: styles.paragraph,
        }}
      />
    </Page>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  2. ATS PROFESSIONAL – Gray bg section headers, clean, ATS-optimized
// ══════════════════════════════════════════════════════════════════════════

const atsStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#000", lineHeight: 1.4 },
  header: { textAlign: "center", borderBottomWidth: 2, borderBottomColor: "#000", paddingBottom: 10, marginBottom: 14 },
  name: { fontSize: 20, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  contactLine: { fontSize: 9, color: "#555", textAlign: "center" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, backgroundColor: "#f0f0f0", paddingVertical: 4, paddingHorizontal: 8, marginBottom: 6 },
  entry: { marginBottom: 8 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", fontWeight: "bold" },
  entryTitle: { fontSize: 10, fontWeight: "bold" },
  entryDate: { fontSize: 9, color: "#777", fontWeight: "normal" },
  entrySubtitle: { fontSize: 9, color: "#555" },
  paragraph: { fontSize: 9, color: "#444", marginBottom: 4 },
  skillLine: { fontSize: 10, marginBottom: 2 },
  skillLabel: { fontWeight: "bold" },
});

function AtsProfessionalPdf({ resume }: { resume: ResumeData }) {
  const styles = withTheme(atsStyles, {
    page: { fontFamily: pdfFontFamily(resume.fontFamily) },
  });
  const { personalInfo, summary, experience, education, skills, certifications, achievements, languages } = resume;

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{personalInfo.fullName}</Text>
        <Text style={styles.contactLine}>
          {personalInfo.email} | {personalInfo.phone} | {personalInfo.linkedin} | {personalInfo.github}
        </Text>
      </View>

      {summary ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.paragraph}>{summary}</Text>
        </View>
      ) : null}

      {experience.length > 0 ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {experience.map((exp) => (
            <View key={exp.id} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{exp.role}</Text>
                <Text style={styles.entryDate}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{exp.company}</Text>
              {exp.responsibilities.length > 0 ? <BulletList items={exp.responsibilities} /> : null}
            </View>
          ))}
        </View>
      ) : null}

      {education.length > 0 ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Education</Text>
          {education.map((edu) => (
            <Text key={edu.id} style={styles.paragraph}>
              <Text style={styles.entryTitle}>{edu.degree}</Text> — {edu.institution}{edu.cgpa ? `, CGPA: ${edu.cgpa}` : ""} ({edu.endDate})
            </Text>
          ))}
        </View>
      ) : null}

      {skills ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {skills.technical.length > 0 ? (
            <Text style={styles.skillLine}><Text style={styles.skillLabel}>Technical: </Text>{skills.technical.join(", ")}</Text>
          ) : null}
          {skills.frameworks.length > 0 ? (
            <Text style={styles.skillLine}><Text style={styles.skillLabel}>Frameworks: </Text>{skills.frameworks.join(", ")}</Text>
          ) : null}
          {skills.tools.length > 0 ? (
            <Text style={styles.skillLine}><Text style={styles.skillLabel}>Tools: </Text>{skills.tools.join(", ")}</Text>
          ) : null}
        </View>
      ) : null}

      {certifications.length > 0 ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {certifications.map((cert) => (
            <Text key={cert.id} style={styles.paragraph}>{cert.name} — {cert.issuer}</Text>
          ))}
        </View>
      ) : null}

      {achievements.length > 0 ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {achievements.map((ach) => (
            <Text key={ach.id} style={styles.paragraph}><Text style={{ fontWeight: "bold" }}>{ach.title}</Text>: {ach.description}</Text>
          ))}
        </View>
      ) : null}

      {languages.length > 0 ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <Text style={styles.paragraph}>{languages.map(l => `${l.name} (${l.proficiency})`).join(", ")}</Text>
        </View>
      ) : null}

      <CustomSectionsPdf
        resume={resume}
        styles={{
          section: styles.section,
          sectionTitle: styles.sectionTitle,
          entry: styles.entry,
          entryTitle: styles.entryTitle,
          entryDate: styles.entryDate,
          entrySubtitle: styles.entrySubtitle,
          paragraph: styles.paragraph,
        }}
      />
    </Page>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  3. STUDENT TEMPLATE – Green/clean, education-first, lowercase sections
// ══════════════════════════════════════════════════════════════════════════

const studentStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.5 },
  header: { textAlign: "center", marginBottom: 16 },
  name: { fontSize: 20, fontWeight: "bold", marginBottom: 3 },
  contactLine: { fontSize: 9, color: "#6b7280" },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 3, marginBottom: 6 },
  entry: { marginBottom: 8 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontSize: 10, fontWeight: "bold" },
  entryDate: { fontSize: 9, color: "#9ca3af" },
  entrySubtitle: { fontSize: 9, color: "#4b5563" },
  paragraph: { fontSize: 9, color: "#374151", marginBottom: 3 },
  skillLine: { fontSize: 9, marginBottom: 2 },
  skillLabel: { fontWeight: "bold" },
});

function StudentPdf({ resume }: { resume: ResumeData }) {
  const styles = withTheme(studentStyles, {
    page: { fontFamily: pdfFontFamily(resume.fontFamily) },
  });
  const { personalInfo, summary, education, projects, skills, certifications, achievements, languages } = resume;

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{personalInfo.fullName}</Text>
        <Text style={styles.contactLine}>{personalInfo.email} | {personalInfo.phone}</Text>
        {personalInfo.linkedin ? <Text style={styles.contactLine}>{personalInfo.linkedin}{personalInfo.github ? ` | ${personalInfo.github}` : ""}</Text> : null}
      </View>

      {summary ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.paragraph}>{summary}</Text>
        </View>
      ) : null}

      {education.length > 0 ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Education</Text>
          {education.map((edu) => (
            <View key={edu.id} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{edu.institution}</Text>
                <Text style={styles.entryDate}>{edu.endDate}</Text>
              </View>
              <Text style={styles.entrySubtitle}>
                {edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.cgpa ? ` — CGPA: ${edu.cgpa}` : ""}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {projects.length > 0 ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {projects.map((proj) => (
            <View key={proj.id} style={styles.entry}>
              <Text style={styles.entryTitle}>{proj.name}</Text>
              <Text style={styles.paragraph}>{proj.description}</Text>
              {proj.technologies.length > 0 ? (
                <Text style={styles.entrySubtitle}>Technologies: {proj.technologies.join(", ")}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {skills ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {skills.technical.length > 0 ? (
            <Text style={styles.skillLine}><Text style={styles.skillLabel}>Technical: </Text>{skills.technical.join(", ")}</Text>
          ) : null}
          {skills.tools.length > 0 ? (
            <Text style={styles.skillLine}><Text style={styles.skillLabel}>Tools: </Text>{skills.tools.join(", ")}</Text>
          ) : null}
        </View>
      ) : null}

      {certifications.length > 0 ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {certifications.map((cert) => (
            <Text key={cert.id} style={styles.paragraph}>{cert.name} — {cert.issuer}</Text>
          ))}
        </View>
      ) : null}

      {achievements.length > 0 ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {achievements.map((ach) => (
            <Text key={ach.id} style={styles.paragraph}>— {ach.title}{ach.description ? `: ${ach.description}` : ""}</Text>
          ))}
        </View>
      ) : null}

      {languages.length > 0 ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <Text style={styles.paragraph}>{languages.map(l => `${l.name} (${l.proficiency})`).join(", ")}</Text>
        </View>
      ) : null}

      <CustomSectionsPdf
        resume={resume}
        styles={{
          section: styles.section,
          sectionTitle: styles.sectionTitle,
          entry: styles.entry,
          entryTitle: styles.entryTitle,
          entryDate: styles.entryDate,
          entrySubtitle: styles.entrySubtitle,
          paragraph: styles.paragraph,
        }}
      />
    </Page>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  4. MINIMAL TEMPLATE – Light, thin font, gray labels, clean
// ══════════════════════════════════════════════════════════════════════════

const minimalStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.6 },
  name: { fontSize: 24, fontWeight: "light", color: "#111827", marginBottom: 4 },
  contactLine: { fontSize: 9, color: "#9ca3af", marginBottom: 16 },
  section: { marginBottom: 18 },
  sectionLabel: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, color: "#9ca3af", marginBottom: 8 },
  entry: { marginBottom: 12 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontSize: 10, fontWeight: "bold", color: "#111827" },
  entryDate: { fontSize: 9, color: "#9ca3af" },
  entrySubtitle: { fontSize: 9, color: "#6b7280" },
  paragraph: { fontSize: 9, color: "#6b7280", marginBottom: 4 },
  respText: { fontSize: 9, color: "#6b7280", marginBottom: 1 },
  skillsText: { fontSize: 9, color: "#6b7280" },
});

function MinimalPdf({ resume }: { resume: ResumeData }) {
  const styles = withTheme(minimalStyles, {
    page: { fontFamily: pdfFontFamily(resume.fontFamily) },
  });
  const { personalInfo, summary, experience, education, skills, certifications, achievements, languages } = resume;

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.name}>{personalInfo.fullName}</Text>
      <Text style={styles.contactLine}>{personalInfo.email}{personalInfo.phone ? ` / ${personalInfo.phone}` : ""}</Text>

      {summary ? (
        <View style={styles.section}>
          <Text style={styles.paragraph}>{summary}</Text>
        </View>
      ) : null}

      {experience.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Experience</Text>
          {experience.map((exp) => (
            <View key={exp.id} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{exp.role}</Text>
                <Text style={styles.entryDate}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{exp.company}</Text>
              {exp.responsibilities.map((r, i) => (
                <Text key={i} style={styles.respText}>{r}</Text>
              ))}
            </View>
          ))}
        </View>
      ) : null}

      {education.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Education</Text>
          {education.map((edu) => (
            <View key={edu.id} style={styles.entry}>
              <Text style={styles.entryTitle}>{edu.institution}</Text>
              <Text style={styles.entrySubtitle}>{edu.degree}{edu.cgpa ? `, CGPA: ${edu.cgpa}` : ""}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {skills ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Skills</Text>
          <Text style={styles.skillsText}>
            {[...skills.technical, ...skills.frameworks, ...skills.tools, ...skills.soft].join(" \u00B7 ")}
          </Text>
        </View>
      ) : null}

      {certifications.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Certifications</Text>
          {certifications.map((cert) => (
            <Text key={cert.id} style={styles.paragraph}>{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}</Text>
          ))}
        </View>
      ) : null}

      {achievements.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Achievements</Text>
          {achievements.map((ach) => (
            <Text key={ach.id} style={styles.paragraph}><Text style={{ fontWeight: "bold" }}>{ach.title}</Text>: {ach.description}</Text>
          ))}
        </View>
      ) : null}

      {languages.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Languages</Text>
          <Text style={styles.paragraph}>{languages.map(l => `${l.name} (${l.proficiency})`).join(" · ")}</Text>
        </View>
      ) : null}

      <CustomSectionsPdf
        resume={resume}
        styles={{
          section: styles.section,
          sectionTitle: styles.sectionLabel,
          entry: styles.entry,
          entryTitle: styles.entryTitle,
          entryDate: styles.entryDate,
          entrySubtitle: styles.entrySubtitle,
          paragraph: styles.paragraph,
        }}
      />
    </Page>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  5. EXECUTIVE TEMPLATE – Serif, dark border, formal uppercase headers
// ══════════════════════════════════════════════════════════════════════════

const execStyles = StyleSheet.create({
  page: { padding: 40, paddingTop: 48, fontSize: 10, fontFamily: "Times-Roman", color: "#1e293b", lineHeight: 1.7 },
  topBar: { height: 8, backgroundColor: "#1e1b4b", marginLeft: -40, marginRight: -40, marginTop: -48, marginBottom: 24 },
  header: { textAlign: "center", marginBottom: 24, borderBottomWidth: 2, borderBottomColor: "#e0e7ff", paddingBottom: 16 },
  name: { fontSize: 26, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, color: "#1e1b4b", marginBottom: 8 },
  contactLine: { fontSize: 9, color: "#475569", fontFamily: "Helvetica" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: "#1e1b4b", textTransform: "uppercase", letterSpacing: 2, borderBottomWidth: 1, borderBottomColor: "#e0e7ff", paddingBottom: 6, marginBottom: 12 },
  entry: { marginBottom: 12 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 },
  entryTitle: { fontSize: 11, fontWeight: "bold", color: "#1e293b" },
  entryDate: { fontSize: 9, color: "#3730a3", fontFamily: "Helvetica", textTransform: "uppercase", letterSpacing: 1 },
  entrySubtitle: { fontSize: 9, color: "#475569", fontWeight: "bold", marginBottom: 4 },
  paragraph: { fontSize: 9, color: "#334155", marginBottom: 4 },
  twoColumn: { flexDirection: "row", gap: 24 },
  column: { flex: 1 },
  skillLabel: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  skillText: { fontSize: 9, color: "#334155", marginBottom: 6 },
  sectionSubtitle: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, color: "#1e1b4b", marginBottom: 4 },
});

function ExecutivePdf({ resume }: { resume: ResumeData }) {
  const accent = resume.accentColor || "#1e1b4b";
  const styles = withTheme(execStyles, {
    page: { fontFamily: pdfFontFamily(resume.fontFamily) },
    topBar: { backgroundColor: accent },
    name: { color: accent },
    sectionTitle: { color: accent },
    entryDate: { color: accent },
    sectionSubtitle: { color: accent },
  });
  const { personalInfo, summary, experience, education, skills, certifications, achievements, languages, projects } = resume;

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.topBar} />
      <View style={styles.header}>
        <Text style={styles.name}>{personalInfo.fullName}</Text>
        <Text style={styles.contactLine}>{personalInfo.email}{personalInfo.phone ? ` \u2022 ${personalInfo.phone}` : ""}</Text>
        {(personalInfo.linkedin || personalInfo.github || personalInfo.portfolio) ? (
          <Text style={[styles.contactLine, { marginTop: 4 }]}>
            {[personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean).join(" \u2022 ")}
          </Text>
        ) : null}
      </View>

      {summary ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.paragraph}>{summary}</Text>
        </View>
      ) : null}

      {experience.length > 0 ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Professional Experience</Text>
          {experience.map((exp) => (
            <View key={exp.id} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{exp.role}</Text>
                <Text style={styles.entryDate}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</Text>
              {exp.responsibilities.length > 0 ? <BulletList items={exp.responsibilities} /> : null}
            </View>
          ))}
        </View>
      ) : null}

      {education.length > 0 ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Education</Text>
          {education.map((edu) => (
            <View key={edu.id} style={[styles.entry, { marginBottom: 8 }]}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</Text>
                <Text style={styles.entryDate}>{edu.startDate} – {edu.endDate}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{edu.institution}</Text>
              {edu.cgpa ? <Text style={[styles.paragraph, { color: "#64748b", marginTop: 2 }]}>CGPA: {edu.cgpa}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      {(skills || certifications.length > 0 || languages.length > 0 || projects.length > 0 || achievements.length > 0) ? (
        <View style={styles.twoColumn}>
          {skills ? (
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Core Competencies</Text>
              {skills.technical.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.skillLabel}>Technical</Text>
                  <Text style={styles.skillText}>{skills.technical.join(", ")}</Text>
                </View>
              ) : null}
              {skills.frameworks.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.skillLabel}>Frameworks</Text>
                  <Text style={styles.skillText}>{skills.frameworks.join(", ")}</Text>
                </View>
              ) : null}
              {skills.tools.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.skillLabel}>Tools</Text>
                  <Text style={styles.skillText}>{skills.tools.join(", ")}</Text>
                </View>
              ) : null}
              {projects.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.sectionTitle}>Key Projects</Text>
                  {projects.map((proj) => (
                    <View key={proj.id} style={{ marginBottom: 6 }}>
                      <Text style={styles.entryTitle}>{proj.name}</Text>
                      <Text style={styles.paragraph}>{proj.description}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={styles.column}>
            {certifications.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Certifications</Text>
                {certifications.map((cert) => (
                  <Text key={cert.id} style={styles.paragraph}>{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}</Text>
                ))}
              </View>
            ) : null}
            {languages.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Languages</Text>
                {languages.map((lang) => (
                  <Text key={lang.id} style={styles.paragraph}>{lang.name} <Text style={{ color: "#64748b" }}>— {lang.proficiency}</Text></Text>
                ))}
              </View>
            ) : null}
            {achievements.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                {achievements.map((ach) => (
                  <Text key={ach.id} style={styles.paragraph}><Text style={{ fontWeight: "bold" }}>{ach.title}</Text>: {ach.description}</Text>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <CustomSectionsPdf
        resume={resume}
        styles={{
          section: styles.section,
          sectionTitle: styles.sectionTitle,
          entry: styles.entry,
          entryTitle: styles.entryTitle,
          entryDate: styles.entryDate,
          entrySubtitle: styles.entrySubtitle,
          paragraph: styles.paragraph,
        }}
      />
    </Page>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  6. CREATIVE TEMPLATE – Two-column, pink accent, sidebar layout
// ══════════════════════════════════════════════════════════════════════════

const creativeStyles = StyleSheet.create({
  wrapper: { flexDirection: "row" },
  sidebar: { width: "33%", backgroundColor: "#fdf2f8", padding: 24, paddingTop: 36 },
  mainContent: { width: "67%", padding: 28 },
  name: { fontSize: 24, fontWeight: "black", color: "#db2777", marginBottom: 4, letterSpacing: -1 },
  divider: { width: 48, height: 5, backgroundColor: "#f472b6", borderRadius: 10, marginBottom: 12 },
  contactItem: { fontSize: 9, fontWeight: "medium", color: "#831843", marginBottom: 6 },
  sidebarTitle: { fontSize: 11, fontWeight: "bold", color: "#db2777", textTransform: "uppercase", letterSpacing: 2, marginTop: 24, marginBottom: 8 },
  skillGroupTitle: { fontSize: 8, fontWeight: "bold", color: "#831843", marginBottom: 4 },
  skillTag: { fontSize: 8, backgroundColor: "#fce7f3", color: "#9d174d", paddingHorizontal: 6, paddingVertical: 2, marginBottom: 3, marginRight: 3 },
  skillRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  langRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  langName: { fontSize: 9, fontWeight: "medium", color: "#831843" },
  langLevel: { fontSize: 8, color: "#831843", opacity: 0.7 },
  mainTitle: { fontSize: 16, fontWeight: "black", color: "#111827", letterSpacing: -0.5, marginBottom: 12 },
  section: { marginBottom: 24 },
  paragraph: { fontSize: 9, color: "#4b5563", fontWeight: "medium", lineHeight: 1.6 },
  entry: { marginBottom: 16, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#fbcfe8" },
  entryDot: { position: "absolute", width: 8, height: 8, backgroundColor: "#ec4899", borderRadius: 4, left: -5, top: 4 },
  entryTitle: { fontSize: 12, fontWeight: "bold", color: "#111827", marginBottom: 2 },
  entrySubtitle: { fontSize: 9, color: "#db2777", fontWeight: "medium", marginBottom: 4 },
  entrySubtitleDate: { color: "#9ca3af", fontWeight: "normal" },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  projCard: { width: "47%", backgroundColor: "#f9fafb", padding: 10, marginBottom: 8 },
  projName: { fontSize: 10, fontWeight: "bold", color: "#111827", marginBottom: 2 },
  projDesc: { fontSize: 8, color: "#4b5563", marginBottom: 4 },
  projTech: { fontSize: 7, fontWeight: "bold", color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 },
});

function CreativePdf({ resume }: { resume: ResumeData }) {
  const accent = resume.accentColor || "#db2777";
  const soft = accentWithAlpha(accent, 0.12);
  const pageStyle = { padding: 0, fontFamily: pdfFontFamily(resume.fontFamily) } as const;
  const styles = withTheme(creativeStyles, {
    sidebar: { backgroundColor: accentWithAlpha(accent, 0.05) },
    name: { color: accent },
    divider: { backgroundColor: accent },
    contactItem: { color: accent },
    sidebarTitle: { color: accent },
    skillGroupTitle: { color: accent },
    skillTag: { backgroundColor: soft, color: accent },
    langName: { color: accent },
    langLevel: { color: accent },
    entry: { borderLeftColor: accentWithAlpha(accent, 0.25) },
    entryDot: { backgroundColor: accent },
    entrySubtitle: { color: accent },
  });
  const { personalInfo, summary, experience, education, projects, skills, languages } = resume;

  return (
    <Page size="LETTER" style={pageStyle}>
      <View style={styles.wrapper}>
        {/* ── Sidebar ── */}
        <View style={styles.sidebar}>
          <Text style={styles.name}>{personalInfo.fullName}</Text>
          <View style={styles.divider} />

          <View>
            {personalInfo.email ? <Text style={styles.contactItem}>{personalInfo.email}</Text> : null}
            {personalInfo.phone ? <Text style={styles.contactItem}>{personalInfo.phone}</Text> : null}
            {personalInfo.linkedin ? <Text style={styles.contactItem}>{personalInfo.linkedin}</Text> : null}
            {personalInfo.github ? <Text style={styles.contactItem}>{personalInfo.github}</Text> : null}
            {personalInfo.portfolio ? <Text style={styles.contactItem}>{personalInfo.portfolio}</Text> : null}
          </View>

          {skills ? (
            <View>
              <Text style={styles.sidebarTitle}>Skills</Text>
              {skills.technical.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.skillGroupTitle}>TECHNICAL</Text>
                  <View style={styles.skillRow}>
                    {skills.technical.map(s => <Text key={s} style={styles.skillTag}>{s}</Text>)}
                  </View>
                </View>
              ) : null}
              {skills.frameworks.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.skillGroupTitle}>FRAMEWORKS</Text>
                  <View style={styles.skillRow}>
                    {skills.frameworks.map(s => <Text key={s} style={styles.skillTag}>{s}</Text>)}
                  </View>
                </View>
              ) : null}
              {skills.tools.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.skillGroupTitle}>TOOLS</Text>
                  <View style={styles.skillRow}>
                    {skills.tools.map(s => <Text key={s} style={styles.skillTag}>{s}</Text>)}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {languages.length > 0 ? (
            <View>
              <Text style={styles.sidebarTitle}>Languages</Text>
              {languages.map((l) => (
                <View key={l.id} style={styles.langRow}>
                  <Text style={styles.langName}>{l.name}</Text>
                  <Text style={styles.langLevel}>{l.proficiency}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* ── Main Content ── */}
        <View style={styles.mainContent}>
          {summary ? (
            <View style={styles.section}>
              <Text style={styles.mainTitle}>About Me</Text>
              <Text style={styles.paragraph}>{summary}</Text>
            </View>
          ) : null}

          {experience.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.mainTitle}>Experience</Text>
              {experience.map((exp) => (
                <View key={exp.id} style={styles.entry}>
                  <View style={styles.entryDot} />
                  <Text style={styles.entryTitle}>{exp.role}</Text>
                  <Text style={styles.entrySubtitle}>
                    {exp.company} <Text style={styles.entrySubtitleDate}>| {exp.startDate} – {exp.current ? "Present" : exp.endDate}</Text>
                  </Text>
                  {exp.responsibilities.length > 0 ? <BulletList items={exp.responsibilities} /> : null}
                </View>
              ))}
            </View>
          ) : null}

          {projects.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.mainTitle}>Projects</Text>
              <View style={styles.grid2}>
                {projects.map((proj) => (
                  <View key={proj.id} style={styles.projCard}>
                    <Text style={styles.projName}>{proj.name}</Text>
                    <Text style={styles.projDesc}>{proj.description}</Text>
                    {proj.technologies.length > 0 ? (
                      <Text style={styles.projTech}>{proj.technologies.join(", ")}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {education.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.mainTitle}>Education</Text>
              {education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: 10 }}>
                  <Text style={styles.entryTitle}>{edu.degree}</Text>
                  <Text style={{ fontSize: 9, color: "#4b5563" }}>
                    {edu.institution} <Text style={{ color: "#9ca3af" }}>| {edu.startDate} – {edu.endDate}</Text>
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <CustomSectionsPdf
            resume={resume}
            styles={{
              section: styles.section,
              sectionTitle: styles.mainTitle,
              entry: styles.entry,
              entryTitle: styles.entryTitle,
              entryDate: styles.entrySubtitleDate,
              entrySubtitle: styles.entrySubtitle,
              paragraph: styles.paragraph,
            }}
          />
        </View>
      </View>
    </Page>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  7. EXECUTIVE SIDEBAR – Two-column layout with dark sidebar
//     Inspired by Glalie/Gengar external templates
// ══════════════════════════════════════════════════════════════════════════

const sidebarStyles = StyleSheet.create({
  wrapper: { flexDirection: "row", height: "100%" },
  sidebar: { width: "30%", backgroundColor: "#1e293b", padding: 24, paddingTop: 36 },
  mainContent: { width: "70%", padding: 28, paddingTop: 36 },
  sidebarName: { fontSize: 18, fontWeight: "bold", color: "#ffffff", marginBottom: 4 },
  sidebarRole: { fontSize: 9, color: "#94a3b8", marginBottom: 20 },
  sidebarDivider: { height: 1, backgroundColor: "#334155", marginBottom: 16 },
  sidebarTitle: { fontSize: 8, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, marginTop: 12 },
  sidebarText: { fontSize: 8, color: "#cbd5e1", marginBottom: 4, lineHeight: 1.4 },
  sidebarLink: { fontSize: 8, color: "#60a5fa", marginBottom: 4 },
  skillTagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 6 },
  skillTag: { fontSize: 7, backgroundColor: "#334155", color: "#cbd5e1", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  mainSectionTitle: { fontSize: 10, fontWeight: "bold", color: "#1e293b", textTransform: "uppercase", letterSpacing: 1.5, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingBottom: 6, marginBottom: 10, marginTop: 6 },
  paragraph: { fontSize: 9, color: "#475569", marginBottom: 6, lineHeight: 1.5 },
  entry: { marginBottom: 12 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  entryTitle: { fontSize: 10, fontWeight: "bold", color: "#0f172a" },
  entryDate: { fontSize: 8, color: "#64748b" },
  entrySubtitle: { fontSize: 9, color: "#3b82f6", fontWeight: "medium", marginBottom: 3 },
  twoColumn: { flexDirection: "row", gap: 16 },
  column: { flex: 1 },
  labelText: { fontSize: 8, fontWeight: "bold", color: "#475569", marginBottom: 2 },
  valueText: { fontSize: 9, color: "#334155", marginBottom: 6 },
});

function ExecutiveSidebarPdf({ resume }: { resume: ResumeData }) {
  const accent = resume.accentColor || "#3b82f6";
  const pageStyle = { padding: 0, fontFamily: pdfFontFamily(resume.fontFamily) } as const;
  const styles = withTheme(sidebarStyles, {
    sidebarLink: { color: accent },
    entrySubtitle: { color: accent },
  });
  const { personalInfo, summary, experience, education, skills, certifications, achievements, languages, projects } = resume;

  return (
    <Page size="LETTER" style={pageStyle}>
      <View style={styles.wrapper}>
        {/* ── Sidebar ── */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarName}>{personalInfo.fullName}</Text>
          <Text style={styles.sidebarRole}>Software Engineer</Text>
          <View style={styles.sidebarDivider} />

          <Text style={styles.sidebarTitle}>Contact</Text>
          {personalInfo.email ? <Text style={styles.sidebarText}>{personalInfo.email}</Text> : null}
          {personalInfo.phone ? <Text style={styles.sidebarText}>{personalInfo.phone}</Text> : null}
          {personalInfo.linkedin ? <Text style={styles.sidebarLink}>{personalInfo.linkedin}</Text> : null}
          {personalInfo.github ? <Text style={styles.sidebarLink}>{personalInfo.github}</Text> : null}
          {personalInfo.portfolio ? <Text style={styles.sidebarLink}>{personalInfo.portfolio}</Text> : null}

          {languages.length > 0 ? (
            <View>
              <Text style={styles.sidebarTitle}>Languages</Text>
              {languages.map((l) => (
                <Text key={l.id} style={styles.sidebarText}>{l.name} — {l.proficiency}</Text>
              ))}
            </View>
          ) : null}

          {skills ? (
            <View>
              <Text style={styles.sidebarTitle}>Skills</Text>
              {skills.technical.length > 0 ? (
                <View style={styles.skillTagRow}>
                  {skills.technical.map(s => <Text key={s} style={styles.skillTag}>{s}</Text>)}
                </View>
              ) : null}
              {skills.frameworks.length > 0 ? (
                <View style={styles.skillTagRow}>
                  {skills.frameworks.map(s => <Text key={s} style={styles.skillTag}>{s}</Text>)}
                </View>
              ) : null}
              {skills.tools.length > 0 ? (
                <View style={styles.skillTagRow}>
                  {skills.tools.map(s => <Text key={s} style={styles.skillTag}>{s}</Text>)}
                </View>
              ) : null}
            </View>
          ) : null}

          {certifications.length > 0 ? (
            <View>
              <Text style={styles.sidebarTitle}>Certifications</Text>
              {certifications.map((cert) => (
                <Text key={cert.id} style={styles.sidebarText}>{cert.name}</Text>
              ))}
            </View>
          ) : null}
        </View>

        {/* ── Main Content ── */}
        <View style={styles.mainContent}>
          {summary ? (
            <View>
              <Text style={styles.mainSectionTitle}>Profile</Text>
              <Text style={styles.paragraph}>{summary}</Text>
            </View>
          ) : null}

          {experience.length > 0 ? (
            <View>
              <Text style={styles.mainSectionTitle}>Experience</Text>
              {experience.map((exp) => (
                <View key={exp.id} style={styles.entry}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{exp.role}</Text>
                    <Text style={styles.entryDate}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</Text>
                  </View>
                  <Text style={styles.entrySubtitle}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</Text>
                  {exp.responsibilities.length > 0 ? <BulletList items={exp.responsibilities} /> : null}
                </View>
              ))}
            </View>
          ) : null}

          {education.length > 0 ? (
            <View>
              <Text style={styles.mainSectionTitle}>Education</Text>
              {education.map((edu) => (
                <View key={edu.id} style={styles.entry}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{edu.institution}</Text>
                    <Text style={styles.entryDate}>{edu.startDate} – {edu.endDate}</Text>
                  </View>
                  <Text style={styles.entrySubtitle}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.cgpa ? ` | CGPA: ${edu.cgpa}` : ""}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {(projects.length > 0 || achievements.length > 0) ? (
            <View style={styles.twoColumn}>
              {projects.length > 0 ? (
                <View style={styles.column}>
                  <Text style={styles.mainSectionTitle}>Projects</Text>
                  {projects.map((proj) => (
                    <View key={proj.id} style={{ marginBottom: 8 }}>
                      <Text style={styles.entryTitle}>{proj.name}</Text>
                      <Text style={styles.paragraph}>{proj.description}</Text>
                      {proj.technologies.length > 0 ? (
                        <Text style={{ fontSize: 7, color: "#64748b" }}>Tech: {proj.technologies.join(", ")}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
              {achievements.length > 0 ? (
                <View style={styles.column}>
                  <Text style={styles.mainSectionTitle}>Achievements</Text>
                  {achievements.map((ach) => (
                    <Text key={ach.id} style={styles.paragraph}>
                      <Text style={{ fontWeight: "bold" }}>{ach.title}</Text>: {ach.description}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <CustomSectionsPdf
            resume={resume}
            styles={{
              section: { marginBottom: 12 },
              sectionTitle: styles.mainSectionTitle,
              entry: styles.entry,
              entryTitle: styles.entryTitle,
              entryDate: styles.entryDate,
              entrySubtitle: styles.entrySubtitle,
              paragraph: styles.paragraph,
            }}
          />
        </View>
      </View>
    </Page>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  8. MODERN CARD – Rounded card-style sections with borders
//     Inspired by Lapras external template
// ══════════════════════════════════════════════════════════════════════════

const cardStyles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.5, backgroundColor: "#f8fafc" },
  header: { marginBottom: 20 },
  name: { fontSize: 24, fontWeight: "bold", color: "#0f172a", marginBottom: 2 },
  contactRow: { fontSize: 9, color: "#64748b", flexDirection: "row", gap: 8, marginTop: 2 },
  card: { backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, marginBottom: 12, shadowOpacity: 0.05, shadowRadius: 4 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: "#0f172a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  paragraph: { fontSize: 9, color: "#475569", marginBottom: 4, lineHeight: 1.5 },
  entry: { marginBottom: 10 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 },
  entryTitle: { fontSize: 10, fontWeight: "bold", color: "#0f172a" },
  entryDate: { fontSize: 8, color: "#94a3b8" },
  entrySubtitle: { fontSize: 9, color: "#6366f1", marginBottom: 3 },
  twoColumn: { flexDirection: "row", gap: 12 },
  column: { flex: 1 },
  skillChip: { fontSize: 8, backgroundColor: "#eef2ff", color: "#4338ca", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 4, marginBottom: 4 },
  skillRow: { flexDirection: "row", flexWrap: "wrap" },
  label: { fontSize: 8, fontWeight: "bold", color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
});

function ModernCardPdf({ resume }: { resume: ResumeData }) {
  const accent = resume.accentColor || "#6366f1";
  const styles = withTheme(cardStyles, {
    page: { fontFamily: pdfFontFamily(resume.fontFamily) },
    entrySubtitle: { color: accent },
    label: { color: accent },
    skillChip: { backgroundColor: accentWithAlpha(accent, 0.12), color: accent },
  });
  const { personalInfo, summary, experience, education, projects, skills, certifications, achievements, languages } = resume;

  return (
    <Page size="LETTER" style={styles.page}>
      {/* ── Header Card ── */}
      <View style={styles.card}>
        <Text style={styles.name}>{personalInfo.fullName}</Text>
        <Text style={styles.contactRow}>
          {personalInfo.email}
          {personalInfo.phone ? <Text> | {personalInfo.phone}</Text> : null}
        </Text>
        {(personalInfo.linkedin || personalInfo.github || personalInfo.portfolio) ? (
          <Text style={styles.contactRow}>
            {[personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean).join(" | ")}
          </Text>
        ) : null}
      </View>

      {/* ── Summary Card ── */}
      {summary ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.paragraph}>{summary}</Text>
        </View>
      ) : null}

      {/* ── Experience Card ── */}
      {experience.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {experience.map((exp) => (
            <View key={exp.id} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{exp.role}</Text>
                <Text style={styles.entryDate}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</Text>
              {exp.responsibilities.length > 0 ? <BulletList items={exp.responsibilities} /> : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Education Card ── */}
      {education.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Education</Text>
          {education.map((edu) => (
            <View key={edu.id} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{edu.institution}</Text>
                <Text style={styles.entryDate}>{edu.startDate} – {edu.endDate}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.cgpa ? ` | CGPA: ${edu.cgpa}` : ""}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Skills + Languages Card ── */}
      {(skills || languages.length > 0) ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Skills & Languages</Text>
          <View style={styles.twoColumn}>
            {skills ? (
              <View style={styles.column}>
                {skills.technical.length > 0 ? (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.label}>Technical</Text>
                    <View style={styles.skillRow}>
                      {skills.technical.map(s => <Text key={s} style={styles.skillChip}>{s}</Text>)}
                    </View>
                  </View>
                ) : null}
                {skills.frameworks.length > 0 ? (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.label}>Frameworks</Text>
                    <View style={styles.skillRow}>
                      {skills.frameworks.map(s => <Text key={s} style={styles.skillChip}>{s}</Text>)}
                    </View>
                  </View>
                ) : null}
                {skills.tools.length > 0 ? (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.label}>Tools</Text>
                    <View style={styles.skillRow}>
                      {skills.tools.map(s => <Text key={s} style={styles.skillChip}>{s}</Text>)}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
            {languages.length > 0 ? (
              <View style={styles.column}>
                <Text style={styles.label}>Languages</Text>
                {languages.map((l) => (
                  <Text key={l.id} style={styles.paragraph}>{l.name} — {l.proficiency}</Text>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* ── Projects Card ── */}
      {projects.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {projects.map((proj) => (
            <View key={proj.id} style={styles.entry}>
              <Text style={styles.entryTitle}>{proj.name}</Text>
              <Text style={styles.paragraph}>{proj.description}</Text>
              {proj.technologies.length > 0 ? (
                <View style={styles.skillRow}>
                  {proj.technologies.map(t => <Text key={t} style={styles.skillChip}>{t}</Text>)}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Certifications Card ── */}
      {certifications.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {certifications.map((cert) => (
            <Text key={cert.id} style={styles.paragraph}>{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}{cert.date ? ` (${cert.date})` : ""}</Text>
          ))}
        </View>
      ) : null}

      {/* ── Achievements Card ── */}
      {achievements.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {achievements.map((ach) => (
            <Text key={ach.id} style={styles.paragraph}><Text style={{ fontWeight: "bold" }}>{ach.title}</Text>: {ach.description}</Text>
          ))}
        </View>
      ) : null}

      <CustomSectionsPdf
        resume={resume}
        styles={{
          section: styles.card,
          sectionTitle: styles.sectionTitle,
          entry: styles.entry,
          entryTitle: styles.entryTitle,
          entryDate: styles.entryDate,
          entrySubtitle: styles.entrySubtitle,
          paragraph: styles.paragraph,
        }}
      />
    </Page>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  Exported dispatcher — picks the right template component
// ══════════════════════════════════════════════════════════════════════════

export function ResumePDF({ resume }: { resume: ResumeData }) {
  switch (resume.template) {
    case "ats-professional":
      return (
        <Document>
          <AtsProfessionalPdf resume={resume} />
        </Document>
      );
    case "student":
      return (
        <Document>
          <StudentPdf resume={resume} />
        </Document>
      );
    case "minimal":
      return (
        <Document>
          <MinimalPdf resume={resume} />
        </Document>
      );
    case "executive":
      return (
        <Document>
          <ExecutivePdf resume={resume} />
        </Document>
      );
    case "creative":
      return (
        <Document>
          <CreativePdf resume={resume} />
        </Document>
      );
    case "executive-sidebar":
      return (
        <Document>
          <ExecutiveSidebarPdf resume={resume} />
        </Document>
      );
    case "modern-card":
      return (
        <Document>
          <ModernCardPdf resume={resume} />
        </Document>
      );
    case "modern":
    default:
      return (
        <Document>
          <ModernPdf resume={resume} />
        </Document>
      );
  }
}
