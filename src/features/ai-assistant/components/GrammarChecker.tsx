"use client";

import { useState } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface GrammarCheckerProps {
  /** Callback when corrected text is accepted */
  onAccept?: (corrected: string) => void;
}

export function GrammarChecker({ onAccept }: GrammarCheckerProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  function handleInputChange(value: string) {
    setInput(value);
    setWordCount(value.split(/\s+/).filter(Boolean).length);
  }

  async function handleCheck() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await callAi("check-grammar", input);
      if (res.success) {
        setResult(res.output);
      } else {
        setError(res.error || "Failed to check grammar");
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
          Text to Check
        </label>
        <textarea
          className="w-full h-40 rounded-sm border border-gray-300 px-3 py-2 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Paste a section of your resume to check for grammar and spelling issues..."
        />
        <div className="flex justify-end mt-1">
          <span className="text-micro text-gray-400">{wordCount} words</span>
        </div>
      </div>

      <Button onClick={handleCheck} disabled={loading || !input.trim()} className="w-full">
        {loading ? <Spinner /> : "Check Grammar"}
      </Button>

      {error && (
        <div className="p-3 rounded-sm bg-red-50 border border-red-200 text-small text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div>
          {/* Original vs Corrected side-by-side preview */}
          <div className="grid grid-cols-1 gap-3 mb-3">
            <div className="p-3 rounded-sm bg-white border border-gray-300">
              <h4 className="text-micro font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Original</h4>
              <p className="text-body text-gray-700 whitespace-pre-wrap line-through decoration-red-300 decoration-1">{input}</p>
            </div>
            <div className="p-3 rounded-sm bg-green-50 border border-green-200">
              <h4 className="text-micro font-semibold text-green-700 uppercase tracking-wider mb-1.5">Corrected</h4>
              <p className="text-body text-green-900 whitespace-pre-wrap">{result}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-sm bg-gray-50 border border-gray-300">
            <div className="flex items-center gap-2 text-micro text-gray-500">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1C3.686 1 1 3.686 1 7s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 11A5 5 0 117 2a5 5 0 010 10z" fill="currentColor"/>
                <path d="M6.5 4.5v3.5M6.5 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span>Grammar fixes only. Content and meaning are preserved.</span>
            </div>
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
        </div>
      )}
    </div>
  );
}
