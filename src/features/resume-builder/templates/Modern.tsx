import type { ResumeData } from "@/types/resume";

export function Modern({ resume }: { resume: ResumeData }) {
  const { personalInfo, summary, education, experience, projects, skills, certifications, achievements, languages } = resume;

  return (
    <div className="font-sans text-sm leading-relaxed">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{personalInfo.fullName}</h1>
        <div className="text-gray-600 mt-1">
          {personalInfo.email} {personalInfo.phone && `| ${personalInfo.phone}`}
        </div>
        <div className="text-gray-500 text-xs">
          {personalInfo.linkedin && <span>{personalInfo.linkedin} </span>}
          {personalInfo.github && <span>| {personalInfo.github} </span>}
          {personalInfo.portfolio && <span>| {personalInfo.portfolio}</span>}
        </div>
      </div>

      {summary && (
        <div className="mb-6">
          <h2 className="text-base font-bold border-b pb-1 mb-2">Professional Summary</h2>
          <p className="text-gray-700">{summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold border-b pb-1 mb-2">Experience</h2>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between">
                <span className="font-semibold">{exp.role}</span>
                <span className="text-gray-500 text-xs">{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
              </div>
              <div className="text-gray-600 text-xs">{exp.company}{exp.location && `, ${exp.location}`}</div>
              {exp.responsibilities.length > 0 && (
                <ul className="list-disc pl-4 mt-1 text-gray-700">
                  {exp.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold border-b pb-1 mb-2">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between">
                <span className="font-semibold">{edu.institution}</span>
                <span className="text-gray-500 text-xs">{edu.startDate} - {edu.endDate}</span>
              </div>
              <div className="text-gray-600 text-xs">{edu.degree}{edu.field && ` in ${edu.field}`}{edu.cgpa && ` | CGPA: ${edu.cgpa}`}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-6">
        {skills && (
          <div>
            <h2 className="text-base font-bold border-b pb-1 mb-2">Skills</h2>
            {skills.technical.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold text-xs">Technical: </span>
                <span className="text-gray-700">{skills.technical.join(", ")}</span>
              </div>
            )}
            {skills.frameworks.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold text-xs">Frameworks: </span>
                <span className="text-gray-700">{skills.frameworks.join(", ")}</span>
              </div>
            )}
            {skills.tools.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold text-xs">Tools: </span>
                <span className="text-gray-700">{skills.tools.join(", ")}</span>
              </div>
            )}
          </div>
        )}

        {languages.length > 0 && (
          <div>
            <h2 className="text-base font-bold border-b pb-1 mb-2">Languages</h2>
            {languages.map((lang) => (
              <div key={lang.id} className="text-gray-700 text-xs">
                {lang.name} - <span className="capitalize">{lang.proficiency}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold border-b pb-1 mb-2">Projects</h2>
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

      {certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold border-b pb-1 mb-2">Certifications</h2>
          {certifications.map((cert) => (
            <div key={cert.id} className="text-gray-700 text-xs">
              {cert.name}{cert.issuer && ` - ${cert.issuer}`}{cert.date && ` (${cert.date})`}
            </div>
          ))}
        </div>
      )}

      {achievements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold border-b pb-1 mb-2">Achievements</h2>
          {achievements.map((ach) => (
            <div key={ach.id} className="mb-1">
              <div className="font-semibold text-xs">{ach.title}</div>
              <p className="text-gray-700 text-xs">{ach.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
