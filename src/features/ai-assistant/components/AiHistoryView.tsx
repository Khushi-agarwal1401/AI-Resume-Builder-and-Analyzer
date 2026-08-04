"use client";

import { useAiHistory, type AiHistoryEntry } from "../context/AiHistoryContext";
import { Button } from "@/components/ui/Button";
import type { ResumeData } from "@/types/resume";

interface AiHistoryViewProps {
  onBack: () => void;
  onRestore: (entry: AiHistoryEntry) => void;
}

export function AiHistoryView({ onBack, onRestore }: AiHistoryViewProps) {
  const { history, clearHistory } = useAiHistory();

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function renderContent(content: string | ResumeData["experience"]) {
    if (typeof content === "string") {
      return <p className="text-[12px] text-gray-700 whitespace-pre-wrap">{content}</p>;
    }
    // Handle array of experience/other objects if necessary
    return <pre className="text-[10px] text-gray-600 overflow-hidden text-ellipsis">{JSON.stringify(content, null, 2)}</pre>;
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-90"
            title="Back"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-slate-500 to-slate-600">
              <span className="text-xs">🕒</span>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-gray-800">AI History</h3>
              <p className="text-[10px] text-gray-400">View and restore previous suggestions</p>
            </div>
          </div>
        </div>
        {history.length > 0 && (
          <button onClick={clearHistory} className="text-[11px] text-gray-500 hover:text-gray-800 underline">
            Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10 flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
            <span className="text-xl opacity-50">⏳</span>
          </div>
          <p className="text-[13px] font-semibold text-gray-700">No History Yet</p>
          <p className="text-[11px] text-gray-400 max-w-[200px]">
            AI suggestions you accept will appear here, allowing you to easily undo or compare them.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{entry.type}</span>
                  <span className="text-[10px] text-gray-400">• {formatTime(entry.timestamp)}</span>
                </div>
                <Button size="sm" variant="accent" onClick={() => onRestore(entry)} className="h-6 text-[10px] px-2.5">
                  Restore Previous
                </Button>
              </div>
              <div className="p-3">
                <p className="text-[11px] font-medium text-gray-500 mb-1">Previous Content:</p>
                <div className="bg-red-50/50 border border-red-100/50 rounded-lg p-2 mb-3">
                  {renderContent(entry.originalContent)}
                </div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">New Content:</p>
                <div className="bg-green-50/50 border border-green-100/50 rounded-lg p-2">
                  {renderContent(entry.newContent)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
