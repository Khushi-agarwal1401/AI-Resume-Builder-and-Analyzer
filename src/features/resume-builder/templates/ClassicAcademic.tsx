import type { ResumeData, TargetLevel } from "@/types/resume";
import { RESUME_TYPES, getOrderedSections } from "@/features/resume-builder/config/resume-types";
import { fontFamilyClass, getVariantAccent, defaultFontForTemplate } from "./theme";

/**
 * CLASSIC ACADEMIC — coursework-first resume in the sb2nov style.
 *
 * Faithful to the popular "sb2nov/resume" LaTeX design: a centered name
 * header with contact links, colored section headings with rules, education
 * subheadings with dates right-aligned, multi-column coursework, projects
 * with tech stacks, internship/experience entries, grouped technical skills,
 * extracurriculars, and certifications.
 */
export function ClassicAcademic({ resume }: { resume: ResumeData }) {
  const accent = getVariantAccent(resume, "#0e5484");
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
    <div className="mb-4">
      <h2
        className="text-[13px] font-bold uppercase tracking-[0.06em]"
        style={{ color: accent }}
      >
        {children}
      </h2>
      <div className="mt-1.5 h-[2px] w-full" style={{ backgroundColor: accent }} />
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
      case "education":
        if (!resume.education?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Education</SectionTitle>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[13px] text-gray-900">{edu.institution}</span>
                  <span className="text-[11px] text-gray-400 font-medium">{edu.startDate} – {edu.endDate}</span>
                </div>
                <div className="text-[12px] text-gray-600">
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}
                  {edu.cgpa ? (
                    <>
                      {" "}– <span className="font-semibold">{edu.cgpa}</span>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        );
      case "coursework":
        if (!resume.coursework?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Relevant Coursework</SectionTitle>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] text-gray-700">
              {resume.coursework.map((c) => (
                <div key={c} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full" style={{ backgroundColor: accent }} />
                  {c}
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
            {resume.projects.map((proj) => (
              <div key={proj.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[13px] text-gray-900">{proj.name}</span>
                  {proj.impact && <span className="text-[11px] text-gray-400">{proj.impact}</span>}
                </div>
                <p className="text-gray-600 text-[12px] mt-0.5">{proj.description}</p>
                {proj.technologies.length > 0 && (
                  <div className="mt-1 text-[11px]" style={{ color: accent }}>
                    <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      case "experience":
        if (!resume.experience?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Experience</SectionTitle>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[13px] text-gray-900">
                    {exp.company}
                    {exp.location ? <span className="text-gray-500 font-medium">, {exp.location}</span> : null}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                <div className="text-[12px] italic" style={{ color: accent }}>
                  {exp.role}
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
      case "skills":
        if (!resume.skills) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Technical Skills</SectionTitle>
            {[
              { label: "Languages", items: resume.skills.technical },
              { label: "Frameworks", items: resume.skills.frameworks },
              { label: "Developer Tools", items: resume.skills.tools },
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
            <div className="text-[12px] text-gray-700">
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
            <div className="text-[12px] text-gray-700">
              {resume.achievements.map((a) => (
                <div key={a.id} className="mb-1">
                  <span className="font-bold">{a.title}</span>
                  {a.description ? ` — ${a.description}` : ""}
                </div>
              ))}
            </div>
          </div>
        );
      case "activities":
        if (!resume.activities?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Extracurricular</SectionTitle>
            <div className="text-[12px] text-gray-700">
              {resume.activities.map((a) => (
                <div key={a.id} className="mb-1">
                  <span className="font-bold">{a.title}</span>
                  {a.description ? ` — ${a.description}` : ""}
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
            <div className="text-[12px] text-gray-700">
              {resume.languages.map((l) => `${l.name} (${l.proficiency})`).join(" · ")}
            </div>
          </div>
        );
      case "codingProfiles":
        if (!resume.codingProfiles?.length) return null;
        return (
          <div className="mb-6">
            <SectionTitle>Profiles</SectionTitle>
            <div className="text-[12px] text-gray-700">
              {resume.codingProfiles.map((p) => `${p.platform}: ${p.handle}`).join(" · ")}
            </div>
          </div>
        );
      case "leadership":
      case "openSource":
      case "publications":
      case "volunteer":
      case "interests":
        return null;
      default:
        return null;
    }
  };

  return (
    <div className={`${fontFamilyClass(defaultFontForTemplate(resume))} text-sm leading-relaxed`}>
      {/* Centered name header */}
      <div className="mb-7 text-center pb-5 border-b border-gray-200">
        <h1 className="text-[26px] font-extrabold leading-tight text-gray-900 tracking-tight">
          {personalInfo.fullName}
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-gray-500 font-medium">
          {contactItems.map((c) => (
            <span key={c} className="break-all">{c}</span>
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
