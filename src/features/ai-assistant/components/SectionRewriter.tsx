"use client";

import { useState } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { cleanRewriteOutput } from "@/features/ai-assistant/lib/cleanRewrite";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface SectionRewriterProps {
  /** The section type being rewritten */
  sectionType: string;
  /** Current content of the section */
  currentContent: string;
  /** Target tone/style for the rewrite */
  onAccept?: (rewritten: string) => void;
}

const STYLES = [
  { id: "professional", label: "Professional", icon: "💼" },
  { id: "impactful", label: "Impactful", icon: "🚀" },
  { id: "concise", label: "Concise", icon: "✂️" },
  { id: "detailed", label: "Detailed", icon: "📋" },
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
        setResult(cleanRewriteOutput(res.output));
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

  function handleAccept() {
    if (result && onAccept) {
      onAccept(result);
    }
  }

  return (
    <div className="space-y-4">
      {/* Style selector */}
      <div>
        <label className="block text-small font-medium text-gray-700 mb-2">
          Rewrite Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[12px] font-medium transition-all ${
                selectedStyle === style.id
                  ? "border-accent-500 bg-accent-50 text-accent-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span>{style.icon}</span>
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Additional instructions */}
      <div>
        <label className="block text-small font-medium text-gray-700 mb-1">
          Additional Instructions <span className="text-gray-400">(optional)</span>
        </label>
        <input
          className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
          value={additionalInstructions}
          onChange={(e) => setAdditionalInstructions(e.target.value)}
          placeholder="e.g. Emphasize leadership, focus on customer impact..."
        />
      </div>

      {/* Current content preview */}
      {currentContent && (
        <div className="p-3 rounded-sm bg-gray-50 border border-gray-200">
          <h4 className="text-micro font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Current Content
          </h4>
          <p className="text-small text-gray-600 line-clamp-3">{currentContent}</p>
        </div>
      )}

      <Button onClick={handleRewrite} disabled={loading || !currentContent.trim()} className="w-full">
        {loading ? <Spinner /> : `Rewrite ${sectionType}`}
      </Button>

      {error && (
        <div className="p-3 rounded-sm bg-red-50 border border-red-200 text-small text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-sm bg-green-50 border border-green-200">
            <h4 className="text-small font-semibold text-green-800 mb-2">Rewritten Version</h4>
            <p className="text-body text-green-900 whitespace-pre-wrap leading-relaxed">{result}</p>
          </div>

          <div className="flex items-center gap-2">
            {onAccept && (
              <Button size="sm" onClick={handleAccept} className="flex-1">
                Accept Rewrite
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={handleCopy} className="flex-1">
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setResult(null); setAdditionalInstructions(""); }}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-micro text-gray-400">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span>Rewrites your existing content in the selected style. Never adds fabricated information.</span>
      </div>
    </div>
  );
}
