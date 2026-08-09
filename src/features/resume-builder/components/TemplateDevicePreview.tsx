"use client";

import { useState } from "react";
import { Maximize2, Monitor, Smartphone, Tablet, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaginatedResumePreview } from "@/features/resume-builder/components/workspace/PaginatedResumePreview";
import type { ResumeData } from "@/types/resume";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

/** Nominal paper frame width (CSS px) per simulated device. */
const DEVICE_WIDTHS: Record<PreviewDevice, number> = {
  desktop: 800,
  tablet: 620,
  mobile: 400,
};

const DEVICES: { id: PreviewDevice; label: string; icon: typeof Monitor }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

interface TemplateDevicePreviewProps {
  resume: ResumeData;
  className?: string;
  /** Optional "full-screen" action shown in the toolbar. */
  onEnlarge?: () => void;
  accentColors?: string[];
  accent?: string;
  onAccentChange?: (hex: string) => void;
}

/**
 * Interactive live template preview.
 * - Device toggle (Desktop / Tablet / Mobile) changes the paper frame width
 * - Zoom controls scale the frame between 50% and 150%
 * - Multi-page resumes are navigated inside PaginatedResumePreview
 * - Oversized frames scroll inside the preview window
 */
export function TemplateDevicePreview({
  resume,
  className,
  onEnlarge,
  accentColors,
  accent,
  onAccentChange,
}: TemplateDevicePreviewProps) {
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [zoom, setZoom] = useState(100);

  const frameWidth = Math.round((DEVICE_WIDTHS[device] * zoom) / 100);

  return (
    <div className={cn("flex flex-col w-full h-full min-h-0", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0 flex-wrap">
        <div
          className="inline-flex items-center gap-0.5 rounded-xl bg-gray-100 p-0.5"
          role="group"
          aria-label="Preview device"
        >
          {DEVICES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setDevice(id)}
              aria-pressed={device === id}
              aria-label={label}
              title={label}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-small font-medium transition-all duration-150 active:scale-95",
                device === id
                  ? "bg-white text-accent-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {accentColors && onAccentChange && (
          <div className="flex-1 flex justify-center items-center">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Try a theme</span>
              <div className="flex items-center gap-1.5">
                {accentColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onAccentChange(color)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                      accent === color ? "border-gray-900 dark:border-white scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="inline-flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            disabled={zoom <= 50}
            aria-label="Zoom out"
            title="Zoom out"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="w-11 text-center text-micro font-semibold text-gray-500 tabular-nums">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(150, z + 10))}
            disabled={zoom >= 150}
            aria-label="Zoom in"
            title="Zoom in"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {onEnlarge && (
            <button
              onClick={onEnlarge}
              aria-label="Open full-screen preview"
              title="Open full-screen preview"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-accent-500 transition-all ml-1"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable preview frame */}
      <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-gray-200 bg-gray-50">
        {/* Fixed-width wrapper doubles as the scroll container; the paper is
            scaled so it exactly fills frameWidth (zoom% = frameWidth/800×100),
            which keeps Zoom In/Out meaningful on every device. */}
        <div className="mx-auto py-5 flex flex-col items-center" style={{ width: frameWidth }}>
          <PaginatedResumePreview resume={resume} zoom={frameWidth / 8} continuous={true} />
        </div>
      </div>
    </div>
  );
}
