"use client";

import { useEffect } from "react";
import { AiAssistantPanel } from "./AiAssistantPanel";
import { useAiAssistant } from "@/features/ai-assistant/context/AiAssistantContext";
import type { ResumeData, Experience } from "@/types/resume";
import { cn } from "@/lib/utils";

interface AiAssistantDrawerProps {
  resumeData?: ResumeData | null;
  onUpdateSummary?: (summary: string) => void;
  onUpdateExperience?: (experience: Experience[]) => void;
}

/**
 * Right-side slide-over that hosts the AI Assistant. Driven entirely by the
 * AiAssistantContext (isOpen/activeTab), so the floating trigger, quick
 * actions, and any future entry points all open the same panel.
 */
export function AiAssistantDrawer({ resumeData, onUpdateSummary, onUpdateExperience }: AiAssistantDrawerProps) {
  const { isOpen, activeTab, closeAssistant } = useAiAssistant();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAssistant();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeAssistant]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeAssistant}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant"
        className={cn(
          "fixed top-0 right-0 z-[111] h-full w-full sm:w-[440px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex-1 min-h-0 overflow-hidden">
          <AiAssistantPanel
            resumeData={resumeData}
            onUpdateSummary={onUpdateSummary}
            onUpdateExperience={onUpdateExperience}
            initialTab={activeTab}
            onClose={closeAssistant}
          />
        </div>
      </div>
    </>
  );
}
