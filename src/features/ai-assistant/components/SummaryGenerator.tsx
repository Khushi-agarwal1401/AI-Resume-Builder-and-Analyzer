"use client";

import { useState } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { Button } from "@/components/ui/Button";

interface SummaryGeneratorProps {
  onAccept?: (summary: string) => void;
}

export function SummaryGenerator({ onAccept }: SummaryGeneratorProps) {
  const [currentRole, setCurrentRole] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [keySkills, setKeySkills] = useState("");
  const [industry, setIndustry] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function buildContext(): string {
    const parts: string[] = [];
    if (currentRole) parts.push(`Current/desired role: ${currentRole}`);
    if (yearsExp) parts.push(`Years of experience: ${yearsExp}`);
    if (keySkills) parts.push(`Key skills: ${keySkills}`);
    if (industry) parts.push(`Industry: ${industry}`);
    return parts.join("\n");
  }

  async function handleGenerate() {
    const context = buildContext();
    if (!context && !additionalContext) {
      setError("Please fill in at least one field to generate a relevant summary.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await callAi("generate-summary", additionalContext || currentRole, context);
      if (res.success) {
        setResult(res.output);
      } else {
        setError(res.error || "Failed to generate summary");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
              Current / Desired Role
            </span>
          </label>
          <input
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            placeholder="e.g. Frontend Developer"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Years of Experience
            </span>
          </label>
          <input
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
            value={yearsExp}
            onChange={(e) => setYearsExp(e.target.value)}
            placeholder="e.g. 5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              Key Skills
            </span>
          </label>
          <input
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
            value={keySkills}
            onChange={(e) => setKeySkills(e.target.value)}
            placeholder="e.g. React, TypeScript, Node.js"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              Industry
            </span>
          </label>
          <input
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Technology, Finance"
          />
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
          Additional Context <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          className="w-full h-20 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300 resize-y placeholder:text-gray-300"
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="Key achievements, target companies, or anything else to include..."
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2"
        variant="accent"
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
            Generate Summary
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

      {result && (
        <div className="rounded-xl border border-accent-200 bg-gradient-to-br from-accent-50/80 to-white overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-accent-100 bg-accent-50/50">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent-600">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="text-[12px] font-semibold text-accent-800">Generated Summary</span>
            </div>
            <div className="flex gap-1.5">
              {onAccept && (
                <button
                  onClick={() => onAccept(result)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium text-accent-600 hover:bg-accent-100 transition-colors"
                >
                  Accept
                </button>
              )}
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-gray-400">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>Generates a 3-4 sentence professional summary using only the information you provide.</span>
      </div>
    </div>
  );
}
