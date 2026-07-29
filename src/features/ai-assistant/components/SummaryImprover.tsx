"use client";

import { useState, useCallback } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { cn } from "@/lib/utils";

interface SummaryImproverProps {
  currentSummary?: string;
  onAccept?: (improved: string) => void;
}

const TONES = [
  { id: "professional", label: "Professional", desc: "Polished, corporate tone" },
  { id: "impactful", label: "Impactful", desc: "Strong action-oriented language" },
  { id: "concise", label: "Concise", desc: "Brief and to the point" },
  { id: "technical", label: "Technical", desc: "Highlight technical expertise" },
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

  const handleAccept = useCallback(() => {
    if (result && onAccept) onAccept(result);
  }, [result, onAccept]);

  return (
    <div className="space-y-4">
      {/* Tone selector */}
      <div>
        <p className="text-micro font-medium text-gray-600 mb-2">Select Tone</p>
        <div className="grid grid-cols-2 gap-2">
          {TONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setSelectedTone(tone.id)}
              className={cn(
                "p-2.5 rounded-xl border text-left transition-all duration-200",
                selectedTone === tone.id
                  ? "border-accent-300 bg-accent-50 ring-2 ring-accent-200/50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <p className="text-small font-semibold text-gray-800">{tone.label}</p>
              <p className="text-micro text-gray-400 mt-0.5">{tone.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div>
        <p className="text-micro font-medium text-gray-600 mb-1">Current Summary</p>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-small text-gray-600 max-h-24 overflow-y-auto">
          {currentSummary || "No summary found. Add one in the Personal Info section."}
        </div>
      </div>

      {/* Improve button */}
      <button
        onClick={handleImprove}
        disabled={loading || !currentSummary?.trim()}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl text-small font-semibold transition-all duration-200",
          "bg-accent-600 text-white hover:bg-accent-700",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Improving...
          </span>
        ) : (
          "Improve Summary"
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-micro font-semibold text-gray-700 uppercase tracking-wider">Improved</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg text-micro font-medium text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleAccept}
                  className="px-2.5 py-1 rounded-lg text-micro font-medium text-accent-600 hover:bg-accent-100 transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
            <p className="text-small text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
          </div>
          <button
            onClick={handleImprove}
            disabled={loading}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-micro font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
