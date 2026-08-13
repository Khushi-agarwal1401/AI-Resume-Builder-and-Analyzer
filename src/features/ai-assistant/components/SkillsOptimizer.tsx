"use client";

import { useState } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import type { ResumeData } from "@/types/resume";
import { cn } from "@/lib/utils";
import { buildResumeText } from "./ResumeOptimizer";

interface SkillsOptimizerProps {
  resumeData?: ResumeData | null;
}

export function SkillsOptimizer({ resumeData }: SkillsOptimizerProps) {
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resumeText = resumeData ? buildResumeText(resumeData) : "";

  const canRun = Boolean(targetRole.trim() || jobDescription.trim());

  async function handleGenerate() {
    if (!canRun) return;

    const inputParts = [targetRole.trim() ? `Target role: ${targetRole.trim()}` : "", jobDescription.trim()]
      .filter(Boolean)
      .join("\n\n");
    const input = inputParts || "No target role or job description provided — highlight the candidate's strongest skills.";

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await callAi("targeted-skills", input, resumeText);
      if (res.success) {
        setResult(res.output);
      } else {
        setError(res.error || "Failed to generate skills");
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
      <div>
        <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Target Role
          </span>
        </label>
        <input
          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. Frontend Developer"
        />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M16 13H8M16 17H8M10 9H8"/>
            </svg>
            Job Description <span className="text-gray-400 font-normal">(optional but recommended)</span>
          </span>
        </label>
        <textarea
          className="w-full h-24 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300 resize-y placeholder:text-gray-300"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description so the skills align with its keywords..."
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !canRun}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl text-small font-semibold transition-all duration-200",
          "bg-accent-600 text-white hover:bg-accent-700",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Building targeted skills...
          </span>
        ) : (
          "Generate Targeted Skills"
        )}
      </button>

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
        <div className="rounded-xl border border-accent-200 bg-gradient-to-br from-accent-50/80 to-white overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 dark:from-accent-500/10 dark:to-gray-900 dark:border-accent-500/25">
          <div className="flex items-center justify-between px-4 py-3 border-b border-accent-100 bg-accent-50/50">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent-600">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="text-[12px] font-semibold text-accent-800">Targeted Skills</span>
            </div>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-gray-400">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>Highlights the most relevant hard skills, soft skills, and technical expertise, grouped logically and aligned with the job description keywords. Uses only skills from your resume — nothing is invented.</span>
      </div>
    </div>
  );
}
