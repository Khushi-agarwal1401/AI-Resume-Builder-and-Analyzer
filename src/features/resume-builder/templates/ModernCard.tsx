import type { ResumeData } from "@/types/resume";
import { fontFamilyClass, getVariantAccent, accentWithAlpha, defaultFontForTemplate } from "./theme";

export function ModernCard({ resume }: { resume: ResumeData }) {
  const accent = getVariantAccent(resume, "#6366f1");
  const { personalInfo, summary, education, experience, projects, skills, certifications, achievements, languages } = resume;
  const chipBg = accentWithAlpha(accent, 0.1);

  return (
    <div className={`${fontFamilyClass(defaultFontForTemplate(resume))} bg-slate-50 p-6 text-sm leading-relaxed`}>
      {/* ── Header Card ── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{personalInfo.fullName}</h1>
        <p className="text-xs text-slate-500">
          {personalInfo.email}
          {personalInfo.phone && <span> | {personalInfo.phone}</span>}
        </p>
        {(personalInfo.linkedin || personalInfo.github || personalInfo.portfolio) && (
          <p className="text-xs text-slate-400 mt-0.5">
            {[personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean).join(" | ")}
          </p>
        )}
      </div>

      {/* ── Summary Card ── */}
      {summary && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Summary</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* ── Experience Card ── */}
      {experience.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Experience</h2>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-4 last:mb-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-sm font-bold text-slate-800">{exp.role}</span>
                <span className="text-[11px] text-slate-400">{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
              </div>
              <p className="text-xs font-medium mb-1" style={{ color: accent }}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</p>
              {exp.responsibilities.length > 0 && (
                <ul className="list-disc pl-4 text-xs text-slate-600 space-y-0.5">
                  {exp.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Education Card ── */}
      {education.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-3 last:mb-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-sm font-bold text-slate-800">{edu.institution}</span>
                <span className="text-[11px] text-slate-400">{edu.startDate} – {edu.endDate}</span>
              </div>
              <p className="text-xs" style={{ color: accent }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.cgpa ? ` | CGPA: ${edu.cgpa}` : ""}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Skills + Languages Card ── */}
      {(skills || languages.length > 0) && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Skills &amp; Languages</h2>
          <div className="grid grid-cols-2 gap-4">
            {skills && (
              <div>
                {skills.technical.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: accent }}>Technical</p>
                    <div className="flex flex-wrap gap-1">
                      {skills.technical.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: chipBg, color: accent }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {skills.frameworks.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: accent }}>Frameworks</p>
                    <div className="flex flex-wrap gap-1">
                      {skills.frameworks.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: chipBg, color: accent }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {skills.tools.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: accent }}>Tools</p>
                    <div className="flex flex-wrap gap-1">
                      {skills.tools.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: chipBg, color: accent }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: accent }}>Languages</p>
                {languages.map((l) => (
                  <p key={l.id} className="text-xs text-slate-600 mb-1">{l.name} — {l.proficiency}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Projects Card ── */}
      {projects.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Projects</h2>
          {projects.map((proj) => (
            <div key={proj.id} className="mb-3 last:mb-0">
              <p className="text-sm font-bold text-slate-800">{proj.name}</p>
              <p className="text-xs text-slate-600 mb-1">{proj.description}</p>
              {proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {proj.technologies.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: chipBg, color: accent }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Certifications Card ── */}
      {certifications.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Certifications</h2>
          {certifications.map((cert) => (
            <p key={cert.id} className="text-xs text-slate-600 mb-1">{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}{cert.date ? ` (${cert.date})` : ""}</p>
          ))}
        </div>
      )}

      {/* ── Achievements Card ── */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Achievements</h2>
          {achievements.map((ach) => (
            <p key={ach.id} className="text-xs text-slate-600 mb-1"><span className="font-bold">{ach.title}</span>: {ach.description}</p>
          ))}
        </div>
      )}

      {/* ── Leadership Card ── */}
      {resume.leadership && resume.leadership.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Leadership</h2>
          {resume.leadership.map((item) => (
            <div key={item.id} className="mb-4 last:mb-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-sm font-bold text-slate-800">{item.title}</span>
                <span className="text-[11px] text-slate-400">{item.startDate} – {item.endDate}</span>
              </div>
              <p className="text-xs font-medium mb-1" style={{ color: accent }}>{item.organization}</p>
              <p className="text-xs text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Open Source Card ── */}
      {resume.openSource && resume.openSource.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Open Source</h2>
          {resume.openSource.map((item) => (
            <div key={item.id} className="mb-4 last:mb-0">
              <p className="text-sm font-bold text-slate-800">{item.projectName}</p>
              <p className="text-xs font-medium mb-1" style={{ color: accent }}>{item.role}</p>
              <p className="text-xs text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Publications Card ── */}
      {resume.publications && resume.publications.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Publications</h2>
          {resume.publications.map((item) => (
            <div key={item.id} className="mb-3 last:mb-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-sm font-bold text-slate-800">{item.title}</span>
                <span className="text-[11px] text-slate-400">{item.date}</span>
              </div>
              <p className="text-xs font-medium" style={{ color: accent }}>{item.publisher}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Volunteer Card ── */}
      {resume.volunteer && resume.volunteer.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Volunteer Experience</h2>
          {resume.volunteer.map((item) => (
            <div key={item.id} className="mb-4 last:mb-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-sm font-bold text-slate-800">{item.role}</span>
                <span className="text-[11px] text-slate-400">{item.startDate} – {item.endDate}</span>
              </div>
              <p className="text-xs font-medium mb-1" style={{ color: accent }}>{item.organization}</p>
              <p className="text-xs text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Activities Card ── */}
      {resume.activities && resume.activities.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Activities</h2>
          {resume.activities.map((item) => (
            <div key={item.id} className="mb-4 last:mb-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-sm font-bold text-slate-800">{item.title}</span>
                <span className="text-[11px] text-slate-400">{item.date}</span>
              </div>
              <p className="text-xs text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Coursework Card ── */}
      {resume.coursework && resume.coursework.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Coursework</h2>
          <div className="flex flex-wrap gap-2">
            {resume.coursework.map(c => (
              <span key={c} className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Interests Card ── */}
      {resume.interests && resume.interests.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {resume.interests.map(i => (
              <span key={i} className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">{i}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Profiles Card ── */}
      {resume.codingProfiles && resume.codingProfiles.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Profiles</h2>
          <div className="flex flex-col gap-1">
            {resume.codingProfiles.map((p) => (
              <div key={p.id} className="text-xs">
                <span className="font-bold text-slate-800">{p.platform}: </span>
                <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:underline">{p.handle}</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Custom Sections ── */}
      {resume.customSections && Object.values(resume.customSections).length > 0 && (
        <>
          {Object.values(resume.customSections).map((cs) => (
            <div key={cs.id} className="bg-white rounded-lg border border-slate-200 p-5 mb-3 shadow-sm">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">{cs.title || "Custom Section"}</h2>
              {cs.items.map((item) => (
                <div key={item.id} className="mb-4 last:mb-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-sm font-bold text-slate-800">{item.title}</span>
                    <span className="text-[11px] text-slate-400">{item.date}</span>
                  </div>
                  <p className="text-xs font-medium mb-1" style={{ color: accent }}>{item.subtitle}</p>
                  <p className="text-xs text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
