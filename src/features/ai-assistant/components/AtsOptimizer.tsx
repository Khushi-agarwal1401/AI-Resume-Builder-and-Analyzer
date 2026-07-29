"use client";

import { useState, useCallback } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { calculateAtsScore } from "@/services/resume-analyzer/ats-scorer";
import type { ResumeData } from "@/types/resume";
import { cn } from "@/lib/utils";

interface AtsOptimizerProps {
  resumeData?: ResumeData | null;
  onApplySuggestion?: (suggestion: string) => void;
}

interface AtsResult {
  overall: number;
  subscores: {
    keywordRelevance: number;
    formatting: number;
    readability: number;
    sections: number;
    contactInfo: number;
    educationRelevance: number;
    experienceDepth: number;
    projectQuality: number;
  };
  grade: string;
  suggestions: string[];
}

const subscoreLabels: { key: keyof AtsResult["subscores"]; label: string; icon: string }[] = [
  { key: "keywordRelevance", label: "Keywords", icon: "🔑" },
  { key: "formatting", label: "Formatting", icon: "📐" },
  { key: "readability", label: "Readability", icon: "📖" },
  { key: "sections", label: "Sections", icon: "📑" },
  { key: "contactInfo", label: "Contact Info", icon: "📞" },
  { key: "educationRelevance", label: "Education", icon: "🎓" },
  { key: "experienceDepth", label: "Experience", icon: "💼" },
  { key: "projectQuality", label: "Projects", icon: "🚀" },
];

