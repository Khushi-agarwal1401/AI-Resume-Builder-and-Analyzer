"use client";

import { useState } from "react";

const suggestions = [
  { id: "improve", label: "Improve bullet points", action: "enhance-bullet" },
  { id: "keywords", label: "Add missing keywords", action: "add-keywords" },
  { id: "verbs", label: "Add action verbs", action: "rewrite-section" },
  { id: "weak", label: "Remove weak content", action: "rewrite-section" },
];

export function AiAssistantPanel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleAction(action: string) {
    setLoading(action);
    setResult(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, input: "", context: "" }),
      });
      const json = await res.json();
      if (json.success) setResult(json.output);
    } catch {
      setResult("AI suggestions unavailable. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <aside className="border-l border-gray-300 bg-white p-4">
      <h2 className="text-micro text-gray-500 uppercase tracking-widest mb-4">
        AI Assistant
      </h2>
      <p className="text-small text-gray-500 mb-4">
        Select a bullet point or section to get AI suggestions.
      </p>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => handleAction(s.action)}
            disabled={loading !== null}
            className="w-full text-left px-3 py-2 rounded-sm text-body text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            {loading === s.action ? "Processing..." : s.label}
          </button>
        ))}
      </div>
      {result && (
        <div className="mt-4 p-3 bg-gray-50 rounded-sm border border-gray-300">
          <p className="text-small text-gray-700">{result}</p>
        </div>
      )}
    </aside>
  );
}
