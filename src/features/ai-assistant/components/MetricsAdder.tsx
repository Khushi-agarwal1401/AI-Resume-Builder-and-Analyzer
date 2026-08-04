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

  const handleAccept = useCallback(
    (suggestion: string) => {
      onAccept?.(suggestion);
    },
    [onAccept]
  );

  if (!experienceText?.trim()) {
    return (
      <p className="text-micro text-gray-400 text-center py-6">
        Add experience with responsibility descriptions to get metric suggestions.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-small text-gray-500">
        Get suggestions for adding quantifiable metrics to your experience bullets.
      </p>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl text-small font-semibold transition-all duration-200",
          "bg-accent-600 text-white hover:bg-accent-700",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating metrics...
          </span>
        ) : (
          "Suggest Metrics & Achievements"
        )}
      </button>

      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-micro font-semibold text-gray-700 uppercase tracking-wider">
            Suggested Metrics
          </p>
          <div className="space-y-1.5">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-all duration-200 group",
                  selectedIndex === i
                    ? "border-accent-300 bg-accent-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                )}
                onClick={() => setSelectedIndex(i)}
              >
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-small text-gray-700 leading-relaxed">{s}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(s);
                    }}
                    className="px-2 py-0.5 rounded-md text-micro font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(s);
                    }}
                    className="px-2 py-0.5 rounded-md text-micro font-medium text-accent-600 hover:bg-accent-100 transition-colors"
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
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-micro font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
