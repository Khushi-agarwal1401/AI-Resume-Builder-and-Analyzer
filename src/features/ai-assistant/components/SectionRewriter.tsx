"use client";

import { useState } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface SectionRewriterProps {
  sectionType: string;
  currentContent: string;
  onAccept?: (rewritten: string) => void;
}

const STYLES = [
  { id: "professional", label: "Professional", icon: "💼", desc: "Polished corporate language" },
  { id: "impactful", label: "Impactful", icon: "🚀", desc: "Strong achievements focus" },
  { id: "concise", label: "Concise", icon: "✂️", desc: "Brief and to the point" },
  { id: "detailed", label: "Detailed", icon: "📋", desc: "Expanded with clarity" },
];

export function SectionRewriter({ sectionType, currentContent, onAccept }: SectionRewriterProps) {
  const [selectedStyle, setSelectedStyle] = useState("professional");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleRewrite() {
    if (!currentContent.trim()) {
      setError("No content to rewrite. Please fill in the section first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const styleDescriptions: Record<string, string> = {
      professional: "Use professional, polished language suitable for corporate environments.",
      impactful: "Use strong action verbs and emphasize achievements and results.",
      concise: "Be brief and to the point. Remove fluff and redundant phrases.",
      detailed: "Expand on details while maintaining clarity and relevance.",
    };

    const context = [
      `Section type: ${sectionType}`,
      `Style: ${styleDescriptions[selectedStyle] || styleDescriptions.professional}`,
      additionalInstructions ? `Additional instructions: ${additionalInstructions}` : "",
      "Do not add fabricated metrics, experience, or skills not present in the original.",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await callAi("rewrite-section", currentContent, context);
      if (res.success) {
        setResult(res.output);
      } else {
        setError(res.error || "Failed to rewrite section");
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
      {/* Style selector */}
      <div>
        <label className="block text-[12px] font-medium text-gray-700 mb-2">Rewrite Style</label>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200",
                selectedStyle === style.id
                  ? "border-accent-300 bg-accent-50 ring-2 ring-accent-200/50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              )}
            >
              <span className="text-sm">{style.icon}</span>
              <div>
                <p className="text-[13px] font-semibold text-gray-800">{style.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{style.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Additional instructions */}
      <div>
        <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
          Additional Instructions <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <input
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="e.g. Emphasize leadership, focus on customer impact..."
          />
        </div>
      </div>

      {/* Current content preview */}
      {currentContent && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Current Content</span>
          </div>
          <p className="text-[12px] text-gray-600 line-clamp-3 leading-relaxed">{currentContent}</p>
        </div>
      )}

      <Button
        onClick={handleRewrite}
        disabled={loading || !currentContent.trim()}
        className="w-full gap-2"
        variant="accent"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Rewriting...
          </span>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Rewrite Section
          </>
        )}
      </Button>

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
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50/80 to-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-green-100 bg-green-50/50">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-600">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span className="text-[12px] font-semibold text-green-800">Rewritten Version</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-green-100/50 transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAccept && (
              <Button size="sm" onClick={() => onAccept(result)} className="flex-1 gap-1.5" variant="accent">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Accept
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={handleCopy} className="flex-1 gap-1.5">
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setResult(null); setAdditionalInstructions(""); }}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-gray-400">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>Rewrites your existing content in the selected style. Never adds fabricated information.</span>
      </div>
    </div>
  );
}
