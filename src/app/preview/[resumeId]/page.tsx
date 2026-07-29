"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import type { ResumeData, ResumeTemplate } from "@/types/resume";
import { cn } from "@/lib/utils";
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
  Monitor,
  Smartphone,
  Maximize2,
  Minimize2,
  Grid3X3,
  Sun,
  Moon,
  Layout,
  Keyboard,
  RotateCcw,
  Eye,
  EyeOff,
  CircleDot,
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

const TEMPLATE_DESCRIPTIONS: Record<ResumeTemplate, string> = {
  "ats-professional": "Clean & ATS-friendly",
  modern: "Contemporary & sleek",
  student: "Fresh & academic",
  minimal: "Simple & elegant",
  executive: "Commanding & professional",
  creative: "Bold & expressive",
};

const TEMPLATE_COLORS: Record<ResumeTemplate, string> = {
  "ats-professional": "from-blue-500 to-indigo-600",
  modern: "from-purple-500 to-violet-600",
  student: "from-emerald-500 to-teal-600",
  minimal: "from-slate-500 to-gray-600",
  executive: "from-amber-500 to-orange-600",
  creative: "from-rose-500 to-pink-600",
};

type ViewMode = "desktop" | "mobile";
type BgPattern = "dots" | "grid" | "none";
type ThemeMode = "light" | "dark";

