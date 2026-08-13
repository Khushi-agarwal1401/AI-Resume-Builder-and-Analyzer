import type { ResumeData, TargetLevel } from "@/types/resume";
import { RESUME_TYPES, getOrderedSections } from "@/features/resume-builder/config/resume-types";
import { fontFamilyClass, defaultFontForTemplate } from "./theme";

/**
 * MINIMAL — editorial ultra-clean.
 *
 * Distinct structure: monochrome (no accent), a large centered name under a
 * thin double rule, small-caps section titles separated by hairline rules,
 * and entries with a sparse "label + value" rhythm. All caps + generous
 * whitespace make it read like a Swiss poster rather than a standard resume.
 */
export function Minimal({ resume }: { resume: ResumeData }) {
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
      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">{children}</span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );

  const renderSection = (id: string) => {
    if (id.startsWith("custom-")) {
      const cs = resume.customSections?.[id];
      if (!cs || cs.items.length === 0) return null;
      return (
        <div className="mb-8">
          <SectionTitle>{cs.title || "Custom Section"}</SectionTitle>
          {cs.items.map((item) => (
            <div key={item.id} className="mb-3">
              <div className="text-[12px] font-semibold text-gray-700">{item.title}</div>
              {item.subtitle && <div className="text-[11px] text-gray-400">{item.subtitle}</div>}
              {item.description && <p className="text-[12px] text-gray-500 mt-0.5">{item.description}</p>}
            </div>
          ))}
        </div>
      );
    }

    switch (id) {
      case "summary":
        return resume.summary ? (
          <div className="mb-8">
            <SectionTitle>Profile</SectionTitle>
            <p className="text-[13px] leading-relaxed text-gray-600">{resume.summary}</p>
          </div>
        ) : null;
      case "experience":
        if (!resume.experience?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Experience</SectionTitle>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-semibold tracking-wide text-gray-800">{exp.role}</span>
                  <span className="text-[10.5px] uppercase tracking-wider text-gray-400">
                    {exp.startDate} — {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                <div className="text-[11.5px] uppercase tracking-[0.14em] text-gray-500 mt-0.5">{exp.company}</div>
                {exp.responsibilities.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {exp.responsibilities.map((r, i) => (
                      <p key={i} className="text-[12px] text-gray-500 leading-relaxed pl-3 border-l border-gray-200">
                        {r}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      case "education":
        if (!resume.education?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Education</SectionTitle>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-semibold text-gray-800">{edu.institution}</span>
                  <span className="text-[10.5px] uppercase tracking-wider text-gray-400">{edu.endDate}</span>
                </div>
                <div className="text-[12px] text-gray-500 mt-0.5">
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
          <div className="mb-8">
            <SectionTitle>Selected Projects</SectionTitle>
            {resume.projects.map((proj) => (
              <div key={proj.id} className="mb-3">
                <div className="text-[13px] font-semibold text-gray-800">{proj.name}</div>
                <p className="text-[12px] text-gray-500 mt-0.5">{proj.description}</p>
                {proj.technologies.length > 0 && (
                  <div className="text-[10.5px] uppercase tracking-wider text-gray-400 mt-1">
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
          <div className="mb-8">
            <SectionTitle>Skills</SectionTitle>
            <div className="text-[12px] text-gray-600 leading-loose">
              {[
                ...resume.skills.technical,
                ...resume.skills.frameworks,
                ...resume.skills.tools,
                ...resume.skills.soft,
              ].join("  /  ")}
            </div>
          </div>
        );
      case "certifications":
        if (!resume.certifications?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Certifications</SectionTitle>
            {resume.certifications.map((c) => (
              <div key={c.id} className="text-[12px] text-gray-600 mb-1">
                {c.name} — {c.issuer}
              </div>
            ))}
          </div>
        );
      case "achievements":
        if (!resume.achievements?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Honors</SectionTitle>
            {resume.achievements.map((a) => (
              <div key={a.id} className="text-[12px] text-gray-600 mb-1">
                <span className="font-semibold text-gray-700">{a.title}</span>
                {a.description ? ` — ${a.description}` : ""}
              </div>
            ))}
          </div>
        );
      case "languages":
        if (!resume.languages?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Languages</SectionTitle>
            <div className="text-[12px] text-gray-600">
              {resume.languages.map((l) => `${l.name} (${l.proficiency})`).join(" · ")}
            </div>
          </div>
        );
      case "leadership":
        if (!resume.leadership?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Leadership</SectionTitle>
            {resume.leadership.map((item) => (
              <div key={item.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-semibold tracking-wide text-gray-800">{item.title}</span>
                  <span className="text-[10.5px] uppercase tracking-wider text-gray-400">
                    {item.startDate} — {item.endDate}
                  </span>
                </div>
                <div className="text-[11.5px] uppercase tracking-[0.14em] text-gray-500 mt-0.5">{item.organization}</div>
                <p className="text-[12px] text-gray-500 leading-relaxed mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "openSource":
        if (!resume.openSource?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Open Source</SectionTitle>
            {resume.openSource.map((item) => (
              <div key={item.id} className="mb-4">
                <div className="text-[13px] font-semibold tracking-wide text-gray-800">{item.projectName}</div>
                <div className="text-[11.5px] uppercase tracking-[0.14em] text-gray-500 mt-0.5">{item.role}</div>
                <p className="text-[12px] text-gray-500 leading-relaxed mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "publications":
        if (!resume.publications?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Publications</SectionTitle>
            {resume.publications.map((item) => (
              <div key={item.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-semibold tracking-wide text-gray-800">{item.title}</span>
                  <span className="text-[10.5px] uppercase tracking-wider text-gray-400">{item.date}</span>
                </div>
                <div className="text-[11.5px] uppercase tracking-[0.14em] text-gray-500 mt-0.5">{item.publisher}</div>
              </div>
            ))}
          </div>
        );
      case "volunteer":
        if (!resume.volunteer?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Volunteer</SectionTitle>
            {resume.volunteer.map((item) => (
              <div key={item.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-semibold tracking-wide text-gray-800">{item.role}</span>
                  <span className="text-[10.5px] uppercase tracking-wider text-gray-400">
                    {item.startDate} — {item.endDate}
                  </span>
                </div>
                <div className="text-[11.5px] uppercase tracking-[0.14em] text-gray-500 mt-0.5">{item.organization}</div>
                <p className="text-[12px] text-gray-500 leading-relaxed mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "activities":
        if (!resume.activities?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Activities</SectionTitle>
            {resume.activities.map((item) => (
              <div key={item.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-semibold tracking-wide text-gray-800">{item.title}</span>
                  <span className="text-[10.5px] uppercase tracking-wider text-gray-400">{item.date}</span>
                </div>
                <p className="text-[12px] text-gray-500 leading-relaxed mt-0.5">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "coursework":
        if (!resume.coursework?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Coursework</SectionTitle>
            <div className="text-[12px] text-gray-600 leading-loose">
              {resume.coursework.join("  /  ")}
            </div>
          </div>
        );
      case "interests":
        if (!resume.interests?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Interests</SectionTitle>
            <div className="text-[12px] text-gray-600 leading-loose">
              {resume.interests.join("  /  ")}
            </div>
          </div>
        );
      case "codingProfiles":
        if (!resume.codingProfiles?.length) return null;
        return (
          <div className="mb-8">
            <SectionTitle>Profiles</SectionTitle>
            <div className="flex flex-col gap-1">
              {resume.codingProfiles.map((item) => (
                <div key={item.id} className="text-[12px] text-gray-600">
                  <span className="font-semibold text-gray-700">{item.platform}: </span>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{item.handle}</a>
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
      {/* Monochrome centered masthead */}
      <div className="text-center mb-9">
        <h1 className="text-[30px] font-light tracking-[0.06em] text-gray-900 uppercase">
          {personalInfo.fullName}
        </h1>
        <div className="mx-auto mt-3 h-px w-24 bg-gray-300" />
        <div className="mx-auto mt-2 h-px w-10 bg-gray-300" />
        <div className="mt-3 text-[10.5px] uppercase tracking-[0.18em] text-gray-500">
          {contactItems.join("  ·  ")}
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
