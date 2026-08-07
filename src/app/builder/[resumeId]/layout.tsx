"use client";

import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useResumeForm } from "@/features/resume-builder/hooks/useResumeForm";
import { AiFloatingTrigger } from "@/features/ai-assistant/components/AiFloatingTrigger";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ExportDialog } from "@/features/export/components/ExportDialog";
import { RESUME_TYPES } from "@/features/resume-builder/config/resume-types";
import { cn, generateId } from "@/lib/utils";
import { TEMPLATE_NAMES as templateConstantsNames, TEMPLATE_VARIANTS as templateConstantsVariants } from "@/features/resume-builder/config/template-constants";
import type { ResumeTemplate, ResumeFont } from "@/types/resume";
import { calculateAtsScore } from "@/services/resume-analyzer/ats-scorer";
import { BuilderContext } from "./builder-context";
import { AiAssistantProvider } from "@/features/ai-assistant/context/AiAssistantContext";
const AiAssistantPanel = lazy(() =>
  import("@/features/ai-assistant/components/AiAssistantPanel").then((m) => ({ default: m.AiAssistantPanel }))
);
import {
  User,
  FileText,
  GraduationCap,
  Wrench,
  Briefcase,
  FolderKanban,
  Award,
  Trophy,
  Code2,
  Crown,
  BookOpen,
  Dumbbell,
  Globe,
  Heart,
  HandHelping,
  Circle,
  Maximize2,
  FileText as FileTextIcon,
  Loader2,
  Monitor,
  ChevronDown,
  Check,
  Plus,
  Layers,
  Palette
} from "lucide-react";

const SECTION_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  personalInfo: User,
  summary: FileText,
  education: GraduationCap,
  skills: Wrench,
  experience: Briefcase,
  projects: FolderKanban,
  certifications: Award,
  achievements: Trophy,
  codingProfiles: Code2,
  leadership: Crown,
  openSource: Code2,
  coursework: BookOpen,
  activities: Dumbbell,
  languages: Globe,
  interests: Heart,
  publications: BookOpen,
  volunteer: HandHelping,
};

// All 83 templates (8 built-in + 75 curated imported) — shared constants so the
// builder's live template switcher covers the entire catalog.
const TEMPLATE_NAMES: Record<string, string> = templateConstantsNames;
const TEMPLATE_VARIANTS: string[] = templateConstantsVariants;

