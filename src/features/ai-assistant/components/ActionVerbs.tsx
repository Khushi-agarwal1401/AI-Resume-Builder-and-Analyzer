"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ActionVerbsProps {
  resumeText?: string;
  onApply?: (original: string, replacement: string) => void;
}

const WEAK_VERBS = [
  "was", "were", "been", "being", "have", "has", "had", "do", "does", "did",
  "make", "made", "making", "get", "got", "getting", "work", "worked", "working",
  "help", "helped", "helping", "use", "used", "using", "take", "took", "taking",
  "give", "gave", "given", "put", "putting", "show", "showed", "showing",
  "try", "tried", "trying", "go", "went", "going", "come", "came", "coming",
  "see", "saw", "seeing", "know", "knew", "knowing", "think", "thought", "thinking",
  "want", "wanted", "wanting", "look", "looked", "looking", "call", "called",
  "calling", "tell", "told", "telling", "find", "found", "finding",
  "responsible for", "duties included", "tasked with", "in charge of",
];

const STRONG_VERB_SUGGESTIONS: Record<string, string[]> = {
  "was": ["Spearheaded", "Led", "Managed", "Directed", "Orchestrated"],
  "were": ["Pioneered", "Established", "Championed", "Drove", "Executed"],
  "have": ["Achieved", "Delivered", "Secured", "Generated", "Attained"],
  "has": ["Demonstrated", "Proven", "Delivered", "Established"],
  "had": ["Acquired", "Developed", "Built", "Cultivated", "Mastered"],
  "make": ["Engineer", "Architect", "Design", "Develop", "Create"],
  "made": ["Engineered", "Architected", "Designed", "Developed", "Created"],
  "get": ["Acquire", "Secure", "Obtain", "Achieve", "Attain"],
  "got": ["Acquired", "Secured", "Obtained", "Achieved", "Attained"],
  "work": ["Collaborate", "Contribute", "Partner", "Coordinate", "Engage"],
  "worked": ["Collaborated", "Contributed", "Partnered", "Coordinated", "Drove"],
  "help": ["Facilitate", "Enable", "Support", "Empower", "Mentor"],
  "helped": ["Facilitated", "Enabled", "Supported", "Empowered", "Mentored"],
  "use": ["Leverage", "Utilize", "Employ", "Implement", "Deploy"],
  "used": ["Leveraged", "Utilized", "Employed", "Implemented", "Deployed"],
  "responsible for": ["Owned", "Directed", "Managed", "Led", "Headed"],
  "duties included": ["Delivered", "Executed", "Performed", "Drove", "Achieved"],
  "tasked with": ["Championed", "Led", "Owned", "Spearheaded", "Drove"],
  "in charge of": ["Oversaw", "Directed", "Managed", "Supervised", "Administered"],
};

export function findWeakVerbs(text: string): { word: string; index: number; context: string }[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found: { word: string; index: number; context: string }[] = [];

  for (const weak of WEAK_VERBS) {
    let startIdx = 0;
    while (startIdx < lower.length) {
      const idx = lower.indexOf(weak, startIdx);
      if (idx === -1) break;

      const start = Math.max(0, idx - 20);
      const end = Math.min(text.length, idx + weak.length + 30);
      const context =
        (start > 0 ? "..." : "") +
        text.slice(start, end) +
        (end < text.length ? "..." : "");

      found.push({ word: weak, index: idx, context });
      startIdx = idx + weak.length;
    }
  }

  return found.slice(0, 15);
}

export function ActionVerbs({ resumeText, onApply }: ActionVerbsProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const findings = resumeText ? findWeakVerbs(resumeText) : [];

  const handleApply = useCallback(
    (original: string, replacement: string) => {
      onApply?.(original, replacement);
    },
    [onApply]
  );

  if (!resumeText) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <p className="text-[13px] font-medium text-gray-600">No resume content yet</p>
        <p className="text-[11px] text-gray-400 mt-1">Add resume content to analyze action verbs.</p>
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="text-[14px] font-semibold text-gray-800">Great job!</p>
        <p className="text-[12px] text-gray-400 mt-1">
          No weak verbs detected. Your resume uses strong action language.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-gray-500 flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Found <span className="font-semibold text-gray-800">{findings.length}</span> weak verb{findings.length !== 1 ? "s" : ""}.
        Select one to see stronger alternatives.
      </p>

      <div className="space-y-1.5 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
        {findings.map((f, i) => {
          const suggestions = STRONG_VERB_SUGGESTIONS[f.word] || [
            "Achieved",
            "Delivered",
            "Implemented",
            "Developed",
            "Executed",
          ];
          const isSelected = selectedWord === `${f.word}-${i}`;

          return (
            <div key={i}>
              <button
                onClick={() => setSelectedWord(isSelected ? null : `${f.word}-${i}`)}
                className={cn(
                  "w-full p-3 rounded-xl border text-left transition-all duration-200",
                  isSelected
                    ? "border-accent-300 bg-accent-50 shadow-sm"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wide">
                    {f.word}
                  </span>
                  <span className="text-[12px] text-gray-500 truncate flex-1">{f.context}</span>
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={cn("text-gray-400 transition-transform duration-200", isSelected && "rotate-180")}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </button>

              {isSelected && (
                <div className="mt-1.5 ml-4 p-3.5 rounded-xl bg-gray-50 border border-gray-200 transition-all duration-200 animate-in slide-in-from-top-1">
                  <p className="text-[11px] font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-500">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Suggested replacements:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((verb) => (
                      <button
                        key={verb}
                        onClick={() => handleApply(f.word, verb)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-accent-600 bg-white border border-accent-200 hover:bg-accent-50 hover:shadow-sm transition-all active:scale-95"
                      >
                        {verb}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
