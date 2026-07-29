"use client";

import { useState, useCallback } from "react";
import { BulletEnhancer } from "./BulletEnhancer";
import { SummaryGenerator } from "./SummaryGenerator";
import { GrammarChecker } from "./GrammarChecker";
import { AchievementSuggestor } from "./AchievementSuggestor";
import { SectionRewriter } from "./SectionRewriter";
import { AtsOptimizer } from "./AtsOptimizer";
import { SummaryImprover } from "./SummaryImprover";
import { BulletImprover } from "./BulletImprover";
import { ActionVerbs } from "./ActionVerbs";
import { MetricsAdder } from "./MetricsAdder";
import { WeakContentDetector } from "./WeakContentDetector";
import type { ResumeData } from "@/types/resume";
import { cn } from "@/lib/utils";

type Tab = "summary" | "summary-improve" | "bullets" | "bullet-improve" | "actions" | "metrics" | "weak" | "grammar" | "achievements" | "rewrite" | "ats";

interface AiAssistantPanelProps {
  resumeData?: ResumeData | null;
  onUpdateSummary?: (summary: string) => void;
  onUpdateExperience?: (experience: ResumeData["experience"]) => void;
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "summary", label: "Summary", icon: "✨" },
  { id: "summary-improve", label: "Improve", icon: "📝" },
  { id: "bullets", label: "Bullets", icon: "✏️" },
  { id: "bullet-improve", label: "Enhance", icon: "💪" },
  { id: "actions", label: "Verbs", icon: "⚡" },
  { id: "metrics", label: "Metrics", icon: "📊" },
  { id: "weak", label: "Weak", icon: "⚠️" },
  { id: "rewrite", label: "Rewrite", icon: "🔄" },
  { id: "ats", label: "ATS", icon: "🎯" },
  { id: "grammar", label: "Grammar", icon: "📝" },
  { id: "achievements", label: "Achievements", icon: "🏆" },
];

