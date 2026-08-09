"use client";

import { useState, useEffect } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import { checkGrammar, GrammarIssue } from "@/services/resume-analyzer/grammar-checker";
import { Button } from "@/components/ui/Button";

interface GrammarCheckerProps {
  onAccept?: (corrected: string) => void;
}

export function GrammarChecker({ onAccept }: GrammarCheckerProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [localIssues, setLocalIssues] = useState<GrammarIssue[]>([]);
  const [showLocalIssues, setShowLocalIssues] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim()) {
        setLocalIssues(checkGrammar(input));
      } else {
        setLocalIssues([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [input]);

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

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M12 20h9"/>
              <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
            </svg>
            Text to Check
          </span>
        </label>
        <textarea
          className="w-full h-40 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300 resize-y placeholder:text-gray-300"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Paste a section of your resume to check for grammar and spelling issues..."
        />
        <div className="flex justify-end mt-1.5">
          <span className="text-[11px] text-gray-400 font-medium">{wordCount} words</span>
        </div>
      </div>

      {localIssues.length > 0 && !result && showLocalIssues && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
          <button
            onClick={() => setShowLocalIssues(false)}
            className="flex items-center justify-between w-full px-4 py-2.5 text-left"
          >
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span className="text-[12px] font-semibold text-amber-800">
                {localIssues.length} Local Suggestion{localIssues.length !== 1 ? "s" : ""}
              </span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <div className="px-4 pb-3 space-y-1.5">
            {localIssues.map((issue, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-amber-100">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">{issue.text}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 shrink-0">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span className="text-[12px] text-amber-800 font-medium">{issue.suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {localIssues.length === 0 && input.trim() && !result && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-600">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-[12px] text-green-800">No basic grammar issues detected locally.</p>
        </div>
      )}

      <Button
        onClick={handleCheck}
        disabled={loading || !input.trim()}
        className="w-full gap-2"
        variant="accent"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Checking...
          </span>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Rewrite with AI
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
          {/* Original vs Corrected */}
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-500">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Original</span>
              </div>
              <p className="text-[13px] text-gray-500 whitespace-pre-wrap line-through decoration-red-300 decoration-1 leading-relaxed">{input}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-green-200 bg-gradient-to-br from-green-50/80 to-white dark:from-green-500/10 dark:to-gray-900 dark:border-green-500/25">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-600">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wider">Corrected</span>
              </div>
              <p className="text-[13px] text-green-900 whitespace-pre-wrap leading-relaxed">{result}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              <span>Grammar fixes only. Content and meaning are preserved.</span>
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
        </div>
      )}
    </div>
  );
}
