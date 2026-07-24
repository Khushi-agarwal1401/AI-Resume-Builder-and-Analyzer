"use client";

import type { ResumeData, TargetLevel } from "@/types/resume";
import { RESUME_TYPES } from "@/features/resume-builder/config/resume-types";

// Import all section components
import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { EducationSection } from "./sections/EducationSection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { ProjectSection } from "./sections/ProjectSection";
import { SkillsSection } from "./sections/SkillsSection";
import { CertificationSection } from "./sections/CertificationSection";
import { AchievementSection } from "./sections/AchievementSection";
import { LanguageSection } from "./sections/LanguageSection";
import { CodingProfilesSection } from "./sections/CodingProfilesSection";
import { LeadershipSection } from "./sections/LeadershipSection";
import { OpenSourceSection } from "./sections/OpenSourceSection";
import { PublicationsSection } from "./sections/PublicationsSection";
import { VolunteerSection } from "./sections/VolunteerSection";
import { ActivitiesSection } from "./sections/ActivitiesSection";
import { CourseworkSection } from "./sections/CourseworkSection";
import { InterestsSection } from "./sections/InterestsSection";

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function BuilderForm({ data, onChange }: Props) {
  function updateField<K extends keyof ResumeData>(field: K, value: ResumeData[K]) {
    onChange({ ...data, [field]: value });
  }

  const targetLevel: TargetLevel = data.targetLevel || "fresher";
  const typeConfig = RESUME_TYPES[targetLevel];
  
  if (!typeConfig) return null;

  const renderSection = (id: string) => {
    switch (id) {
      case "personalInfo":
        return <PersonalInfoSection data={data.personalInfo} onChange={(v) => updateField("personalInfo", v)} />;
      case "summary":
        return (
          <div className="space-y-2" id="summary">
            <h3 className="font-semibold text-lg">Summary / Objective</h3>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              rows={4}
              value={data.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              placeholder="Professional summary..."
            />
          </div>
        );
      case "education":
        return <EducationSection data={data.education} targetLevel={targetLevel} onChange={(v) => updateField("education", v)} />;
      case "experience":
        return <ExperienceSection data={data.experience} onChange={(v) => updateField("experience", v)} />;
      case "projects":
        return <ProjectSection data={data.projects} targetLevel={targetLevel} onChange={(v) => updateField("projects", v)} />;
      case "skills":
        return <SkillsSection data={data.skills} onChange={(v) => updateField("skills", v)} />;
      case "certifications":
        return <CertificationSection data={data.certifications} onChange={(v) => updateField("certifications", v)} />;
      case "achievements":
        return <AchievementSection data={data.achievements} onChange={(v) => updateField("achievements", v)} />;
      case "languages":
        return <LanguageSection data={data.languages} onChange={(v) => updateField("languages", v)} />;
      case "codingProfiles":
        return <CodingProfilesSection data={data.codingProfiles || []} onChange={(v) => updateField("codingProfiles", v)} />;
      case "leadership":
        return <LeadershipSection data={data.leadership || []} onChange={(v) => updateField("leadership", v)} />;
      case "openSource":
        return <OpenSourceSection data={data.openSource || []} onChange={(v) => updateField("openSource", v)} />;
      case "publications":
        return <PublicationsSection data={data.publications || []} onChange={(v) => updateField("publications", v)} />;
      case "volunteer":
        return <VolunteerSection data={data.volunteer || []} onChange={(v) => updateField("volunteer", v)} />;
      case "activities":
        return <ActivitiesSection data={data.activities || []} onChange={(v) => updateField("activities", v)} />;
      case "coursework":
        return <CourseworkSection data={data.coursework || []} onChange={(v) => updateField("coursework", v)} />;
      case "interests":
        return <InterestsSection data={data.interests || []} onChange={(v) => updateField("interests", v)} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <div>
        <input
          className="text-2xl font-bold w-full border-none outline-none bg-transparent"
          value={data.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Resume Title"
        />
      </div>

      {typeConfig.sections.map((section) => (
        <div key={section.id}>
          {renderSection(section.id)}
        </div>
      ))}
    </div>
  );
}
