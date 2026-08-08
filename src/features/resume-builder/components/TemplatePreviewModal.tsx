"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { TemplatePreview } from "./preview/TemplatePreview";
import type { ResumeData } from "@/types/resume";

interface TemplatePreviewModalProps {
  name: string;
  resume: ResumeData;
  onClose: () => void;
}

/** Full-screen modal with an interactive, enlargeable template preview. */
export function TemplatePreviewModal({ name, resume, onClose }: TemplatePreviewModalProps) {
  // Close on Escape and lock background scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} template preview`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl shadow-gray-900/40 flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h2 className="text-h3 text-black leading-tight truncate">{name}</h2>
            <p className="text-micro text-gray-400 mt-0.5">
              Interactive preview with sample content — switch devices, zoom, and browse pages
            </p>
          </div>
          <button
            autoFocus
            onClick={onClose}
            aria-label="Close preview"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 min-h-0 w-full flex justify-center bg-gray-50/50">
          <TemplatePreview resume={resume} scale="fit-contain" className="bg-transparent" />
        </div>
      </div>
    </div>
  );
}
