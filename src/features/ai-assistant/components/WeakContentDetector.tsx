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

  return found.slice(0, 12);
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
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <p className="text-[13px] font-medium text-gray-600">No resume content</p>
        <p className="text-[11px] text-gray-400 mt-1">Add resume content to detect weak phrases.</p>
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
        <p className="text-[14px] font-semibold text-gray-800">Clean content!</p>
        <p className="text-[12px] text-gray-400 mt-1">
          No weak or overused phrases detected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-500 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Found <span className="font-semibold text-gray-800">{visibleFindings.length}</span> weak phrase{visibleFindings.length !== 1 ? "s" : ""}.
        </p>
        {dismissed.size > 0 && (
          <button
            onClick={() => setDismissed(new Set())}
            className="px-2 py-1 rounded-md text-[11px] font-medium text-accent-600 hover:bg-accent-50 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
        {visibleFindings.map((f, i) => (
          <div key={i} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 group transition-all hover:shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-amber-600 text-[11px] font-bold">!</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wide">
                    {f.phrase}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-1.5 truncate italic">
                  &ldquo;{f.context}&rdquo;
                </p>
                <p className="text-[12px] text-gray-700">
                  <span className="font-medium">Try: </span>
                  <span className="text-green-700 font-medium">{f.alternative}</span>
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-1.5 mt-2 pt-2 border-t border-amber-100/50">
              <button
                onClick={() => handleDismiss(i)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-amber-100/50 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleApply(f.phrase, f.alternative)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium text-accent-600 hover:bg-amber-100 transition-colors"
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
