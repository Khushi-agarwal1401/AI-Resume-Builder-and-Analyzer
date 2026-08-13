import type { ResumeData, TargetLevel } from "@/types/resume";
import { RESUME_TYPES, getOrderedSections } from "@/features/resume-builder/config/resume-types";
import { fontFamilyClass, getVariantAccent, defaultFontForTemplate, accentWithAlpha } from "./theme";

/**
 * DEEDY — compact two-column resume.
 *
 * Faithful to the Deedy design: education, links, coursework, and skills live
 * in a narrow left rail; experience, research, awards, and the rest flow down
 * the main column. Tight leading, one-page density, minimal decoration.
 */
export function Deedy({ resume }: { resume: ResumeData }) {
  const accent = getVariantAccent(resume, "#b91c1c");
  const { personalInfo, targetLevel = "experienced" } = resume;
  const typeConfig = RESUME_TYPES[targetLevel as TargetLevel] || RESUME_TYPES.experienced;

  const contactItems = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.portfolio,
  ].filter(Boolean);

  const MainTitle = ({ children }: { children: string }) => (
    <h2
      className="mb-3 mt-6 text-[12px] font-bold uppercase tracking-[0.12em] border-b pb-1"
      style={{ color: accent, borderColor: accentWithAlpha(accent, 0.25) }}
    >
      {children}
    </h2>
  );

  const renderSection = (id: string) => {
    if (id.startsWith("custom-")) {
      const cs = resume.customSections?.[id];
      if (!cs || cs.items.length === 0) return null;
      return (
        <div className="mb-4">
          <MainTitle>{cs.title || "Custom Section"}</MainTitle>
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
          <div className="mb-4">
            <MainTitle>Profile</MainTitle>
            <p className="text-gray-700 text-[12px] leading-relaxed">{resume.summary}</p>
          </div>
        ) : null;
      case "education":
        if (!resume.education?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Education</MainTitle>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <div className="font-bold text-[12.5px] text-gray-900">{edu.institution}</div>
                <div className="text-[11.5px] text-gray-700">{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</div>
                <div className="text-[11px] text-gray-400">{edu.startDate} – {edu.endDate}</div>
                {edu.cgpa ? <div className="text-[11px] text-gray-500">GPA: {edu.cgpa}</div> : null}
              </div>
            ))}
          </div>
        );
      case "coursework":
        if (!resume.coursework?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Coursework</MainTitle>
            <div className="space-y-0.5 text-[12px] text-gray-700">
              {resume.coursework.map((c) => (
                <div key={c}>{c}</div>
              ))}
            </div>
          </div>
        );
      case "skills":
        if (!resume.skills) return null;
        return (
          <div className="mb-4">
            <MainTitle>Skills</MainTitle>
            {[
              { label: "Programming", items: resume.skills.technical },
              { label: "Frameworks", items: resume.skills.frameworks },
              { label: "Tools", items: resume.skills.tools },
              { label: "Soft Skills", items: resume.skills.soft },
            ].filter((g) => g.items.length > 0).map((g) => (
              <div key={g.label} className="mb-1 text-[11.5px]">
                <span className="font-bold text-gray-800">{g.label}: </span>
                <span className="text-gray-600">{g.items.join(", ")}</span>
              </div>
            ))}
          </div>
        );
      case "experience":
        if (!resume.experience?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Experience</MainTitle>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[13px] text-gray-900">{exp.role}</span>
                  <span className="text-[10.5px] text-gray-400 font-medium">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                <div className="text-[11.5px]" style={{ color: accent }}>
                  {exp.company}
                  {exp.location ? `, ${exp.location}` : ""}
                </div>
                {exp.responsibilities.length > 0 && (
                  <ul className="mt-1 space-y-1">
                    {exp.responsibilities.map((r, i) => (
                      <li key={i} className="text-[11.5px] text-gray-700 leading-snug">{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );
      case "projects":
        if (!resume.projects?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Projects</MainTitle>
            {resume.projects.map((proj) => (
              <div key={proj.id} className="mb-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[12.5px] text-gray-900">{proj.name}</span>
                  {proj.impact && <span className="text-[10.5px] text-gray-400">{proj.impact}</span>}
                </div>
                <p className="text-gray-600 text-[11.5px] mt-0.5">{proj.description}</p>
                {proj.technologies.length > 0 && (
                  <div className="text-[10.5px] text-gray-500 mt-0.5">
                    {proj.technologies.join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      case "publications":
        if (!resume.publications?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Publications</MainTitle>
            {resume.publications.map((p) => (
              <div key={p.id} className="mb-1.5 text-[12px]">
                <span className="font-semibold">{p.title}</span>
                {p.publisher ? ` — ${p.publisher}` : ""}
                {p.date ? ` (${p.date})` : ""}
              </div>
            ))}
          </div>
        );
      case "achievements":
        if (!resume.achievements?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Awards</MainTitle>
            {resume.achievements.map((a) => (
              <div key={a.id} className="mb-1.5 text-[12px]">
                <span className="font-bold">{a.title}</span>
                {a.description ? ` — ${a.description}` : ""}
              </div>
            ))}
          </div>
        );
      case "certifications":
        if (!resume.certifications?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Certifications</MainTitle>
            <div className="text-[12px] text-gray-700">
              {resume.certifications.map((c) => (
                <div key={c.id} className="mb-1">{c.name}</div>
              ))}
            </div>
          </div>
        );
      case "languages":
        if (!resume.languages?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Languages</MainTitle>
            <div className="text-[12px] text-gray-700">
              {resume.languages.map((l) => `${l.name} (${l.proficiency})`).join(" · ")}
            </div>
          </div>
        );
      case "openSource":
        if (!resume.openSource?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Open Source</MainTitle>
            {resume.openSource.map((os) => (
              <div key={os.id} className="mb-1.5 text-[12px]">
                <span className="font-bold">{os.projectName}</span>
                {os.role ? ` — ${os.role}` : ""}
                {os.description ? <div className="text-gray-600">{os.description}</div> : null}
              </div>
            ))}
          </div>
        );
      case "leadership":
        if (!resume.leadership?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Leadership</MainTitle>
            {resume.leadership.map((item) => (
              <div key={item.id} className="mb-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[12.5px] text-gray-900">{item.title}</span>
                  <span className="text-[10.5px] text-gray-400 font-medium">{item.startDate} – {item.endDate}</span>
                </div>
                <div className="text-[11.5px]" style={{ color: accent }}>{item.organization}</div>
                <p className="text-gray-600 text-[11.5px] mt-0.5">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "volunteer":
        if (!resume.volunteer?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Volunteer</MainTitle>
            {resume.volunteer.map((item) => (
              <div key={item.id} className="mb-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[12.5px] text-gray-900">{item.role}</span>
                  <span className="text-[10.5px] text-gray-400 font-medium">{item.startDate} – {item.endDate}</span>
                </div>
                <div className="text-[11.5px]" style={{ color: accent }}>{item.organization}</div>
                <p className="text-gray-600 text-[11.5px] mt-0.5">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "activities":
        if (!resume.activities?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Activities</MainTitle>
            {resume.activities.map((item) => (
              <div key={item.id} className="mb-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[12.5px] text-gray-900">{item.title}</span>
                  <span className="text-[10.5px] text-gray-400 font-medium">{item.date}</span>
                </div>
                <p className="text-gray-600 text-[11.5px] mt-0.5">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "codingProfiles":
        if (!resume.codingProfiles?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Profiles</MainTitle>
            <div className="space-y-1 text-[11.5px]">
              {resume.codingProfiles.map((p) => (
                <div key={p.id} className="flex flex-col text-gray-700">
                  <span className="font-bold">{p.platform}</span>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:underline">{p.handle}</a>
                </div>
              ))}
            </div>
          </div>
        );
      case "interests":
        if (!resume.interests?.length) return null;
        return (
          <div className="mb-4">
            <MainTitle>Interests</MainTitle>
            <div className="text-[12px] text-gray-700">{resume.interests.join(", ")}</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${fontFamilyClass(defaultFontForTemplate(resume))} text-sm leading-relaxed`}>
      {/* Masthead */}
      <div className="mb-5 text-center border-b-2 pb-4" style={{ borderColor: accent }}>
        <h1 className="text-[30px] font-extrabold leading-tight text-gray-900 tracking-tight">
          {personalInfo.fullName}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11px] text-gray-600 font-medium">
          {contactItems.map((c) => (
            <span key={c} className="break-all">{c}</span>
          ))}
        </div>
      </div>

      {/* Two columns: left rail (education/links/coursework/skills), main column */}
      <div className="flex gap-6">
        <div className="w-[33%] shrink-0">
          {getOrderedSections(resume, typeConfig)
            .filter((s) => s.id !== "personalInfo")
            .filter((s) => ["education", "coursework", "skills", "languages", "codingProfiles", "interests"].includes(s.id))
            .map((section) => (
              <div key={section.id}>{renderSection(section.id)}</div>
            ))}
        </div>
        <div className="min-w-0 flex-1">
          {getOrderedSections(resume, typeConfig)
            .filter((s) => s.id !== "personalInfo")
            .filter((s) => !["education", "coursework", "skills", "languages", "codingProfiles", "interests"].includes(s.id))
            .map((section) => (
              <div key={section.id}>{renderSection(section.id)}</div>
            ))}
        </div>
      </div>
    </div>
  );
}
