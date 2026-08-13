import type { ResumeData, TargetLevel } from "@/types/resume";
import { RESUME_TYPES, getOrderedSections } from "@/features/resume-builder/config/resume-types";
import { fontFamilyClass, accentWithAlpha, getVariantAccent, defaultFontForTemplate } from "./theme";

/**
 * EXECUTIVE — boardroom serif.
 *
 * Distinct structure: a commanding centered masthead (large letterspaced serif
 * name over a thin double rule), a bordered "Leadership Summary" block, and
 * metric-forward experience entries. A sidebar-less single column, but the
 * typography and summary block read as senior-leadership material.
 */
export function Executive({ resume }: { resume: ResumeData }) {
  const accent = getVariantAccent(resume, "#312e81");
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
    <div className="mb-4 flex items-center gap-3">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>
        {children}
      </h2>
      <span className="h-px flex-1" style={{ backgroundColor: accentWithAlpha(accent, 0.2) }} />
    </div>
  );

  const renderSection = (id: string) => {
    if (id.startsWith("custom-")) {
      const cs = resume.customSections?.[id];
      if (!cs || cs.items.length === 0) return null;
      return (
        <div className="mb-7">
          <SectionTitle>{cs.title || "Custom Section"}</SectionTitle>
          {cs.items.map((item) => (
            <div key={item.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[13px] font-semibold text-gray-800">{item.title}</span>
                {item.date && <span className="text-[11px] text-gray-400">{item.date}</span>}
              </div>
              {item.subtitle && <div className="text-[12px] text-gray-500">{item.subtitle}</div>}
              {item.description && <p className="text-[12px] text-gray-600 mt-1">{item.description}</p>}
            </div>
          ))}
        </div>
      );
    }

    switch (id) {
      case "summary":
        return resume.summary ? (
          <div className="mb-7">
            <SectionTitle>Leadership Summary</SectionTitle>
            <div className="border-l-4 pl-4" style={{ borderColor: accent }}>
              <p className="text-[13px] italic leading-relaxed text-gray-700">{resume.summary}</p>
            </div>
          </div>
        ) : null;
      case "experience":
        if (!resume.experience?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Professional Experience</SectionTitle>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[14px] font-bold text-gray-900">{exp.role}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {exp.startDate} — {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>
                  {exp.company}
                  {exp.location ? ` · ${exp.location}` : ""}
                </div>
                {exp.responsibilities.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {exp.responsibilities.map((r, i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-gray-700">
                        <span className="mt-[8px] h-[5px] w-[5px] shrink-0 rotate-45" style={{ backgroundColor: accentWithAlpha(accent, 0.6) }} />
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
          <div className="mb-7">
            <SectionTitle>Education</SectionTitle>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-bold text-gray-800">{edu.institution}</span>
                  <span className="text-[11px] text-gray-400">{edu.startDate} — {edu.endDate}</span>
                </div>
                <div className="text-[12px] text-gray-600">
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}
                  {edu.cgpa ? ` · ${edu.cgpa}` : ""}
                </div>
              </div>
            ))}
          </div>
        );
      case "projects":
        if (!resume.projects?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Key Initiatives</SectionTitle>
            {resume.projects.map((proj) => (
              <div key={proj.id} className="mb-3">
                <div className="text-[13px] font-semibold text-gray-800">{proj.name}</div>
                <p className="text-[12px] text-gray-600 mt-0.5">{proj.description}</p>
                {proj.technologies.length > 0 && (
                  <div className="text-[10.5px] uppercase tracking-wider text-gray-400 mt-0.5">
                    {proj.technologies.join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      case "skills":
        if (!resume.skills) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Core Competencies</SectionTitle>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
              {[
                { label: "Leadership", items: resume.skills.soft },
                { label: "Technical", items: resume.skills.technical },
                { label: "Frameworks", items: resume.skills.frameworks },
                { label: "Tools", items: resume.skills.tools },
              ].filter((g) => g.items.length > 0).map((g) => (
                <div key={g.label} className="text-[12px]">
                  <span className="font-bold uppercase tracking-wide text-gray-800 text-[10.5px]">{g.label}: </span>
                  <span className="text-gray-600">{g.items.join(", ")}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case "achievements":
        if (!resume.achievements?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Key Achievements</SectionTitle>
            {resume.achievements.map((a) => (
              <div key={a.id} className="mb-2 flex gap-2 text-[12px] text-gray-700">
                <span className="text-[13px] font-bold" style={{ color: accent }}>✦</span>
                <span><span className="font-semibold">{a.title}</span>{a.description ? ` — ${a.description}` : ""}</span>
              </div>
            ))}
          </div>
        );
      case "certifications":
        if (!resume.certifications?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Board & Certifications</SectionTitle>
            {resume.certifications.map((c) => (
              <div key={c.id} className="text-[12px] text-gray-700 mb-1">
                <span className="font-semibold">{c.name}</span>
                {c.issuer ? ` — ${c.issuer}` : ""}
                {c.date ? ` (${c.date})` : ""}
              </div>
            ))}
          </div>
        );
      case "languages":
        if (!resume.languages?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Languages</SectionTitle>
            <div className="text-[12px] text-gray-700">
              {resume.languages.map((l) => `${l.name} (${l.proficiency})`).join(" · ")}
            </div>
          </div>
        );
      case "leadership":
        if (!resume.leadership?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Leadership Initiatives</SectionTitle>
            {resume.leadership.map((item) => (
              <div key={item.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-bold text-gray-900">{item.title}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{item.startDate} — {item.endDate}</span>
                </div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>{item.organization}</div>
                <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "openSource":
        if (!resume.openSource?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Open Source</SectionTitle>
            {resume.openSource.map((item) => (
              <div key={item.id} className="mb-4">
                <div className="text-[13px] font-bold text-gray-900">{item.projectName}</div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>{item.role}</div>
                <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "publications":
        if (!resume.publications?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Publications</SectionTitle>
            {resume.publications.map((item) => (
              <div key={item.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-bold text-gray-900">{item.title}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{item.date}</span>
                </div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>{item.publisher}</div>
              </div>
            ))}
          </div>
        );
      case "volunteer":
        if (!resume.volunteer?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Volunteer Experience</SectionTitle>
            {resume.volunteer.map((item) => (
              <div key={item.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-bold text-gray-900">{item.role}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{item.startDate} — {item.endDate}</span>
                </div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>{item.organization}</div>
                <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "activities":
        if (!resume.activities?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Board & Activities</SectionTitle>
            {resume.activities.map((item) => (
              <div key={item.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-bold text-gray-900">{item.title}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{item.date}</span>
                </div>
                <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "coursework":
        if (!resume.coursework?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Relevant Coursework</SectionTitle>
            <div className="text-[12px] text-gray-700">{resume.coursework.join(", ")}</div>
          </div>
        );
      case "interests":
        if (!resume.interests?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Interests</SectionTitle>
            <div className="text-[12px] text-gray-700">{resume.interests.join(", ")}</div>
          </div>
        );
      case "codingProfiles":
        if (!resume.codingProfiles?.length) return null;
        return (
          <div className="mb-7">
            <SectionTitle>Professional Profiles</SectionTitle>
            <div className="flex flex-wrap gap-4">
              {resume.codingProfiles.map((item) => (
                <div key={item.id} className="text-[12px]">
                  <span className="font-bold text-gray-800">{item.platform}: </span>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline">{item.handle}</a>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${fontFamilyClass(defaultFontForTemplate(resume))} text-sm leading-relaxed`}>
      {/* Commanding serif masthead */}
      <div className="text-center mb-8">
        <h1
          className="text-[32px] font-bold uppercase leading-tight tracking-[0.12em]"
          style={{ color: accent }}
        >
          {personalInfo.fullName}
        </h1>
        <div className="mx-auto mt-4 h-[2px] w-28" style={{ backgroundColor: accent }} />
        <div className="mx-auto mt-1 h-px w-40" style={{ backgroundColor: accentWithAlpha(accent, 0.3) }} />
        <div className="mt-3 text-[11px] uppercase tracking-[0.16em] text-gray-500">
          {contactItems.join("   ·   ")}
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
