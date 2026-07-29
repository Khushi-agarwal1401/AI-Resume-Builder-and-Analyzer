"use client";

import { useState, useCallback } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { cn } from "@/lib/utils";

interface SummaryImproverProps {
  currentSummary?: string;
  onAccept?: (improved: string) => void;
}

const TONES = [
  { id: "professional", label: "Professional", desc: "Polished, corporate tone", icon: "💼" },
  { id: "impactful", label: "Impactful", desc: "Strong action-oriented language", icon: "🚀" },
  { id: "concise", label: "Concise", desc: "Brief and to the point", icon: "✂️" },
  { id: "technical", label: "Technical", desc: "Highlight technical expertise", icon: "⚙️" },
];

export function SummaryImprover({ currentSummary, onAccept }: SummaryImproverProps) {
  const [selectedTone, setSelectedTone] = useState("professional");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleImprove = useCallback(async () => {
    if (!currentSummary?.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await callAi(
        "rewrite-section",
        currentSummary,
        `Rewrite this resume summary in a "${selectedTone}" tone. Keep it to 3-4 sentences. Use only facts provided. Do not invent metrics or experience.`
      );
      if (res.success) setResult(res.output);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentSummary, selectedTone]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  return (
    <div className="space-y-4">
      {/* Tone selector */}
      <div>
        <p className="text-[12px] font-medium text-gray-600 mb-2">Select Tone</p>
        <div className="grid grid-cols-2 gap-2">
          {TONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setSelectedTone(tone.id)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all duration-200",
                selectedTone === tone.id
                  ? "border-accent-300 bg-accent-50 ring-2 ring-accent-200/50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm"
              )}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm">{tone.icon}</span>
                <p className="text-[13px] font-semibold text-gray-800">{tone.label}</p>
              </div>
              <p className="text-[11px] text-gray-400 ml-6">{tone.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Current summary display */}
      <div>
        <p className="text-[12px] font-medium text-gray-600 mb-1.5">Current Summary</p>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-600 max-h-24 overflow-y-auto leading-relaxed">
          {currentSummary ? (
            <span>{currentSummary}</span>
          ) : (
            <span className="text-gray-400 italic">No summary found. Add one in the Personal Info section.</span>
          )}
        </div>
      </div>

      {/* Improve button */}
      <button
        onClick={handleImprove}
        disabled={loading || !currentSummary?.trim()}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-2",
          "bg-accent-600 text-white hover:bg-accent-700 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        )}
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Improving...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
            </svg>
            Improve Summary
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50/80 to-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-green-100 bg-green-50/50">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-600">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span className="text-[12px] font-semibold text-green-800">Improved Version</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-green-100/50 transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => onAccept?.(result)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium text-accent-600 hover:bg-accent-100 transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
            </div>
          </div>
          <button
            onClick={handleImprove}
            disabled={loading}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
