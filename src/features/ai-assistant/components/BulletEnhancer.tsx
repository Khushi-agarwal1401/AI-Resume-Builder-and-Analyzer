"use client";

import { useState } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { cn } from "@/lib/utils";

interface BulletEnhancerProps {
  initialBullet?: string;
  context?: string;
  onAccept?: (enhanced: string) => void;
}

const enhanceActions = [
  { id: "action-verbs", label: "Improve Phrasing", desc: "Stronger action verbs", icon: "✍️" },
  { id: "add-keywords", label: "Add Keywords", desc: "Industry keywords", icon: "🔑" },
  { id: "add-metrics", label: "Add Metrics", desc: "Quantifiable results", icon: "📈" },
];

export function BulletEnhancer({ initialBullet = "", context = "", onAccept }: BulletEnhancerProps) {
  const [input, setInput] = useState(initialBullet);
  const [contextInput, setContextInput] = useState(context);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleEnhance(actionType: string) {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    let promptContext = contextInput;
    if (actionType === "add-metrics") {
      promptContext += "\nInstruction: Add placeholders like [X]% or $[Y] where appropriate metrics could be added to quantify the bullet point.";
    } else if (actionType === "add-keywords") {
      promptContext += "\nInstruction: Enhance the bullet by seamlessly integrating industry-standard keywords.";
    } else if (actionType === "action-verbs") {
      promptContext += "\nInstruction: Start the bullet with a strong action verb and improve the overall phrasing.";
    }

    try {
      const res = await callAi("enhance-bullet", input, promptContext);
      if (res.success) {
        setResult(res.output);
      } else {
        setError(res.error || "Failed to enhance bullet point");
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
      <div>
        <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Original Bullet Point
          </span>
        </label>
        <textarea
          className="w-full h-24 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300 resize-y placeholder:text-gray-300"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a bullet point from your resume..."
        />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
          Context <span className="text-gray-400 font-normal">(optional — role, company, or project details)</span>
        </label>
        <div className="relative">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <input
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
            value={contextInput}
            onChange={(e) => setContextInput(e.target.value)}
            placeholder="e.g. Senior Frontend Developer at Acme Corp"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {enhanceActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleEnhance(action.id)}
            disabled={loading || !input.trim()}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl border text-center transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:border-accent-200 hover:bg-accent-50/50 hover:shadow-sm active:scale-[0.97]",
              loading ? "border-gray-100 bg-gray-50" : "border-gray-200 bg-white"
            )}
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-accent-500 rounded-full animate-spin" />
            ) : (
              <span className="text-sm">{action.icon}</span>
            )}
            <span className="text-[11px] font-medium text-gray-700">{action.label}</span>
            <span className="text-[9px] text-gray-400">{action.desc}</span>
          </button>
        ))}
      </div>

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
        <div className="rounded-xl border border-accent-200 bg-gradient-to-br from-accent-50/80 to-white overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 dark:from-accent-500/10 dark:to-gray-900 dark:border-accent-500/25">
          <div className="flex items-center justify-between px-4 py-3 border-b border-accent-100 bg-accent-50/50">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent-600">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="text-[12px] font-semibold text-accent-800">Enhanced Version</span>
            </div>
            <div className="flex gap-1.5">
              {onAccept && (
                <button
                  onClick={() => onAccept(result)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium text-accent-600 hover:bg-accent-100 transition-colors"
                >
                  Accept
                </button>
              )}
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-gray-400">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>AI uses action verbs and adds metrics only if you provided them. Never fabricates data.</span>
      </div>
    </div>
  );
}
