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
import { useAiHistory } from "../context/AiHistoryContext";
import { AiHistoryView } from "./AiHistoryView";
import type { ResumeData } from "@/types/resume";
import { cn } from "@/lib/utils";

export type Tab =
  | "home"
  | "summary"
  | "summary-improve"
  | "bullets"
  | "bullet-improve"
  | "actions"
  | "metrics"
  | "weak"
  | "grammar"
  | "achievements"
  | "rewrite"
  | "ats";

interface AiAssistantPanelProps {
  resumeData?: ResumeData | null;
  onUpdateSummary?: (summary: string) => void;
  onUpdateExperience?: (experience: ResumeData["experience"]) => void;
  /** If true, shows a compact variant suitable for a floating panel */
  compact?: boolean;
  /** Callback when panel wants to close (only for floating mode) */
  onClose?: () => void;
}

interface ToolDefinition {
  id: Exclude<Tab, "home">;
  label: string;
  icon: string;
  description: string;
  color: string;
  gradient: string;
  group: "generate" | "improve" | "analyze";
}

const TOOLS: ToolDefinition[] = [
  {
    id: "summary",
    label: "Summary",
    icon: "✨",
    description: "Generate a professional summary from your profile",
    color: "from-violet-500 to-purple-600",
    gradient: "from-violet-50/80 to-purple-50/80",
    group: "generate",
  },
  {
    id: "bullets",
    label: "Bullets",
    icon: "✏️",
    description: "Create bullet points with strong action verbs",
    color: "from-blue-500 to-indigo-600",
    gradient: "from-blue-50/80 to-indigo-50/80",
    group: "generate",
  },
  {
    id: "achievements",
    label: "Achievements",
    icon: "🏆",
    description: "Get quantifiable achievement suggestions",
    color: "from-amber-500 to-orange-600",
    gradient: "from-amber-50/80 to-orange-50/80",
    group: "generate",
  },
  {
    id: "summary-improve",
    label: "Improve",
    icon: "📝",
    description: "Polish your summary with different tones",
    color: "from-emerald-500 to-teal-600",
    gradient: "from-emerald-50/80 to-teal-50/80",
    group: "improve",
  },
  {
    id: "bullet-improve",
    label: "Enhance",
    icon: "💪",
    description: "Enhance existing bullet points",
    color: "from-cyan-500 to-sky-600",
    gradient: "from-cyan-50/80 to-sky-50/80",
    group: "improve",
  },
  {
    id: "actions",
    label: "Verbs",
    icon: "⚡",
    description: "Detect weak verbs, get stronger alternatives",
    color: "from-yellow-500 to-amber-600",
    gradient: "from-yellow-50/80 to-amber-50/80",
    group: "improve",
  },
  {
    id: "metrics",
    label: "Metrics",
    icon: "📊",
    description: "Add quantifiable achievements",
    color: "from-pink-500 to-rose-600",
    gradient: "from-pink-50/80 to-rose-50/80",
    group: "improve",
  },
  {
    id: "weak",
    label: "Weak",
    icon: "⚠️",
    description: "Find and replace weak phrases",
    color: "from-orange-500 to-red-600",
    gradient: "from-orange-50/80 to-red-50/80",
    group: "improve",
  },
  {
    id: "grammar",
    label: "Grammar",
    icon: "🔤",
    description: "Check grammar and spelling errors",
    color: "from-green-500 to-emerald-600",
    gradient: "from-green-50/80 to-emerald-50/80",
    group: "improve",
  },
  {
    id: "rewrite",
    label: "Rewrite",
    icon: "🔄",
    description: "Rewrite sections in a different style",
    color: "from-purple-500 to-violet-600",
    gradient: "from-purple-50/80 to-violet-50/80",
    group: "improve",
  },
  {
    id: "ats",
    label: "ATS",
    icon: "🎯",
    description: "Analyze ATS compatibility",
    color: "from-red-500 to-rose-600",
    gradient: "from-red-50/80 to-rose-50/80",
    group: "analyze",
  },
];

const GROUP_LABELS: Record<string, string> = {
  generate: "Generate",
  improve: "Improve & Polish",
  analyze: "Analyze",
};

const GROUP_ICONS: Record<string, string> = {
  generate: "🎨",
  improve: "🔧",
  analyze: "📋",
};

