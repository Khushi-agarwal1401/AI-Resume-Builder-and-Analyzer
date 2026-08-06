import type { CSSProperties, ReactNode } from "react";
import type { ResumeData, TargetLevel } from "@/types/resume";
import { RESUME_TYPES, getOrderedSections } from "@/features/resume-builder/config/resume-types";
import type { ImportedTemplateConfig } from "./catalog";

/**
 * Generic data-driven renderer. Every imported template is pure config
 * (theme/typography/layout + header/section/skills styles); this single
 * component draws any of them, so 88 designs share one implementation.
 */

/** Pick a CSS font stack from a source family name (the app ships no webfonts). */
function fontStack(family: string): string {
  const f = family.toLowerCase();
  if (f.includes("mono")) return "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
  if (
    f.includes("serif") ||
    f.includes("garamond") ||
    f.includes("playfair") ||
    f.includes("cormorant") ||
    f.includes("times") ||
    f.includes("tinos") ||
    f.includes("charter") ||
    f.includes("computer modern") ||
    f.includes("fontin") ||
    f.includes("gentium") ||
    f.includes("latin modern") ||
    f.includes("spectral")
  ) {
    return "Georgia, 'Times New Roman', serif";
  }
  return "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
}

export function ImportedTemplate({
  resume,
  config,
}: {
  resume: ResumeData;
  config: ImportedTemplateConfig;
}) {
  const { theme, typography, layout } = config;
  const bg = theme.background || "#ffffff";
  const fg = theme.text;
  const muted = theme.muted;
  const primary = theme.primary;
  const bodyFont = fontStack(typography.fontFamily);
  const headingFont = fontStack(typography.headingFamily);
  const nameFont = fontStack(typography.nameFamily);
  const bodySize = typography.fontSize;
  const headingSize = bodySize * typography.headingScale;
  const nameSize = bodySize * 1.9;
  const typeConfig = RESUME_TYPES[(resume.targetLevel as TargetLevel) || "fresher"] || RESUME_TYPES.fresher;
  const sections = getOrderedSections(resume, typeConfig);
  const gap = layout.sectionGap ?? 12;
  const itemGap = layout.itemGap ?? 6;
  const personal = resume.personalInfo;
  const initials = (personal.fullName || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Which section ids live in the sidebar for two-column layouts.
  const SIDEBAR_IDS = new Set([
    "skills",
    "languages",
    "certifications",
    "achievements",
    "interests",
    "codingProfiles",
  ]);
  const sidebarSections = sections.filter((s) => SIDEBAR_IDS.has(s.id));
  const mainSections = sections.filter((s) => !SIDEBAR_IDS.has(s.id));

  const sectionTitle = (label: string): ReactNode => {
    const titleStyle: CSSProperties = {
      fontFamily: headingFont,
      fontSize: headingSize,
      fontWeight: 700,
      color: fg,
      textTransform: typography.uppercaseHeadings ? "uppercase" : "none",
      letterSpacing: typography.uppercaseHeadings ? "0.06em" : "0",
      marginBottom: 6,
    };
    switch (config.section) {
      case "underline":
        return (
          <div style={{ borderBottom: `1px solid ${muted}`, paddingBottom: 3, marginBottom: 8 }}>
            <div style={titleStyle}>{label}</div>
          </div>
        );
      case "bar":
        return (
          <div style={{ marginBottom: 8 }}>
            <div style={titleStyle}>{label}</div>
            <div style={{ width: 34, height: 3, backgroundColor: primary, marginTop: 4 }} />
          </div>
        );
      case "rule-after":
        return (
          <div style={{ marginBottom: 8 }}>
            <div style={titleStyle}>{label}</div>
            <div style={{ height: 1, backgroundColor: muted, opacity: 0.5, marginTop: 4 }} />
          </div>
        );
      case "side":
        return (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 8,
              borderBottom: `1px solid ${primary}`,
              paddingBottom: 3,
            }}
          >
            <span style={{ fontFamily: nameFont, fontSize: headingSize * 0.85, fontWeight: 800, color: primary, letterSpacing: "0.04em" }}>
              {label}
            </span>
          </div>
        );
      default:
        return <div style={titleStyle}>{label}</div>;
    }
  };

  const bulletList = (items: string[]) => (
    <ul style={{ margin: "4px 0 0", paddingLeft: 16, listStyle: "disc" }}>
      {items.map((r, i) => (
        <li key={i} style={{ marginBottom: 2, lineHeight: 1.4 }}>{r}</li>
      ))}
    </ul>
  );

  const renderSkills = (skills: ResumeData["skills"]) => {
    const groups = [
      { label: "Technical", items: skills.technical },
      { label: "Frameworks", items: skills.frameworks },
      { label: "Tools", items: skills.tools },
      { label: "Soft", items: skills.soft },
    ].filter((g) => g.items.length > 0);
    const chip: CSSProperties = {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      backgroundColor: `${primary}22`,
      color: fg,
      fontSize: bodySize - 0.5,
      marginRight: 4,
      marginBottom: 4,
    };
    switch (config.skills) {
      case "chips":
      case "grouped-chips":
        return (
          <div>
            {config.skills === "grouped-chips" && groups.length > 1
              ? groups.map((g) => (
                  <div key={g.label} style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: muted, fontSize: bodySize - 1 }}>{g.label}: </span>
                    {g.items.map((s) => (
                      <span key={s} style={chip}>{s}</span>
                    ))}
                  </div>
                ))
              : groups.map((g) => g.items).flat().map((s) => <span key={s} style={chip}>{s}</span>)}
          </div>
        );
      case "bars":
        return (
          <div>
            {groups.map((g) => (
              <div key={g.label} style={{ marginBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: bodySize - 0.5, marginBottom: 2 }}>{g.label}</div>
                {g.items.slice(0, 6).map((s) => (
                  <div key={s} style={{ marginBottom: 3 }}>
                    <div style={{ fontSize: bodySize - 1 }}>{s}</div>
                    <div style={{ height: 3, backgroundColor: `${muted}33`, borderRadius: 2 }}>
                      <div style={{ width: "75%", height: 3, backgroundColor: primary, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      case "dots":
        return (
          <div>
            {groups.map((g) => (
              <div key={g.label} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 600, fontSize: bodySize - 0.5 }}>{g.label}</div>
                {g.items.slice(0, 6).map((s) => (
                  <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: bodySize - 1 }}>{s}</span>
                    <span style={{ color: primary, fontSize: bodySize - 2, letterSpacing: 2 }}>
                      {"●".repeat(3)}
                      <span style={{ color: `${muted}44` }}>{"●".repeat(2)}</span>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div style={{ lineHeight: 1.5 }}>
            {groups.map((g, gi) => (
              <span key={g.label}>
                {gi > 0 && <span style={{ color: muted }}> · </span>}
                <span style={{ fontWeight: 700 }}>{g.label}: </span>
                {g.items.join(", ")}
              </span>
            ))}
          </div>
        );
    }
  };

  const entryTitle: CSSProperties = { fontWeight: 700, fontSize: bodySize + 0.5, color: fg };
  const entrySub: CSSProperties = { color: muted, fontSize: bodySize - 0.8 };
  const entryDate: CSSProperties = { color: muted, fontSize: bodySize - 1, whiteSpace: "nowrap" };

  const renderSection = (id: string): ReactNode => {
    if (id.startsWith("custom-")) {
      const cs = resume.customSections?.[id];
      if (!cs || cs.items.length === 0) return null;
      return (
        <div style={{ marginBottom: gap }}>
          {sectionTitle(cs.title || "Custom Section")}
          {cs.items.map((item) => (
            <div key={item.id} style={{ marginBottom: itemGap }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={entryTitle}>{item.title}</span>
                {item.date && <span style={entryDate}>{item.date}</span>}
              </div>
              {item.subtitle && <div style={entrySub}>{item.subtitle}</div>}
              {item.description && <p style={{ color: fg, fontSize: bodySize - 0.8, marginTop: 2 }}>{item.description}</p>}
            </div>
          ))}
        </div>
      );
    }

    switch (id) {
      case "summary":
        return resume.summary ? (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Summary")}
            <p style={{ color: fg, lineHeight: 1.5, margin: 0 }}>{resume.summary}</p>
          </div>
        ) : null;
      case "experience":
        if (!resume.experience?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Experience")}
            {resume.experience.map((exp) => (
              <div key={exp.id} style={{ marginBottom: itemGap + 3 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={entryTitle}>{exp.role}</span>
                  <span style={entryDate}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
                </div>
                <div style={entrySub}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</div>
                {exp.responsibilities.length > 0 && bulletList(exp.responsibilities)}
                {exp.achievements.length > 0 && (
                  <div style={{ color: fg, fontSize: bodySize - 0.8, marginTop: 2 }}>
                    <span style={{ fontWeight: 700, color: muted }}>Achievements: </span>
                    {exp.achievements.join("; ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      case "education":
        if (!resume.education?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Education")}
            {resume.education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: itemGap }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={entryTitle}>{edu.institution}</span>
                  <span style={entryDate}>{edu.startDate} – {edu.endDate}</span>
                </div>
                <div style={entrySub}>
                  {edu.degree}{edu.branch ? ` in ${edu.branch}` : ""}{edu.field ? ` in ${edu.field}` : ""}
                  {edu.cgpa ? ` | CGPA: ${edu.cgpa}` : ""}
                </div>
              </div>
            ))}
          </div>
        );
      case "projects":
        if (!resume.projects?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Projects")}
            {resume.projects.map((proj) => (
              <div key={proj.id} style={{ marginBottom: itemGap }}>
                <div style={entryTitle}>{proj.name}</div>
                <p style={{ color: fg, fontSize: bodySize - 0.8, margin: "2px 0" }}>{proj.description}</p>
                {proj.technologies.length > 0 && (
                  <div style={entrySub}>{proj.technologies.join(", ")}</div>
                )}
              </div>
            ))}
          </div>
        );
      case "skills":
        return resume.skills ? (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Skills")}
            {renderSkills(resume.skills)}
          </div>
        ) : null;
      case "certifications":
        if (!resume.certifications?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Certifications")}
            {resume.certifications.map((c) => (
              <div key={c.id} style={{ marginBottom: 2, color: fg, fontSize: bodySize - 0.6 }}>
                {c.name}{c.issuer ? ` — ${c.issuer}` : ""}{c.date ? ` (${c.date})` : ""}
              </div>
            ))}
          </div>
        );
      case "achievements":
        if (!resume.achievements?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Achievements")}
            {resume.achievements.map((a) => (
              <div key={a.id} style={{ marginBottom: 2, color: fg, fontSize: bodySize - 0.6 }}>
                <span style={{ fontWeight: 700 }}>{a.title}</span>
                {a.description ? ` — ${a.description}` : ""}
              </div>
            ))}
          </div>
        );
      case "languages":
        if (!resume.languages?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Languages")}
            {resume.languages.map((l) => (
              <div key={l.id} style={{ color: fg, fontSize: bodySize - 0.6 }}>
                {l.name} <span style={{ color: muted, textTransform: "capitalize" }}>({l.proficiency})</span>
              </div>
            ))}
          </div>
        );
      case "codingProfiles":
        if (!resume.codingProfiles?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Coding Profiles")}
            {resume.codingProfiles.map((cp) => (
              <div key={cp.id} style={{ color: fg, fontSize: bodySize - 0.6 }}>
                <span style={{ fontWeight: 700 }}>{cp.platform}:</span> {cp.handle}
              </div>
            ))}
          </div>
        );
      case "leadership":
        if (!resume.leadership?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Leadership")}
            {resume.leadership.map((item) => (
              <div key={item.id} style={{ marginBottom: itemGap }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={entryTitle}>{item.title} at {item.organization}</span>
                  <span style={entryDate}>{item.startDate} – {item.endDate}</span>
                </div>
                <p style={{ color: fg, fontSize: bodySize - 0.8, margin: "2px 0 0" }}>{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "openSource":
        if (!resume.openSource?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Open Source")}
            {resume.openSource.map((item) => (
              <div key={item.id} style={{ marginBottom: itemGap }}>
                <div style={entryTitle}>{item.projectName} — {item.role}</div>
                <p style={{ color: fg, fontSize: bodySize - 0.8, margin: "2px 0 0" }}>{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "publications":
        if (!resume.publications?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Publications")}
            {resume.publications.map((p) => (
              <div key={p.id} style={{ marginBottom: 2, color: fg, fontSize: bodySize - 0.6 }}>
                <span style={{ fontWeight: 700 }}>{p.title}</span> — {p.publisher}{p.date ? ` (${p.date})` : ""}
              </div>
            ))}
          </div>
        );
      case "volunteer":
        if (!resume.volunteer?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Volunteer")}
            {resume.volunteer.map((v) => (
              <div key={v.id} style={{ marginBottom: itemGap }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={entryTitle}>{v.role} at {v.organization}</span>
                  <span style={entryDate}>{v.startDate} – {v.endDate}</span>
                </div>
                <p style={{ color: fg, fontSize: bodySize - 0.8, margin: "2px 0 0" }}>{v.description}</p>
              </div>
            ))}
          </div>
        );
      case "activities":
        if (!resume.activities?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Activities")}
            {resume.activities.map((a) => (
              <div key={a.id} style={{ marginBottom: 2 }}>
                <span style={entryTitle}>{a.title}</span>
                {a.description ? <span style={{ color: fg, fontSize: bodySize - 0.8 }}> — {a.description}</span> : null}
              </div>
            ))}
          </div>
        );
      case "coursework":
        if (!resume.coursework?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Coursework")}
            <p style={{ color: fg, fontSize: bodySize - 0.8, margin: 0 }}>{resume.coursework.join(", ")}</p>
          </div>
        );
      case "interests":
        if (!resume.interests?.length) return null;
        return (
          <div style={{ marginBottom: gap }}>
            {sectionTitle("Interests")}
            <p style={{ color: fg, fontSize: bodySize - 0.8, margin: 0 }}>{resume.interests.join(", ")}</p>
          </div>
        );
      default:
        return null;
    }
  };

  // ── Header ────────────────────────────────────────────────────────────
  const contactItems = [
    personal.email,
    personal.phone,
    personal.linkedin,
    personal.github,
    personal.portfolio,
  ].filter(Boolean);

  const renderPhoto = (size: number, _bgForPhoto: string) =>
    layout.showPhoto && personal.photo ? (
      // Photo is user-supplied and rendered at exact pixel sizes inside a scaled
      // A4 page — next/image's optimizer is not a fit here, so keep <img>.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={personal.photo}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: layout.photoShape === "circle" ? "50%" : layout.photoShape === "rounded" ? 8 : 2,
          objectFit: "cover",
          marginBottom: 8,
        }}
      />
    ) : null;

  const renderMonogram = (size: number, onDark: boolean) =>
    layout.monogram && !personal.photo ? (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: layout.photoShape === "circle" ? "50%" : layout.photoShape === "diamond" ? 4 : 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: onDark ? `${primary}44` : primary,
          color: onDark ? primary : "#ffffff",
          fontWeight: 800,
          fontSize: size * 0.36,
          fontFamily: nameFont,
          margin: "0 auto 8px",
          transform: layout.photoShape === "diamond" ? "rotate(45deg)" : undefined,
        }}
      >
        <span style={{ transform: layout.photoShape === "diamond" ? "rotate(-45deg)" : undefined }}>{initials}</span>
      </div>
    ) : null;

  const headerStandard = (center: boolean) => (
    <div style={{ textAlign: center ? "center" : "left", marginBottom: gap + 4 }}>
      {layout.monogram && renderMonogram(44, false)}
      {layout.showPhoto && renderPhoto(64, "transparent")}
      <div style={{ fontFamily: nameFont, fontSize: nameSize, fontWeight: 800, color: fg, letterSpacing: "0.01em" }}>
        {personal.fullName}
      </div>
      <div style={{ color: muted, fontSize: bodySize, marginTop: 2, lineHeight: 1.5 }}>
        {contactItems.join(center ? " · " : " | ")}
      </div>
    </div>
  );

  const headerBanner = () => (
    <div style={{ backgroundColor: primary, margin: "-36px -36px 16px", padding: "22px 36px", color: "#ffffff" }}>
      <div style={{ fontFamily: nameFont, fontSize: nameSize, fontWeight: 800, letterSpacing: "0.01em" }}>
        {personal.fullName}
      </div>
      <div style={{ color: "rgba(255,255,255,0.85)", fontSize: bodySize, marginTop: 2 }}>
        {contactItems.join("  ·  ")}
      </div>
    </div>
  );

  const headerSplit = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: gap + 4,
        paddingBottom: 8,
        borderBottom: `2px solid ${primary}`,
      }}
    >
      <div>
        <div style={{ fontFamily: nameFont, fontSize: nameSize * 0.9, fontWeight: 800, color: fg }}>
          {personal.fullName}
        </div>
        <div style={{ color: muted, fontSize: bodySize - 0.6 }}>{resume.summary?.slice(0, 40)}</div>
      </div>
      <div style={{ textAlign: "right", color: muted, fontSize: bodySize - 0.8, lineHeight: 1.5 }}>
        {contactItems.map((c) => <div key={c}>{c}</div>)}
      </div>
    </div>
  );

  const headerCompact = () => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: gap, paddingBottom: 6, borderBottom: `1px solid ${muted}` }}>
      <span style={{ fontFamily: nameFont, fontSize: nameSize * 0.8, fontWeight: 800, color: fg }}>{personal.fullName}</span>
      <span style={{ color: muted, fontSize: bodySize - 0.8 }}>{contactItems.join(" · ")}</span>
    </div>
  );

  const renderHeader = () => {
    switch (config.header) {
      case "centered":
        return headerStandard(true);
      case "banner":
        return headerBanner();
      case "split":
        return headerSplit();
      case "compact":
        return headerCompact();
      default:
        return headerStandard(false);
    }
  };

  // ── Assemble ──────────────────────────────────────────────────────────
  const sidebarBg = theme.sidebar || `${primary}0f`;
  const sidebarText = theme.sidebarText || fg;
  const mainCol = mainSections.map((s) => (
    <div key={s.id}>{renderSection(s.id)}</div>
  ));

  if (layout.columns === 2 && (sidebarSections.length > 0 || layout.showPhoto)) {
    const sidebarCol = (
      <div
        style={{
          width: `${(layout.sidebarWidth ?? 0.32) * 100}%`,
          backgroundColor: sidebarBg,
          padding: "24px 18px",
          margin: "-36px 0 -36px",
          color: sidebarText,
          flexShrink: 0,
        }}
      >
        {layout.showPhoto && (
          <div style={{ textAlign: "center" }}>
            {renderPhoto(84, sidebarBg)}
            {layout.monogram && renderMonogram(64, true)}
          </div>
        )}
        {sidebarSections.map((s) => (
          <div key={s.id} style={{ marginBottom: gap }}>
            {renderSection(s.id)}
          </div>
        ))}
      </div>
    );
    return (
      <div style={{ fontFamily: bodyFont, fontSize: bodySize, color: fg, backgroundColor: bg, padding: 36 }}>
        {renderHeader()}
        <div style={{ display: "flex", gap: 20 }}>
          {layout.sidebar === "right" ? (
            <>
              <div style={{ flex: 1 }}>{mainCol}</div>
              {sidebarCol}
            </>
          ) : (
            <>
              {sidebarCol}
              <div style={{ flex: 1 }}>{mainCol}</div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: bodyFont, fontSize: bodySize, color: fg, backgroundColor: bg, padding: 36 }}>
      {renderHeader()}
      {layout.showPhoto && !layout.monogram && (
        <div style={{ textAlign: "center" }}>{renderPhoto(72, "transparent")}</div>
      )}
      {layout.monogram && !layout.showPhoto && renderMonogram(48, false)}
      {mainCol}
    </div>
  );
}

/** Dispatcher: renders the right imported template, or undefined for built-ins. */
export function ImportedTemplateRenderer({
  resume,
  config,
}: {
  resume: ResumeData;
  config?: ImportedTemplateConfig;
}) {
  if (!config) return null;
  return <ImportedTemplate resume={resume} config={config} />;
}
