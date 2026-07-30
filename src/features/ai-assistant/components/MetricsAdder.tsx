"use client";

import { useState, useCallback } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { cn } from "@/lib/utils";

interface MetricsAdderProps {
  experienceText?: string;
  onAccept?: (suggestion: string) => void;
}

export function MetricsAdder({ experienceText, onAccept }: MetricsAdderProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!experienceText?.trim()) return;
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await callAi(
        "suggest-achievements",
        experienceText,
        "Suggest 3-5 specific, quantifiable metrics or achievements that could be added to these resume bullets. Focus on numbers, percentages, revenue, users, performance improvements, team sizes, etc. If no specific metrics are available from the context, suggest areas where metrics would strengthen the bullet points. Format each as a bullet point starting with -"
      );
      if (res.success) {
        const lines = res.output
          .split("\n")
          .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*"))
          .map((l) => l.replace(/^[-*]\s*/, "").trim())
          .filter(Boolean);
        setSuggestions(lines.length > 0 ? lines : [res.output.trim()]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [experienceText]);

  const handleCopy = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    []
  );

  if (!experienceText?.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <p className="text-[13px] font-medium text-gray-600">No experience content</p>
        <p className="text-[11px] text-gray-400 mt-1">
          Add experience with responsibility descriptions to get metric suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-gray-500 flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-500">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        Get suggestions for adding quantifiable metrics to your experience bullets.
      </p>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-2",
          "bg-accent-600 text-white hover:bg-accent-700 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        )}
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating metrics...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
            </svg>
            Suggest Metrics & Achievements
          </>
        )}
      </button>

      {suggestions.length > 0 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-[12px] font-semibold text-gray-700 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-500">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Suggested Metrics
          </p>
          <div className="space-y-1.5">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className={cn(
                  "p-3.5 rounded-xl border transition-all duration-200 group cursor-pointer",
                  selectedIndex === i
                    ? "border-accent-300 bg-accent-50 shadow-sm ring-1 ring-accent-200"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                )}
                onClick={() => setSelectedIndex(i)}
              >
                <div className="flex items-start gap-2.5">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    selectedIndex === i ? "bg-accent-200" : "bg-green-100"
                  )}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={selectedIndex === i ? "text-accent-600" : "text-green-600"}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-700 leading-relaxed">{s}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(s); }}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAccept?.(s); }}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium text-accent-600 hover:bg-accent-100 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
          >
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
