"use client";

import type { ResumeData } from "@/types/resume";
import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { EducationSection } from "./sections/EducationSection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { ProjectSection } from "./sections/ProjectSection";
import { SkillsSection } from "./sections/SkillsSection";
import { CertificationSection } from "./sections/CertificationSection";
import { AchievementSection } from "./sections/AchievementSection";
import { LanguageSection } from "./sections/LanguageSection";

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function BuilderForm({ data, onChange }: Props) {
  function updateField<K extends keyof ResumeData>(field: K, value: ResumeData[K]) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="space-y-8">
      <div>
        <input
          className="text-2xl font-bold w-full border-none outline-none bg-transparent"
          value={data.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Resume Title"
        />
      </div>

      <PersonalInfoSection
        data={data.personalInfo}
        onChange={(v) => updateField("personalInfo", v)}
      />

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Summary</h3>
        <textarea
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          rows={4}
          value={data.summary}
          onChange={(e) => updateField("summary", e.target.value)}
          placeholder="Professional summary..."
        />
      </div>

      <EducationSection
        data={data.education}
        onChange={(v) => updateField("education", v)}
      />

      <ExperienceSection
        data={data.experience}
        onChange={(v) => updateField("experience", v)}
      />

      <ProjectSection
        data={data.projects}
        onChange={(v) => updateField("projects", v)}
      />

      <SkillsSection
        data={data.skills}
        onChange={(v) => updateField("skills", v)}
      />

      <CertificationSection
        data={data.certifications}
        onChange={(v) => updateField("certifications", v)}
      />

      <AchievementSection
        data={data.achievements}
        onChange={(v) => updateField("achievements", v)}
      />

      <LanguageSection
        data={data.languages}
        onChange={(v) => updateField("languages", v)}
      />
    </div>
  );
}
