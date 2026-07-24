import React, { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import { AiAssistantPanel } from "@/features/ai-assistant/components/AiAssistantPanel";
import { useAiAssistant } from "@/features/ai-assistant/context/AiAssistantContext";
import type { ResumeData } from "@/types/resume";

interface RightPreviewPanelProps {
  resumeData: ResumeData | null;
  onUpdateSummary: (summary: string) => void;
  onUpdateExperience: (experience: unknown) => void;
}

export function RightPreviewPanel({
  resumeData,
  onUpdateSummary,
  onUpdateExperience,
}: RightPreviewPanelProps) {
  const [zoom, setZoom] = useState(45); // percentage
  const { isOpen, closeAssistant, openAssistant } = useAiAssistant();

  const handleZoomIn = () => setZoom((z) => Math.min(z + 10, 100));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 10, 20));
  const handleZoomReset = () => setZoom(45);

  return (
    <div className="flex flex-col h-full w-[450px]">
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 bg-white px-2">
        <button
          onClick={() => closeAssistant()}
          className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${!isOpen ? "border-primary-600 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-900"}`}
        >
          Live Preview
        </button>
        <button
          onClick={() => openAssistant("summary")}
          className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${isOpen ? "border-primary-600 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-900"}`}
        >
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
            {/* The wrapper that scales the resume */}
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
