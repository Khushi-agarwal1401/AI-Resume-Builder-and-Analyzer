import type { ResumeData } from "@/types/resume";
import { fontFamilyClass, accentWithAlpha } from "./theme";
import { CustomSectionBlock } from "./CustomSectionBlock";

export function Creative({ resume }: { resume: ResumeData }) {
  const accent = resume.accentColor || "#db2777";
  const { personalInfo, summary, education, experience, projects, skills, languages } = resume;

  return (
    <div
      className={`${fontFamilyClass(resume.fontFamily)} text-sm leading-relaxed text-gray-800 bg-white h-full min-h-[1000px] grid grid-cols-3`}
      style={{
        "--resume-accent": accent,
        "--resume-accent-soft": accentWithAlpha(accent, 0.1),
        "--resume-accent-border": accentWithAlpha(accent, 0.25),
      } as React.CSSProperties}
    >
      <div className="col-span-1 bg-[color:var(--resume-accent-soft)] p-6 border-r border-[color:var(--resume-accent-border)] flex flex-col break-words">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-[color:var(--resume-accent)] leading-none mb-2">{personalInfo.fullName}</h1>
          <div className="w-12 h-1.5 bg-[color:var(--resume-accent)] mb-4 rounded-full"></div>
          
          <div className="space-y-2 text-xs font-medium text-[color:var(--resume-accent)] break-all">
            {personalInfo.email && <div>{personalInfo.email}</div>}
            {personalInfo.phone && <div>{personalInfo.phone}</div>}
            {personalInfo.linkedin && <div>{personalInfo.linkedin}</div>}
            {personalInfo.github && <div>{personalInfo.github}</div>}
            {personalInfo.portfolio && <div>{personalInfo.portfolio}</div>}
          </div>
        </div>

        {skills && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[color:var(--resume-accent)] uppercase tracking-widest mb-3">Skills</h2>
            <div className="space-y-4">
              {skills.technical.length > 0 && (
                <div>
                  <h3 className="font-bold text-[color:var(--resume-accent)] text-xs mb-1">Technical</h3>
                  <div className="flex flex-wrap gap-1">
                    {skills.technical.map(s => <span key={s} className="bg-[color:var(--resume-accent-soft)] text-[color:var(--resume-accent)] px-2 py-0.5 rounded-sm text-xs">{s}</span>)}
                  </div>
                </div>
              )}
              {skills.frameworks.length > 0 && (
                <div>
                  <h3 className="font-bold text-[color:var(--resume-accent)] text-xs mb-1">Frameworks</h3>
                  <div className="flex flex-wrap gap-1">
                    {skills.frameworks.map(s => <span key={s} className="bg-[color:var(--resume-accent-soft)] text-[color:var(--resume-accent)] px-2 py-0.5 rounded-sm text-xs">{s}</span>)}
                  </div>
                </div>
              )}
              {skills.tools.length > 0 && (
                <div>
                  <h3 className="font-bold text-[color:var(--resume-accent)] text-xs mb-1">Tools</h3>
                  <div className="flex flex-wrap gap-1">
                    {skills.tools.map(s => <span key={s} className="bg-[color:var(--resume-accent-soft)] text-[color:var(--resume-accent)] px-2 py-0.5 rounded-sm text-xs">{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {languages.length > 0 && (
          <div className="mb-8">
             <h2 className="text-lg font-bold text-[color:var(--resume-accent)] uppercase tracking-widest mb-3">Languages</h2>
             <div className="space-y-2">
               {languages.map(l => (
                 <div key={l.id} className="text-sm font-medium text-[color:var(--resume-accent)] flex justify-between">
                   <span>{l.name}</span>
                   <span className="opacity-70 text-xs">{l.proficiency}</span>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      <div className="col-span-2 p-8">
        {summary && (
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">About Me</h2>
            <p className="text-gray-600 font-medium leading-relaxed">{summary}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-5">Experience</h2>
            <div className="space-y-6">
              {experience.map(exp => (
                <div key={exp.id} className="relative pl-4 border-l-2 border-[color:var(--resume-accent-border)]">
                  <div className="absolute w-2.5 h-2.5 bg-[color:var(--resume-accent)] rounded-full -left-[6px] top-1.5 shadow-[0_0_0_4px_white]"></div>
                  <h3 className="font-bold text-lg text-gray-900 leading-none mb-1">{exp.role}</h3>
                  <div className="text-[color:var(--resume-accent)] font-medium text-sm mb-2">
                    {exp.company} <span className="text-gray-400 font-normal">| {exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                  </div>
                  {exp.responsibilities.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1 text-gray-600">
                      {exp.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-5">Projects</h2>
            <div className="grid grid-cols-2 gap-4">
              {projects.map(proj => (
                <div key={proj.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-1">{proj.name}</h3>
                  <p className="text-gray-600 text-xs mb-2 leading-relaxed">{proj.description}</p>
                  {proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {proj.technologies.map(t => <span key={t} className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-5">Education</h2>
            <div className="space-y-4">
              {education.map(edu => (
                <div key={edu.id}>
                  <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                  <div className="text-gray-600 text-sm">{edu.institution} <span className="text-gray-400">| {edu.startDate} - {edu.endDate}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <CustomSectionBlock
          resume={resume}
          containerClassName="mb-8"
          headingClassName="text-2xl font-black text-gray-900 tracking-tight mb-5"
        />
      </div>
    </div>
  );
}
