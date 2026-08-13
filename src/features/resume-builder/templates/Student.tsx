import type { ResumeData } from "@/types/resume";
import { fontFamilyClass, accentWithAlpha, getVariantAccent, defaultFontForTemplate } from "./theme";

/**
 * STUDENT — education-first with a colored header band.
 *
 * Distinct structure: a full-width accent band carries the name and objective;
 * education is the hero section rendered as a card grid; projects appear as
 * bordered cards; skills are chip clouds. Built for students and grads where
 * academics and projects matter more than work history.
 */
export function Student({ resume }: { resume: ResumeData }) {
  const accent = getVariantAccent(resume, "#059669");
  const { personalInfo, summary, education, projects, skills, certifications, achievements, languages, experience } = resume;

  const contactItems = [personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean);

  const SectionTitle = ({ children }: { children: string }) => (
    <h2 className="mb-3 text-[13px] font-black uppercase tracking-[0.1em] text-gray-800 flex items-center gap-2">
      <span className="inline-block h-3.5 w-3.5 rounded" style={{ backgroundColor: accent }} />
      {children}
    </h2>
  );

  const chip = (label: string) => (
    <span
      key={label}
      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: accentWithAlpha(accent, 0.12), color: accent }}
    >
      {label}
    </span>
  );

  return (
    <div className={`${fontFamilyClass(defaultFontForTemplate(resume))} text-sm leading-relaxed`}>
      {/* ── Colored header band ── */}
      <div
        className="-mx-10 -mt-10 mb-8 px-10 pb-7 pt-9 text-white"
        style={{ backgroundColor: accent, backgroundImage: `radial-gradient(circle at 85% 20%, ${accentWithAlpha("#ffffff", 0.18)}, transparent 45%)` }}
      >
        <h1 className="text-[30px] font-black leading-tight tracking-tight">{personalInfo.fullName}</h1>
        <div className="mt-1.5 text-[13px] font-medium opacity-90">
          {experience?.[0]?.role || (education[0]?.degree ? `${education[0].degree} Candidate` : "Student")}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium opacity-85">
          {contactItems.map((c) => (
            <span key={c} className="break-all">{c}</span>
          ))}
        </div>
      </div>

      {/* ── Objective ── */}
      {summary && (
        <div className="mb-7">
          <SectionTitle>Objective</SectionTitle>
          <p className="text-gray-700 text-[13px] leading-relaxed">{summary}</p>
        </div>
      )}

      {/* ── Education first — hero section ── */}
      {education.length > 0 && (
        <div className="mb-7">
          <SectionTitle>Education</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {education.map((edu) => (
              <div key={edu.id} className="rounded-xl border p-4" style={{ borderColor: accentWithAlpha(accent, 0.25) }}>
                <div className="text-[14px] font-bold text-gray-900 leading-tight">{edu.institution}</div>
                <div className="mt-1 text-[12px] font-semibold" style={{ color: accent }}>
                  {edu.degree}
                  {edu.field ? ` · ${edu.field}` : ""}
                </div>
                <div className="mt-1 text-[11px] text-gray-500">
                  {edu.startDate} – {edu.endDate}
                  {edu.cgpa ? ` · CGPA ${edu.cgpa}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Skills as chips ── */}
      {skills && (
        <div className="mb-7">
          <SectionTitle>Skills</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {[
              ...skills.technical,
              ...skills.frameworks,
              ...skills.tools,
              ...skills.soft,
            ].map(chip)}
          </div>
        </div>
      )}

      {/* ── Projects as cards ── */}
      {projects.length > 0 && (
        <div className="mb-7">
          <SectionTitle>Projects</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {projects.map((proj) => (
              <div key={proj.id} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
                <div className="text-[13px] font-bold text-gray-900">{proj.name}</div>
                <p className="mt-1 text-[11.5px] leading-snug text-gray-600">{proj.description}</p>
                {proj.technologies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">{proj.technologies.map(chip)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Experience (internships) ── */}
      {experience.length > 0 && (
        <div className="mb-7">
          <SectionTitle>Experience</SectionTitle>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[13px] font-bold text-gray-900">{exp.role} — {exp.company}</span>
                <span className="text-[11px] text-gray-400">{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
              </div>
              {exp.responsibilities.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-[12px] text-gray-600 space-y-0.5">
                  {exp.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {resume.leadership && resume.leadership.length > 0 && (
        <div className="mb-7">
          <SectionTitle>Leadership</SectionTitle>
          {resume.leadership.map((item) => (
            <div key={item.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[13px] font-bold text-gray-900">{item.title} — {item.organization}</span>
                <span className="text-[11px] text-gray-400">{item.startDate} – {item.endDate}</span>
              </div>
              <p className="mt-1 text-[12px] text-gray-600 leading-snug">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {resume.openSource && resume.openSource.length > 0 && (
        <div className="mb-7">
          <SectionTitle>Open Source</SectionTitle>
          {resume.openSource.map((item) => (
            <div key={item.id} className="mb-3">
              <span className="text-[13px] font-bold text-gray-900">{item.projectName}</span>
              <span className="ml-2 text-[12px] italic text-gray-600">{item.role}</span>
              <p className="mt-1 text-[12px] text-gray-600 leading-snug">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {resume.publications && resume.publications.length > 0 && (
        <div className="mb-7">
          <SectionTitle>Publications</SectionTitle>
          {resume.publications.map((item) => (
            <div key={item.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[13px] font-bold text-gray-900">{item.title}</span>
                <span className="text-[11px] text-gray-400">{item.date}</span>
              </div>
              <p className="text-[12px] italic text-gray-600">{item.publisher}</p>
            </div>
          ))}
        </div>
      )}

      {resume.volunteer && resume.volunteer.length > 0 && (
        <div className="mb-7">
          <SectionTitle>Volunteer</SectionTitle>
          {resume.volunteer.map((item) => (
            <div key={item.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[13px] font-bold text-gray-900">{item.role} — {item.organization}</span>
                <span className="text-[11px] text-gray-400">{item.startDate} – {item.endDate}</span>
              </div>
              <p className="mt-1 text-[12px] text-gray-600 leading-snug">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {resume.activities && resume.activities.length > 0 && (
        <div className="mb-7">
          <SectionTitle>Activities</SectionTitle>
          {resume.activities.map((item) => (
            <div key={item.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[13px] font-bold text-gray-900">{item.title}</span>
                <span className="text-[11px] text-gray-400">{item.date}</span>
              </div>
              <p className="mt-1 text-[12px] text-gray-600 leading-snug">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {resume.coursework && resume.coursework.length > 0 && (
        <div className="mb-7">
          <SectionTitle>Coursework</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {resume.coursework.map(chip)}
          </div>
        </div>
      )}

      {resume.interests && resume.interests.length > 0 && (
        <div className="mb-7">
          <SectionTitle>Interests</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {resume.interests.map(chip)}
          </div>
        </div>
      )}

      {resume.codingProfiles && resume.codingProfiles.length > 0 && (
        <div className="mb-7">
          <SectionTitle>Profiles</SectionTitle>
          <div className="flex flex-wrap gap-4">
            {resume.codingProfiles.map((p) => (
              <div key={p.id} className="text-[12px]">
                <span className="font-bold text-gray-800">{p.platform}: </span>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline">{p.handle}</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {resume.customSections && Object.values(resume.customSections).length > 0 && (
        <>
          {Object.entries(resume.customSections).map(([sectionName, cs]) => (
            <div key={sectionName} className="mb-7">
              <SectionTitle>{cs.title || "Custom Section"}</SectionTitle>
              {cs.items.map((item) => (
                <div key={item.id} className="mb-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[13px] font-bold text-gray-900">{item.title}</span>
                    <span className="text-[11px] text-gray-400">{item.date}</span>
                  </div>
                  <p className="text-[12px] italic text-gray-600">{item.subtitle}</p>
                  <p className="mt-1 text-[12px] text-gray-600 leading-snug">{item.description}</p>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* ── Certifications + achievements + languages ── */}
      {(certifications.length > 0 || achievements.length > 0 || languages.length > 0) && (
        <div className="grid grid-cols-2 gap-x-6">
          {certifications.length > 0 && (
            <div className="mb-5">
              <SectionTitle>Certifications</SectionTitle>
              {certifications.map((c) => (
                <div key={c.id} className="text-[12px] text-gray-700 mb-1">
                  <span className="font-semibold">{c.name}</span>
                  {c.issuer ? ` — ${c.issuer}` : ""}
                </div>
              ))}
            </div>
          )}
          <div className="mb-5">
            {achievements.length > 0 && (
              <>
                <SectionTitle>Achievements</SectionTitle>
                {achievements.map((a) => (
                  <div key={a.id} className="text-[12px] text-gray-700 mb-1">• {a.title}</div>
                ))}
              </>
            )}
            {languages.length > 0 && (
              <>
                <SectionTitle>Languages</SectionTitle>
                <div className="text-[12px] text-gray-700">
                  {languages.map((l) => `${l.name} (${l.proficiency})`).join(" · ")}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
