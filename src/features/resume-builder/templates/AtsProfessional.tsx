import type { ResumeData, TargetLevel } from "@/types/resume";
import { RESUME_TYPES } from "@/features/resume-builder/config/resume-types";

export function AtsProfessional({ resume }: { resume: ResumeData }) {
  const { 
    personalInfo, summary, education, experience, projects, skills, 
    certifications, achievements, languages, codingProfiles, leadership, 
    openSource, publications, volunteer, activities, coursework, interests,
    targetLevel = "experienced"
  } = resume;

  const typeConfig = RESUME_TYPES[targetLevel as TargetLevel] || RESUME_TYPES.experienced;

  const renderSection = (id: string) => {
    switch (id) {
      case "summary":
        if (!summary) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Summary</h2>
            <p className="text-gray-700 text-xs">{summary}</p>
          </div>
        );
      case "experience":
        if (!experience?.length) return null;
        return (
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
        );
      case "education":
        if (!education?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Education</h2>
            {education.map((edu) => (
              <div key={edu.id} className="mb-1 text-xs">
                <span className="font-semibold">{edu.degree}</span> - {edu.institution}
                {edu.branch && `, ${edu.branch}`}
                {edu.field && `, ${edu.field}`}
                {edu.semester && ` (Sem ${edu.semester})`}
                {edu.cgpa && `, CGPA: ${edu.cgpa}`}
                {edu.classXII && `, Class XII: ${edu.classXII}%`}
                {edu.classX && `, Class X: ${edu.classX}%`}
                <span className="text-gray-500"> ({edu.endDate})</span>
              </div>
            ))}
          </div>
        );
      case "projects":
        if (!projects?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Projects</h2>
            {projects.map((proj) => (
              <div key={proj.id} className="mb-2 text-xs">
                <div className="font-semibold">{proj.name}</div>
                {(proj.client || proj.teamSize || proj.impact) && (
                  <div className="text-gray-600 italic">
                    {proj.client && `Client: ${proj.client} `}
                    {proj.teamSize && `| Team: ${proj.teamSize} `}
                    {proj.impact && `| Impact: ${proj.impact}`}
                  </div>
                )}
                <p className="text-gray-700">{proj.description}</p>
                {proj.technologies.length > 0 && (
                  <div className="text-gray-500">Tech: {proj.technologies.join(", ")}</div>
                )}
              </div>
            ))}
          </div>
        );
      case "skills":
        if (!skills) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Skills</h2>
            <div className="text-xs text-gray-700">
              {skills.technical.length > 0 && <div><span className="font-semibold">Technical:</span> {skills.technical.join(", ")}</div>}
              {skills.frameworks.length > 0 && <div><span className="font-semibold">Frameworks:</span> {skills.frameworks.join(", ")}</div>}
              {skills.tools.length > 0 && <div><span className="font-semibold">Tools:</span> {skills.tools.join(", ")}</div>}
            </div>
          </div>
        );
      case "certifications":
        if (!certifications?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Certifications</h2>
            {certifications.map((cert) => (
              <div key={cert.id} className="text-xs">{cert.name} - {cert.issuer}</div>
            ))}
          </div>
        );
      case "achievements":
        if (!achievements?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Achievements</h2>
            {achievements.map((ach) => (
              <div key={ach.id} className="mb-1 text-xs">
                <span className="font-semibold">{ach.title}</span>: {ach.description}
              </div>
            ))}
          </div>
        );
      case "languages":
        if (!languages?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Languages</h2>
            <div className="text-xs text-gray-700">
              {languages.map(lang => `${lang.name} (${lang.proficiency})`).join(", ")}
            </div>
          </div>
        );
      case "codingProfiles":
        if (!codingProfiles?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Coding Profiles</h2>
            <div className="text-xs text-gray-700">
              {codingProfiles.map(cp => `${cp.platform}: ${cp.handle}`).join(" | ")}
            </div>
          </div>
        );
      case "leadership":
        if (!leadership?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Leadership</h2>
            {leadership.map((item) => (
              <div key={item.id} className="mb-2 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>{item.title} at {item.organization}</span>
                  <span className="text-gray-500">{item.startDate} - {item.endDate}</span>
                </div>
                <p className="text-gray-700 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "openSource":
        if (!openSource?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Open Source</h2>
            {openSource.map((item) => (
              <div key={item.id} className="mb-2 text-xs">
                <div className="font-semibold">{item.projectName} - {item.role}</div>
                <p className="text-gray-700 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "publications":
        if (!publications?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Publications</h2>
            {publications.map((item) => (
              <div key={item.id} className="mb-2 text-xs">
                <div className="font-semibold">{item.title}</div>
                <div className="text-gray-600">{item.publisher} | {item.date}</div>
              </div>
            ))}
          </div>
        );
      case "volunteer":
        if (!volunteer?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Volunteer Experience</h2>
            {volunteer.map((item) => (
              <div key={item.id} className="mb-2 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>{item.role} at {item.organization}</span>
                  <span className="text-gray-500">{item.startDate} - {item.endDate}</span>
                </div>
                <p className="text-gray-700 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "activities":
        if (!activities?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Extra Curricular Activities</h2>
            {activities.map((item) => (
              <div key={item.id} className="mb-2 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>{item.title}</span>
                  <span className="text-gray-500">{item.date}</span>
                </div>
                <p className="text-gray-700 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "coursework":
        if (!coursework?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Relevant Coursework</h2>
            <p className="text-gray-700 text-xs">{coursework.join(", ")}</p>
          </div>
        );
      case "interests":
        if (!interests?.length) return null;
        return (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2">Interests</h2>
            <p className="text-gray-700 text-xs">{interests.join(", ")}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="font-sans text-sm leading-relaxed">
      <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{personalInfo.fullName}</h1>
        <div className="text-gray-600 text-xs mt-1">
          {personalInfo.email} | {personalInfo.phone} | {personalInfo.linkedin} | {personalInfo.github}
        </div>
      </div>

      {typeConfig.sections.map(section => (
        <div key={section.id}>
          {renderSection(section.id)}
        </div>
      ))}
    </div>
  );
}
