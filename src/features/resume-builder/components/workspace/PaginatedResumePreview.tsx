"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MemoTemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import type { ResumeData } from "@/types/resume";

/** A4 page height in px at the preview width (210mm × 297mm → 794 × 1123). */
export const PREVIEW_PAGE_HEIGHT = 1123;

interface PaginatedResumePreviewProps {
  resume: ResumeData;
  /** Zoom percentage (45 = 45%). Ignored when fitToWidth is true. */
  zoom?: number;
  /** Scale the paper to fit the available container width. */
  fitToWidth?: boolean;
  className?: string;
}

/**
 * Windowed live preview that shows one A4 page at a time.
 * - Stays synchronized with edits (re-measures pages as content changes)
 * - Supports zoom via a CSS `zoom` scale on the paper window
 * - Provides page navigation (prev / dots / next) for multi-page resumes
 */
export function PaginatedResumePreview({
  resume,
  zoom = 45,
  fitToWidth = false,
  className,
}: PaginatedResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure available width when fit-to-width is enabled
  useEffect(() => {
    if (!fitToWidth) return;
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitToWidth]);

  // Measure rendered height to compute the page count, and keep the current page valid.
  // Note: the content sits inside a `zoom`-scaled window, and layout-zoom scales
  // descendants' reported metrics, so we measure in viewport px and divide by the
  // effective zoom to recover unzoomed (A4) coordinates.
  const effectiveZoom = fitToWidth
    ? containerWidth > 0
      ? Math.min(containerWidth / 800, 1)
      : zoom / 100
    : zoom / 100;

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => {
      const height = el.getBoundingClientRect().height / effectiveZoom;
      const pages = Math.max(1, Math.ceil(height / PREVIEW_PAGE_HEIGHT));
      setTotalPages(pages);
      setPage((p) => Math.min(p, pages));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [resume, effectiveZoom]);

  const nextPage = useCallback(() => setPage((p) => Math.min(p + 1, totalPages)), [totalPages]);
  const prevPage = useCallback(() => setPage((p) => Math.max(p - 1, 1)), []);

  return (
    <div ref={containerRef} className={cn("flex flex-col items-center w-full", className)}>
      {/* Paper window — shows one page at a time */}
      <div
        className="bg-white shadow-[0_2px_20px_-8px_rgba(0,0,0,0.15)] md:shadow-[0_4px_40px_-12px_rgba(0,0,0,0.2)] shrink-0 overflow-hidden transition-all duration-200 ease-out"
        style={{
          zoom: effectiveZoom,
          width: 800,
          height: PREVIEW_PAGE_HEIGHT,
        }}
      >
        <div
          ref={contentRef}
          className="w-full transition-transform duration-300 ease-out will-change-transform"
          style={{ transform: `translateY(-${(page - 1) * PREVIEW_PAGE_HEIGHT}px)` }}
        >
          <MemoTemplateRenderer resume={resume} />
        </div>
      </div>

      {/* Page navigation */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-center mt-4 gap-3">
          <button
            onClick={prevPage}
            disabled={page <= 1}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all"
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5" role="group" aria-label="Pages">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-200",
                  page === i + 1 ? "bg-accent-500 scale-125" : "bg-gray-300 hover:bg-gray-400"
                )}
                title={`Page ${i + 1}`}
                aria-label={`Go to page ${i + 1}`}
                aria-current={page === i + 1 ? "page" : undefined}
              />
            ))}
          </div>

          <button
            onClick={nextPage}
            disabled={page >= totalPages}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all"
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center mt-4 gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
          <span className="text-[10px] font-medium text-gray-400">Page 1</span>
        </div>
      )}
    </div>
  );
}
