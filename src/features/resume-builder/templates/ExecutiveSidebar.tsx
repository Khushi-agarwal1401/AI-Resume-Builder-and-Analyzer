import type { ResumeData } from "@/types/resume";
import { fontFamilyClass, getVariantAccent, defaultFontForTemplate } from "./theme";

export function ExecutiveSidebar({ resume }: { resume: ResumeData }) {
  const accent = getVariantAccent(resume, "#3b82f6");
  const { personalInfo, summary, education, experience, projects, skills, certifications, achievements, languages } = resume;

  return (
    <div className={`${fontFamilyClass(defaultFontForTemplate(resume))} flex min-h-[600px] bg-white`}>
      {/* ── Sidebar ── */}
      <div className="w-[30%] bg-slate-900 text-white p-6 flex flex-col shrink-0">
        <h2 className="text-lg font-bold leading-tight mb-1">{personalInfo.fullName}</h2>
        <p className="text-slate-400 text-xs mb-5">Software Engineer</p>
        <div className="h-px bg-slate-700 mb-4" />

        <div className="space-y-1 mb-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contact</h3>
          {personalInfo.email && <p className="text-xs text-slate-300">{personalInfo.email}</p>}
          {personalInfo.phone && <p className="text-xs text-slate-300">{personalInfo.phone}</p>}
          {personalInfo.linkedin && <p className="text-xs" style={{ color: accent }}>{personalInfo.linkedin}</p>}
          {personalInfo.github && <p className="text-xs" style={{ color: accent }}>{personalInfo.github}</p>}
          {personalInfo.portfolio && <p className="text-xs" style={{ color: accent }}>{personalInfo.portfolio}</p>}
        </div>

        {languages.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Languages</h3>
            {languages.map((l) => (
              <p key={l.id} className="text-xs text-slate-300 mb-0.5">{l.name} — {l.proficiency}</p>
            ))}
          </div>
        )}

        {skills && (
          <div className="mb-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Skills</h3>
            {skills.technical.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {skills.technical.map(s => (
                  <span key={s} className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            )}
            {skills.frameworks.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {skills.frameworks.map(s => (
                  <span key={s} className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            )}
            {skills.tools.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {skills.tools.map(s => (
                  <span key={s} className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {certifications.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Certs</h3>
            {certifications.map((cert) => (
              <p key={cert.id} className="text-xs text-slate-300 mb-0.5">{cert.name}</p>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 p-7 overflow-y-auto">
        {summary && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-3">Profile</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-3">Experience</h3>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-baseline">
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

        {education.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-3">Education</h3>
            {education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-800">{edu.institution}</span>
                  <span className="text-[11px] text-slate-400">{edu.startDate} – {edu.endDate}</span>
                </div>
                <p className="text-xs" style={{ color: accent }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.cgpa ? ` | CGPA: ${edu.cgpa}` : ""}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {projects.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-3">Projects</h3>
              {projects.map((proj) => (
                <div key={proj.id} className="mb-3">
                  <p className="text-sm font-bold text-slate-800">{proj.name}</p>
                  <p className="text-xs text-slate-600">{proj.description}</p>
                  {proj.technologies.length > 0 && (
                    <p className="text-[10px] text-slate-400 mt-0.5">Tech: {proj.technologies.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {achievements.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-3">Achievements</h3>
              {achievements.map((ach) => (
                <p key={ach.id} className="text-xs text-slate-600 mb-2"><span className="font-bold">{ach.title}</span>: {ach.description}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