// ─── Tool splash screen grid ───────────────────────────────────────
function ToolGrid({
  tools,
  onSelect,
}: {
  tools: ToolDefinition[];
  onSelect: (id: Tab) => void;
}) {
  const groups = ["generate", "improve", "analyze"] as const;

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const groupTools = tools.filter((t) => t.group === group);
        if (!groupTools.length) return null;

        return (
          <div key={group}>
            <div className="flex items-center gap-2 mb-2.5 px-0.5">
              <span className="text-sm">{GROUP_ICONS[group]}</span>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">
                {GROUP_LABELS[group]}
              </h3>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {groupTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => onSelect(tool.id)}
                  className="group relative flex flex-col items-start gap-2 p-3.5 rounded-2xl border border-gray-200/80 bg-white hover:shadow-lg hover:border-gray-300/80 transition-all duration-300 text-left active:scale-[0.97]"
                >
                  {/* Gradient overlay on hover */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                      tool.gradient
                    )}
                  />

                  {/* Icon */}
                  <div
                    className={cn(
                      "relative w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-white/20 shrink-0",
                      "bg-gradient-to-br",
                      tool.color
                    )}
                  >
                    <span className="text-sm">{tool.icon}</span>
                  </div>

                  {/* Text */}
                  <div className="relative">
                    <p className="text-[13px] font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                      {tool.label}
                    </p>
                    <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  {/* Arrow hint */}
                  <div className="relative self-end -mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-400"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </button>
              ))}

              {/* Pad empty slots if odd number */}
              {groupTools.length % 2 !== 0 && (
                <div className="hidden sm:block" />
              )}
            </div>
          </div>
        );
      })}

      {/* Footer note */}
      <div className="flex items-center gap-2 pt-2 pb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
        <p className="text-[10px] text-gray-400 leading-relaxed">
          AI uses only the info you provide. No data fabricated.
        </p>
      </div>
    </div>
  );
}