function countWords(data: ResumeData): number {
  const text = [
    data.summary || "",
    ...(data.experience || []).flatMap((e) => [
      e.role,
      e.company,
      ...e.responsibilities,
      ...e.achievements,
    ]),
    ...(data.education || []).map((e) => `${e.degree} ${e.institution}`),
    ...(data.projects || []).map((p) => `${p.name} ${p.description}`),
    ...(data.skills?.technical || []),
    ...(data.skills?.soft || []),
    ...(data.skills?.tools || []),
    ...(data.skills?.frameworks || []),
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

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
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [bgPattern, setBgPattern] = useState<BgPattern>("dots");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/login");
      return;
    }
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

  const fullName = resume?.personalInfo?.fullName || "";
  const wordCount = useMemo(() => (resume ? countWords(resume) : 0), [resume]);

  // Handles template switching with a smooth CSS transition
  const handleTemplateChange = useCallback((t: ResumeTemplate) => {
    setIsTransitioning(true);
    setTemplateMenuOpen(false);
    // Use requestAnimationFrame for smoother transitions
    requestAnimationFrame(() => {
      setSelectedTemplate(t);
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "=":
          case "+":
            e.preventDefault();
            setZoom((z) => Math.min(z + 0.1, 1.5));
            break;
          case "-":
            e.preventDefault();
            setZoom((z) => Math.max(z - 0.1, 0.5));
            break;
          case "0":
            e.preventDefault();
            setZoom(1);
            break;
        }
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowRight": {
          e.preventDefault();
          if (!selectedTemplate) return;
          const currentIdx = TEMPLATE_VARIANTS.indexOf(selectedTemplate);
          const nextIdx =
            e.key === "ArrowRight"
              ? (currentIdx + 1) % TEMPLATE_VARIANTS.length
              : (currentIdx - 1 + TEMPLATE_VARIANTS.length) % TEMPLATE_VARIANTS.length;
          handleTemplateChange(TEMPLATE_VARIANTS[nextIdx]);
          break;
        }
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "h":
          e.preventDefault();
          setShowToolbar((prev) => !prev);
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTemplate, handleTemplateChange]);

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

  function handleZoomChange(value: number) {
    setZoom(Math.round(value * 10) / 10);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    function handleFSChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  const previewWidth = viewMode === "mobile" ? 440 : 800;
  const previewScale = viewMode === "mobile" ? Math.min(zoom, 1.2) : zoom;
  const previewMinHeight = viewMode === "mobile" ? "min-h-[780px]" : "min-h-[1056px]";

  const bgStyle =
    bgPattern === "dots"
      ? {
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }
      : bgPattern === "grid"
      ? {
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }
      : {};

  const selectedColor = selectedTemplate ? TEMPLATE_COLORS[selectedTemplate] : "from-accent-500 to-accent-600";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center animate-pulse shadow-lg">
              <FileText size={24} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-400 border-2 border-white" />
          </div>
          <Spinner />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Loading preview...</p>
            <p className="text-xs text-gray-400 mt-0.5">Preparing your resume for review</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <AlertCircle size={36} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Resume not found</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              The resume you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
          </div>
          <Button variant="secondary" onClick={() => router.push("/dashboard")} className="rounded-xl">
            <ArrowLeft size={16} className="mr-1.5" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col transition-colors duration-300",
        themeMode === "dark" ? "bg-gray-950" : "bg-gray-50/70"
      )}
    >
      {/* ── Top Toolbar ── */}
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-300 print:hidden",
          showToolbar
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none",
          themeMode === "dark"
            ? "bg-gray-900/80 border-gray-800"
            : "bg-white/80 border-gray-200",
          "backdrop-blur-xl border-b shadow-lg shadow-black/[0.02]"
        )}
      >
        <div className="max-w-[1400px] mx-auto px-3 md:px-5 h-14 flex items-center justify-between gap-2">
          {/* Left - Back & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => router.push(`/builder/${resume.id}`)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all",
                themeMode === "dark"
                  ? "text-gray-400 hover:text-white hover:bg-gray-800"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
              aria-label="Back to editor"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className={cn("h-5 w-px", themeMode === "dark" ? "bg-gray-800" : "bg-gray-200")} />

            {/* Resume title */}
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <FileText size={14} className={cn("shrink-0", themeMode === "dark" ? "text-gray-500" : "text-gray-400")} />
              <span className={cn(
                "text-[13px] font-medium truncate max-w-[140px] md:max-w-[200px]",
                themeMode === "dark" ? "text-gray-300" : "text-gray-700"
              )}>
                {resume.title}
              </span>
            </div>
          </div>

          {/* Center - Template Selector */}
          <div className="relative">
            <button
              onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all",
                themeMode === "dark"
                  ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              )}
              aria-label="Select template"
              aria-expanded={templateMenuOpen}
            >
              <div className={cn(
                "w-4 h-4 rounded flex items-center justify-center bg-gradient-to-br",
                selectedColor
              )}>
                <div className="w-1.5 h-1.5 bg-white rounded-[1px] rotate-45" />
              </div>
              <span className="hidden sm:inline">
                {selectedTemplate ? TEMPLATE_NAMES[selectedTemplate] : "Select Template"}
              </span>
              <span className="sm:hidden">Template</span>
              <ChevronDown size={12} className={cn(themeMode === "dark" ? "text-gray-500" : "text-gray-400")} />
            </button>

            {templateMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTemplateMenuOpen(false)} aria-hidden="true" />
                <div
                  className={cn(
                    "absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[280px] sm:w-[320px] rounded-xl shadow-xl border py-1.5 z-20",
                    themeMode === "dark"
                      ? "bg-gray-900 border-gray-700"
                      : "bg-white border-gray-200"
                  )}
                  role="listbox"
                  aria-label="Template options"
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className={cn(
                      "text-[11px] font-semibold uppercase tracking-wider",
                      themeMode === "dark" ? "text-gray-400" : "text-gray-500"
                    )}>
                      Choose Template
                    </p>
                  </div>
                  {TEMPLATE_VARIANTS.map((t) => {
                    const isSelected = selectedTemplate === t;
                    return (
                      <button
                        key={t}
                        onClick={() => handleTemplateChange(t)}
                        role="option"
                        aria-selected={isSelected}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-[12px] font-medium transition-all hover:bg-gray-50",
                          isSelected && (themeMode === "dark" ? "bg-gray-800" : "bg-accent-50/50")
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0",
                          TEMPLATE_COLORS[t],
                          isSelected ? "shadow-md" : ""
                        )}>
                          <Layout size={14} className="text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={cn(
                            "font-semibold",
                            isSelected
                              ? themeMode === "dark" ? "text-white" : "text-gray-900"
                              : themeMode === "dark" ? "text-gray-300" : "text-gray-700"
                          )}>
                            {TEMPLATE_NAMES[t]}
                          </p>
                          <p className={cn(
                            "text-[10px]",
                            themeMode === "dark" ? "text-gray-500" : "text-gray-400"
                          )}>
                            {TEMPLATE_DESCRIPTIONS[t]}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle size={14} className={cn(
                            "shrink-0",
                            themeMode === "dark" ? "text-accent-400" : "text-accent-500"
                          )} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right - Controls */}
          <div className="flex items-center gap-1">
            {/* Keyboard shortcut hint */}
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className={cn(
                "hidden md:flex items-center justify-center w-7 h-7 rounded-lg transition-all",
                themeMode === "dark"
                  ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              )}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts"
            >
              <Keyboard size={13} />
            </button>

            {/* Background pattern toggle */}
            <div className={cn(
              "hidden md:flex items-center rounded-lg border overflow-hidden",
              themeMode === "dark" ? "border-gray-700" : "border-gray-200"
            )}>
              {(["dots", "grid", "none"] as BgPattern[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setBgPattern(p)}
                  className={cn(
                    "p-1.5 transition-all",
                    bgPattern === p
                      ? themeMode === "dark" ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"
                      : themeMode === "dark" ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                  )}
                  aria-label={`${p} background pattern`}
                  title={p === "dots" ? "Dot pattern" : p === "grid" ? "Grid pattern" : "No pattern"}
                >
                  {p === "dots" ? <CircleDot size={14} /> : p === "grid" ? <Grid3X3 size={14} /> : <EyeOff size={14} />}
                </button>
              ))}
            </div>

            <div className={cn("h-5 w-px mx-0.5", themeMode === "dark" ? "bg-gray-800" : "bg-gray-200")} />

            {/* View mode */}
            <div className={cn(
              "hidden md:flex items-center rounded-lg border overflow-hidden",
              themeMode === "dark" ? "border-gray-700" : "border-gray-200"
            )}>
              {(["desktop", "mobile"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={cn(
                    "p-1.5 transition-all",
                    viewMode === v
                      ? themeMode === "dark" ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"
                      : themeMode === "dark" ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                  )}
                  aria-label={`${v} view`}
                  title={v === "desktop" ? "Desktop view" : "Mobile view"}
                >
                  {v === "desktop" ? <Monitor size={14} /> : <Smartphone size={14} />}
                </button>
              ))}
            </div>

            {/* Zoom controls */}
            <div className={cn(
              "hidden md:flex items-center gap-0.5 px-2 rounded-lg border",
              themeMode === "dark" ? "border-gray-700" : "border-gray-200"
            )}>
              <button
                onClick={() => handleZoomChange(Math.max(zoom - 0.1, 0.5))}
                className={cn(
                  "p-1 rounded transition-all",
                  themeMode === "dark" ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                )}
                aria-label="Zoom out"
                title="Zoom out (Ctrl+-)"
              >
                <ZoomOut size={14} />
              </button>
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={Math.round(zoom * 100)}
                  onChange={(e) => handleZoomChange(parseInt(e.target.value) / 100)}
                  className="w-16 h-1 appearance-none cursor-pointer rounded-full"
                  style={{
                    background: `linear-gradient(to right, #6366f1 ${zoom * 100}%, ${
                      themeMode === "dark" ? "#374151" : "#e5e7eb"
                    } ${zoom * 100}%)`,
                  }}
                  aria-label="Zoom level"
                  aria-valuemin={50}
                  aria-valuemax={150}
                  aria-valuenow={Math.round(zoom * 100)}
                  title="Zoom level"
                />
                <style jsx>{`
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #6366f1;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                    transition: transform 0.15s;
                  }
                  input[type="range"]::-webkit-slider-thumb:hover {
                    transform: scale(1.15);
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #6366f1;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                  }
                `}</style>
              </div>
              <span className={cn(
                "text-[11px] font-semibold w-8 text-center",
                themeMode === "dark" ? "text-gray-300" : "text-gray-600"
              )}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoomChange(Math.min(zoom + 0.1, 1.5))}
                className={cn(
                  "p-1 rounded transition-all",
                  themeMode === "dark" ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                )}
                aria-label="Zoom in"
                title="Zoom in (Ctrl+=)"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => handleZoomChange(1)}
                className={cn(
                  "p-1 rounded transition-all text-[10px] font-bold",
                  themeMode === "dark" ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                )}
                aria-label="Reset zoom"
                title="Reset zoom (Ctrl+0)"
              >
                <RotateCcw size={11} />
              </button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
              className={cn(
                "hidden md:flex items-center justify-center w-7 h-7 rounded-lg transition-all",
                themeMode === "dark"
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              )}
              aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
              title="Toggle dark mode"
            >
              {themeMode === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className={cn(
                "hidden md:flex items-center justify-center w-7 h-7 rounded-lg transition-all",
                themeMode === "dark"
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              )}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            <div className={cn("h-5 w-px mx-0.5", themeMode === "dark" ? "bg-gray-800" : "bg-gray-200")} />

            {/* ATS */}
            <button
              onClick={() => router.push(`/resume/${resume.id}/ats-score`)}
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all",
                themeMode === "dark"
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <BarChart3 size={14} />
              <span>ATS</span>
            </button>

            {/* Download */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all shadow-sm",
                "bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50",
                "hover:shadow-md active:scale-[0.97]"
              )}
              aria-label="Download resume"
            >
              {exporting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Exporting...</span>
                </span>
              ) : (
                <>
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </>
              )}
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-lg transition-all",
                themeMode === "dark"
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              )}
              aria-label="Print resume"
              title="Print"
            >
              <Printer size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Keyboard Shortcuts Info Panel ── */}
      {showShortcuts && (
        <div className={cn(
          "fixed top-16 right-4 z-30 rounded-xl border shadow-xl p-4 w-64 backdrop-blur-xl",
          themeMode === "dark" ? "bg-gray-900/95 border-gray-700" : "bg-white/95 border-gray-200"
        )}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", themeMode === "dark" ? "text-gray-400" : "text-gray-500")}>
              Shortcuts
            </h3>
            <button
              onClick={() => setShowShortcuts(false)}
              className={cn("text-gray-400 hover:text-gray-600", themeMode === "dark" ? "hover:text-gray-300" : "")}
              aria-label="Close shortcuts"
            >
              <span className="text-lg leading-none">&times;</span>
            </button>
          </div>
          <div className="space-y-2">
            {[
              { keys: "Ctrl + + / -", desc: "Zoom in / out" },
              { keys: "Ctrl + 0", desc: "Reset zoom" },
              { keys: "\u2190 / \u2192", desc: "Switch template" },
              { keys: "F", desc: "Toggle fullscreen" },
              { keys: "H", desc: "Toggle toolbar" },
            ].map((shortcut) => (
              <div key={shortcut.keys} className="flex items-center justify-between">
                <kbd className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold",
                  themeMode === "dark"
                    ? "bg-gray-800 text-gray-300 border border-gray-700"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                )}>
                  {shortcut.keys}
                </kbd>
                <span className={cn("text-[11px]", themeMode === "dark" ? "text-gray-400" : "text-gray-500")}>
                  {shortcut.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Toolbar toggle button (when hidden) ── */}
      {!showToolbar && (
        <button
          onClick={() => setShowToolbar(true)}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg text-[11px] font-semibold text-gray-500 hover:text-gray-800 hover:bg-white transition-all"
          aria-label="Show toolbar"
        >
          <span className="flex items-center gap-1.5">
            <Eye size={14} />
            Show toolbar (H)
          </span>
        </button>
      )}

      {/* ── Resume Preview ── */}
      <div
        className={cn(
          "flex-1 flex justify-center py-6 md:py-10 px-4 print:p-0 transition-colors duration-300",
          themeMode === "dark" ? "bg-gray-950" : ""
        )}
        style={themeMode === "dark" ? {} : bgStyle}
      >
        <div
          ref={previewRef}
          className={cn(
            "transition-all duration-300 ease-out print:m-0 print:max-w-none",
            isTransitioning && "opacity-0 scale-[0.98]"
          )}
          style={{
            transform: `scale(${previewScale})`,
            transformOrigin: "top center",
            width: `${previewWidth}px`,
            minWidth: `${previewWidth}px`,
          }}
        >
          {/* Paper card container */}
          <div
            className={cn(
              "relative bg-white",
              "md:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.04)]",
              "print:shadow-none",
              "transition-shadow duration-300",
              "hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18),0_2px_6px_rgba(0,0,0,0.06)]",
              previewMinHeight
            )}
            style={{
              borderRadius: viewMode === "mobile" ? "16px" : "1px",
              overflow: viewMode === "mobile" ? "hidden" : "visible",
              boxShadow: viewMode === "mobile"
                ? "0 4px 24px -8px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.06)"
                : undefined,
            }}
          >
            {/* Subtle top accent line */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r opacity-80",
              selectedColor
            )} />

            {/* Paper texture overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.012]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />

            <div className="p-6 md:p-8 lg:p-10 print:p-6">
              {previewResume && <TemplateRenderer resume={previewResume} />}
            </div>

            {/* Page curl shadow */}
            <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none overflow-hidden opacity-30 hidden md:block">
              <div
                className="absolute -bottom-2 -right-2 w-10 h-10 rotate-45"
                style={{
                  background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%)",
                  borderRadius: "0 0 0 4px",
                }}
              />
            </div>
          </div>

          {/* Bottom metadata bar */}
          <div className={cn(
            "mt-4 flex items-center justify-center gap-4 text-[11px] print:hidden flex-wrap",
            themeMode === "dark" ? "text-gray-500" : "text-gray-400"
          )}>
            {/* Template badge */}
            <span className="flex items-center gap-1.5">
              <div className={cn(
                "w-3 h-3 rounded flex items-center justify-center bg-gradient-to-br",
                selectedColor
              )}>
                <div className="w-1 h-1 bg-white rounded-[0.5px] rotate-45" />
              </div>
              <span className={cn(
                "font-medium",
                themeMode === "dark" ? "text-gray-400" : "text-gray-500"
              )}>
                {selectedTemplate ? TEMPLATE_NAMES[selectedTemplate] : "Template"}
              </span>
            </span>

            <span className={themeMode === "dark" ? "text-gray-700" : "text-gray-300"} aria-hidden="true">&bull;</span>

            {/* Resume author */}
            <span className={themeMode === "dark" ? "text-gray-400" : "text-gray-500"}>
              {fullName || "Untitled"}
            </span>

            {fullName && (
              <>
                <span className={themeMode === "dark" ? "text-gray-700" : "text-gray-300"} aria-hidden="true">&bull;</span>
                <span>{wordCount} words</span>
              </>
            )}

            {/* View mode indicator */}
            {viewMode === "mobile" && (
              <>
                <span className={themeMode === "dark" ? "text-gray-700" : "text-gray-300"} aria-hidden="true">&bull;</span>
                <span className="flex items-center gap-1">
                  <Smartphone size={10} /> Mobile preview
                </span>
              </>
            )}

            {/* Dark mode indicator */}
            {themeMode === "dark" && (
              <>
                <span className="text-gray-700" aria-hidden="true">&bull;</span>
                <span className="flex items-center gap-1">
                  <Moon size={10} /> Dark
                </span>
              </>
            )}
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
