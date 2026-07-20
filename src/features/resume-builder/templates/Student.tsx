import type { ResumeData } from "@/types/resume";

export function Student({ resume }: { resume: ResumeData }) {
  const { personalInfo, summary, education, projects, skills, certifications, achievements, languages } = resume;

  return (
    <div className="font-sans text-sm leading-relaxed">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{personalInfo.fullName}</h1>
        <div className="text-gray-600 text-xs">{personalInfo.email} | {personalInfo.phone}</div>
        <div className="text-gray-500 text-xs">{personalInfo.linkedin}{personalInfo.github && ` | ${personalInfo.github}`}</div>
      </div>

      {summary && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Summary</h2>
          <p className="text-gray-700">{summary}</p>
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between">
                <span className="font-semibold">{edu.institution}</span>
                <span className="text-gray-500 text-xs">{edu.endDate}</span>
              </div>
              <div className="text-gray-600 text-xs">{edu.degree}{edu.field && ` in ${edu.field}`}{edu.cgpa && ` - CGPA: ${edu.cgpa}`}</div>
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Projects</h2>
          {projects.map((proj) => (
            <div key={proj.id} className="mb-2">
              <div className="font-semibold">{proj.name}</div>
              <p className="text-gray-700 text-xs">{proj.description}</p>
              {proj.technologies.length > 0 && (
                <div className="text-gray-500 text-xs mt-1">{proj.technologies.join(", ")}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {skills && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Skills</h2>
          {skills.technical.length > 0 && <div className="text-xs text-gray-700 mb-1"><span className="font-semibold">Technical:</span> {skills.technical.join(", ")}</div>}
          {skills.tools.length > 0 && <div className="text-xs text-gray-700"><span className="font-semibold">Tools:</span> {skills.tools.join(", ")}</div>}
        </div>
      )}

      {certifications.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Certifications</h2>
          {certifications.map((cert) => (
            <div key={cert.id} className="text-xs text-gray-700">{cert.name} - {cert.issuer}</div>
          ))}
        </div>
      )}

      {achievements.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Achievements</h2>
          {achievements.map((ach) => (
            <div key={ach.id} className="text-xs text-gray-700 mb-1">- {ach.title}{ach.description && `: ${ach.description}`}</div>
          ))}
        </div>
      )}

      {languages.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Languages</h2>
          <div className="text-xs text-gray-700">{languages.map((l) => `${l.name} (${l.proficiency})`).join(", ")}</div>
        </div>
      )}
    </div>
  );
}
