"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Download, FileText, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import type { ResumeData, ResumeTemplate } from "@/types/resume";

// ══════════════════════════════════════════════════════════════════════════
//  Template metadata — visual identity per template
// ══════════════════════════════════════════════════════════════════════════

interface TemplateMeta {
  id: ResumeTemplate;
  label: string;
  description: string;
  accent: string; // Tailwind border/ring color
  bgLight: string; // Tailwind light background
  layout: "single" | "two-column" | "sidebar";
}

const TEMPLATE_METAS: TemplateMeta[] = [
  {
    id: "modern",
    label: "Modern",
    description: "Clean blue accent, standard layout. Best for most roles.",
    accent: "border-blue-500 ring-blue-400",
    bgLight: "bg-blue-50",
    layout: "single",
  },
  {
    id: "ats-professional",
    label: "ATS Professional",
    description: "Bold uppercase headers, ATS-optimized structure.",
    accent: "border-gray-700 ring-gray-600",
    bgLight: "bg-gray-50",
    layout: "single",
  },
  {
    id: "student",
    label: "Student",
    description: "Education-first layout, perfect for academic profiles.",
    accent: "border-emerald-500 ring-emerald-400",
    bgLight: "bg-emerald-50",
    layout: "single",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Lightweight, generous whitespace, elegant simplicity.",
    accent: "border-gray-400 ring-gray-300",
    bgLight: "bg-gray-50",
    layout: "single",
  },
  {
    id: "executive",
    label: "Executive",
    description: "Serif font, dark indigo accents, formal presentation.",
    accent: "border-indigo-700 ring-indigo-600",
    bgLight: "bg-indigo-50",
    layout: "two-column",
  },
  {
    id: "creative",
    label: "Creative",
    description: "Two-column pink sidebar, bold modern aesthetic.",
    accent: "border-pink-500 ring-pink-400",
    bgLight: "bg-pink-50",
    layout: "sidebar",
  },
];

// ══════════════════════════════════════════════════════════════════════════
//  Props
// ══════════════════════════════════════════════════════════════════════════

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  resumeId: string;
  /** Called when the dialog wants to start an export */
  onExport?: (resumeId: string, template: ResumeTemplate) => Promise<void>;
}

// ══════════════════════════════════════════════════════════════════════════
//  Component
// ══════════════════════════════════════════════════════════════════════════

export function ExportDialog({
  open,
  onClose,
  resumeData,
  resumeId,
  onExport,
}: ExportDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>(
    resumeData.template
  );
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTemplate(resumeData.template);
      setExporting(false);
      setExported(false);
      setError(null);
    }
  }, [open, resumeData.template]);

  const previewData: ResumeData = { ...resumeData, template: selectedTemplate };

  const handleExport = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      if (onExport) {
        await onExport(resumeId, selectedTemplate);
      } else {
        // Default export logic — pass selected template so PDF matches preview
        const res = await fetch(`/api/export/${resumeId}?template=${selectedTemplate}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Export failed");
        }

        const disposition = res.headers.get("Content-Disposition");
        const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/);
        const filename =
          filenameMatch?.[1] || `resume_${resumeId}.pdf`;

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      setExported(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [resumeId, selectedTemplate, onExport, onClose]);

  // Body scroll lock + Escape key
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", keyHandler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", keyHandler);
    };
  }, [open, onClose]);

  if (!open) return null;

  const selectedMeta =
    TEMPLATE_METAS.find((t) => t.id === selectedTemplate) ?? TEMPLATE_METAS[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-[90vw] max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Export Resume
              </h2>
              <p className="text-xs text-gray-500">
                Choose a template and download your resume as PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Template Preview */}
          <div className="flex-1 flex flex-col bg-gray-50 p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Preview —{" "}
                <span className="text-primary-700">{selectedMeta.label}</span>
              </h3>
            </div>

            <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm flex items-start justify-center p-4">
              <div
                className="w-[600px] origin-top scale-[0.7] 2xl:scale-[0.8]"
                key={selectedTemplate}
              >
                <TemplateRenderer resume={previewData} />
              </div>
            </div>
          </div>

          {/* Right: Template Selector + Actions */}
          <div className="w-72 shrink-0 border-l border-gray-200 flex flex-col bg-white">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                Select Template
              </h3>
              <div className="space-y-2">
                {TEMPLATE_METAS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-150 ${
                      selectedTemplate === t.id
                        ? `${t.accent} ${t.bgLight} shadow-sm`
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-sm font-bold ${
                          selectedTemplate === t.id
                            ? "text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {t.label}
                      </span>
                      {selectedTemplate === t.id && (
                        <Check className="w-4 h-4 text-primary-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      {t.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto p-5 border-t border-gray-100 space-y-3">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                variant="secondary"
                className="w-full rounded-xl h-11 text-sm font-bold"
                onClick={onClose}
                disabled={exporting}
              >
                Cancel
              </Button>

              <Button
                variant="accent"
                className={`w-full rounded-xl h-11 text-sm font-bold transition-all ${
                  exported
                    ? "bg-green-500 hover:bg-green-600 border-green-500"
                    : ""
                }`}
                onClick={handleExport}
                disabled={exporting || exported}
              >
                {exporting ? (
                  <>
                    <Spinner /> Exporting...
                  </>
                ) : exported ? (
                  <>
                    <Check className="w-5 h-5" /> Exported!
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" /> Export PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
