"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useResumeForm } from "@/features/resume-builder/hooks/useResumeForm";
import { AiAssistantPanel } from "@/features/ai-assistant/components/AiAssistantPanel";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ExportDialog } from "@/features/export/components/ExportDialog";
import { RESUME_TYPES } from "@/features/resume-builder/config/resume-types";
import { cn } from "@/lib/utils";
import { BuilderContext } from "./builder-context";
import { AiAssistantProvider } from "@/features/ai-assistant/context/AiAssistantContext";
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
  Circle
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

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const resumeId = params.resumeId as string;
  const { data, setData, loading, saving } = useResumeForm(resumeId);
  const [debouncedData, setDebouncedData] = useState(data);
  const [exportOpen, setExportOpen] = useState(false);

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
  const pathParts = pathname.split("/").filter(Boolean);
  const sectionId = pathParts.length >= 4 ? pathParts[pathParts.length - 1] : undefined;
  const currentSectionIndex = sectionId ? sectionIds.indexOf(sectionId) : -1;

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
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
            </nav>

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
              <span className={`text-[11px] font-medium ${saving ? "text-amber-500" : "text-green-500"}`}>
                {saving ? "Saving..." : "Saved"}
              </span>
              <Button variant="ghost" size="sm" onClick={() => data?.id && router.push(`/resume/${data.id}/ats-score`)}>
                ATS
              </Button>
              <Button variant="secondary" size="sm" onClick={() => data?.id && router.push(`/preview/${data.id}`)}>
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

          {/* Section page content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[720px] mx-auto p-8">
              {children}
            </div>
          </div>
        </div>

        {/* Preview + AI Panel */}
        <aside className="w-[400px] border-l border-gray-300 bg-white shrink-0 hidden xl:flex xl:flex-col sticky top-[72px] h-[calc(100vh-72px)]">
          <div className="p-4 border-b border-gray-300 bg-gray-50 flex-1 flex flex-col min-h-[400px]">
            <h2 className="text-micro text-gray-500 uppercase tracking-widest mb-3">Live Preview</h2>
            <div className="flex-1 overflow-auto rounded-sm border border-gray-300 bg-white shadow-sm flex items-start justify-center p-4">
              <div className="w-[800px] origin-top scale-[0.45] 2xl:scale-[0.55]">
                {debouncedData && <TemplateRenderer resume={debouncedData} />}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto border-t border-gray-300 max-h-[50%]">
            <AiAssistantPanel
              resumeData={data}
              onUpdateSummary={(summary) => setData((prev) => prev ? { ...prev, summary } : prev)}
              onUpdateExperience={(experience) => setData((prev) => prev ? { ...prev, experience } : prev)}
            />
          </div>
        </aside>
      </div>

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
