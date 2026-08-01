"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useResumeForm } from "@/features/resume-builder/hooks/useResumeForm";
import { AiAssistantPanel } from "@/features/ai-assistant/components/AiAssistantPanel";
import { AiFloatingTrigger } from "@/features/ai-assistant/components/AiFloatingTrigger";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ExportDialog } from "@/features/export/components/ExportDialog";
import { RESUME_TYPES } from "@/features/resume-builder/config/resume-types";
import { cn } from "@/lib/utils";
import type { ResumeTemplate } from "@/types/resume";
import { getSectionStatus } from "@/services/resume/completion";
import { BuilderContext } from "./builder-context";
import { AiAssistantProvider } from "@/features/ai-assistant/context/AiAssistantContext";
import { SectionNavList, SECTION_ICONS } from "@/features/resume-builder/components/workspace/SectionNavList";
import { MobileBuilderOverlays } from "@/features/resume-builder/components/workspace/MobileBuilderOverlays";
import { PaginatedResumePreview } from "@/features/resume-builder/components/workspace/PaginatedResumePreview";
import {
  Circle,
  Maximize2,
  FileText as FileTextIcon,
  Loader2,
  Monitor,
  ChevronDown,
  Check,
  ZoomIn,
  ZoomOut
} from "lucide-react";

const TEMPLATE_NAMES: Record<ResumeTemplate, string> = {
  "ats-professional": "ATS Professional",
  modern: "Modern",
  student: "Student",
  minimal: "Minimal",
  executive: "Executive",
  "executive-sidebar": "Exec Sidebar",
  "modern-card": "Card Modern",
  creative: "Creative",
};

