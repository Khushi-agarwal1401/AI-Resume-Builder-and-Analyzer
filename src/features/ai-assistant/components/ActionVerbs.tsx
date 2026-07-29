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

function findWeakVerbs(text: string): { word: string; index: number; context: string }[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found: { word: string; index: number; context: string }[] = [];

  for (const weak of WEAK_VERBS) {
    let startIdx = 0;
    while (startIdx < lower.length) {
      const idx = lower.indexOf(weak, startIdx);
      if (idx === -1) break;

      // Get surrounding context
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

  return found.slice(0, 15); // Limit results
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
      <p className="text-micro text-gray-400 text-center py-6">
        Add resume content to analyze action verbs.
      </p>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
          <span className="text-lg">✅</span>
        </div>
        <p className="text-small font-medium text-gray-800">Great job!</p>
        <p className="text-micro text-gray-400 mt-1">
          No weak verbs detected. Your resume uses strong action language.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-small text-gray-500">
        Found <span className="font-semibold text-gray-800">{findings.length}</span> weak verb{findings.length !== 1 ? "s" : ""}.
        Select one to see stronger alternatives.
      </p>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
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
                onClick={() =>
                  setSelectedWord(isSelected ? null : `${f.word}-${i}`)
                }
                className={cn(
                  "w-full p-2.5 rounded-xl border text-left transition-all",
                  isSelected
                    ? "border-accent-300 bg-accent-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-micro font-bold uppercase">
                    {f.word}
                  </span>
                  <span className="text-small text-gray-500 truncate">{f.context}</span>
                </div>
              </button>

              {isSelected && (
                <div className="mt-1.5 ml-4 p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-micro font-medium text-gray-600 mb-1.5">Suggested replacements:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((verb) => (
                      <button
                        key={verb}
                        onClick={() => handleApply(f.word, verb)}
                        className="px-2.5 py-1 rounded-lg text-micro font-medium text-accent-600 bg-white border border-accent-200 hover:bg-accent-50 transition-colors"
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
