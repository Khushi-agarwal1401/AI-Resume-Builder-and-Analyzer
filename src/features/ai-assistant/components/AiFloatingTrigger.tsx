"use client";

import { useState } from "react";
import { useAiAssistant } from "@/features/ai-assistant/context/AiAssistantContext";
import { cn } from "@/lib/utils";

const quickActions = [
  { tab: "summary" as const, label: "Summary", icon: "✨", shortcut: "S" },
  { tab: "grammar" as const, label: "Grammar", icon: "🔤", shortcut: "G" },
  { tab: "weak" as const, label: "Weak", icon: "⚠️", shortcut: "W" },
  { tab: "ats" as const, label: "ATS", icon: "🎯", shortcut: "A" },
];

export function AiFloatingTrigger() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { openAssistant } = useAiAssistant();

  const handleOpenTool = (tab: (typeof quickActions)[number]["tab"]) => {
    openAssistant(tab, "", "");
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Quick action buttons */}
      {isExpanded && (
        <div className="flex flex-col gap-1.5 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {quickActions.map((action) => (
            <button
              key={action.tab}
              onClick={() => handleOpenTool(action.tab)}
              className="group flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-lg hover:shadow-xl hover:border-accent-200 hover:bg-accent-50 transition-all duration-200 active:scale-95"
            >
              <span className="text-sm">{action.icon}</span>
              <span className="text-[12px] font-medium text-gray-700 group-hover:text-accent-700 whitespace-nowrap">
                {action.label}
              </span>
              <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold text-gray-400 bg-gray-100 border border-gray-200 font-mono">
                {action.shortcut}
              </kbd>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90",
          "bg-gradient-to-br from-accent-500 to-accent-600 text-white hover:shadow-xl hover:from-accent-600 hover:to-accent-700",
          isExpanded && "rotate-45 bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
        )}
        title="AI Assistant"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200"
        >
          {isExpanded ? (
            <line x1="18" y1="6" x2="6" y2="18" />
          ) : (
            <>
              <path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4Z" />
              <path d="M8 13h.01" />
              <path d="M16 13h.01" />
              <path d="M10 17h4" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