const TEMPLATE_VARIANTS: ResumeTemplate[] = [
  "ats-professional",
  "modern",
  "student",
  "minimal",
  "executive",
  "executive-sidebar",
  "modern-card",
  "creative",
];

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const resumeId = params.resumeId as string;
  const { data, setData, loading, saving } = useResumeForm(resumeId);
  const [debouncedData, setDebouncedData] = useState(data);
  const [exportOpen, setExportOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(45);
  const [fitToWidth, setFitToWidth] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [localTemplate, setLocalTemplate] = useState<ResumeTemplate | null>(null);
  const isDebouncing = data !== debouncedData;

  // Reset local override once debounced data has caught up with the selection
  useEffect(() => {
    setLocalTemplate(null);
  }, [debouncedData?.template]);

  // Instantly override template in preview without waiting for debounce
  const previewResume = useMemo(() => {
    if (!debouncedData) return null;
    if (!localTemplate) return debouncedData;
    return { ...debouncedData, template: localTemplate };
  }, [debouncedData, localTemplate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedData(data);
    }, 500);
    return () => clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    if (!authLoading && !authenticated) router.push("/login");
  }, [authLoading, authenticated, router]);

  const currentTypeConfig = data ? RESUME_TYPES[data.targetLevel] : null;
  const sectionIds = currentTypeConfig ? currentTypeConfig.sections.map((s) => s.id) : [];

  // Extract sectionId from pathname (layout can't access child params)
  // Route is /builder/:resumeId/:sectionId → 3 segments
  const pathParts = pathname.split("/").filter(Boolean);
  const sectionId = pathParts.length >= 3 ? pathParts[pathParts.length - 1] : undefined;
  const currentSectionIndex = sectionId ? sectionIds.indexOf(sectionId) : -1;
  const currentSection = sectionId ? currentTypeConfig?.sections.find((s) => s.id === sectionId) : undefined;
  const CurrentSectionIcon = currentSection ? SECTION_ICONS[currentSection.id] || Circle : Circle;

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  function handleZoomIn() {
    setPreviewZoom((z) => Math.min(z + 10, 100));
  }

  function handleZoomOut() {
    setPreviewZoom((z) => Math.max(z - 10, 20));
  }

  function handleZoomReset() {
    setPreviewZoom(45);
    setFitToWidth(false);
  }

  async function handleSave() {
    if (!data) return;
    if (resumeId === "new") {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          template: data.template,
          targetLevel: data.targetLevel,
          personalInfo: data.personalInfo,
          summary: data.summary,
        }),
      });
      const json = await res.json();
      if (json.success) router.push(`/builder/${json.data.id}`);
    } else {
      await fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
  }

  return (
    <AiAssistantProvider>
      <BuilderContext.Provider
        value={{ data, setData, sectionIds, currentSectionIndex, debouncedData, exportOpen, setExportOpen, resumeId }}
      >
      <div className="min-h-screen flex pt-[72px]">
        {/* Sidebar */}          <aside className="hidden xl:flex w-[260px] border-r border-gray-200 bg-white shrink-0 flex-col sticky top-[72px] h-[calc(100vh-72px)]">
            {/* Navigation */}
            <SectionNavList
              sections={currentTypeConfig?.sections ?? []}
              resumeId={resumeId}
              currentSectionId={sectionId}
              data={data}
            />

            {/* Footer with progress */}
            {currentTypeConfig && (
              <div className="border-t border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                  <span className="font-medium">
                    Section {Math.max(0, currentSectionIndex + 1)} of {sectionIds.length}
                  </span>
                  <span className="font-semibold text-accent-500">
                    {sectionIds.length > 0
                      ? Math.round(((currentSectionIndex + 1) / sectionIds.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-500 to-accent-600 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${sectionIds.length > 0 ? ((currentSectionIndex + 1) / sectionIds.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 xl:px-8 py-3 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <input
                value={data?.title || ""}
                onChange={(e) => setData((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                placeholder="Resume Title"
                aria-label="Resume title"
                className="min-w-0 flex-1 max-w-[160px] sm:max-w-[240px] text-[15px] font-bold text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-400 truncate"
              />
              {currentSection && (
                <>
                  <span className="hidden sm:block h-5 w-px bg-gray-200" />
                  <div className="hidden sm:flex items-center gap-2 text-[13px] font-semibold text-gray-600 min-w-0">
                    <CurrentSectionIcon size={15} className="text-gray-400 shrink-0" />
                    <span className="truncate">{currentSection.label}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors",
                  saving ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                )}
                role="status"
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    saving ? "bg-amber-500 animate-pulse" : "bg-green-500"
                  )}
                />
                {saving ? "Saving..." : "Saved"}
              </span>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={() => data?.id && router.push(`/resume/${data.id}/ats-score`)}>
                ATS
              </Button>
              <Button variant="secondary" size="sm" className="hidden md:inline-flex" onClick={() => data?.id && router.push(`/preview/${data.id}`)}>
                Preview
              </Button>
              <Button size="sm" onClick={() => setExportOpen(true)} disabled={!data} className="text-white">
                Export
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="text-white">
                {saving ? <Spinner /> : "Save"}
              </Button>
            </div>
          </div>

          {/* Mobile section chips (below xl) */}
          <div className="xl:hidden flex items-center gap-1.5 px-3 py-2 border-b border-gray-200 bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden shrink-0">
            {currentTypeConfig?.sections.map((s) => {
              const isActive = s.id === sectionId;
              const SectionIcon = SECTION_ICONS[s.id] || Circle;
              const status = data ? getSectionStatus(s.id, data) : "empty";
              return (
                <Link
                  key={s.id}
                  href={`/builder/${resumeId}/${s.id}`}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap border transition-all",
                    isActive
                      ? "bg-gradient-to-r from-accent-500 to-accent-600 text-white border-transparent shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  )}
                >
                  <SectionIcon size={13} className={isActive ? "text-white" : "text-gray-400"} />
                  {s.label}
                  {status === "done" && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                </Link>
              );
            })}
          </div>

          {/* Section page content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[720px] mx-auto p-4 sm:p-6 xl:p-8 pb-28 sm:pb-28 xl:pb-8">
              {children}
            </div>
          </div>
        </div>

        {/* Preview + AI Panel */}
        <aside className="w-[420px] border-l border-gray-300 bg-white shrink-0 hidden xl:flex xl:flex-col sticky top-[72px] h-[calc(100vh-72px)]">
          {/* Preview section */}
          <div className="flex-1 flex flex-col min-h-[300px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-gray-400" />
                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.08em]">Live Preview</h2>
                {isDebouncing && (
                  <Loader2 className="w-3 h-3 text-accent-400 animate-spin ml-1" />
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Template selector dropdown */}
                {previewResume && (
                  <div className="relative">
                    <button
                      onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 transition-all capitalize"
                    >
                      {TEMPLATE_NAMES[previewResume.template]}
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {templateMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setTemplateMenuOpen(false)} />
                        <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                          {TEMPLATE_VARIANTS.map((t) => (
                            <button
                              key={t}
                              onClick={() => {
                                setLocalTemplate(t);
                                setData((prev) => prev ? { ...prev, template: t } : prev);
                                setTemplateMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-[11px] font-medium transition-colors flex items-center gap-2 ${
                                previewResume.template === t
                                  ? "text-accent-700 bg-accent-50"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <Check
                                size={10}
                                className={previewResume.template === t ? "text-accent-500" : "text-transparent"}
                              />
                              {TEMPLATE_NAMES[t]}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {/* Zoom controls */}
                <div className="flex items-center gap-0.5 mr-1 pr-1.5 border-r border-gray-200">
                  <button
                    onClick={handleZoomOut}
                    disabled={fitToWidth}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title="Zoom out"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleZoomReset}
                    className="px-1 py-0.5 rounded-md text-[10px] font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all tabular-nums min-w-[2.2rem]"
                    title={fitToWidth ? "Exit fit to width" : "Reset zoom"}
                  >
                    {fitToWidth ? "Fit" : `${previewZoom}%`}
                  </button>
                  <button
                    onClick={handleZoomIn}
                    disabled={fitToWidth}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title="Zoom in"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Fit to width toggle */}
                <button
                  onClick={() => {
                    setFitToWidth(!fitToWidth);
                    if (!fitToWidth) setPreviewZoom(45);
                  }}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    fitToWidth
                      ? "bg-accent-50 text-accent-600"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  )}
                  title="Fit to width"
                  aria-label="Fit to width"
                  aria-pressed={fitToWidth}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Preview canvas with grid bg */}
            <div className="flex-1 overflow-y-auto bg-[#F0F0F0] bg-[radial-gradient(#d4d4d4_0.5px,transparent_0.5px)] [background-size:12px_12px] flex items-start justify-center p-6 relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
              {previewResume ? (
                <>

                  {/* Windowed paginated preview — synchronized with edits, zoomable, multi-page */}
                  <PaginatedResumePreview
                    resume={previewResume}
                    zoom={previewZoom}
                    fitToWidth={fitToWidth}
                  />
                </>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <FileTextIcon className="w-6 h-6 text-gray-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-500">No resume data yet</p>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
                      Start filling in your details to see a live preview here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Assistant section - now with the redesigned panel */}
          <div className="border-t border-gray-200 flex-1 overflow-y-auto max-h-[45%] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
            <AiAssistantPanel
              resumeData={data}
              onUpdateSummary={(summary) => setData((prev) => prev ? { ...prev, summary } : prev)}
              onUpdateExperience={(experience) => setData((prev) => prev ? { ...prev, experience } : prev)}
            />
          </div>
        </aside>
      </div>

      {/* Floating AI action button — desktop only (xl+); mobile uses the bottom action bar */}
      <AiFloatingTrigger />

      {/* Mobile bottom action bar + sheets (below xl) */}
      <MobileBuilderOverlays
        resumeId={resumeId}
        sections={currentTypeConfig?.sections ?? []}
        currentSectionId={sectionId}
        data={data}
        previewResume={previewResume}
        resumeData={data}
        isDebouncing={isDebouncing}
        currentTemplate={previewResume?.template ?? "modern"}
        onUpdateSummary={(summary) => setData((prev) => (prev ? { ...prev, summary } : prev))}
        onUpdateExperience={(experience) => setData((prev) => (prev ? { ...prev, experience } : prev))}
        onSelectTemplate={(t) => {
          setLocalTemplate(t);
          setData((prev) => (prev ? { ...prev, template: t } : prev));
        }}
        onOpenAts={() => data?.id && router.push(`/resume/${data.id}/ats-score`)}
      />

      {data && (
        <ExportDialog
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          resumeData={data}
          resumeId={resumeId}
        />
      )}
      </BuilderContext.Provider>
    </AiAssistantProvider>
  );
}
