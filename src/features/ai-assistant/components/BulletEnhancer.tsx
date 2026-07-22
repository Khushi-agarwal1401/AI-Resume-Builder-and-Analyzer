"use client";

import { useState } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface BulletEnhancerProps {
  /** Optional initial bullet text to pre-fill */
  initialBullet?: string;
  /** Optional context about the role/company */
  context?: string;
  /** Callback when enhancement is accepted */
  onAccept?: (enhanced: string) => void;
}

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

  function handleAccept() {
    if (result && onAccept) {
      onAccept(result);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-small font-medium text-gray-700 mb-1.5">
          Original Bullet Point
        </label>
        <textarea
          className="w-full h-24 rounded-sm border border-gray-300 px-3 py-2 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a bullet point from your resume..."
        />
      </div>

      <div>
        <label className="block text-small font-medium text-gray-700 mb-1.5">
          Context <span className="text-gray-400">(optional — role, company, or project details)</span>
        </label>
        <input
          className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
          value={contextInput}
          onChange={(e) => setContextInput(e.target.value)}
          placeholder="e.g. Senior Frontend Developer at Acme Corp"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => handleEnhance("action-verbs")} disabled={loading || !input.trim()} className="w-full text-xs py-2 h-auto">
          {loading ? <Spinner /> : "Improve Phrasing"}
        </Button>
        <Button onClick={() => handleEnhance("add-keywords")} disabled={loading || !input.trim()} variant="secondary" className="w-full text-xs py-2 h-auto">
          {loading ? <Spinner /> : "Add Keywords"}
        </Button>
        <Button onClick={() => handleEnhance("add-metrics")} disabled={loading || !input.trim()} variant="secondary" className="w-full text-xs py-2 h-auto col-span-2">
          {loading ? <Spinner /> : "Suggest Metric Placeholders"}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-sm bg-red-50 border border-red-200 text-small text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="p-4 rounded-sm bg-gray-50 border border-gray-300">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-small font-semibold text-black">Enhanced Version</h4>
            <div className="flex gap-2">
              {onAccept && (
                <button
                  onClick={handleAccept}
                  className="text-micro font-medium text-accent-500 hover:text-accent-600 underline underline-offset-2"
                >
                  Accept
                </button>
              )}
              <button
                onClick={handleCopy}
                className="text-micro font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <p className="text-body text-gray-700 whitespace-pre-wrap">{result}</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-micro text-gray-400">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span>AI uses action verbs and adds metrics only if you provided them. Never fabricates data.</span>
      </div>
    </div>
  );
}
