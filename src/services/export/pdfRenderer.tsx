import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ResumeData } from "@/types/resume";

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: "#2563eb",
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  contactLine: {
    fontSize: 9,
    color: "#6b7280",
    flexDirection: "row",
    gap: 4,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2563eb",
    textTransform: "uppercase",
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
    paddingBottom: 3,
  },
  entry: {
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  entryTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
  },
  entryDate: {
    fontSize: 8,
    color: "#9ca3af",
  },
  entrySubtitle: {
    fontSize: 9,
    color: "#4b5563",
    marginBottom: 3,
  },
  bulletList: {
    marginLeft: 14,
    marginTop: 2,
  },
  bulletLine: {
    flexDirection: "row",
    marginBottom: 1,
  },
  bulletPoint: {
    width: 8,
    fontSize: 9,
    color: "#374151",
  },
  bulletText: {
    fontSize: 9,
    color: "#374151",
    flex: 1,
  },
  skillCategory: {
    marginBottom: 4,
  },
  skillCategoryLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
  },
  skillCategoryItems: {
    fontSize: 9,
    color: "#4b5563",
  },
  twoColumn: {
    flexDirection: "row",
    gap: 16,
  },
  column: {
    flex: 1,
  },
  paragraph: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 4,
  },
});

// ── Sub-components ──────────────────────────────────────────────────────

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletLine}>
          <Text style={styles.bulletPoint}>{"\u2022"}</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Main Document Component ─────────────────────────────────────────────

function ResumePDF({ resume }: { resume: ResumeData }) {
  const {
    personalInfo,
    summary,
    experience,
    education,
    projects,
    skills,
    certifications,
    achievements,
    languages,
  } = resume;

  return (
    <Document>
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
                {[personalInfo.linkedin, personalInfo.github, personalInfo.portfolio]
                  .filter(Boolean)
                  .join(" | ")}
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
                  <Text style={styles.entryDate}>
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                  </Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {exp.company}
                  {exp.location ? `, ${exp.location}` : ""}
                </Text>
                {exp.responsibilities.length > 0 ? (
                  <BulletList items={exp.responsibilities} />
                ) : null}
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
                  <Text style={styles.entryDate}>
                    {edu.startDate} – {edu.endDate}
                  </Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}
                  {edu.cgpa ? ` | CGPA: ${edu.cgpa}` : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Two-column: Skills / Languages ── */}
        {skills || languages.length > 0 ? (
          <View style={styles.twoColumn}>
            {skills ? (
              <View style={[styles.section, styles.column]}>
                <Text style={styles.sectionTitle}>Skills</Text>
                {skills.technical.length > 0 ? (
                  <View style={styles.skillCategory}>
                    <Text>
                      <Text style={styles.skillCategoryLabel}>Technical: </Text>
                      <Text style={styles.skillCategoryItems}>
                        {skills.technical.join(", ")}
                      </Text>
                    </Text>
                  </View>
                ) : null}
                {skills.frameworks.length > 0 ? (
                  <View style={styles.skillCategory}>
                    <Text>
                      <Text style={styles.skillCategoryLabel}>Frameworks: </Text>
                      <Text style={styles.skillCategoryItems}>
                        {skills.frameworks.join(", ")}
                      </Text>
                    </Text>
                  </View>
                ) : null}
                {skills.tools.length > 0 ? (
                  <View style={styles.skillCategory}>
                    <Text>
                      <Text style={styles.skillCategoryLabel}>Tools: </Text>
                      <Text style={styles.skillCategoryItems}>
                        {skills.tools.join(", ")}
                      </Text>
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            {languages.length > 0 ? (
              <View style={[styles.section, styles.column]}>
                <Text style={styles.sectionTitle}>Languages</Text>
                {languages.map((lang) => (
                  <Text key={lang.id} style={styles.paragraph}>
                    {lang.name} — {lang.proficiency}
                  </Text>
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
                  <Text style={styles.entrySubtitle}>
                    Technologies: {proj.technologies.join(", ")}
                  </Text>
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
                {cert.name}
                {cert.issuer ? ` — ${cert.issuer}` : ""}
                {cert.date ? ` (${cert.date})` : ""}
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
      </Page>
    </Document>
  );
}

// ── Public API ──────────────────────────────────────────────────────────

export async function generatePdfBuffer(resume: ResumeData): Promise<Buffer> {
  return await renderToBuffer(<ResumePDF resume={resume} />);
}
