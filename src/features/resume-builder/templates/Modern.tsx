import type { ResumeData, TargetLevel } from "@/types/resume";
import { RESUME_TYPES } from "@/features/resume-builder/config/resume-types";

export function Modern({ resume }: { resume: ResumeData }) {
  const { 
    personalInfo, summary, education, experience, projects, skills, 
    certifications, achievements, languages, codingProfiles, leadership, 
    openSource, publications, volunteer, activities, coursework, interests,
    targetLevel = "fresher"
  } = resume;

  const typeConfig = RESUME_TYPES[targetLevel as TargetLevel] || RESUME_TYPES.fresher;

  const renderSection = (id: string) => {
    switch (id) {
      case "summary":
        if (!summary) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Professional Summary</h2>
            <p className="text-gray-700">{summary}</p>
          </div>
        );
      case "experience":
        if (!experience?.length) return null;
        return (
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
        );
      case "education":
        if (!education?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Education</h2>
            {education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <div className="flex justify-between">
                  <span className="font-semibold">{edu.institution}</span>
                  <span className="text-gray-500 text-xs">{edu.startDate} - {edu.endDate}</span>
                </div>
                <div className="text-gray-600 text-xs">
                  {edu.degree}
                  {edu.branch && ` in ${edu.branch}`}
                  {edu.field && ` in ${edu.field}`}
                  {edu.semester && ` | Sem: ${edu.semester}`}
                  {edu.cgpa && ` | CGPA: ${edu.cgpa}`}
                  {edu.classXII && ` | XII: ${edu.classXII}%`}
                  {edu.classX && ` | X: ${edu.classX}%`}
                </div>
              </div>
            ))}
          </div>
        );
      case "projects":
        if (!projects?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Projects</h2>
            {projects.map((proj) => (
              <div key={proj.id} className="mb-2">
                <div className="font-semibold">{proj.name}</div>
                {(proj.client || proj.teamSize || proj.impact) && (
                  <div className="text-gray-600 text-xs italic mb-1">
                    {proj.client && `Client: ${proj.client} `}
                    {proj.teamSize && `| Team: ${proj.teamSize} `}
                    {proj.impact && `| Impact: ${proj.impact}`}
                  </div>
                )}
                <p className="text-gray-700 text-xs">{proj.description}</p>
                {proj.technologies.length > 0 && (
                  <div className="text-gray-500 text-xs mt-1">{proj.technologies.join(", ")}</div>
                )}
              </div>
            ))}
          </div>
        );
      case "skills":
        if (!skills) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Skills</h2>
            {skills.technical.length > 0 && (
              <div className="mb-1 text-xs">
                <span className="font-semibold">Technical: </span>
                <span className="text-gray-700">{skills.technical.join(", ")}</span>
              </div>
            )}
            {skills.frameworks.length > 0 && (
              <div className="mb-1 text-xs">
                <span className="font-semibold">Frameworks: </span>
                <span className="text-gray-700">{skills.frameworks.join(", ")}</span>
              </div>
            )}
            {skills.tools.length > 0 && (
              <div className="mb-1 text-xs">
                <span className="font-semibold">Tools: </span>
                <span className="text-gray-700">{skills.tools.join(", ")}</span>
              </div>
            )}
          </div>
        );
      case "certifications":
        if (!certifications?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Certifications</h2>
            {certifications.map((cert) => (
              <div key={cert.id} className="text-gray-700 text-xs">
                {cert.name}{cert.issuer && ` - ${cert.issuer}`}{cert.date && ` (${cert.date})`}
              </div>
            ))}
          </div>
        );
      case "achievements":
        if (!achievements?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Achievements</h2>
            {achievements.map((ach) => (
              <div key={ach.id} className="mb-1">
                <div className="font-semibold text-xs">{ach.title}</div>
                <p className="text-gray-700 text-xs">{ach.description}</p>
              </div>
            ))}
          </div>
        );
      case "languages":
        if (!languages?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Languages</h2>
            {languages.map((lang) => (
              <div key={lang.id} className="text-gray-700 text-xs">
                {lang.name} - <span className="capitalize">{lang.proficiency}</span>
              </div>
            ))}
          </div>
        );
      case "codingProfiles":
        if (!codingProfiles?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Coding Profiles</h2>
            {codingProfiles.map((cp) => (
              <div key={cp.id} className="text-gray-700 text-xs">
                <span className="font-semibold">{cp.platform}:</span> {cp.handle} {cp.url && `(${cp.url})`}
              </div>
            ))}
          </div>
        );
      case "leadership":
        if (!leadership?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Leadership</h2>
            {leadership.map((item) => (
              <div key={item.id} className="mb-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{item.title} at {item.organization}</span>
                  <span className="text-gray-500">{item.startDate} - {item.endDate}</span>
                </div>
                <p className="text-gray-700 text-xs mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "openSource":
        if (!openSource?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Open Source</h2>
            {openSource.map((item) => (
              <div key={item.id} className="mb-2">
                <div className="font-semibold text-xs">{item.projectName} - {item.role}</div>
                <p className="text-gray-700 text-xs mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "publications":
        if (!publications?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Publications</h2>
            {publications.map((item) => (
              <div key={item.id} className="mb-2">
                <div className="font-semibold text-xs">{item.title}</div>
                <div className="text-gray-600 text-xs">{item.publisher} | {item.date}</div>
              </div>
            ))}
          </div>
        );
      case "volunteer":
        if (!volunteer?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Volunteer Experience</h2>
            {volunteer.map((item) => (
              <div key={item.id} className="mb-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{item.role} at {item.organization}</span>
                  <span className="text-gray-500">{item.startDate} - {item.endDate}</span>
                </div>
                <p className="text-gray-700 text-xs mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "activities":
        if (!activities?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Extra Curricular Activities</h2>
            {activities.map((item) => (
              <div key={item.id} className="mb-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{item.title}</span>
                  <span className="text-gray-500">{item.date}</span>
                </div>
                <p className="text-gray-700 text-xs mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        );
      case "coursework":
        if (!coursework?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Relevant Coursework</h2>
            <p className="text-gray-700 text-xs">{coursework.join(", ")}</p>
          </div>
        );
      case "interests":
        if (!interests?.length) return null;
        return (
          <div className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-2">Interests</h2>
            <p className="text-gray-700 text-xs">{interests.join(", ")}</p>
          </div>
        );
      default:
        return null;
    }
  };

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

      {typeConfig.sections.map(section => (
        <div key={section.id}>
          {renderSection(section.id)}
        </div>
      ))}
    </div>
  );
}