// ─── Tool content wrapper with back button ─────────────────────────
function ToolView({
  activeTab,
  resumeData,
  onUpdateSummary,
  onUpdateExperience,
  buildExperienceContext,
  handleAcceptSummary,
  handleAcceptBullet,
  handleAcceptGrammar,
  handleAcceptAchievement,
  onBack,
  addHistory,
}: {
  activeTab: Exclude<Tab, "home">;
  resumeData?: ResumeData | null;
  onUpdateSummary?: (summary: string) => void;
  onUpdateExperience?: (experience: ResumeData["experience"]) => void;
  buildExperienceContext: () => string;
  handleAcceptSummary: (summary: string) => void;
  handleAcceptBullet: (enhanced: string) => void;
  handleAcceptGrammar: (corrected: string) => void;
  handleAcceptAchievement: (achievement: string) => void;
  onBack: () => void;
  addHistory: ReturnType<typeof useAiHistory>["addHistory"];
}) {
  const tool = TOOLS.find((t) => t.id === activeTab);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
      {/* Back button + tool header */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onBack}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-90"
          title="Back to tools"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        {tool && (
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shadow-sm",
                "bg-gradient-to-br",
                tool.color
              )}
            >
              <span className="text-xs">{tool.icon}</span>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-gray-800">{tool.label}</h3>
              <p className="text-[10px] text-gray-400">{tool.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tool content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === "summary" && <SummaryGenerator onAccept={handleAcceptSummary} />}
        {activeTab === "summary-improve" && (
          <SummaryImprover currentSummary={resumeData?.summary || ""} onAccept={handleAcceptSummary} />
        )}
        {activeTab === "bullets" && <BulletEnhancer context={buildExperienceContext()} onAccept={handleAcceptBullet} />}
        {activeTab === "bullet-improve" && (
          <BulletImprover
            experience={resumeData?.experience}
            onAccept={(index, enhanced) => {
              if (!resumeData?.experience?.length || !onUpdateExperience) return;
              const updated = [...resumeData.experience];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                responsibilities: [...updated[updated.length - 1].responsibilities, enhanced],
              };
              onUpdateExperience(updated);
            }}
          />
        )}
        {activeTab === "actions" && (
          <ActionVerbs
            resumeText={[resumeData?.summary || "", ...(resumeData?.experience || []).flatMap((e) => [`${e.role} at ${e.company}`, ...e.responsibilities])].join("\n")}
            onApply={(original, replacement) => {
              const regex = new RegExp(`\\b${original}\\b`, "i");
              let changed = false;
              if (onUpdateSummary && resumeData?.summary && regex.test(resumeData.summary)) {
                addHistory({ type: "summary", description: "Action Verbs", originalContent: resumeData.summary, newContent: resumeData.summary.replace(regex, replacement) });
                onUpdateSummary(resumeData.summary.replace(regex, replacement));
                changed = true;
              }
              if (!changed && onUpdateExperience && resumeData?.experience?.length) {
                const newExp = resumeData.experience.map((exp) => ({
                  ...exp,
                  responsibilities: exp.responsibilities.map((r) => (regex.test(r) ? r.replace(regex, replacement) : r)),
                }));
                addHistory({ type: "experience", description: "Action Verbs", originalContent: resumeData.experience, newContent: newExp });
                onUpdateExperience(newExp);
              }
            }}
          />
        )}
        {activeTab === "metrics" && (
          <MetricsAdder
            experienceText={(resumeData?.experience || []).flatMap((e) => [`${e.role} at ${e.company}`, ...e.responsibilities]).join("\n")}
            onAccept={(suggestion) => handleAcceptAchievement(suggestion)}
          />
        )}
        {activeTab === "weak" && (
          <WeakContentDetector
            resumeText={[resumeData?.summary || "", ...(resumeData?.experience || []).flatMap((e) => e.responsibilities)].join("\n")}
            onApply={(phrase, alternative) => {
              const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              const regex = new RegExp(escaped, "i");
              let changed = false;
              if (onUpdateSummary && resumeData?.summary && regex.test(resumeData.summary)) {
                addHistory({ type: "summary", description: "Weak Content Replace", originalContent: resumeData.summary, newContent: resumeData.summary.replace(regex, alternative) });
                onUpdateSummary(resumeData.summary.replace(regex, alternative));
                changed = true;
              }
              if (!changed && onUpdateExperience && resumeData?.experience?.length) {
                const newExp = resumeData.experience.map((exp) => ({
                  ...exp,
                  responsibilities: exp.responsibilities.map((r) => (regex.test(r) ? r.replace(regex, alternative) : r)),
                }));
                addHistory({ type: "experience", description: "Weak Content Replace", originalContent: resumeData.experience, newContent: newExp });
                onUpdateExperience(newExp);
              }
            }}
          />
        )}
        {activeTab === "grammar" && <GrammarChecker onAccept={handleAcceptGrammar} />}
        {activeTab === "rewrite" && (
          <SectionRewriter sectionType="section" currentContent={resumeData?.summary || ""} onAccept={(rewritten) => onUpdateSummary?.(rewritten)} />
        )}
        {activeTab === "ats" && (
          <AtsOptimizer
            resumeData={resumeData}
            onApplySuggestion={(suggestion) => {
              if (resumeData?.summary && onUpdateSummary) {
                onUpdateSummary(resumeData.summary + `\n\n[ATS Note]: ${suggestion}`);
              }
            }}
          />
        )}
        {activeTab === "achievements" && <AchievementSuggestor onAccept={handleAcceptAchievement} />}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export function AiAssistantPanel({
  resumeData,
  onUpdateSummary,
  onUpdateExperience,
  compact = false,
  onClose,
}: AiAssistantPanelProps) {
  const [view, setView] = useState<"home" | "tool" | "history">("home");
  const [activeTab, setActiveTab] = useState<Exclude<Tab, "home">>("summary");
  const { history, addHistory, undoLast } = useAiHistory();

  const buildExperienceContext = useCallback((): string => {
    if (!resumeData?.experience?.length) return "";
    return resumeData.experience
      .map((exp) => `${exp.role} at ${exp.company} (${exp.startDate} - ${exp.current ? "Present" : exp.endDate})`)
      .join("; ");
  }, [resumeData]);

  const handleAcceptSummary = useCallback(
    (summary: string) => {
      if (resumeData?.summary !== undefined) {
        addHistory({
          type: "summary",
          description: "Summary Update",
          originalContent: resumeData.summary,
          newContent: summary,
        });
      }
      onUpdateSummary?.(summary);
    },
    [onUpdateSummary, resumeData, addHistory]
  );
  const handleAcceptBullet = useCallback(
    (enhanced: string) => {
      if (!resumeData?.experience?.length || !onUpdateExperience) return;
      const updated = [...resumeData.experience];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        responsibilities: [...updated[updated.length - 1].responsibilities, enhanced],
      };
      addHistory({
        type: "experience",
        description: "Bullet Enhancement",
        originalContent: resumeData.experience,
        newContent: updated,
      });
      onUpdateExperience(updated);
    },
    [resumeData, onUpdateExperience, addHistory]
  );
  const handleAcceptGrammar = useCallback(
    (corrected: string) => {
      if (resumeData?.summary !== undefined) {
        addHistory({
          type: "summary",
          description: "Grammar Correction",
          originalContent: resumeData.summary,
          newContent: corrected,
        });
      }
      onUpdateSummary?.(corrected);
    },
    [onUpdateSummary, resumeData, addHistory]
  );
  const handleAcceptAchievement = useCallback(
    (achievement: string) => {
      if (!resumeData?.experience?.length || !onUpdateExperience) return;
      const updated = [...resumeData.experience];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        achievements: [...updated[updated.length - 1].achievements, achievement],
      };
      addHistory({
        type: "experience",
        description: "Achievement Addition",
        originalContent: resumeData.experience,
        newContent: updated,
      });
      onUpdateExperience(updated);
    },
    [resumeData, onUpdateExperience, addHistory]
  );

  const handleSelectTool = useCallback((id: Tab) => {
    if (id === "home") {
      setView("home");
      return;
    }
    setActiveTab(id);
    setView("tool");
  }, []);

  return (
    <div className={cn("flex flex-col h-full bg-white", compact && "rounded-2xl shadow-2xl border border-gray-200")}>
      {/* ── Header ── */}
      <div
        className={cn(
          "shrink-0",
          view === "home"
            ? "px-5 pt-5 pb-3 border-b border-gray-100"
            : "px-4 pt-4 pb-0"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shadow-sm",
                view === "home"
                  ? "bg-gradient-to-br from-accent-500 to-accent-600"
                  : "bg-gradient-to-br from-gray-100 to-gray-200"
              )}
            >
              {view === "home" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4Z" />
                  <path d="M8 13h.01" />
                  <path d="M16 13h.01" />
                  <path d="M10 17h4" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4Z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {view === "home" ? "AI Assistant" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("-", " ")}
              </h2>
              {view === "home" && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Choose a tool to get started
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => {
                  const entry = undoLast();
                  if (entry) {
                    if (entry.type === "summary") {
                      onUpdateSummary?.(entry.originalContent as string);
                    } else if (entry.type === "experience") {
                      onUpdateExperience?.(entry.originalContent as ResumeData["experience"]);
                    }
                  }
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-90"
                title="Undo last AI change"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setView(view === "history" ? "home" : "history")}
              className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90", view === "history" ? "bg-accent-50 text-accent-600" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}
              title="History"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            {compact && onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-90"
                title="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
        {view === "history" ? (
          <AiHistoryView 
            onBack={() => setView("home")} 
            onRestore={(entry) => {
              if (entry.type === "summary") {
                onUpdateSummary?.(entry.originalContent as string);
              } else if (entry.type === "experience") {
                onUpdateExperience?.(entry.originalContent as ResumeData["experience"]);
              }
            }} 
          />
        ) : view === "home" ? (
          <ToolGrid tools={TOOLS} onSelect={handleSelectTool} />
        ) : (
          <ToolView
            activeTab={activeTab}
            resumeData={resumeData}
            onUpdateSummary={onUpdateSummary}
            onUpdateExperience={onUpdateExperience}
            buildExperienceContext={buildExperienceContext}
            handleAcceptSummary={handleAcceptSummary}
            handleAcceptBullet={handleAcceptBullet}
            handleAcceptGrammar={handleAcceptGrammar}
            handleAcceptAchievement={handleAcceptAchievement}
            onBack={() => handleSelectTool("home")}
            addHistory={addHistory}
          />
        )}
      </div>
    </div>
  );
}
