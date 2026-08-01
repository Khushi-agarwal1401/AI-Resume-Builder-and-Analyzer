"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { MemoTemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import { TemplateMiniPreview } from "@/features/resume-builder/components/TemplateMiniPreview";
import type { ResumeData, ResumeTemplate } from "@/types/resume";
import { cn } from "@/lib/utils";
import { TEMPLATE_BADGE, TEMPLATE_NAMES, TEMPLATE_VARIANTS } from "@/features/resume-builder/config/template-constants";
import {
  ArrowLeft,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  FileText,
  BarChart3,
  AlertCircle,
  ChevronDown,
  Palette,
  Check,
  Share2,
  Copy,
  X,
  Eye,
} from "lucide-react";


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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !authenticated) { router.push("/login"); return; }
    if (authenticated) {
      fetch(`/api/resumes/${params.resumeId}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) {
            setResume(json.data);
            setSelectedTemplate(json.data.template);
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
      const templateParam = selectedTemplate ? `&template=${selectedTemplate}` : "";
      const res = await fetch(`/api/export/${resume.id}?format=pdf${templateParam}`);
      if (!res.ok) {
        const err = await res.json();
        if (err.upgradeRequired) {
          toast.error(err.error || "PDF export is a Pro feature.");
          router.push("/pricing");
          return;
        }
        toast.error(err.error || "Export failed");
        return;
      }
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = filenameMatch?.[1] || `resume_${resume.id}.pdf`;
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
      toast.error("Failed to export resume.");
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

  async function handleToggleShare() {
    if (!resume || shareBusy) return;
    setShareBusy(true);
    try {
      const res = await fetch(`/api/resumes/${resume.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !shareEnabled }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to update sharing.");
        return;
      }
      setShareEnabled(json.data.enabled);
      setShareUrl(json.data.url);
    } catch {
      toast.error("Failed to update sharing.");
    } finally {
      setShareBusy(false);
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[12px] font-semibold transition-all"
            >
              {selectedTemplate ? (
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                  TEMPLATE_BADGE[selectedTemplate]?.bg || "bg-gray-100",
                  TEMPLATE_BADGE[selectedTemplate]?.text || "text-gray-600"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", TEMPLATE_BADGE[selectedTemplate]?.dot || "bg-gray-400")} />
                  <Palette className="w-2.5 h-2.5 opacity-70" />
                  {TEMPLATE_NAMES[selectedTemplate]}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
                  <span className="w-16 h-2.5 bg-gray-200 rounded animate-pulse" />
                </span>
              )}
              <ChevronDown size={13} className="text-gray-400" />
            </button>

            {templateMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTemplateMenuOpen(false)} />
                <div className="absolute top-full right-0 mt-1 w-[340px] bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-20" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1">
                    Choose a template
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATE_VARIANTS.map((t) => {
                      const badge = TEMPLATE_BADGE[t];
                      const isActive = selectedTemplate === t;
                      return (
                        <button
                          key={t}
                          onClick={() => {
                            setSelectedTemplate(t);
                            setTemplateMenuOpen(false);
                          }}
                          className={cn(
                            "flex flex-col items-stretch rounded-lg transition-all duration-150 overflow-hidden group",
                            isActive
                              ? "ring-2 ring-accent-500 ring-offset-1 shadow-sm"
                              : "hover:ring-2 hover:ring-gray-200 hover:ring-offset-1 hover:shadow-sm"
                          )}
                        >
                          {/* Mini preview thumbnail */}
                          <div className={cn(
                            "h-[80px] relative overflow-hidden flex items-center justify-center",
                            badge?.bg || "bg-gray-100"
                          )}>
                            <div className="absolute inset-1.5 bg-white rounded shadow-sm overflow-hidden">
                              <TemplateMiniPreview templateId={t} className="h-full" />
                            </div>
                            {isActive && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-500 text-white flex items-center justify-center shadow-sm">
                                <Check size={9} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          {/* Template name */}
                          <div className={cn(
                            "px-2 py-1.5 text-[11px] font-semibold text-center transition-colors",
                            isActive
                              ? "text-accent-700 bg-accent-50"
                              : "text-gray-700 group-hover:text-gray-900 bg-white"
                          )}>
                            {TEMPLATE_NAMES[t]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
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

            {/* Share */}
            <button
              onClick={() => setShareDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Share</span>
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
          className="transition-all duration-300 ease-out print:m-0 print:max-w-none w-full max-w-4xl"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
          }}
        >
          {/* Paper card */}
          <div className="bg-white shadow-[0_2px_20px_-8px_rgba(0,0,0,0.15)] md:shadow-[0_4px_40px_-12px_rgba(0,0,0,0.2)] print:shadow-none min-h-[900px] print:min-h-screen">
            <div className="p-6 md:p-10 print:p-8">
              {previewResume && <MemoTemplateRenderer resume={previewResume} />}
            </div>
          </div>

          {/* Bottom metadata (hidden when printing) */}
          <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-gray-400 print:hidden">
            {selectedTemplate ? (
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                TEMPLATE_BADGE[selectedTemplate]?.bg || "bg-gray-100",
                TEMPLATE_BADGE[selectedTemplate]?.text || "text-gray-600"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", TEMPLATE_BADGE[selectedTemplate]?.dot || "bg-gray-400")} />
                <Palette className="w-2.5 h-2.5 opacity-70" />
                {TEMPLATE_NAMES[selectedTemplate]}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-pulse" />
                <span className="w-14 h-2 bg-gray-200 rounded animate-pulse" />
              </span>
            )}
            <span>•</span>
            <span>{resume.personalInfo.fullName || "Untitled"}</span>
          </div>
        </div>
      </div>

      {/* ── Share Dialog ── */}
      {shareDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 print:hidden">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Share resume</h3>
              <button
                onClick={() => setShareDialogOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">Public link</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {shareEnabled
                      ? "Anyone with the link can view this resume."
                      : "Generate a public link to share your resume."}
                  </p>
                </div>
                <button
                  onClick={handleToggleShare}
                  disabled={shareBusy}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors shrink-0",
                    shareEnabled ? "bg-accent-600" : "bg-gray-300"
                  )}
                  aria-pressed={shareEnabled}
                  aria-label="Toggle public link"
                >
                  {shareBusy ? (
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span
                      className={cn(
                        "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
                        shareEnabled ? "left-[22px]" : "left-0.5"
                      )}
                    />
                  )}
                </button>
              </div>

              {shareUrl && shareEnabled && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-700 bg-gray-50 outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white bg-accent-600 hover:bg-accent-700 transition-all"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Eye size={12} />
                    This link is public — anyone who has it can view.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
