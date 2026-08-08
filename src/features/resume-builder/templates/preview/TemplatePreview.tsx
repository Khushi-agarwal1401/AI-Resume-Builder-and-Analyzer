"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";
import { MemoTemplateRenderer } from "../TemplateRenderer";

interface TemplatePreviewProps {
  /** The resume data to render (use `previewResume` from ./previewResume for catalog previews). */
  resume: ResumeData;
  /**
   * Scale of the 210mm × 297mm page relative to natural size.
   * 1 = full size, 0.3 ≈ grid thumbnail, 0.55 ≈ detail pane.
   */
  scale?: number;
  className?: string;
  /** Rounded corners on the paper frame. */
  rounded?: boolean;
}

/**
 * Renders a REAL miniature resume — the same template component the builder
 * uses, scaled down to fit a card. The preview and the live builder preview
 * are guaranteed to stay pixel-identical because they share the renderer.
 *
 * The outer frame is exactly `297mm × scale` tall and clips the page, so a
 * card never shows the next page spilling out.
 */
export function TemplatePreview({
  resume,
  scale = 0.3,
  className,
  rounded = false,
}: TemplatePreviewProps) {
  return (
    <div
      className={cn(
        "relative w-full bg-white overflow-hidden flex justify-center",
        rounded && "rounded-lg",
        className
      )}
      style={{ height: `calc(297mm * ${scale})` }}
      aria-hidden="true"
    >
      <div
        className="origin-top-center"
        style={{
          width: "210mm",
          minHeight: "297mm",
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        <MemoTemplateRenderer resume={resume} />
      </div>
    </div>
  );
}

/** Memoized variant — skips re-renders when the resume reference is unchanged. */
export const MemoPreview = memo(TemplatePreview);
