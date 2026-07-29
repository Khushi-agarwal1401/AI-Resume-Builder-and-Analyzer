import React, { useState } from "react";
import { ZoomIn, ZoomOut, Sparkles, Eye } from "lucide-react";
import type { ResumeData, Experience } from "@/types/resume";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import { AiAssistantPanel } from "@/features/ai-assistant/components/AiAssistantPanel";
import { useAiAssistant } from "@/features/ai-assistant/context/AiAssistantContext";
import { cn } from "@/lib/utils";

interface RightPreviewPanelProps {
  resumeData: ResumeData | null;
  onUpdateSummary: (summary: string) => void;
  onUpdateExperience: (experience: Experience[]) => void;
}

export function RightPreviewPanel({
  resumeData,
  onUpdateSummary,
  onUpdateExperience,
}: RightPreviewPanelProps) {
  const [zoom, setZoom] = useState(45);
  const { isOpen, closeAssistant, openAssistant } = useAiAssistant();

  const handleZoomIn = () => setZoom((z) => Math.min(z + 10, 100));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 10, 20));
  const handleZoomReset = () => setZoom(45);

  return (
    <div className="flex flex-col h-full w-[450px]">
      {/* Premium tab bar */}
      <div className="flex items-center border-b border-gray-200 bg-white px-1">
        <button
          onClick={() => closeAssistant()}
          className={cn(
            "relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all duration-200",
            !isOpen
              ? "text-accent-700"
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          {!isOpen && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full bg-accent-500" />
          )}
          <Eye className="w-4 h-4" />
          Live Preview
        </button>
        <button
          onClick={() => openAssistant("summary")}
          className={cn(
            "relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all duration-200",
            isOpen
              ? "text-accent-700"
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          {isOpen && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full bg-accent-500" />
          )}
          <Sparkles className="w-4 h-4" />
          AI Assistant
        </button>
      </div>

      {!isOpen && (
        <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden relative">
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <button onClick={handleZoomOut} className="p-2.5 hover:bg-gray-100 text-gray-600 transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleZoomReset} className="px-3 text-xs font-semibold text-gray-600 hover:bg-gray-100 border-x border-gray-200 min-w-[3.5rem] transition-colors" title="Reset Zoom">
              {zoom}%
            </button>
            <button onClick={handleZoomIn} className="p-2.5 hover:bg-gray-100 text-gray-600 transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-auto flex items-start justify-center p-8">
            <div 
              className="origin-top shadow-xl transition-transform duration-200 bg-white rounded-lg"
              style={{ transform: `scale(${zoom / 100})`, width: "800px" }}
            >
              {resumeData && <TemplateRenderer resume={resumeData} />}
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="flex-1 overflow-y-auto bg-white">
          <AiAssistantPanel
            resumeData={resumeData}
            onUpdateSummary={onUpdateSummary}
            onUpdateExperience={onUpdateExperience}
          />
        </div>
      )}
    </div>
  );
}