export function AtsOptimizer({ resumeData, onApplySuggestion }: AtsOptimizerProps) {
  const [result, setResult] = useState<AtsResult | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const resumeText = resumeData
    ? [
        resumeData.summary || "",
        ...(resumeData.experience || []).flatMap((e) => [
          `${e.role} at ${e.company}`,
          ...e.responsibilities,
        ]),
        ...(resumeData.education || []).map((e) =>
          `${e.degree} at ${e.institution}`
        ),
        ...(resumeData.skills ? [
          ...(resumeData.skills.technical || []),
          ...(resumeData.skills.soft || []),
          ...(resumeData.skills.tools || []),
          ...(resumeData.skills.frameworks || [])
        ] : []),
        ...(resumeData.projects || []).map((p) =>
          `${p.name}: ${p.description}`
        ),
      ].join("\n")
    : "";

  const handleAnalyze = useCallback(() => {
    if (!resumeText.trim()) return;
    setLoading(true);
    setResult(null);
    setAiSuggestions([]);

    // Simulate brief loading for visual feedback
    setTimeout(() => {
      const score = calculateAtsScore({
        text: resumeText,
        category: "experienced",
      });

      setResult({
        overall: score.overall,
        subscores: score.subscores,
        grade: score.grade,
        suggestions: score.suggestions,
      });
      setLoading(false);
    }, 400);
  }, [resumeText]);

  const handleAiSuggestions = useCallback(async () => {
    if (!resumeText.trim()) return;
    setAiLoading(true);
    try {
      const res = await callAi(
        "rewrite-section",
        "Analyze this resume for ATS compatibility and provide specific, actionable improvement suggestions.",
        resumeText
      );
      if (res.success) {
        const lines = res.output
          .split("\n")
          .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*") || /^\d+\./.test(l.trim()))
          .map((l) => l.replace(/^[-*\d]+\.\s*/, "").trim())
          .filter(Boolean);
        setAiSuggestions(lines.length > 0 ? lines : [res.output.trim()]);
      }
    } catch {
      // ignore
    } finally {
      setAiLoading(false);
    }
  }, [resumeText]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-green-50 border-green-200";
    if (score >= 40) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const getScoreRing = (score: number) => {
    if (score >= 70) return "border-green-400";
    if (score >= 40) return "border-amber-400";
    return "border-red-400";
  };

  const getBarColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-400";
  };

  return (
    <div className="space-y-4">
      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={loading || !resumeText.trim()}
        className={cn(
          "w-full px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-2",
          "bg-accent-600 text-white hover:bg-accent-700 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        )}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            Analyze ATS Compatibility
          </>
        )}
      </button>

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Overall Score */}
          <div className={cn("rounded-2xl border p-5 text-center", getScoreBg(result.overall))}>
            <div className="flex items-center justify-center gap-5">
              <div className="relative">
                <div
                  className={cn(
                    "w-20 h-20 rounded-full border-[4px] flex items-center justify-center bg-white shadow-sm",
                    getScoreRing(result.overall)
                  )}
                >
                  <span className={cn("text-2xl font-bold", getScoreColor(result.overall))}>{result.overall}</span>
                </div>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">Grade</p>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-lg text-lg font-bold",
                    ["A+", "A", "A-"].includes(result.grade) && "bg-green-100 text-green-700",
                    ["B+", "B", "B-"].includes(result.grade) && "bg-blue-100 text-blue-700",
                    ["C+", "C"].includes(result.grade) && "bg-amber-100 text-amber-700",
                    !["A+", "A", "A-", "B+", "B", "B-", "C+", "C"].includes(result.grade) && "bg-red-100 text-red-700"
                  )}>{result.grade}</span>
                </div>
                <p className="text-[12px] text-gray-500 mt-0.5">Estimated ATS Compatibility Score</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {result.overall >= 70 ? "Good — minor improvements recommended" :
                   result.overall >= 40 ? "Fair — needs improvement" :
                   "Poor — significant changes needed"}
                </p>
              </div>
            </div>
          </div>

          {/* Subscores */}
          <div>
            <p className="text-[12px] font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M18 20V10"/>
                <path d="M12 20V4"/>
                <path d="M6 20v-6"/>
              </svg>
              Detailed Breakdown
            </p>
            <div className="grid grid-cols-2 gap-2">
              {subscoreLabels.map((s) => {
                const value = result.subscores[s.key];
                return (
                  <div
                    key={s.key}
                    className={cn(
                      "rounded-xl border p-3 transition-all",
                      value >= 70 ? "border-green-200 bg-green-50/50" :
                      value >= 40 ? "border-amber-200 bg-amber-50/50" :
                      "border-red-200 bg-red-50/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <span>{s.icon}</span>
                        {s.label}
                      </span>
                      <span className={cn("text-[12px] font-bold", getScoreColor(value))}>{value}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-200/70 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700 ease-out", getBarColor(value))}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Suggestions button */}
          <button
            onClick={handleAiSuggestions}
            disabled={aiLoading}
            className="w-full px-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-[12px] font-medium text-gray-600 hover:border-accent-300 hover:bg-accent-50/50 hover:text-accent-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {aiLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-accent-600 rounded-full animate-spin" />
                Getting AI suggestions...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
                Get AI-Powered Suggestions
              </>
            )}
          </button>

          {/* Suggestions */}
          {(result.suggestions.length > 0 || aiSuggestions.length > 0) && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-500">
                  <path d="M12 20h9"/>
                  <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
                </svg>
                Improvement Suggestions
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
                {[...result.suggestions, ...aiSuggestions].map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all duration-200 group",
                      selectedIndex === i
                        ? "border-accent-300 bg-accent-50 shadow-sm"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                    )}
                    onClick={() => setSelectedIndex(selectedIndex === i ? null : i)}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      selectedIndex === i ? "bg-accent-200" : "bg-gray-100"
                    )}>
                      <span className={cn("text-[9px] font-bold", selectedIndex === i ? "text-accent-700" : "text-gray-500")}>{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-gray-700 leading-relaxed">{s}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplySuggestion?.(s);
                      }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2.5 py-1 rounded-md text-[11px] font-medium text-accent-600 hover:bg-accent-100 border border-transparent hover:border-accent-200"
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && resumeText.trim() && (
        <p className="text-[12px] text-gray-400 text-center py-4 flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          Click &ldquo;Analyze ATS Compatibility&rdquo; to get your score and suggestions.
        </p>
      )}

      {!resumeText.trim() && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <p className="text-[13px] font-medium text-gray-600">No resume content</p>
          <p className="text-[11px] text-gray-400 mt-1">Add resume content first to get an ATS analysis.</p>
        </div>
      )}
    </div>
  );
}
