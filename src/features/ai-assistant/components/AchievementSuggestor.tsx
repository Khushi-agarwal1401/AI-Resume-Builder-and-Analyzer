"use client";

import { useState } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AchievementSuggestorProps {
  onAccept?: (achievement: string) => void;
}

export function AchievementSuggestor({ onAccept }: AchievementSuggestorProps) {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [metrics, setMetrics] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  function buildContext(): string {
    const parts: string[] = [];
    if (role) parts.push(`Role: ${role}`);
    if (company) parts.push(`Company: ${company}`);
    if (metrics) parts.push(`Available metrics: ${metrics}`);
    return parts.join("\n");
  }

  async function handleSuggest() {
    const exp = `${role ? `Role: ${role}` : ""}${company ? ` at ${company}` : ""}\nResponsibilities: ${responsibilities}`;
    if (!exp.trim() || exp === "Responsibilities: ") {
      setError("Please describe your responsibilities at minimum.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedIdx(null);

    try {
      const res = await callAi("suggest-achievements", exp, buildContext());
      if (res.success) {
        setResult(res.output);
      } else {
        setError(res.error || "Failed to generate suggestions");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function parseSuggestions(): string[] {
    if (!result) return [];
    const lines = result
      .split(/\n+/)
      .map((l) => l.replace(/^[-•\d*.]+\\s*/, "").trim())
      .filter((l) => l.length > 10);
    return lines.length > 0 ? lines : [result];
  }

  const suggestions = result ? parseSuggestions() : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Role Title
            </span>
          </label>
          <input
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Company
            </span>
          </label>
          <input
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp"
          />
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
          Key Responsibilities <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full h-24 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300 resize-y placeholder:text-gray-300"
          value={responsibilities}
          onChange={(e) => setResponsibilities(e.target.value)}
          placeholder="Describe what you did day-to-day, projects you worked on, teams you led..."
        />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
          Available Metrics <span className="text-gray-400 font-normal">(optional — numbers, percentages, $ amounts)</span>
        </label>
        <div className="relative">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <input
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
            value={metrics}
            onChange={(e) => setMetrics(e.target.value)}
            placeholder="e.g. 40% faster, managed $50k budget, team of 8"
          />
        </div>
      </div>

      <Button
        onClick={handleSuggest}
        disabled={loading}
        className="w-full gap-2"
        variant="accent"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
            </svg>
            Suggest Achievements
          </>
        )}
      </Button>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-gray-700 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-500">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Suggested Achievements
          </p>
          <div className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3.5 rounded-xl border cursor-pointer transition-all duration-200",
                  selectedIdx === idx
                    ? "border-accent-300 bg-accent-50 shadow-sm ring-1 ring-accent-200"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                )}
                onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
              >
                <div className="flex items-start gap-2.5">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                    selectedIdx === idx ? "bg-accent-200" : "bg-gray-100"
                  )}>
                    <span className={cn(
                      "text-[10px] font-bold",
                      selectedIdx === idx ? "text-accent-700" : "text-gray-500"
                    )}>{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-700 leading-relaxed">{suggestion}</p>
                  </div>
                </div>
                {selectedIdx === idx && onAccept && (
                  <div className="flex justify-end mt-3 pt-3 border-t border-accent-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); onAccept(suggestion); }}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white bg-accent-600 hover:bg-accent-700 transition-colors"
                    >
                      Use This Achievement
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-gray-400">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>Only uses metrics you provide. Never invents numbers.</span>
      </div>
    </div>
  );
}
