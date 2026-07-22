"use client";

import { useState } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface AchievementSuggestorProps {
  /** Callback when an achievement is accepted */
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
    // Split by numbered lines, bullet points, or newlines
    const lines = result
      .split(/\n+/)
      .map((l) => l.replace(/^[-•\d*.]+\s*/, "").trim())
      .filter((l) => l.length > 10);
    return lines.length > 0 ? lines : [result];
  }

  function handleAccept(idx: number) {
    const suggestions = parseSuggestions();
    if (suggestions[idx] && onAccept) {
      onAccept(suggestions[idx]);
    }
  }

  const suggestions = result ? parseSuggestions() : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-small font-medium text-gray-700 mb-1">
            Role Title
          </label>
          <input
            className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div>
          <label className="block text-small font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp"
          />
        </div>
      </div>

      <div>
        <label className="block text-small font-medium text-gray-700 mb-1.5">
          Key Responsibilities <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full h-24 rounded-sm border border-gray-300 px-3 py-2 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
          value={responsibilities}
          onChange={(e) => setResponsibilities(e.target.value)}
          placeholder="Describe what you did day-to-day, projects you worked on, teams you led..."
        />
      </div>

      <div>
        <label className="block text-small font-medium text-gray-700 mb-1">
          Available Metrics <span className="text-gray-400">(optional — numbers, percentages, $ amounts)</span>
        </label>
        <input
          className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
          value={metrics}
          onChange={(e) => setMetrics(e.target.value)}
          placeholder="e.g. 40% faster, managed $50k budget, team of 8"
        />
      </div>

      <Button onClick={handleSuggest} disabled={loading} className="w-full">
        {loading ? <Spinner /> : "Suggest Achievements"}
      </Button>

      {error && (
        <div className="p-3 rounded-sm bg-red-50 border border-red-200 text-small text-red-700">
          {error}
        </div>
      )}

      {result && suggestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-small font-semibold text-black">Suggested Achievements</h4>
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-sm border cursor-pointer transition-all duration-200 ${
                selectedIdx === idx
                  ? "border-accent-500 bg-accent-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
              onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
            >
              <p className="text-body text-gray-700">{suggestion}</p>
              {selectedIdx === idx && onAccept && (
                <div className="flex justify-end mt-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAccept(idx); }}
                    className="text-small font-medium text-accent-500 hover:text-accent-600 underline underline-offset-2"
                  >
                    Use This Achievement
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-micro text-gray-400">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span>Only uses metrics you provide. Never invents numbers.</span>
      </div>
    </div>
  );
}
