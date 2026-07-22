"use client";

import { useState } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface SummaryGeneratorProps {
  /** Callback when generated summary is accepted */
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

  function handleAccept() {
    if (result && onAccept) {
      onAccept(result);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-small font-medium text-gray-700 mb-1">
            Current / Desired Role
          </label>
          <input
            className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            placeholder="e.g. Frontend Developer"
          />
        </div>
        <div>
          <label className="block text-small font-medium text-gray-700 mb-1">
            Years of Experience
          </label>
          <input
            className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
            value={yearsExp}
            onChange={(e) => setYearsExp(e.target.value)}
            placeholder="e.g. 5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-small font-medium text-gray-700 mb-1">
            Key Skills
          </label>
          <input
            className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
            value={keySkills}
            onChange={(e) => setKeySkills(e.target.value)}
            placeholder="e.g. React, TypeScript, Node.js"
          />
        </div>
        <div>
          <label className="block text-small font-medium text-gray-700 mb-1">
            Industry
          </label>
          <input
            className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Technology, Finance"
          />
        </div>
      </div>

      <div>
        <label className="block text-small font-medium text-gray-700 mb-1">
          Additional Context <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          className="w-full h-20 rounded-sm border border-gray-300 px-3 py-2 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="Key achievements, target companies, or anything else to include..."
        />
      </div>

      <Button onClick={handleGenerate} disabled={loading} className="w-full">
        {loading ? <Spinner /> : "Generate Summary"}
      </Button>

      {error && (
        <div className="p-3 rounded-sm bg-red-50 border border-red-200 text-small text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="p-4 rounded-sm bg-gray-50 border border-gray-300">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-small font-semibold text-black">Generated Summary</h4>
            <div className="flex gap-2">
              {onAccept && (
                <button
                  onClick={handleAccept}
                  className="text-micro font-medium text-accent-500 hover:text-accent-600 underline underline-offset-2"
                >
                  Accept
                </button>
              )}
              <button
                onClick={handleCopy}
                className="text-micro font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <p className="text-body text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-micro text-gray-400">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span>Generates a 3-4 sentence professional summary using only the information you provide.</span>
      </div>
    </div>
  );
}
