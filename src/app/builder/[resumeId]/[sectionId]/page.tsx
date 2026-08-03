"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useBuilder } from "../builder-context";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CustomSectionItem, ResumeData } from "@/types/resume";
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
  CustomSectionEditor,
} from "@/features/resume-builder/components/sections";

export default function SectionPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  const router = useRouter();
  const { data, setData, sectionIds, currentSectionIndex, resumeId } = useBuilder();

  const prevSection = currentSectionIndex > 0 ? sectionIds[currentSectionIndex - 1] : null;
  const nextSection = currentSectionIndex < sectionIds.length - 1 ? sectionIds[currentSectionIndex + 1] : null;

  // Keyboard shortcuts: ← / → move between sections (ignored while typing)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (isTyping) return;

      if (e.key === "ArrowLeft" && prevSection) {
        e.preventDefault();
        router.push(`/builder/${resumeId}/${prevSection}`);
      } else if (e.key === "ArrowRight" && nextSection) {
        e.preventDefault();
        router.push(`/builder/${resumeId}/${nextSection}`);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [prevSection, nextSection, resumeId, router]);

  if (!data) return null;

  function updateField<K extends keyof ResumeData>(field: K, value: ResumeData[K]) {
    setData((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  const renderSection = () => {
    // User-created custom sections (K-04) — ids are prefixed "custom-".
    if (sectionId.startsWith("custom-")) {
      const custom = data.customSections?.[sectionId];
      return (
        <CustomSectionEditor
          data={custom?.items ?? []}
          title={custom?.title ?? ""}
          onChange={(items: CustomSectionItem[]) =>
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    customSections: {
                      ...(prev.customSections ?? {}),
                      [sectionId]: { title: custom?.title ?? "Custom Section", items },
                    },
                  }
                : prev
            )
          }
          onChangeTitle={(title: string) =>
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    customSections: {
                      ...(prev.customSections ?? {}),
                      [sectionId]: { title, items: custom?.items ?? [] },
                    },
                  }
                : prev
            )
          }
          onDeleteSection={() => {
            setData((prev) => {
              if (!prev) return prev;
              const customSections = Object.fromEntries(
                Object.entries(prev.customSections ?? {}).filter(([id]) => id !== sectionId)
              );
              return {
                ...prev,
                customSections,
                sectionOrder: (prev.sectionOrder ?? []).filter((id) => id !== sectionId),
              };
            });
            router.push(`/builder/${resumeId}`);
          }}
        />
      );
    }

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
      <div className="pt-6 border-t border-gray-100">
        <div className={cn("flex items-center", prevSection ? "justify-between" : "justify-end")}>
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
        <p className="mt-3 text-center text-[11px] text-gray-400">
          <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 font-sans">←</kbd>{" "}
          and{" "}
          <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 font-sans">→</kbd>{" "}
          to move between sections
        </p>
      </div>
    </div>
  );
}