export function AiAssistantPanel({ resumeData, onUpdateSummary, onUpdateExperience }: AiAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const buildExperienceContext = useCallback((): string => {
    if (!resumeData?.experience?.length) return "";
    return resumeData.experience
      .map((exp) => `${exp.role} at ${exp.company} (${exp.startDate} - ${exp.current ? "Present" : exp.endDate})`)
      .join("; ");
  }, [resumeData]);

  const handleAcceptSummary = useCallback((summary: string) => {
    onUpdateSummary?.(summary);
  }, [onUpdateSummary]);

  const handleAcceptBullet = useCallback((enhanced: string) => {
    // Append the enhanced bullet to the last experience entry's responsibilities
    if (!resumeData?.experience?.length || !onUpdateExperience) return;
    const updated = [...resumeData.experience];
    const lastIdx = updated.length - 1;
    updated[lastIdx] = {
      ...updated[lastIdx],
      responsibilities: [...updated[lastIdx].responsibilities, enhanced],
    };
    onUpdateExperience(updated);
  }, [resumeData, onUpdateExperience]);

  const handleAcceptGrammar = useCallback((corrected: string) => {
    // When grammar correction is accepted, update the summary
    onUpdateSummary?.(corrected);
  }, [onUpdateSummary]);

  const handleAcceptAchievement = useCallback((achievement: string) => {
    // Append the achievement to the last experience entry's achievements
    if (!resumeData?.experience?.length || !onUpdateExperience) return;
    const updated = [...resumeData.experience];
    const lastIdx = updated.length - 1;
    updated[lastIdx] = {
      ...updated[lastIdx],
      achievements: [...updated[lastIdx].achievements, achievement],
    };
    onUpdateExperience(updated);
  }, [resumeData, onUpdateExperience]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-0">
        <h2 className="text-micro text-gray-500 uppercase tracking-widest mb-3">
          AI Assistant
        </h2>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-300 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-small font-medium border-b-2 transition-all duration-200",
              activeTab === tab.id
                ? "border-accent-500 text-black"
                : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
            )}
          >
            <span className="text-xs">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "summary" && (
          <div>
            <p className="text-small text-gray-500 mb-4">
              Generate a professional summary based on your profile.
            </p>
            <SummaryGenerator onAccept={handleAcceptSummary} />
          </div>
        )}

        {activeTab === "summary-improve" && (
          <div>
            <p className="text-small text-gray-500 mb-4">
              Improve your existing summary with different tones and styles.
            </p>
            <SummaryImprover
              currentSummary={resumeData?.summary || ""}
              onAccept={handleAcceptSummary}
            />
          </div>
        )}

        {activeTab === "bullets" && (
          <div>
            <p className="text-small text-gray-500 mb-4">
              Generate bullet points from scratch with strong action verbs.
            </p>
            <BulletEnhancer
              context={buildExperienceContext()}
              onAccept={handleAcceptBullet}
            />
          </div>
        )}

        {activeTab === "bullet-improve" && (
          <div>
            <p className="text-small text-gray-500 mb-4">
              Enhance existing bullet points with one-click improvements.
            </p>
            <BulletImprover
              experience={resumeData?.experience}
              onAccept={(index, enhanced) => {
                if (!resumeData?.experience?.length || !onUpdateExperience) return;
                const updated = [...resumeData.experience];
                const lastIdx = updated.length - 1;
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  responsibilities: [...updated[lastIdx].responsibilities, enhanced],
                };
                onUpdateExperience(updated);
              }}
            />
          </div>
        )}

        {activeTab === "actions" && (
          <div>
            <p className="text-small text-gray-500 mb-4">
              Detect weak verbs and get stronger alternatives.
            </p>
            <ActionVerbs
              resumeText={[
                resumeData?.personalInfo?.summary || "",
                ...(resumeData?.experience || []).flatMap((e) => [
                  `${e.role} at ${e.company}`,
                  ...e.responsibilities,
                ]),
              ].join("\n")}
            />
          </div>
        )}

        {activeTab === "metrics" && (
          <div>
            <p className="text-small text-gray-500 mb-4">
              Get suggestions for adding quantifiable achievements to your experience.
            </p>
            <MetricsAdder
              experienceText={(resumeData?.experience || [])
                .flatMap((e) => [`${e.role} at ${e.company}`, ...e.responsibilities])
                .join("\n")}
              onAccept={(suggestion) => handleAcceptAchievement(suggestion)}
            />
          </div>
        )}

        {activeTab === "weak" && (
          <div>
            <p className="text-small text-gray-500 mb-4">
              Find and replace weak or overused phrases in your resume.
            </p>
            <WeakContentDetector
              resumeText={[
                resumeData?.personalInfo?.summary || "",
                ...(resumeData?.experience || []).flatMap((e) =>
                  e.responsibilities
                ),
              ].join("\n")}
            />
          </div>
        )}

        {activeTab === "grammar" && (
          <div>
            <p className="text-small text-gray-500 mb-4">
              Check a section of your resume for grammar and spelling errors.
            </p>
            <GrammarChecker
              onAccept={handleAcceptGrammar}
            />
          </div>
        )}

        {activeTab === "rewrite" && (
          <div>
            <p className="text-small text-gray-500 mb-4">
              Rewrite any section of your resume in a different style or tone.
            </p>
            <SectionRewriter
              sectionType="section"
              currentContent={resumeData?.summary || ""}
              onAccept={(rewritten) => onUpdateSummary?.(rewritten)}
            />
          </div>
        )}

        {activeTab === "ats" && (
          <div>
            <p className="text-small text-gray-500 mb-4">
              Analyze your resume for ATS compatibility and get actionable suggestions.
            </p>
            <AtsOptimizer
              resumeData={resumeData}
              onApplySuggestion={(suggestion) => {
                // Append the suggestion to the summary as a reference note
                if (resumeData?.summary && onUpdateSummary) {
                  onUpdateSummary(resumeData.summary + `\n\n[ATS Note]: ${suggestion}`);
                }
              }}
            />
          </div>
        )}

        {activeTab === "achievements" && (
          <div>
            <p className="text-small text-gray-500 mb-4">
              Get quantifiable achievement suggestions based on your experience.
            </p>
            <AchievementSuggestor onAccept={handleAcceptAchievement} />
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="px-4 py-3 border-t border-gray-300 bg-gray-50">
        <p className="text-micro text-gray-400">
          AI uses only the information you provide. No data is fabricated.
        </p>
      </div>
    </div>
  );
}
