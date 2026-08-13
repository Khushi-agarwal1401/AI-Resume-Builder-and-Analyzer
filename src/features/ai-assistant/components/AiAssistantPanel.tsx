"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { BulletEnhancer } from "./BulletEnhancer";
import { SummaryGenerator } from "./SummaryGenerator";
import { GrammarChecker } from "./GrammarChecker";
import { AchievementSuggestor } from "./AchievementSuggestor";
import { SectionRewriter } from "./SectionRewriter";
import { AtsOptimizer } from "./AtsOptimizer";
import { ResumeOptimizer } from "./ResumeOptimizer";
import { SkillsOptimizer } from "./SkillsOptimizer";
import { SummaryImprover } from "./SummaryImprover";
import { BulletImprover } from "./BulletImprover";
import { ActionVerbs } from "./ActionVerbs";
import { MetricsAdder } from "./MetricsAdder";
import { WeakContentDetector } from "./WeakContentDetector";
import type { ResumeData } from "@/types/resume";
import { cn } from "@/lib/utils";

type Tab = "summary" | "summary-improve" | "bullets" | "bullet-improve" | "actions" | "metrics" | "weak" | "grammar" | "achievements" | "rewrite" | "ats" | "optimize" | "skills";

interface AiAssistantPanelProps {
  resumeData?: ResumeData | null;
  onUpdateSummary?: (summary: string) => void;
  onUpdateExperience?: (experience: ResumeData["experience"]) => void;
  onUpdateSkills?: (skills: ResumeData["skills"]) => void;
  /** Optional externally-driven tab (e.g. from the AI context on mobile); re-syncs when it changes. */
  initialTab?: Tab;
  /** Optional close button shown in the header (used when embedded in a drawer/overlay). */
  onClose?: () => void;
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
  { id: "optimize", label: "Optimize", icon: "🚀" },
  { id: "skills", label: "Skills", icon: "🧩" },
  { id: "grammar", label: "Grammar", icon: "📝" },
  { id: "achievements", label: "Achievements", icon: "🏆" },
];

export function AiAssistantPanel({ resumeData, onUpdateSummary, onUpdateExperience, onUpdateSkills, initialTab, onClose }: AiAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

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
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            AI Assistant
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              title="Close AI Assistant"
              className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 px-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all duration-200 shrink-0",
              activeTab === tab.id
                ? "border-accent-500 text-accent-700 bg-accent-50/50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200 hover:bg-gray-50"
            )}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "summary" && (
          <div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Generate a professional summary based on your profile.
            </p>
            <SummaryGenerator onAccept={handleAcceptSummary} />
          </div>
        )}

        {activeTab === "summary-improve" && (
          <div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
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
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
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
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
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
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Detect weak verbs and get stronger alternatives. Click a verb to see suggestions, then click a replacement to apply it.
            </p>
            <ActionVerbs
              resumeText={[
                resumeData?.summary || "",
                ...(resumeData?.experience || []).flatMap((e) => [
                  `${e.role} at ${e.company}`,
                  ...e.responsibilities,
                ]),
              ].join("\n")}
              onApply={(original, replacement) => {
                // Try to replace the weak verb in summary first, then in experience responsibilities
                const regex = new RegExp(`\\b${original}\\b`, "i");
                let changed = false;

                // Try summary
                if (onUpdateSummary && resumeData?.summary && regex.test(resumeData.summary)) {
                  onUpdateSummary(resumeData.summary.replace(regex, replacement));
                  changed = true;
                }

                // Try experience responsibilities
                if (!changed && onUpdateExperience && resumeData?.experience?.length) {
                  const updated = resumeData.experience.map((exp) => ({
                    ...exp,
                    responsibilities: exp.responsibilities.map((r) =>
                      regex.test(r) ? r.replace(regex, replacement) : r
                    ),
                  }));
                  const didChange = updated.some((exp, i) =>
                    exp.responsibilities.some(
                      (r, j) => r !== resumeData.experience![i].responsibilities[j]
                    )
                  );
                  if (didChange) {
                    onUpdateExperience(updated);
                    changed = true;
                  }
                }
              }}
            />
          </div>
        )}

        {activeTab === "metrics" && (
          <div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
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
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Find and replace weak or overused phrases in your resume. Click "Replace" to apply a stronger alternative.
            </p>
            <WeakContentDetector
              resumeText={[
                resumeData?.summary || "",
                ...(resumeData?.experience || []).flatMap((e) =>
                  e.responsibilities
                ),
              ].join("\n")}
              onApply={(phrase, alternative) => {
                // Try to replace the weak phrase in summary first, then in experience
                const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const regex = new RegExp(escaped, "i");
                let changed = false;

                // Try summary
                if (onUpdateSummary && resumeData?.summary && regex.test(resumeData.summary)) {
                  onUpdateSummary(resumeData.summary.replace(regex, alternative));
                  changed = true;
                }

                // Try experience responsibilities
                if (!changed && onUpdateExperience && resumeData?.experience?.length) {
                  const updated = resumeData.experience.map((exp) => ({
                    ...exp,
                    responsibilities: exp.responsibilities.map((r) =>
                      regex.test(r) ? r.replace(regex, alternative) : r
                    ),
                  }));
                  const didChange = updated.some((exp, i) =>
                    exp.responsibilities.some(
                      (r, j) => r !== resumeData.experience![i].responsibilities[j]
                    )
                  );
                  if (didChange) {
                    onUpdateExperience(updated);
                  }
                }
              }}
            />
          </div>
        )}

        {activeTab === "grammar" && (
          <div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Check a section of your resume for grammar and spelling errors.
            </p>
            <GrammarChecker
              onAccept={handleAcceptGrammar}
            />
          </div>
        )}

        {activeTab === "rewrite" && (
          <div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
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
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
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
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Get quantifiable achievement suggestions based on your experience.
            </p>
            <AchievementSuggestor onAccept={handleAcceptAchievement} />
          </div>
        )}

        {activeTab === "optimize" && (
          <div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Rewrite your full resume for a target role and get an ATS + recruiter optimization report.
            </p>
            <ResumeOptimizer resumeData={resumeData} />
          </div>
        )}

        {activeTab === "skills" && (
          <div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Generate a targeted skills section aligned with the target role and job description keywords.
            </p>
            <SkillsOptimizer resumeData={resumeData} onApply={onUpdateSkills} />
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/60 dark:to-gray-900">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          AI uses only the information you provide. No data is fabricated.
        </p>
      </div>
    </div>
  );
}
