import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumeData } from "@/types/resume";

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

// ── Section types for section-style reusable rendering ──────────────────
interface SectionDef {
  title: string;
  children: React.ReactNode;
  style?: any;
}

function SimpleSection({ title, children, style }: SectionDef) {
  if (!children) return null;
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <Text style={modernStyles.sectionTitle}>{title}</Text>
      {children}
    </View>
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
  const { personalInfo, summary, experience, education, projects, skills, certifications, achievements, languages } = resume;

  return (
    <Page size="LETTER" style={modernStyles.page}>
      {/* ── Header ── */}
      <View style={modernStyles.header}>
        <Text style={modernStyles.name}>{personalInfo.fullName}</Text>
        <View style={modernStyles.contactLine}>
          <Text>{personalInfo.email}</Text>
          {personalInfo.phone ? <Text> | {personalInfo.phone}</Text> : null}
        </View>
        {personalInfo.linkedin || personalInfo.github || personalInfo.portfolio ? (
          <View style={modernStyles.contactLine}>
            <Text>
              {[personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean).join(" | ")}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Summary ── */}
      {summary ? (
        <View style={modernStyles.section}>
          <Text style={modernStyles.sectionTitle}>Professional Summary</Text>
          <Text style={modernStyles.paragraph}>{summary}</Text>
        </View>
      ) : null}

      {/* ── Experience ── */}
      {experience.length > 0 ? (
        <View style={modernStyles.section}>
          <Text style={modernStyles.sectionTitle}>Experience</Text>
          {experience.map((exp) => (
            <View key={exp.id} style={modernStyles.entry}>
              <View style={modernStyles.entryHeader}>
                <Text style={modernStyles.entryTitle}>{exp.role}</Text>
                <Text style={modernStyles.entryDate}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</Text>
              </View>
              <Text style={modernStyles.entrySubtitle}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</Text>
              {exp.responsibilities.length > 0 ? <BulletList items={exp.responsibilities} /> : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Education ── */}
      {education.length > 0 ? (
        <View style={modernStyles.section}>
          <Text style={modernStyles.sectionTitle}>Education</Text>
          {education.map((edu) => (
            <View key={edu.id} style={modernStyles.entry}>
              <View style={modernStyles.entryHeader}>
                <Text style={modernStyles.entryTitle}>{edu.institution}</Text>
                <Text style={modernStyles.entryDate}>{edu.startDate} – {edu.endDate}</Text>
              </View>
              <Text style={modernStyles.entrySubtitle}>
                {edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.cgpa ? ` | CGPA: ${edu.cgpa}` : ""}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Two-column: Skills / Languages ── */}
      {(skills || languages.length > 0) ? (
        <View style={modernStyles.twoColumn}>
          {skills ? (
            <View style={[modernStyles.section, modernStyles.column]}>
              <Text style={modernStyles.sectionTitle}>Skills</Text>
              {skills.technical.length > 0 ? (
                <View style={modernStyles.skillGroup}>
                  <Text><Text style={modernStyles.skillLabel}>Technical: </Text><Text style={modernStyles.skillItems}>{skills.technical.join(", ")}</Text></Text>
                </View>
              ) : null}
              {skills.frameworks.length > 0 ? (
                <View style={modernStyles.skillGroup}>
                  <Text><Text style={modernStyles.skillLabel}>Frameworks: </Text><Text style={modernStyles.skillItems}>{skills.frameworks.join(", ")}</Text></Text>
                </View>
              ) : null}
              {skills.tools.length > 0 ? (
                <View style={modernStyles.skillGroup}>
                  <Text><Text style={modernStyles.skillLabel}>Tools: </Text><Text style={modernStyles.skillItems}>{skills.tools.join(", ")}</Text></Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {languages.length > 0 ? (
            <View style={[modernStyles.section, modernStyles.column]}>
              <Text style={modernStyles.sectionTitle}>Languages</Text>
              {languages.map((lang) => (
                <Text key={lang.id} style={modernStyles.paragraph}>{lang.name} — {lang.proficiency}</Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ── Projects ── */}
      {projects.length > 0 ? (
        <View style={modernStyles.section}>
          <Text style={modernStyles.sectionTitle}>Projects</Text>
          {projects.map((proj) => (
            <View key={proj.id} style={modernStyles.entry}>
              <Text style={modernStyles.entryTitle}>{proj.name}</Text>
              <Text style={modernStyles.paragraph}>{proj.description}</Text>
              {proj.technologies.length > 0 ? (
                <Text style={modernStyles.entrySubtitle}>Technologies: {proj.technologies.join(", ")}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Certifications ── */}
      {certifications.length > 0 ? (
        <View style={modernStyles.section}>
          <Text style={modernStyles.sectionTitle}>Certifications</Text>
          {certifications.map((cert) => (
            <Text key={cert.id} style={modernStyles.paragraph}>
              {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}{cert.date ? ` (${cert.date})` : ""}
            </Text>
          ))}
        </View>
      ) : null}

      {/* ── Achievements ── */}
      {achievements.length > 0 ? (
        <View style={modernStyles.section}>
          <Text style={modernStyles.sectionTitle}>Achievements</Text>
          {achievements.map((ach) => (
            <View key={ach.id} style={modernStyles.entry}>
              <Text style={modernStyles.entryTitle}>{ach.title}</Text>
              <Text style={modernStyles.paragraph}>{ach.description}</Text>
            </View>
          ))}
        </View>
      ) : null}
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
  const { personalInfo, summary, experience, education, skills, certifications, achievements, languages } = resume;

  return (
    <Page size="LETTER" style={atsStyles.page}>
      <View style={atsStyles.header}>
        <Text style={atsStyles.name}>{personalInfo.fullName}</Text>
        <Text style={atsStyles.contactLine}>
          {personalInfo.email} | {personalInfo.phone} | {personalInfo.linkedin} | {personalInfo.github}
        </Text>
      </View>

      {summary ? (
        <View style={atsStyles.section} wrap={false}>
          <Text style={atsStyles.sectionTitle}>Summary</Text>
          <Text style={atsStyles.paragraph}>{summary}</Text>
        </View>
      ) : null}

      {experience.length > 0 ? (
        <View style={atsStyles.section} wrap={false}>
          <Text style={atsStyles.sectionTitle}>Experience</Text>
          {experience.map((exp) => (
            <View key={exp.id} style={atsStyles.entry}>
              <View style={atsStyles.entryHeader}>
                <Text style={atsStyles.entryTitle}>{exp.role}</Text>
                <Text style={atsStyles.entryDate}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</Text>
              </View>
              <Text style={atsStyles.entrySubtitle}>{exp.company}</Text>
              {exp.responsibilities.length > 0 ? <BulletList items={exp.responsibilities} /> : null}
            </View>
          ))}
        </View>
      ) : null}

      {education.length > 0 ? (
        <View style={atsStyles.section} wrap={false}>
          <Text style={atsStyles.sectionTitle}>Education</Text>
          {education.map((edu) => (
            <Text key={edu.id} style={atsStyles.paragraph}>
              <Text style={atsStyles.entryTitle}>{edu.degree}</Text> — {edu.institution}{edu.cgpa ? `, CGPA: ${edu.cgpa}` : ""} ({edu.endDate})
            </Text>
          ))}
        </View>
      ) : null}

      {skills ? (
        <View style={atsStyles.section} wrap={false}>
          <Text style={atsStyles.sectionTitle}>Skills</Text>
          {skills.technical.length > 0 ? (
            <Text style={atsStyles.skillLine}><Text style={atsStyles.skillLabel}>Technical: </Text>{skills.technical.join(", ")}</Text>
          ) : null}
          {skills.frameworks.length > 0 ? (
            <Text style={atsStyles.skillLine}><Text style={atsStyles.skillLabel}>Frameworks: </Text>{skills.frameworks.join(", ")}</Text>
          ) : null}
          {skills.tools.length > 0 ? (
            <Text style={atsStyles.skillLine}><Text style={atsStyles.skillLabel}>Tools: </Text>{skills.tools.join(", ")}</Text>
          ) : null}
        </View>
      ) : null}

      {certifications.length > 0 ? (
        <View style={atsStyles.section} wrap={false}>
          <Text style={atsStyles.sectionTitle}>Certifications</Text>
          {certifications.map((cert) => (
            <Text key={cert.id} style={atsStyles.paragraph}>{cert.name} — {cert.issuer}</Text>
          ))}
        </View>
      ) : null}

      {achievements.length > 0 ? (
        <View style={atsStyles.section} wrap={false}>
          <Text style={atsStyles.sectionTitle}>Achievements</Text>
          {achievements.map((ach) => (
            <Text key={ach.id} style={atsStyles.paragraph}><Text style={{ fontWeight: "bold" }}>{ach.title}</Text>: {ach.description}</Text>
          ))}
        </View>
      ) : null}

      {languages.length > 0 ? (
        <View style={atsStyles.section} wrap={false}>
          <Text style={atsStyles.sectionTitle}>Languages</Text>
          <Text style={atsStyles.paragraph}>{languages.map(l => `${l.name} (${l.proficiency})`).join(", ")}</Text>
        </View>
      ) : null}
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
  const { personalInfo, summary, education, projects, skills, certifications, achievements, languages } = resume;

  return (
    <Page size="LETTER" style={studentStyles.page}>
      <View style={studentStyles.header}>
        <Text style={studentStyles.name}>{personalInfo.fullName}</Text>
        <Text style={studentStyles.contactLine}>{personalInfo.email} | {personalInfo.phone}</Text>
        {personalInfo.linkedin ? <Text style={studentStyles.contactLine}>{personalInfo.linkedin}{personalInfo.github ? ` | ${personalInfo.github}` : ""}</Text> : null}
      </View>

      {summary ? (
        <View style={studentStyles.section} wrap={false}>
          <Text style={studentStyles.sectionTitle}>Summary</Text>
          <Text style={studentStyles.paragraph}>{summary}</Text>
        </View>
      ) : null}

      {education.length > 0 ? (
        <View style={studentStyles.section} wrap={false}>
          <Text style={studentStyles.sectionTitle}>Education</Text>
          {education.map((edu) => (
            <View key={edu.id} style={studentStyles.entry}>
              <View style={studentStyles.entryHeader}>
                <Text style={studentStyles.entryTitle}>{edu.institution}</Text>
                <Text style={studentStyles.entryDate}>{edu.endDate}</Text>
              </View>
              <Text style={studentStyles.entrySubtitle}>
                {edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.cgpa ? ` — CGPA: ${edu.cgpa}` : ""}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {projects.length > 0 ? (
        <View style={studentStyles.section} wrap={false}>
          <Text style={studentStyles.sectionTitle}>Projects</Text>
          {projects.map((proj) => (
            <View key={proj.id} style={studentStyles.entry}>
              <Text style={studentStyles.entryTitle}>{proj.name}</Text>
              <Text style={studentStyles.paragraph}>{proj.description}</Text>
              {proj.technologies.length > 0 ? (
                <Text style={studentStyles.entrySubtitle}>Technologies: {proj.technologies.join(", ")}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {skills ? (
        <View style={studentStyles.section} wrap={false}>
          <Text style={studentStyles.sectionTitle}>Skills</Text>
          {skills.technical.length > 0 ? (
            <Text style={studentStyles.skillLine}><Text style={studentStyles.skillLabel}>Technical: </Text>{skills.technical.join(", ")}</Text>
          ) : null}
          {skills.tools.length > 0 ? (
            <Text style={studentStyles.skillLine}><Text style={studentStyles.skillLabel}>Tools: </Text>{skills.tools.join(", ")}</Text>
          ) : null}
        </View>
      ) : null}

      {certifications.length > 0 ? (
        <View style={studentStyles.section} wrap={false}>
          <Text style={studentStyles.sectionTitle}>Certifications</Text>
          {certifications.map((cert) => (
            <Text key={cert.id} style={studentStyles.paragraph}>{cert.name} — {cert.issuer}</Text>
          ))}
        </View>
      ) : null}

      {achievements.length > 0 ? (
        <View style={studentStyles.section} wrap={false}>
          <Text style={studentStyles.sectionTitle}>Achievements</Text>
          {achievements.map((ach) => (
            <Text key={ach.id} style={studentStyles.paragraph}>— {ach.title}{ach.description ? `: ${ach.description}` : ""}</Text>
          ))}
        </View>
      ) : null}

      {languages.length > 0 ? (
        <View style={studentStyles.section} wrap={false}>
          <Text style={studentStyles.sectionTitle}>Languages</Text>
          <Text style={studentStyles.paragraph}>{languages.map(l => `${l.name} (${l.proficiency})`).join(", ")}</Text>
        </View>
      ) : null}
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
  const { personalInfo, summary, experience, education, skills, certifications, achievements, languages } = resume;

  return (
    <Page size="LETTER" style={minimalStyles.page}>
      <Text style={minimalStyles.name}>{personalInfo.fullName}</Text>
      <Text style={minimalStyles.contactLine}>{personalInfo.email}{personalInfo.phone ? ` / ${personalInfo.phone}` : ""}</Text>

      {summary ? (
        <View style={minimalStyles.section}>
          <Text style={minimalStyles.paragraph}>{summary}</Text>
        </View>
      ) : null}

      {experience.length > 0 ? (
        <View style={minimalStyles.section}>
          <Text style={minimalStyles.sectionLabel}>Experience</Text>
          {experience.map((exp) => (
            <View key={exp.id} style={minimalStyles.entry}>
              <View style={minimalStyles.entryHeader}>
                <Text style={minimalStyles.entryTitle}>{exp.role}</Text>
                <Text style={minimalStyles.entryDate}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</Text>
              </View>
              <Text style={minimalStyles.entrySubtitle}>{exp.company}</Text>
              {exp.responsibilities.map((r, i) => (
                <Text key={i} style={minimalStyles.respText}>{r}</Text>
              ))}
            </View>
          ))}
        </View>
      ) : null}

      {education.length > 0 ? (
        <View style={minimalStyles.section}>
          <Text style={minimalStyles.sectionLabel}>Education</Text>
          {education.map((edu) => (
            <View key={edu.id} style={minimalStyles.entry}>
              <Text style={minimalStyles.entryTitle}>{edu.institution}</Text>
              <Text style={minimalStyles.entrySubtitle}>{edu.degree}{edu.cgpa ? `, CGPA: ${edu.cgpa}` : ""}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {skills ? (
        <View style={minimalStyles.section}>
          <Text style={minimalStyles.sectionLabel}>Skills</Text>
          <Text style={minimalStyles.skillsText}>
            {[...skills.technical, ...skills.frameworks, ...skills.tools, ...skills.soft].join(" \u00B7 ")}
          </Text>
        </View>
      ) : null}

      {certifications.length > 0 ? (
        <View style={minimalStyles.section}>
          <Text style={minimalStyles.sectionLabel}>Certifications</Text>
          {certifications.map((cert) => (
            <Text key={cert.id} style={minimalStyles.paragraph}>{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}</Text>
          ))}
        </View>
      ) : null}

      {achievements.length > 0 ? (
        <View style={minimalStyles.section}>
          <Text style={minimalStyles.sectionLabel}>Achievements</Text>
          {achievements.map((ach) => (
            <Text key={ach.id} style={minimalStyles.paragraph}><Text style={{ fontWeight: "bold" }}>{ach.title}</Text>: {ach.description}</Text>
          ))}
        </View>
      ) : null}

      {languages.length > 0 ? (
        <View style={minimalStyles.section}>
          <Text style={minimalStyles.sectionLabel}>Languages</Text>
          <Text style={minimalStyles.paragraph}>{languages.map(l => `${l.name} (${l.proficiency})`).join(" · ")}</Text>
        </View>
      ) : null}
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
  const { personalInfo, summary, experience, education, skills, certifications, achievements, languages, projects } = resume;

  return (
    <Page size="LETTER" style={execStyles.page}>
      <View style={execStyles.topBar} />
      <View style={execStyles.header}>
        <Text style={execStyles.name}>{personalInfo.fullName}</Text>
        <Text style={execStyles.contactLine}>{personalInfo.email}{personalInfo.phone ? ` \u2022 ${personalInfo.phone}` : ""}</Text>
        {(personalInfo.linkedin || personalInfo.github || personalInfo.portfolio) ? (
          <Text style={[execStyles.contactLine, { marginTop: 4 }]}>
            {[personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean).join(" \u2022 ")}
          </Text>
        ) : null}
      </View>

      {summary ? (
        <View style={execStyles.section} wrap={false}>
          <Text style={execStyles.sectionTitle}>Executive Summary</Text>
          <Text style={execStyles.paragraph}>{summary}</Text>
        </View>
      ) : null}

      {experience.length > 0 ? (
        <View style={execStyles.section} wrap={false}>
          <Text style={execStyles.sectionTitle}>Professional Experience</Text>
          {experience.map((exp) => (
            <View key={exp.id} style={execStyles.entry}>
              <View style={execStyles.entryHeader}>
                <Text style={execStyles.entryTitle}>{exp.role}</Text>
                <Text style={execStyles.entryDate}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</Text>
              </View>
              <Text style={execStyles.entrySubtitle}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</Text>
              {exp.responsibilities.length > 0 ? <BulletList items={exp.responsibilities} /> : null}
            </View>
          ))}
        </View>
      ) : null}

      {education.length > 0 ? (
        <View style={execStyles.section} wrap={false}>
          <Text style={execStyles.sectionTitle}>Education</Text>
          {education.map((edu) => (
            <View key={edu.id} style={[execStyles.entry, { marginBottom: 8 }]}>
              <View style={execStyles.entryHeader}>
                <Text style={execStyles.entryTitle}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</Text>
                <Text style={execStyles.entryDate}>{edu.startDate} – {edu.endDate}</Text>
              </View>
              <Text style={execStyles.entrySubtitle}>{edu.institution}</Text>
              {edu.cgpa ? <Text style={[execStyles.paragraph, { color: "#64748b", marginTop: 2 }]}>CGPA: {edu.cgpa}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      {(skills || certifications.length > 0 || languages.length > 0 || projects.length > 0 || achievements.length > 0) ? (
        <View style={execStyles.twoColumn}>
          {skills ? (
            <View style={execStyles.column}>
              <Text style={execStyles.sectionTitle}>Core Competencies</Text>
              {skills.technical.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={execStyles.skillLabel}>Technical</Text>
                  <Text style={execStyles.skillText}>{skills.technical.join(", ")}</Text>
                </View>
              ) : null}
              {skills.frameworks.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={execStyles.skillLabel}>Frameworks</Text>
                  <Text style={execStyles.skillText}>{skills.frameworks.join(", ")}</Text>
                </View>
              ) : null}
              {skills.tools.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={execStyles.skillLabel}>Tools</Text>
                  <Text style={execStyles.skillText}>{skills.tools.join(", ")}</Text>
                </View>
              ) : null}
              {projects.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={execStyles.sectionTitle}>Key Projects</Text>
                  {projects.map((proj) => (
                    <View key={proj.id} style={{ marginBottom: 6 }}>
                      <Text style={execStyles.entryTitle}>{proj.name}</Text>
                      <Text style={execStyles.paragraph}>{proj.description}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={execStyles.column}>
            {certifications.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={execStyles.sectionTitle}>Certifications</Text>
                {certifications.map((cert) => (
                  <Text key={cert.id} style={execStyles.paragraph}>{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}</Text>
                ))}
              </View>
            ) : null}
            {languages.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={execStyles.sectionTitle}>Languages</Text>
                {languages.map((lang) => (
                  <Text key={lang.id} style={execStyles.paragraph}>{lang.name} <Text style={{ color: "#64748b" }}>— {lang.proficiency}</Text></Text>
                ))}
              </View>
            ) : null}
            {achievements.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={execStyles.sectionTitle}>Achievements</Text>
                {achievements.map((ach) => (
                  <Text key={ach.id} style={execStyles.paragraph}><Text style={{ fontWeight: "bold" }}>{ach.title}</Text>: {ach.description}</Text>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
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
  const { personalInfo, summary, experience, education, projects, skills, languages } = resume;

  return (
    <Page size="LETTER" style={{ padding: 0 }}>
      <View style={creativeStyles.wrapper}>
        {/* ── Sidebar ── */}
        <View style={creativeStyles.sidebar}>
          <Text style={creativeStyles.name}>{personalInfo.fullName}</Text>
          <View style={creativeStyles.divider} />

          <View>
            {personalInfo.email ? <Text style={creativeStyles.contactItem}>{personalInfo.email}</Text> : null}
            {personalInfo.phone ? <Text style={creativeStyles.contactItem}>{personalInfo.phone}</Text> : null}
            {personalInfo.linkedin ? <Text style={creativeStyles.contactItem}>{personalInfo.linkedin}</Text> : null}
            {personalInfo.github ? <Text style={creativeStyles.contactItem}>{personalInfo.github}</Text> : null}
            {personalInfo.portfolio ? <Text style={creativeStyles.contactItem}>{personalInfo.portfolio}</Text> : null}
          </View>

          {skills ? (
            <View>
              <Text style={creativeStyles.sidebarTitle}>Skills</Text>
              {skills.technical.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={creativeStyles.skillGroupTitle}>TECHNICAL</Text>
                  <View style={creativeStyles.skillRow}>
                    {skills.technical.map(s => <Text key={s} style={creativeStyles.skillTag}>{s}</Text>)}
                  </View>
                </View>
              ) : null}
              {skills.frameworks.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={creativeStyles.skillGroupTitle}>FRAMEWORKS</Text>
                  <View style={creativeStyles.skillRow}>
                    {skills.frameworks.map(s => <Text key={s} style={creativeStyles.skillTag}>{s}</Text>)}
                  </View>
                </View>
              ) : null}
              {skills.tools.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={creativeStyles.skillGroupTitle}>TOOLS</Text>
                  <View style={creativeStyles.skillRow}>
                    {skills.tools.map(s => <Text key={s} style={creativeStyles.skillTag}>{s}</Text>)}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {languages.length > 0 ? (
            <View>
              <Text style={creativeStyles.sidebarTitle}>Languages</Text>
              {languages.map((l) => (
                <View key={l.id} style={creativeStyles.langRow}>
                  <Text style={creativeStyles.langName}>{l.name}</Text>
                  <Text style={creativeStyles.langLevel}>{l.proficiency}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* ── Main Content ── */}
        <View style={creativeStyles.mainContent}>
          {summary ? (
            <View style={creativeStyles.section}>
              <Text style={creativeStyles.mainTitle}>About Me</Text>
              <Text style={creativeStyles.paragraph}>{summary}</Text>
            </View>
          ) : null}

          {experience.length > 0 ? (
            <View style={creativeStyles.section}>
              <Text style={creativeStyles.mainTitle}>Experience</Text>
              {experience.map((exp) => (
                <View key={exp.id} style={creativeStyles.entry}>
                  <View style={creativeStyles.entryDot} />
                  <Text style={creativeStyles.entryTitle}>{exp.role}</Text>
                  <Text style={creativeStyles.entrySubtitle}>
                    {exp.company} <Text style={creativeStyles.entrySubtitleDate}>| {exp.startDate} – {exp.current ? "Present" : exp.endDate}</Text>
                  </Text>
                  {exp.responsibilities.length > 0 ? <BulletList items={exp.responsibilities} /> : null}
                </View>
              ))}
            </View>
          ) : null}

          {projects.length > 0 ? (
            <View style={creativeStyles.section}>
              <Text style={creativeStyles.mainTitle}>Projects</Text>
              <View style={creativeStyles.grid2}>
                {projects.map((proj) => (
                  <View key={proj.id} style={creativeStyles.projCard}>
                    <Text style={creativeStyles.projName}>{proj.name}</Text>
                    <Text style={creativeStyles.projDesc}>{proj.description}</Text>
                    {proj.technologies.length > 0 ? (
                      <Text style={creativeStyles.projTech}>{proj.technologies.join(", ")}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {education.length > 0 ? (
            <View style={creativeStyles.section}>
              <Text style={creativeStyles.mainTitle}>Education</Text>
              {education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: 10 }}>
                  <Text style={creativeStyles.entryTitle}>{edu.degree}</Text>
                  <Text style={{ fontSize: 9, color: "#4b5563" }}>
                    {edu.institution} <Text style={{ color: "#9ca3af" }}>| {edu.startDate} – {edu.endDate}</Text>
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
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
    case "modern":
    default:
      return (
        <Document>
          <ModernPdf resume={resume} />
        </Document>
      );
  }
}