// A-03: accent swatches + font choices offered by the builder theme picker.
const ACCENT_COLORS = [
  { value: "#2563eb", label: "Blue" },
  { value: "#0d9488", label: "Teal" },
  { value: "#059669", label: "Green" },
  { value: "#d97706", label: "Amber" },
  { value: "#db2777", label: "Pink" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#dc2626", label: "Red" },
  { value: "#111827", label: "Slate" },
];

const FONT_OPTIONS = [
  { value: "sans" as ResumeFont, label: "Sans" },
  { value: "serif" as ResumeFont, label: "Serif" },
  { value: "mono" as ResumeFont, label: "Mono" },
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
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [localTheme, setLocalTheme] = useState<{ accentColor?: string; fontFamily?: ResumeFont } | null>(null);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [versionSaved, setVersionSaved] = useState(false);
  const isDebouncing = data !== debouncedData;

  // Reset local override once debounced data has caught up with the selection
  useEffect(() => {
    setLocalTemplate(null);
  }, [debouncedData?.template]);

  useEffect(() => {
    setLocalTheme(null);
  }, [debouncedData?.accentColor, debouncedData?.fontFamily]);

  // Instantly override template in preview without waiting for debounce
  const previewResume = useMemo(() => {
    if (!debouncedData) return null;
    let next = debouncedData;
    if (localTemplate) next = { ...next, template: localTemplate };
    if (localTheme) next = { ...next, ...localTheme };
    return next;
  }, [debouncedData, localTemplate, localTheme]);

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
  // Custom sections (K-04) participate in the sidebar progress footer too.
  const allSectionIds = [
    ...sectionIds,
    ...(data ? Object.keys(data.customSections ?? {}) : []),
  ];

  // Extract sectionId from pathname (layout can't access child params)
  const pathParts = pathname.split("/").filter(Boolean);
  const sectionId = pathParts.length >= 4 ? pathParts[pathParts.length - 1] : undefined;
  const currentSectionIndex = sectionId ? allSectionIds.indexOf(sectionId) : -1;

  const atsScore = useMemo(() => {
    if (!debouncedData) return null;
    const text = [
      debouncedData.summary || "",
      ...(debouncedData.experience || []).flatMap((e) => [
        `${e.role} at ${e.company}`,
        ...e.responsibilities,
      ]),
      ...(debouncedData.education || []).map((e) =>
        `${e.degree} at ${e.institution}`
      ),
      ...(debouncedData.skills ? [
        ...(debouncedData.skills.technical || []),
        ...(debouncedData.skills.soft || []),
        ...(debouncedData.skills.tools || []),
        ...(debouncedData.skills.frameworks || [])
      ] : []),
      ...(debouncedData.projects || []).map((p) =>
        `${p.name}: ${p.description}`
      ),
    ].join("\n");

    if (!text.trim()) return null;

    try {
      return calculateAtsScore({ text, category: "experienced" }).overall;
    } catch {
      return null;
    }
  }, [debouncedData]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  function handleAddSection() {
    const name = newSectionName.trim();
    if (!name || !data) return;
    const id = `custom-${generateId()}`;
    setData((prev) =>
      prev
        ? { ...prev, customSections: { ...(prev.customSections ?? {}), [id]: { title: name, items: [] } } }
        : prev
    );
    setAddSectionOpen(false);
    setNewSectionName("");
    router.push(`/builder/${resumeId}/${id}`);
  }

  async function saveVersion() {
    if (!data) return;
    try {
      const res = await fetch("/api/resumes/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          label: data.title || "Untitled Resume",
          snapshot: data,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setVersionSaved(true);
        setTimeout(() => setVersionSaved(false), 2000);
      }
    } catch {
      // ignore
    }
  }

  return (
    <AiAssistantProvider>
      <BuilderContext.Provider
        value={{ data, setData, sectionIds, currentSectionIndex, debouncedData, exportOpen, setExportOpen, resumeId }}
      >
      <div className="min-h-screen flex pt-[72px]">
        {/* Sidebar */}          <aside className="w-[260px] border-r border-gray-200 bg-white shrink-0 flex flex-col sticky top-[72px] h-[calc(100vh-72px)]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">
                Resume Sections
              </h2>
              <p className="text-[11px] text-gray-300 mt-0.5">
                {currentTypeConfig?.name || "Loading..."}
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
              {currentTypeConfig?.sections.map((s) => {
                const isActive = s.id === sectionId;
                const SectionIcon = SECTION_ICONS[s.id] || Circle;
                return (
                  <Link
                    key={s.id}
                    href={`/builder/${resumeId}/${s.id}`}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-accent-50 to-accent-50/50 text-accent-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80"
                    )}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-accent-500 to-accent-600 shadow-sm" />
                    )}

                    {/* Icon */}
                    <SectionIcon
                      size={16}
                      className={cn(
                        "shrink-0 transition-all duration-200",
                        isActive
                          ? "text-accent-600"
                          : "text-gray-400 group-hover:text-gray-600"
                      )}
                    />

                    {/* Label */}
                    <span className="truncate">{s.label}</span>

                    {/* Required badge or indicator */}
                    {!s.isOptional ? (
                      <span className="ml-auto text-[9px] font-medium text-red-300 group-hover:text-red-400 transition-colors">*</span>
                    ) : (
                      <span className="ml-auto text-[9px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">opt</span>
                    )}
                  </Link>
                );
              })}

              {/* User-created custom sections (K-04) */}
              {data && Object.keys(data.customSections ?? {}).length > 0 && (
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <p className="px-3 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Custom</p>
                  {Object.entries(data.customSections ?? {}).map(([id, cs]) => {
                    const isActive = id === sectionId;
                    return (
                      <Link
                        key={id}
                        href={`/builder/${resumeId}/${id}`}
                        className={cn(
                          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-accent-50 to-accent-50/50 text-accent-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-accent-500 to-accent-600 shadow-sm" />
                        )}
                        <Layers
                          size={16}
                          className={cn(
                            "shrink-0 transition-all duration-200",
                            isActive ? "text-accent-600" : "text-gray-400 group-hover:text-gray-600"
                          )}
                        />
                        <span className="truncate">{cs.title?.trim() || "Custom Section"}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </nav>

            {/* Add custom section */}
            <div className="border-t border-gray-100 px-3 py-2.5">
              <button
                onClick={() => setAddSectionOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl text-[12px] font-semibold text-accent-600 bg-accent-50 hover:bg-accent-100 transition-colors active:scale-[0.98]"
              >
                <Plus size={14} />
                Add Section
              </button>
            </div>

            {/* Footer with progress */}
            {currentTypeConfig && (
              <div className="border-t border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                  <span className="font-medium">
                    Section {Math.max(0, currentSectionIndex + 1)} of {allSectionIds.length}
                  </span>
                  <span className="font-semibold text-accent-500">
                    {allSectionIds.length > 0
                      ? Math.round(((currentSectionIndex + 1) / allSectionIds.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-500 to-accent-600 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${allSectionIds.length > 0 ? ((currentSectionIndex + 1) / allSectionIds.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-8 py-3 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                ← Dashboard
              </Button>
              {currentTypeConfig && sectionId && (
                <span className="text-[13px] text-gray-400">
                  {currentTypeConfig.sections.find((s) => s.id === sectionId)?.label || ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors duration-300",
                  saving
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Saved
                  </>
                )}
              </span>
              <Button variant="ghost" size="sm" onClick={() => data?.id && router.push(`/resume/${data.id}/ats-score`)}>
                ATS
              </Button>
              <Button variant="secondary" size="sm" onClick={() => data?.id && router.push(`/preview/${data.id}`)}>
                Preview
              </Button>
              <Button variant="ghost" size="sm" onClick={saveVersion} className={versionSaved ? "text-emerald-600" : ""}>
                {versionSaved ? "✓ Saved" : "Save Version"}
              </Button>
              <Button size="sm" onClick={() => setExportOpen(true)} disabled={!data} className="text-white">
                Export
              </Button>
            </div>
          </div>

          {/* Section page content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[720px] mx-auto p-8">
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
                {atsScore !== null && !isDebouncing && (
                  <div className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    atsScore >= 70 ? "bg-green-100 text-green-700" :
                    atsScore >= 40 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    ATS: {atsScore}
                  </div>
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
                {/* A-03: Accent color + font theme picker */}
                {previewResume && (
                  <div className="relative">
                    <button
                      onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 transition-all"
                      title="Theme (accent + font)"
                    >
                      <Palette className="w-3 h-3" />
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {themeMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setThemeMenuOpen(false)} />
                        <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-3 px-3 z-20">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                            Accent Color
                          </p>
                          <div className="grid grid-cols-8 gap-1.5 mb-3">
                            {ACCENT_COLORS.map((c) => (
                              <button
                                key={c.value}
                                title={c.label}
                                onClick={() => {
                                  setLocalTheme((prev) => ({ ...(prev ?? {}), accentColor: c.value }));
                                  setData((prev) => prev ? { ...prev, accentColor: c.value } : prev);
                                }}
                                style={{ backgroundColor: c.value }}
                                className={cn(
                                  "w-5 h-5 rounded-full border transition-transform hover:scale-110",
                                  (previewResume.accentColor || "") === c.value
                                    ? "ring-2 ring-offset-1 ring-gray-400 border-white"
                                    : "border-white/40"
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                            Font Family
                          </p>
                          <div className="flex gap-1">
                            {FONT_OPTIONS.map((f) => (
                              <button
                                key={f.value}
                                onClick={() => {
                                  setLocalTheme((prev) => ({ ...(prev ?? {}), fontFamily: f.value }));
                                  setData((prev) => prev ? { ...prev, fontFamily: f.value } : prev);
                                }}
                                className={cn(
                                  "flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                                  previewResume.fontFamily === f.value
                                    ? "bg-accent-50 text-accent-700"
                                    : "text-gray-600 hover:bg-gray-50"
                                )}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
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
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Preview canvas with grid bg */}
            <div className="flex-1 overflow-y-auto bg-[#F0F0F0] bg-[radial-gradient(#d4d4d4_0.5px,transparent_0.5px)] [background-size:12px_12px] flex items-start justify-center p-6 relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
              {previewResume ? (
                <>

                  {/* Paper mockup — matches full-page preview format */}
                  <div
                    className="shrink-0 transition-all duration-200 ease-out flex flex-col items-center"
                    style={{
                      zoom: fitToWidth ? 1 : previewZoom / 100,
                      width: fitToWidth ? "100%" : "800px",
                      maxWidth: fitToWidth ? "100%" : "800px",
                    }}
                  >
                    <div className="bg-white shadow-[0_2px_20px_-8px_rgba(0,0,0,0.15)] md:shadow-[0_4px_40px_-12px_rgba(0,0,0,0.2)] min-h-[1100px]">
                      <div className="p-6 md:p-8">
                        <TemplateRenderer resume={previewResume} />
                      </div>
                    </div>
                    {/* Page indicator */}
                    <div className="flex items-center justify-center mt-4 gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                      <span className="text-[10px] font-medium text-gray-400">Page 1</span>
                    </div>
                  </div>
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

          {/* AI Assistant section - now with the redesigned panel (A-18 lazy) */}
          <div className="border-t border-gray-200 flex-1 overflow-y-auto max-h-[45%] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
            <Suspense fallback={null}>
              <AiAssistantPanel
                resumeData={data}
                onUpdateSummary={(summary) => setData((prev) => prev ? { ...prev, summary } : prev)}
                onUpdateExperience={(experience) => setData((prev) => prev ? { ...prev, experience } : prev)}
              />
            </Suspense>
          </div>
        </aside>
      </div>

      {/* Floating AI action button */}
      <AiFloatingTrigger />

      {data && (
        <ExportDialog
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          resumeData={data}
          resumeId={resumeId}
        />
      )}

      {/* Add Section dialog (K-04) */}
      {addSectionOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddSectionOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-base font-bold text-gray-900 mb-1">Add Custom Section</h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Give your section a name — e.g. &quot;Awards&quot;, &quot;Volunteering&quot;, &quot;Publications&quot;.
            </p>
            <input
              autoFocus
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
              placeholder="Section name"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setAddSectionOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddSection} disabled={!newSectionName.trim()} className="text-white">
                Add Section
              </Button>
            </div>
          </div>
        </div>
      )}
      </BuilderContext.Provider>
    </AiAssistantProvider>
  );
}
