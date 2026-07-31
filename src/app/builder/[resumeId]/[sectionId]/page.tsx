"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useBuilder } from "../builder-context";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";
import {
  PersonalInfoSection,
  EducationSection,
  ExperienceSection,
  ProjectSection,
  SkillsSection,
  CertificationSection,
  AchievementSection,
  LanguageSection,
  CodingProfilesSection,
  LeadershipSection,
  OpenSourceSection,
  PublicationsSection,
  VolunteerSection,
  ActivitiesSection,
  CourseworkSection,
  InterestsSection,
  SummarySection,
} from "@/features/resume-builder/components/sections";

export default function SectionPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  const { data, setData, sectionIds, currentSectionIndex, resumeId } = useBuilder();

  if (!data) return null;

  function updateField<K extends keyof ResumeData>(field: K, value: ResumeData[K]) {
    setData((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  const prevSection = currentSectionIndex > 0 ? sectionIds[currentSectionIndex - 1] : null;
  const nextSection = currentSectionIndex < sectionIds.length - 1 ? sectionIds[currentSectionIndex + 1] : null;

  const renderSection = () => {
    switch (sectionId) {
      case "personalInfo":
        return <PersonalInfoSection data={data.personalInfo} onChange={(v) => updateField("personalInfo", v as ResumeData["personalInfo"])} />;
      case "summary":
        return <SummarySection data={data.summary} onChange={(v) => updateField("summary", v as ResumeData["summary"])} />;
      case "education":
        return <EducationSection data={data.education} targetLevel={data.targetLevel} onChange={(v) => updateField("education", v as ResumeData["education"])} />;
      case "experience":
        return <ExperienceSection data={data.experience} onChange={(v) => updateField("experience", v as ResumeData["experience"])} />;
      case "projects":
        return <ProjectSection data={data.projects} targetLevel={data.targetLevel} onChange={(v) => updateField("projects", v as ResumeData["projects"])} />;
      case "skills":
        return <SkillsSection data={data.skills} onChange={(v) => updateField("skills", v as ResumeData["skills"])} />;
      case "certifications":
        return <CertificationSection data={data.certifications} onChange={(v) => updateField("certifications", v as ResumeData["certifications"])} />;
      case "achievements":
        return <AchievementSection data={data.achievements} onChange={(v) => updateField("achievements", v as ResumeData["achievements"])} />;
      case "languages":
        return <LanguageSection data={data.languages} onChange={(v) => updateField("languages", v as ResumeData["languages"])} />;
      case "codingProfiles":
        return <CodingProfilesSection data={data.codingProfiles || []} onChange={(v) => updateField("codingProfiles", v as ResumeData["codingProfiles"])} />;
      case "leadership":
        return <LeadershipSection data={data.leadership || []} onChange={(v) => updateField("leadership", v as ResumeData["leadership"])} />;
      case "openSource":
        return <OpenSourceSection data={data.openSource || []} onChange={(v) => updateField("openSource", v as ResumeData["openSource"])} />;
      case "publications":
        return <PublicationsSection data={data.publications || []} onChange={(v) => updateField("publications", v as ResumeData["publications"])} />;
      case "volunteer":
        return <VolunteerSection data={data.volunteer || []} onChange={(v) => updateField("volunteer", v as ResumeData["volunteer"])} />;
      case "activities":
        return <ActivitiesSection data={data.activities || []} onChange={(v) => updateField("activities", v as ResumeData["activities"])} />;
      case "coursework":
        return <CourseworkSection data={data.coursework || []} onChange={(v) => updateField("coursework", v as ResumeData["coursework"])} />;
      case "interests":
        return <InterestsSection data={data.interests || []} onChange={(v) => updateField("interests", v as ResumeData["interests"])} />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Section not found</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Section form */}
      <div>{renderSection()}</div>

      {/* Navigation buttons */}
      <div className={cn("flex pt-6 border-t border-gray-100", prevSection ? "justify-between" : "justify-end")}>
        {prevSection && (
          <Link href={`/builder/${resumeId}/${prevSection}`}>
            <Button variant="secondary" size="sm">
              ← Previous Section
            </Button>
          </Link>
        )}
        {nextSection ? (
          <Link href={`/builder/${resumeId}/${nextSection}`}>
            <Button size="sm" className="text-white">
              Next Section →
            </Button>
          </Link>
        ) : (
          <Link href={`/preview/${resumeId}`}>
            <Button size="sm" className="text-white bg-green-600 hover:bg-green-700">
              View Preview →
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
