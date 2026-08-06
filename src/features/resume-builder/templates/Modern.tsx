import type { ResumeData, TargetLevel } from "@/types/resume";
import { RESUME_TYPES, getOrderedSections } from "@/features/resume-builder/config/resume-types";
import { fontFamilyClass, accentWithAlpha } from "./theme";

/**
 * MODERN — split header + accent hierarchy.
 *
 * Distinct structure: name sits top-left in a bold accent-tinted block while
 * contact stacks top-right; every section title is a colored rule with the
 * accent color; entries use a light left rule for scannability. Two-tone,
 * clean, still parser-friendly (single column, real headings).
 */
export function Modern({ resume }: { resume: ResumeData }) {
  const accent = resume.accentColor || "#2563eb";
  const { personalInfo, targetLevel = "experienced" } = resume;
  const typeConfig = RESUME_TYPES[targetLevel as TargetLevel] || RESUME_TYPES.experienced;

  const contactItems = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.portfolio,
  ].filter(Boolean);

  const SectionTitle = ({ children }: { children: string }) => (
    <div className="mb-3 flex items-center gap-2.5">
      <span
        className="inline-block h-4 w-1 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <h2
        className="text-[13px] font-bold uppercase tracking-[0.08em]"
        style={{ color: accent }}
      >
        {children}
      </h2>
    </div>
  );

  const renderSection = (id: string) => {
    if (id.startsWith("custom-")) {
      const cs = resume.customSections?.[id];
      if (!cs || cs.items.length === 0) return null;
      return (
        <div className="mb-6">
          <SectionTitle>{cs.title || "Custom Section"}</SectionTitle>
          {cs.items.map((item) => (
            <div key={item.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-[13px]">{item.title}</span>
                {item.date && <span className="text-gray-400 text-[11px]">{item.date}</span>}
              </div>
              {item.subtitle && <div className="text-gray-500 text-[11px]">{item.subtitle}</div>}
              {item.description && <p className="text-gray-600 text-[12px] mt-1">{item.description}</p>}
            </div>
          ))}
        </div>
      );
    }

    switch (id) {
      case "summary":
        return resume.summary ? (
          <div className="mb-6">
            <SectionTitle>Summary</SectionTitle>
            <p className="text-gray-700 text-[13px] leading-relaxed">{resume.summary}</p>
          </div>
        ) : null;
      case "experience":
        if (!resume.experience?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Experience</SectionTitle>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-5 pl-3.5 relative">
                <span
                  className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full"
                  style={{ backgroundColor: accentWithAlpha(accent, 0.25) }}
                />
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[13px] text-gray-900">{exp.role}</span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                <div className="text-[12px] font-semibold" style={{ color: accent }}>
                  {exp.company}
                  {exp.location ? ` · ${exp.location}` : ""}
                </div>
                {exp.responsibilities.length > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {exp.responsibilities.map((r, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-gray-700 leading-snug">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );
      case "education":
        if (!resume.education?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Education</SectionTitle>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[13px] text-gray-900">{edu.institution}</span>
                  <span className="text-[11px] text-gray-400">{edu.startDate} – {edu.endDate}</span>
                </div>
                <div className="text-[12px] text-gray-600">
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}
                  {edu.cgpa ? ` · CGPA ${edu.cgpa}` : ""}
                </div>
              </div>
            ))}
          </div>
        );
      case "projects":
        if (!resume.projects?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Projects</SectionTitle>
            {resume.projects.map((proj) => (
              <div key={proj.id} className="mb-3">
                <div className="font-bold text-[13px] text-gray-900">{proj.name}</div>
                <p className="text-gray-600 text-[12px] mt-0.5">{proj.description}</p>
                {proj.technologies.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {proj.technologies.map((t) => (
                      <span
                        key={t}
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: accentWithAlpha(accent, 0.12), color: accent }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      case "skills":
        if (!resume.skills) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Skills</SectionTitle>
            {[
              { label: "Technical", items: resume.skills.technical },
              { label: "Frameworks", items: resume.skills.frameworks },
              { label: "Tools", items: resume.skills.tools },
            ].filter((g) => g.items.length > 0).map((g) => (
              <div key={g.label} className="mb-1.5 text-[12px]">
                <span className="font-bold text-gray-800">{g.label}: </span>
                <span className="text-gray-600">{g.items.join(", ")}</span>
              </div>
            ))}
          </div>
        );
      case "certifications":
        if (!resume.certifications?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Certifications</SectionTitle>
            {resume.certifications.map((c) => (
              <div key={c.id} className="text-[12px] text-gray-700 mb-1">
                {c.name}{c.issuer ? ` — ${c.issuer}` : ""}{c.date ? ` (${c.date})` : ""}
              </div>
            ))}
          </div>
        );
      case "achievements":
        if (!resume.achievements?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Achievements</SectionTitle>
            {resume.achievements.map((a) => (
              <div key={a.id} className="text-[12px] text-gray-700 mb-1">
                <span className="font-bold">{a.title}</span>
                {a.description ? ` — ${a.description}` : ""}
              </div>
            ))}
          </div>
        );
      case "languages":
        if (!resume.languages?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Languages</SectionTitle>
            <div className="text-[12px] text-gray-700">
              {resume.languages.map((l) => `${l.name} (${l.proficiency})`).join(" · ")}
            </div>
          </div>
        );
      case "leadership":
      case "openSource":
      case "publications":
      case "volunteer":
      case "activities":
      case "coursework":
      case "interests":
      case "codingProfiles":
        return null;
      default:
        return null;
    }
  };

  return (
    <div className={`${fontFamilyClass(resume.fontFamily)} text-sm leading-relaxed`}>
      {/* Split header: name + role left, contact right */}
      <div className="mb-7 flex items-start justify-between gap-6 pb-5 border-b-2" style={{ borderColor: accentWithAlpha(accent, 0.2) }}>
        <div>
          <h1 className="text-[26px] font-extrabold leading-tight text-gray-900 tracking-tight">
            {personalInfo.fullName}
          </h1>
          <div className="mt-1.5 h-[3px] w-14 rounded-full" style={{ backgroundColor: accent }} />
          <div className="mt-2 text-[12px] font-semibold" style={{ color: accent }}>
            {resume.experience?.[0]?.role || resume.summary?.slice(0, 48) || "Professional"}
          </div>
        </div>
        <div className="text-right space-y-0.5 text-[11px] text-gray-500 font-medium shrink-0">
          {contactItems.map((c) => (
            <div key={c} className="break-all">{c}</div>
          ))}
        </div>
      </div>

      {getOrderedSections(resume, typeConfig)
        .filter((s) => s.id !== "personalInfo")
        .map((section) => (
          <div key={section.id}>{renderSection(section.id)}</div>
        ))}
    </div>
  );
}
