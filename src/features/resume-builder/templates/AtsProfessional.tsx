import type { ResumeData } from "@/types/resume";

export function AtsProfessional({ resume }: { resume: ResumeData }) {
  const { personalInfo, summary, experience, education, skills, certifications } = resume;

  return (
    <div className="font-sans text-sm leading-relaxed">
      <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{personalInfo.fullName}</h1>
        <div className="text-gray-600 text-xs mt-1">
          {personalInfo.email} | {personalInfo.phone} | {personalInfo.linkedin} | {personalInfo.github}
        </div>
      </div>

      {summary && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Summary</h2>
          <p className="text-gray-700">{summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Experience</h2>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between font-semibold">
                <span>{exp.role}</span>
                <span className="text-gray-500 text-xs">{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
              </div>
              <div className="text-gray-600 text-xs">{exp.company}</div>
              {exp.responsibilities.length > 0 && (
                <ul className="list-disc pl-4 mt-1 text-gray-700 text-xs">
                  {exp.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-1 text-xs">
              <span className="font-semibold">{edu.degree}</span> - {edu.institution}, {edu.cgpa && `CGPA: ${edu.cgpa}`} ({edu.endDate})
            </div>
          ))}
        </div>
      )}

      {skills && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Skills</h2>
          <div className="text-xs text-gray-700">
            {skills.technical.length > 0 && <div><span className="font-semibold">Technical:</span> {skills.technical.join(", ")}</div>}
            {skills.frameworks.length > 0 && <div><span className="font-semibold">Frameworks:</span> {skills.frameworks.join(", ")}</div>}
          </div>
        </div>
      )}

      {certifications.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Certifications</h2>
          {certifications.map((cert) => (
            <div key={cert.id} className="text-xs">{cert.name} - {cert.issuer}</div>
          ))}
        </div>
      )}
    </div>
  );
}
