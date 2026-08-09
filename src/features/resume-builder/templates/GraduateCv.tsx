import type { ResumeData, TargetLevel } from "@/types/resume";
import { RESUME_TYPES, getOrderedSections } from "@/features/resume-builder/config/resume-types";
import { fontFamilyClass, getVariantAccent, defaultFontForTemplate, accentWithAlpha } from "./theme";

/**
 * GRADUATE CV — classic academic curriculum vitae.
 *
 * Faithful to the Rensselaer "Medium Length Graduate CV" (res.cls margin
 * style): the name sits at the top with address/contact blocks beside it,
 * section titles (EDUCATION, PROJECTS, SKILLS, EXPERIENCE) are bold and sit
 * to the left of the flowing serif body text. Academic-first, parser-safe.
 */
export function GraduateCv({ resume }: { resume: ResumeData }) {
  const accent = getVariantAccent(resume, "#1e3a8a");
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
    <div className="mb-4 flex items-start gap-3">
      <h2
        className="w-[26%] shrink-0 pt-0.5 text-[12px] font-bold uppercase tracking-[0.12em]"
        style={{ color: accent }}
      >
        {children}
      </h2>
      <div className="mt-2 h-px flex-1" style={{ backgroundColor: accentWithAlpha(accent, 0.2) }} />
    </div>
  );

  const renderSection = (id: string) => {
    if (id.startsWith("custom-")) {
      const cs = resume.customSections?.[id];
      if (!cs || cs.items.length === 0) return null;
      return (
        <div className="mb-6">
          <SectionTitle>{cs.title || "Custom Section"}</SectionTitle>
          <div className="pl-[30%]">
            {cs.items.map((item) => (
              <div key={item.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-[13px]">{item.title}</span>
                  {item.date && <span className="text-gray-400 text-[11px]">{item.date}</span>}
                </div>
                {item.subtitle && <div className="text-gray-500 text-[11px] italic">{item.subtitle}</div>}
                {item.description && <p className="text-gray-600 text-[12px] mt-1">{item.description}</p>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    switch (id) {
      case "summary":
        return resume.summary ? (
          <div className="mb-6">
            <SectionTitle>Summary</SectionTitle>
            <p className="pl-[30%] text-gray-700 text-[13px] leading-relaxed">{resume.summary}</p>
          </div>
        ) : null;
      case "experience":
        if (!resume.experience?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Experience</SectionTitle>
            <div className="pl-[30%]">
              {resume.experience.map((exp) => (
                <div key={exp.id} className="mb-4">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[13px] text-gray-900">{exp.role}</span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                  <div className="text-[12px] italic" style={{ color: accent }}>
                    {exp.company}
                    {exp.location ? `, ${exp.location}` : ""}
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
          </div>
        );
      case "education":
        if (!resume.education?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Education</SectionTitle>
            <div className="pl-[30%]">
              {resume.education.map((edu) => (
                <div key={edu.id} className="mb-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[13px] text-gray-900">{edu.institution}</span>
                    <span className="text-[11px] text-gray-400">{edu.startDate} – {edu.endDate}</span>
                  </div>
                  <div className="text-[12px] text-gray-600 italic">
                    {edu.degree}
                    {edu.field ? ` in ${edu.field}` : ""}
                    {edu.cgpa ? `, GPA: ${edu.cgpa}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "projects":
        if (!resume.projects?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Projects</SectionTitle>
            <div className="pl-[30%]">
              {resume.projects.map((proj) => (
                <div key={proj.id} className="mb-3">
                  <div className="font-bold text-[13px] text-gray-900">{proj.name}</div>
                  <p className="text-gray-600 text-[12px] mt-0.5">{proj.description}</p>
                  {proj.technologies.length > 0 && (
                    <div className="text-[11px] text-gray-500 mt-0.5 italic">
                      Technologies: {proj.technologies.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case "skills":
        if (!resume.skills) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Skills</SectionTitle>
            <div className="pl-[30%]">
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
          </div>
        );
      case "certifications":
        if (!resume.certifications?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Certifications</SectionTitle>
            <div className="pl-[30%] text-[12px] text-gray-700">
              {resume.certifications.map((c) => (
                <div key={c.id} className="mb-1">
                  {c.name}{c.issuer ? ` — ${c.issuer}` : ""}{c.date ? ` (${c.date})` : ""}
                </div>
              ))}
            </div>
          </div>
        );
      case "achievements":
        if (!resume.achievements?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Achievements</SectionTitle>
            <div className="pl-[30%] text-[12px] text-gray-700">
              {resume.achievements.map((a) => (
                <div key={a.id} className="mb-1">
                  <span className="font-bold">{a.title}</span>
                  {a.description ? ` — ${a.description}` : ""}
                </div>
              ))}
            </div>
          </div>
        );
      case "publications":
        if (!resume.publications?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Publications</SectionTitle>
            <div className="pl-[30%] text-[12px] text-gray-700">
              {resume.publications.map((p) => (
                <div key={p.id} className="mb-1.5">
                  <span className="font-semibold italic">{p.title}</span>
                  {p.publisher ? ` — ${p.publisher}` : ""}
                  {p.date ? ` (${p.date})` : ""}
                  {p.description ? <div className="text-gray-600">{p.description}</div> : null}
                </div>
              ))}
            </div>
          </div>
        );
      case "languages":
        if (!resume.languages?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Languages</SectionTitle>
            <div className="pl-[30%] text-[12px] text-gray-700">
              {resume.languages.map((l) => `${l.name} (${l.proficiency})`).join(" · ")}
            </div>
          </div>
        );
      case "coursework":
        if (!resume.coursework?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Coursework</SectionTitle>
            <div className="pl-[30%] text-[12px] text-gray-700">
              {resume.coursework.join(" · ")}
            </div>
          </div>
        );
      case "volunteer":
        if (!resume.volunteer?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Volunteer</SectionTitle>
            <div className="pl-[30%]">
              {resume.volunteer.map((v) => (
                <div key={v.id} className="mb-2 text-[12px]">
                  <span className="font-bold text-gray-800">{v.organization}</span>
                  {v.role ? ` — ${v.role}` : ""}
                  {v.description ? <div className="text-gray-600">{v.description}</div> : null}
                </div>
              ))}
            </div>
          </div>
        );
      case "leadership":
      case "openSource":
      case "codingProfiles":
      case "activities":
      case "interests":
        return null;
      default:
        return null;
    }
  };

  return (
    <div className={`${fontFamilyClass(defaultFontForTemplate(resume))} text-sm leading-relaxed`}>
      {/* Name + address blocks */}
      <div className="mb-7 flex items-end justify-between gap-6 pb-5 border-b" style={{ borderColor: accentWithAlpha(accent, 0.2) }}>
        <h1 className="text-[26px] font-bold leading-tight text-gray-900 tracking-tight">
          {personalInfo.fullName}
        </h1>
        <div className="text-right text-[11px] text-gray-600 leading-relaxed shrink-0">
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
