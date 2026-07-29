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

    // Run local ATS analysis
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

  const handleApply = useCallback(
    (suggestion: string) => {
      onApplySuggestion?.(suggestion);
    },
    [onApplySuggestion]
  );

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

  const getGradeColor = (grade: string) => {
    if (["A+", "A", "A-"].includes(grade)) return "text-green-600";
    if (["B+", "B", "B-"].includes(grade)) return "text-blue-600";
    if (["C+", "C"].includes(grade)) return "text-amber-600";
    return "text-red-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={handleAnalyze}
          disabled={loading || !resumeText.trim()}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl text-small font-semibold transition-all duration-200",
            "bg-accent-600 text-white hover:bg-accent-700",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            "Analyze ATS Compatibility"
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Overall Score */}
          <div className={cn("rounded-xl border p-4 text-center", getScoreBg(result.overall))}>
            <div className="flex items-center justify-center gap-4">
              <div
                className={cn(
                  "w-16 h-16 rounded-full border-4 flex items-center justify-center text-xl font-bold",
                  result.overall >= 70
                    ? "border-green-400"
                    : result.overall >= 40
                    ? "border-amber-400"
                    : "border-red-400"
                )}
              >
                <span className={getScoreColor(result.overall)}>{result.overall}</span>
              </div>
              <div className="text-left">
                <p className="text-small font-semibold text-gray-900">
                  Grade: <span className={cn("text-lg", getGradeColor(result.grade))}>{result.grade}</span>
                </p>
                <p className="text-micro text-gray-500">Estimated Compatibility Score</p>
              </div>
            </div>
          </div>

          {/* Subscores */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Keywords", value: result.subscores.keywordRelevance },
              { label: "Formatting", value: result.subscores.formatting },
              { label: "Readability", value: result.subscores.readability },
              { label: "Sections", value: result.subscores.sections },
              { label: "Contact Info", value: result.subscores.contactInfo },
              { label: "Education", value: result.subscores.educationRelevance },
              { label: "Experience", value: result.subscores.experienceDepth },
              { label: "Projects", value: result.subscores.projectQuality },
            ].map((s) => (
              <div
                key={s.label}
                className={cn(
                  "rounded-lg border p-3",
                  s.value >= 70
                    ? "border-green-200 bg-green-50/50"
                    : s.value >= 40
                    ? "border-amber-200 bg-amber-50/50"
                    : "border-red-200 bg-red-50/50"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-micro text-gray-500">{s.label}</span>
                  <span className={cn("text-micro font-bold", getScoreColor(s.value))}>{s.value}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      s.value >= 70
                        ? "bg-green-500"
                        : s.value >= 40
                        ? "bg-amber-500"
                        : "bg-red-400"
                    )}
                    style={{ width: `${s.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AI Suggestions button */}
          <button
            onClick={handleAiSuggestions}
            disabled={aiLoading}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-small font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
          >
            {aiLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                Getting AI suggestions...
              </span>
            ) : (
              "Get AI-Powered Suggestions"
            )}
          </button>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-micro font-semibold text-gray-700 uppercase tracking-wider">
                Suggestions
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {[...result.suggestions, ...aiSuggestions].map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all duration-200 group",
                      selectedIndex === i
                        ? "border-accent-300 bg-accent-50"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                    )}
                    onClick={() => setSelectedIndex(i)}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-small text-gray-700 leading-relaxed">{s}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(s);
                      }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 rounded-md text-micro font-medium text-accent-600 hover:bg-accent-100"
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
        <p className="text-micro text-gray-400 text-center py-4">
          Click &ldquo;Analyze ATS Compatibility&rdquo; to get your score and suggestions.
        </p>
      )}

      {!resumeText.trim() && (
        <p className="text-micro text-gray-400 text-center py-4">
          Add resume content first to get an ATS analysis.
        </p>
      )}
    </div>
  );
}
