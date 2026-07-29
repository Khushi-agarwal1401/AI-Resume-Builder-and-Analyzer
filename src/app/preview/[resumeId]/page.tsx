"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import type { ResumeData, ResumeTemplate } from "@/types/resume";
import {
  ArrowLeft,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  FileText,
  BarChart3,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

const TEMPLATE_NAMES: Record<ResumeTemplate, string> = {
  "ats-professional": "ATS Professional",
  modern: "Modern",
  student: "Student",
  minimal: "Minimal",
  executive: "Executive",
  creative: "Creative",
};

const TEMPLATE_VARIANTS: ResumeTemplate[] = [
  "ats-professional",
  "modern",
  "student",
  "minimal",
  "executive",
  "creative",
];

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !authenticated) { router.push("/login"); return; }
    if (authenticated) {
      fetch(`/api/resumes/${params.resumeId}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) {
            setResume(json.data);
            setSelectedTemplate("ats-professional");
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [authLoading, authenticated, params.resumeId, router]);

  // Compute the preview resume with the selected template override
  const previewResume = useMemo(() => {
    if (!resume || !selectedTemplate) return null;
    return { ...resume, template: selectedTemplate };
  }, [resume, selectedTemplate]);

  async function handleExport() {
    if (!resume) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/export/${resume.id}`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Export failed");
        return;
      }
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = filenameMatch?.[1] || `resume_${resume.id}.html`;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export resume.");
    } finally {
      setExporting(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleZoomIn() {
    setZoom((z) => Math.min(z + 0.1, 1.5));
  }

  function handleZoomOut() {
    setZoom((z) => Math.max(z - 0.1, 0.5));
  }

  function handleZoomReset() {
    setZoom(1);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center animate-pulse">
            <FileText size={20} className="text-white" />
          </div>
          <Spinner />
          <p className="text-sm text-gray-400">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Resume not found</h2>
          <p className="text-sm text-gray-500">The resume you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/70 flex flex-col">
      {/* ── Top Toolbar ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 print:hidden">
        <div className="max-w-[1320px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/builder/${resume.id}`)}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-5 w-px bg-gray-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <FileText size={15} className="text-gray-400" />
              <span className="text-[13px] font-medium text-gray-700 truncate max-w-[180px]">
                {resume.title}
              </span>
            </div>
          </div>

          {/* Center - Template Selector */}
          <div className="relative">
            <button
              onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[12px] font-semibold text-gray-700 transition-all"
            >
              <div className="w-4 h-4 rounded bg-accent-100 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-accent-600 rounded-[1px] rotate-45" />
              </div>
              {selectedTemplate ? TEMPLATE_NAMES[selectedTemplate] : "Select Template"}
              <ChevronDown size={13} className="text-gray-400" />
            </button>

            {templateMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTemplateMenuOpen(false)} />
                <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20">
                  {TEMPLATE_VARIANTS.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedTemplate(t);
                        setTemplateMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-[12px] font-medium transition-colors ${
                        selectedTemplate === t
                          ? "text-accent-700 bg-accent-50"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle
                          size={12}
                          className={selectedTemplate === t ? "text-accent-500" : "text-transparent"}
                        />
                        {TEMPLATE_NAMES[t]}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {/* Zoom controls */}
            <div className="hidden md:flex items-center gap-0.5 mr-1 pr-2 border-r border-gray-200">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                title="Zoom out"
              >
                <ZoomOut size={15} />
              </button>
              <button
                onClick={handleZoomReset}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                title="Zoom in"
              >
                <ZoomIn size={15} />
              </button>
            </div>

            {/* ATS Score */}
            <button
              onClick={() => router.push(`/resume/${resume.id}/ats-score`)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              <BarChart3 size={14} />
              <span>ATS</span>
            </button>

            {/* Download */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-accent-600 hover:bg-accent-700 disabled:opacity-50 transition-all"
            >
              {exporting ? <Spinner /> : <Download size={14} />}
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
              title="Print"
            >
              <Printer size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Resume Preview ── */}
      <div
        className="flex-1 flex justify-center py-8 md:py-12 px-4 print:p-0"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)", backgroundSize: "24px 24px" }}
      >
        <div
          className="transition-all duration-300 ease-out print:m-0 print:max-w-none"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            width: "800px",
            minWidth: "800px",
          }}
        >
          {/* Paper card */}
          <div className="bg-white shadow-[0_2px_20px_-8px_rgba(0,0,0,0.15)] md:shadow-[0_4px_40px_-12px_rgba(0,0,0,0.2)] print:shadow-none min-h-[1100px]">
            <div className="p-6 md:p-10 print:p-6">
              {previewResume && <TemplateRenderer resume={previewResume} />}
            </div>
          </div>

          {/* Bottom metadata (hidden when printing) */}
          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-gray-400 print:hidden">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-accent-100 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-accent-600 rounded-[1px] rotate-45" />
              </div>
              {selectedTemplate ? TEMPLATE_NAMES[selectedTemplate] : "Template"}
            </span>
            <span>•</span>
            <span>{resume.personalInfo.fullName || "Untitled"}</span>
          </div>
        </div>
      </div>

      {/* ── Print Styles ── */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          header, footer, nav, [class*="print:hidden"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
