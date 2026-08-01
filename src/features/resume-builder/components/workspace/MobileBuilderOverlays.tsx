"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Sparkles, LayoutGrid, Target, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import { AiAssistantPanel } from "@/features/ai-assistant/components/AiAssistantPanel";
import { SectionNavList } from "./SectionNavList";
import { TEMPLATE_NAMES } from "@/features/resume-builder/config/template-constants";
import type { ResumeData, Experience, ResumeTemplate } from "@/types/resume";

type Sheet = "sections" | "preview" | "ai" | null;

interface MobileBuilderOverlaysProps {
  resumeId: string;
  sections: { id: string; label: string; isOptional?: boolean }[];
  currentSectionId?: string;
  data: ResumeData | null;
  previewResume: ResumeData | null;
  resumeData: ResumeData | null;
  isDebouncing: boolean;
  currentTemplate: ResumeTemplate;
  onUpdateSummary: (summary: string) => void;
  onUpdateExperience: (experience: Experience[]) => void;
  onSelectTemplate: (template: ResumeTemplate) => void;
  /** Navigates to the ATS score page (mobile-only entry point) */
  onOpenAts: () => void;
}

const SHEET_META: Record<Exclude<Sheet, null>, { title: string; icon: React.ReactNode; accent: string }> = {
  sections: { title: "Sections", icon: <LayoutGrid className="w-4 h-4" />, accent: "from-accent-500 to-accent-600" },
  preview: { title: "Live Preview", icon: <Eye className="w-4 h-4" />, accent: "from-emerald-500 to-teal-600" },
  ai: { title: "AI Assistant", icon: <Sparkles className="w-4 h-4" />, accent: "from-violet-500 to-purple-600" },
};

export function MobileBuilderOverlays({
  resumeId,
  sections,
  currentSectionId,
  data,
  previewResume,
  resumeData,
  isDebouncing,
  currentTemplate,
  onUpdateSummary,
  onUpdateExperience,
  onSelectTemplate,
  onOpenAts,
}: MobileBuilderOverlaysProps) {
  const [activeSheet, setActiveSheet] = useState<Sheet>(null);
  const pathname = usePathname();

  // Close the sheet when the route changes (e.g. tapping a section link inside the sheet)
  useEffect(() => {
    setActiveSheet(null);
  }, [pathname]);

  // Lock body scroll while a sheet is open
  useEffect(() => {
    if (!activeSheet) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeSheet]);

  // Close sheet on Escape
  useEffect(() => {
    if (!activeSheet) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveSheet(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeSheet]);

  const close = () => setActiveSheet(null);
  const meta = activeSheet ? SHEET_META[activeSheet] : null;

  return (
    <>
      {/* ═══════════ Mobile bottom action bar (below xl) ═══════════ */}
      <div className="xl:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-4 h-16">
          <button
            onClick={() => setActiveSheet(activeSheet === "sections" ? null : "sections")}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-1 transition-colors duration-150",
              activeSheet === "sections" ? "text-accent-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {activeSheet === "sections" && (
              <span className="absolute top-0 h-0.5 w-10 rounded-full bg-gradient-to-r from-accent-500 to-accent-600" />
            )}
            <LayoutGrid
              size={20}
              className={cn("transition-transform duration-150", activeSheet === "sections" ? "scale-110" : "group-hover:scale-105")}
            />
            <span className="text-[10px] font-semibold tracking-wide">Sections</span>
          </button>

          <button
            onClick={() => setActiveSheet(activeSheet === "preview" ? null : "preview")}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-1 transition-colors duration-150",
              activeSheet === "preview" ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {activeSheet === "preview" && (
              <span className="absolute top-0 h-0.5 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" />
            )}
            <Eye
              size={20}
              className={cn("transition-transform duration-150", activeSheet === "preview" ? "scale-110" : "group-hover:scale-105")}
            />
            <span className="text-[10px] font-semibold tracking-wide">Preview</span>
          </button>

          <button
            onClick={() => setActiveSheet(activeSheet === "ai" ? null : "ai")}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-1 transition-colors duration-150",
              activeSheet === "ai" ? "text-violet-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {activeSheet === "ai" && (
              <span className="absolute top-0 h-0.5 w-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-600" />
            )}
            <Sparkles
              size={20}
              className={cn("transition-transform duration-150", activeSheet === "ai" ? "scale-110" : "group-hover:scale-105")}
            />
            <span className="text-[10px] font-semibold tracking-wide">AI</span>
          </button>

          <button
            onClick={onOpenAts}
            className="group relative flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600 transition-colors duration-150"
          >
            <Target
              size={20}
              className="transition-transform duration-150 group-hover:scale-105"
            />
            <span className="text-[10px] font-semibold tracking-wide">ATS</span>
          </button>
        </div>
        {/* Safe-area spacer for iOS home indicator */}
        <div className="h-[env(safe-area-inset-bottom)] bg-transparent" />
      </div>

      {/* ═══════════ Bottom sheets ═══════════ */}
      <AnimatePresence>
        {activeSheet && meta && (
          <motion.div
            className="xl:hidden fixed inset-0 z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

            {/* Sheet */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={meta.title}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              {/* Drag handle */}
              <div className="pt-2.5 pb-1 flex justify-center shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm bg-gradient-to-br", meta.accent)}>
                    {meta.icon}
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">{meta.title}</h2>
                  {activeSheet === "preview" && isDebouncing && (
                    <Loader2 className="w-3.5 h-3.5 text-accent-400 animate-spin" />
                  )}
                </div>
                <button
                  onClick={close}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-90"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {activeSheet === "sections" && (
                  <div className="h-full overflow-y-auto">
                    <SectionNavList
                      sections={sections}
                      resumeId={resumeId}
                      currentSectionId={currentSectionId}
                      data={data}
                    />
                  </div>
                )}

                {activeSheet === "preview" && (
                  <div className="h-full flex flex-col">
                    {/* Template switcher */}
                    <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                      <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-0.5">
                        {Object.keys(TEMPLATE_NAMES).map((t) => (
                          <button
                            key={t}
                            onClick={() => onSelectTemplate(t as ResumeTemplate)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0",
                              currentTemplate === t
                                ? "bg-accent-50 text-accent-700 border-accent-200"
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                            )}
                          >
                            {TEMPLATE_NAMES[t as ResumeTemplate]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preview canvas */}
                    <div className="flex-1 overflow-y-auto bg-[#F0F0F0] bg-[radial-gradient(#d4d4d4_0.5px,transparent_0.5px)] [background-size:12px_12px] p-4">
                      {previewResume ? (
                        <div className="bg-white shadow-[0_2px_20px_-8px_rgba(0,0,0,0.15)]">
                          <div className="p-4 md:p-6">
                            <TemplateRenderer resume={previewResume} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                          <Eye className="w-8 h-8" />
                          <p className="text-xs">No resume data yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSheet === "ai" && (
                  <div className="h-full">
                    <AiAssistantPanel
                      compact
                      onClose={close}
                      resumeData={resumeData}
                      onUpdateSummary={onUpdateSummary}
                      onUpdateExperience={onUpdateExperience}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
