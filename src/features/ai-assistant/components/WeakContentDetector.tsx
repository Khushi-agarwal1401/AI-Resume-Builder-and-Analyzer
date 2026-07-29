"use client";

import { useState, useCallback } from "react";


interface WeakContentDetectorProps {
  resumeText?: string;
  onApply?: (phrase: string, alternative: string) => void;
}

const WEAK_PHRASES = [
  { phrase: "hardworking", alternative: "A results-oriented professional known for delivering..." },
  { phrase: "team player", alternative: "Collaborates cross-functionally to drive project completion" },
  { phrase: "good communication skills", alternative: "Delivers clear, concise technical documentation and presentations" },
  { phrase: "detail oriented", alternative: "Meticulous quality assurance with zero-defect track record" },
  { phrase: "self motivated", alternative: "Proactively identifies opportunities and drives initiatives independently" },
  { phrase: "highly motivated", alternative: "Consistently exceeds performance targets" },
  { phrase: "passionate about", alternative: "Dedicated to advancing in" },
  { phrase: "think outside the box", alternative: "Innovates creative solutions to complex challenges" },
  { phrase: "go-getter", alternative: "Consistently takes initiative to drive results" },
  { phrase: "people person", alternative: "Skilled at building rapport and fostering collaboration" },
  { phrase: "results driven", alternative: "Consistently achieves measurable outcomes" },
  { phrase: "proven track record", alternative: "A history of delivering" },
  { phrase: "works well under pressure", alternative: "Thrives in high-stakes environments" },
  { phrase: "excellent verbal and written communication", alternative: "Communicates complex ideas clearly across all levels" },
  { phrase: "familiar with", alternative: "Proficient in" },
  { phrase: "exposure to", alternative: "Experience with" },
  { phrase: "knowledge of", alternative: "Expertise in" },
  { phrase: "ability to", alternative: "Skilled at" },
  { phrase: "responsible for", alternative: "Owned, Led, Managed, Directed" },
  { phrase: "duties included", alternative: "Delivered, Drove, Executed" },
  { phrase: "tasked with", alternative: "Championed, Spearheaded" },
  { phrase: "in charge of", alternative: "Oversaw, Directed, Managed" },
  { phrase: "worked on", alternative: "Developed, Built, Engineered" },
  { phrase: "involved in", alternative: "Contributed to, Participated in" },
  { phrase: "helped with", alternative: "Facilitated, Enabled, Supported" },
  { phrase: "participated in", alternative: "Contributed to, Collaborated on" },
  { phrase: "assisted with", alternative: "Supported, Augmented, Partnered with" },
  { phrase: "basic understanding", alternative: "Foundational knowledge of" },
  { phrase: "some experience", alternative: "Practical experience in" },
  { phrase: "various", alternative: "Specific types: [name them]" },
  { phrase: "etc", alternative: "Omit or list completely" },
  { phrase: "things", alternative: "Deliverables, initiatives, projects" },
  { phrase: "stuff", alternative: "Omit — use specific terminology" },
  { phrase: "numerous", alternative: "Specify the number" },
  { phrase: "extensive", alternative: "Specify duration or scope" },
];

export function detectWeakContent(text: string): { phrase: string; alternative: string; context: string }[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found: { phrase: string; alternative: string; context: string }[] = [];

  for (const weak of WEAK_PHRASES) {
    const idx = lower.indexOf(weak.phrase.toLowerCase());
    if (idx !== -1) {
      const start = Math.max(0, idx - 15);
      const end = Math.min(text.length, idx + weak.phrase.length + 25);
      const context =
        (start > 0 ? "..." : "") +
        text.slice(start, end) +
        (end < text.length ? "..." : "");
      found.push({ phrase: weak.phrase, alternative: weak.alternative, context });
    }
  }

  return found.slice(0, 12); // Limit results
}

export function WeakContentDetector({ resumeText, onApply }: WeakContentDetectorProps) {
  const findings = resumeText ? detectWeakContent(resumeText) : [];
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const visibleFindings = findings.filter((_, i) => !dismissed.has(i));

  const handleDismiss = useCallback((idx: number) => {
    setDismissed((prev) => new Set(prev).add(idx));
  }, []);

  const handleApply = useCallback(
    (phrase: string, alternative: string) => {
      onApply?.(phrase, alternative);
    },
    [onApply]
  );

  if (!resumeText) {
    return (
      <p className="text-micro text-gray-400 text-center py-6">
        Add resume content to detect weak phrases.
      </p>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
          <span className="text-lg">✅</span>
        </div>
        <p className="text-small font-medium text-gray-800">Clean content!</p>
        <p className="text-micro text-gray-400 mt-1">
          No weak or overused phrases detected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-small text-gray-500">
          Found <span className="font-semibold text-gray-800">{visibleFindings.length}</span> weak phrase{visibleFindings.length !== 1 ? "s" : ""}.
        </p>
        {dismissed.size > 0 && (
          <button
            onClick={() => setDismissed(new Set())}
            className="text-micro font-medium text-accent-600 hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {visibleFindings.map((f, i) => (
          <div key={i} className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 group">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-amber-600 text-micro font-bold">!</span>
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-micro font-bold">
                    {f.phrase}
                  </span>
                </div>
                <p className="text-micro text-gray-500 mb-1 truncate">{f.context}</p>
                <p className="text-small text-gray-700">
                  <span className="font-medium">Try: </span>
                  <span className="text-green-700">{f.alternative}</span>
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-1.5 mt-2">
              <button
                onClick={() => handleDismiss(i)}
                className="px-2 py-0.5 rounded-md text-micro font-medium text-gray-500 hover:bg-amber-100/50 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleApply(f.phrase, f.alternative)}
                className="px-2 py-0.5 rounded-md text-micro font-medium text-accent-600 hover:bg-amber-100/50 transition-colors"
              >
                Replace
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
