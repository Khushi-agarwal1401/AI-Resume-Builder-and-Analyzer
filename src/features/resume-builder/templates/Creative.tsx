import type { ResumeData } from "@/types/resume";
import { fontFamilyClass, getVariantAccent, accentWithAlpha, defaultFontForTemplate } from "./theme";

/**
 * CREATIVE — bold sidebar archetype.
 *
 * Accent-driven: the sidebar tint, name, timeline, skill tags, and section
 * titles all derive from the variant's accent color, so every Creative
 * variant (Creative, Portfolio Developer, Design Portfolio, …) carries its
 * own identity while reusing the same layout.
 */
export function Creative({ resume }: { resume: ResumeData }) {
  const accent = getVariantAccent(resume, "#db2777");
  const { personalInfo, summary, education, experience, projects, skills, languages } = resume;

  const sidebarBg = accentWithAlpha(accent, 0.08);
  const sidebarBorder = accentWithAlpha(accent, 0.18);
  const tagBg = accentWithAlpha(accent, 0.14);
  const mutedOnAccent = accentWithAlpha(accent, 0.75);

  return (
    <div className={`${fontFamilyClass(defaultFontForTemplate(resume))} text-sm leading-relaxed text-gray-800 bg-white h-full min-h-[1000px] grid grid-cols-3`}>
      <div className="col-span-1 p-6 border-r flex flex-col break-words" style={{ backgroundColor: sidebarBg, borderColor: sidebarBorder }}>
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter leading-none mb-2" style={{ color: accent }}>{personalInfo.fullName}</h1>
          <div className="w-12 h-1.5 mb-4 rounded-full" style={{ backgroundColor: accent }}></div>

          <div className="space-y-2 text-xs font-medium break-all" style={{ color: mutedOnAccent }}>
            {personalInfo.email && <div>{personalInfo.email}</div>}
            {personalInfo.phone && <div>{personalInfo.phone}</div>}
            {personalInfo.linkedin && <div>{personalInfo.linkedin}</div>}
            {personalInfo.github && <div>{personalInfo.github}</div>}
            {personalInfo.portfolio && <div>{personalInfo.portfolio}</div>}
          </div>
        </div>

        {skills && (
          <div className="mb-8">
            <h2 className="text-lg font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>Skills</h2>
            <div className="space-y-4">
              {skills.technical.length > 0 && (
                <div>
                  <h3 className="font-bold text-xs mb-1" style={{ color: mutedOnAccent }}>Technical</h3>
                  <div className="flex flex-wrap gap-1">
                    {skills.technical.map(s => <span key={s} className="px-2 py-0.5 rounded-sm text-xs font-medium" style={{ backgroundColor: tagBg, color: accent }}>{s}</span>)}
                  </div>
                </div>
              )}
              {skills.frameworks.length > 0 && (
                <div>
                  <h3 className="font-bold text-xs mb-1" style={{ color: mutedOnAccent }}>Frameworks</h3>
                  <div className="flex flex-wrap gap-1">
                    {skills.frameworks.map(s => <span key={s} className="px-2 py-0.5 rounded-sm text-xs font-medium" style={{ backgroundColor: tagBg, color: accent }}>{s}</span>)}
                  </div>
                </div>
              )}
              {skills.tools.length > 0 && (
                <div>
                  <h3 className="font-bold text-xs mb-1" style={{ color: mutedOnAccent }}>Tools</h3>
                  <div className="flex flex-wrap gap-1">
                    {skills.tools.map(s => <span key={s} className="px-2 py-0.5 rounded-sm text-xs font-medium" style={{ backgroundColor: tagBg, color: accent }}>{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {languages.length > 0 && (
          <div className="mb-8">
             <h2 className="text-lg font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>Languages</h2>
             <div className="space-y-2">
               {languages.map(l => (
                 <div key={l.id} className="text-sm font-medium flex justify-between" style={{ color: mutedOnAccent }}>
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
                <div key={exp.id} className="relative pl-4 border-l-2" style={{ borderColor: accentWithAlpha(accent, 0.3) }}>
                  <div className="absolute w-2.5 h-2.5 rounded-full -left-[6px] top-1.5 shadow-[0_0_0_4px_white]" style={{ backgroundColor: accent }}></div>
                  <h3 className="font-bold text-lg text-gray-900 leading-none mb-1">{exp.role}</h3>
                  <div className="font-medium text-sm mb-2" style={{ color: accent }}>
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
      </div>
    </div>
  );
}
