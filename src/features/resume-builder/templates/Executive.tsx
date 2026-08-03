import type { ResumeData } from "@/types/resume";
import { fontFamilyClass, accentWithAlpha } from "./theme";
import { CustomSectionBlock } from "./CustomSectionBlock";

export function Executive({ resume }: { resume: ResumeData }) {
  const accent = resume.accentColor || "#312e81";
  const { personalInfo, summary, education, experience, projects, skills, certifications, achievements, languages } = resume;

  return (
    <div
      className={`${fontFamilyClass(resume.fontFamily)} text-sm leading-relaxed text-slate-900 bg-white p-8 border-t-8 border-[color:var(--resume-accent)]`}
      style={{
        "--resume-accent": accent,
        "--resume-accent-border": accentWithAlpha(accent, 0.2),
      } as React.CSSProperties}
    >
      <div className="flex flex-col items-center mb-8 border-b-2 border-[color:var(--resume-accent-border)] pb-6">
        <h1 className="text-4xl font-bold uppercase tracking-wider text-[color:var(--resume-accent)] mb-2">{personalInfo.fullName}</h1>
        <div className="text-slate-600 font-sans tracking-wide">
          {personalInfo.email} {personalInfo.phone && `• ${personalInfo.phone}`}
        </div>
        <div className="text-slate-500 font-sans text-xs mt-1 space-x-2">
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          {personalInfo.github && <span>• {personalInfo.github}</span>}
          {personalInfo.portfolio && <span>• {personalInfo.portfolio}</span>}
        </div>
      </div>

      {summary && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[color:var(--resume-accent)] border-b border-[color:var(--resume-accent-border)] pb-2 mb-3 uppercase tracking-widest">Executive Summary</h2>
          <p className="text-slate-700 leading-loose">{summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[color:var(--resume-accent)] border-b border-[color:var(--resume-accent-border)] pb-2 mb-4 uppercase tracking-widest">Professional Experience</h2>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-6">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-lg text-slate-800">{exp.role}</span>
                <span className="text-[color:var(--resume-accent)] font-medium font-sans text-xs uppercase tracking-wider">{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
              </div>
              <div className="text-slate-600 font-semibold mb-2">{exp.company}{exp.location && `, ${exp.location}`}</div>
              {exp.responsibilities.length > 0 && (
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-700">
                  {exp.responsibilities.map((r, i) => <li key={i} className="pl-1">{r}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[color:var(--resume-accent)] border-b border-[color:var(--resume-accent-border)] pb-2 mb-4 uppercase tracking-widest">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-800">{edu.degree}{edu.field && ` in ${edu.field}`}</span>
                <span className="text-[color:var(--resume-accent)] font-medium font-sans text-xs uppercase tracking-wider">{edu.startDate} – {edu.endDate}</span>
              </div>
              <div className="text-slate-600 font-semibold">{edu.institution}</div>
              {edu.cgpa && <div className="text-slate-500 text-sm mt-1">CGPA: {edu.cgpa}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mb-8">
        {skills && (
          <div>
            <h2 className="text-xl font-bold text-[color:var(--resume-accent)] border-b border-[color:var(--resume-accent-border)] pb-2 mb-4 uppercase tracking-widest">Core Competencies</h2>
            <div className="space-y-3 font-sans">
              {skills.technical.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Technical: </span>
                  <span className="text-slate-700">{skills.technical.join(", ")}</span>
                </div>
              )}
              {skills.frameworks.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Frameworks: </span>
                  <span className="text-slate-700">{skills.frameworks.join(", ")}</span>
                </div>
              )}
              {skills.tools.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Tools: </span>
                  <span className="text-slate-700">{skills.tools.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(projects.length > 0 || certifications.length > 0 || languages.length > 0 || achievements.length > 0) && (
          <div>
             <h2 className="text-xl font-bold text-[color:var(--resume-accent)] border-b border-[color:var(--resume-accent-border)] pb-2 mb-4 uppercase tracking-widest">Additional Value</h2>
             
             {certifications.length > 0 && (
              <div className="mb-4 font-sans">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Certifications</h3>
                {certifications.map((cert) => (
                  <div key={cert.id} className="text-slate-700 mb-1">
                    {cert.name}{cert.issuer && ` — ${cert.issuer}`}
                  </div>
                ))}
              </div>
            )}

            {languages.length > 0 && (
              <div className="mb-4 font-sans">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Languages</h3>
                {languages.map((lang) => (
                  <div key={lang.id} className="text-slate-700 mb-1">
                    {lang.name} <span className="text-slate-500">— {lang.proficiency}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <CustomSectionBlock
        resume={resume}
        containerClassName="mb-8"
        headingClassName="text-xl font-bold text-[color:var(--resume-accent)] border-b border-[color:var(--resume-accent-border)] pb-2 mb-4 uppercase tracking-widest"
      />
    </div>
  );
}
