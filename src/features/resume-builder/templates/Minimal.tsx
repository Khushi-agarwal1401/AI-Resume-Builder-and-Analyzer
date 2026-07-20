import type { ResumeData } from "@/types/resume";

export function Minimal({ resume }: { resume: ResumeData }) {
  const { personalInfo, summary, experience, education, skills } = resume;

  return (
    <div className="font-sans text-sm leading-relaxed">
      <div className="mb-6">
        <h1 className="text-3xl font-light">{personalInfo.fullName}</h1>
        <div className="text-gray-500 text-xs mt-1">
          {personalInfo.email}{personalInfo.phone && ` / ${personalInfo.phone}`}
        </div>
      </div>

      {summary && (
        <div className="mb-6">
          <p className="text-gray-700">{summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Experience</h2>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between">
                <span className="font-semibold">{exp.role}</span>
                <span className="text-gray-400 text-xs">{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
              </div>
              <div className="text-gray-500 text-xs">{exp.company}</div>
              {exp.responsibilities.length > 0 && (
                <div className="mt-1 text-gray-600 text-xs">
                  {exp.responsibilities.map((r, i) => <div key={i} className="mb-0.5">{r}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="font-semibold">{edu.institution}</div>
              <div className="text-gray-500 text-xs">{edu.degree}{edu.cgpa && `, CGPA: ${edu.cgpa}`}</div>
            </div>
          ))}
        </div>
      )}

      {skills && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Skills</h2>
          <div className="text-gray-700 text-xs">
            {[
              ...skills.technical,
              ...skills.frameworks,
              ...skills.tools,
              ...skills.soft,
            ].join(" \u00B7 ")}
          </div>
        </div>
      )}
    </div>
  );
}
