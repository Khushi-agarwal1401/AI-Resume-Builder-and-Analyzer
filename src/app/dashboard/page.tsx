"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { useDashboardSearch } from "@/features/dashboard/context/DashboardSearchContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MoreVertical, Copy, Download, Trash, Edit3, FileText, Sparkles, Palette, ChevronDown, Check, Gauge, Eye, Download as DownloadIcon } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { TEMPLATE_DISPLAY, TEMPLATE_BADGE } from "@/features/resume-builder/config/template-constants";
import { ContinueWorkingCard } from "@/features/dashboard/components/ContinueWorkingCard";
import { AiRecommendationsCard } from "@/features/dashboard/components/AiRecommendationsCard";
import { ResumeProgress } from "@/features/dashboard/components/ResumeProgress";
import { WelcomeEmptyState } from "@/features/dashboard/components/WelcomeEmptyState";
import { CreateResumeModal } from "@/features/dashboard/components/CreateResumeModal";
import { ResponsiveWidget } from "@/features/dashboard/components/ResponsiveWidget";
import type { ResumeListItem } from "@/services/resume/completion";

export default function DashboardPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { query: searchQuery, setQuery: setSearchQuery } = useDashboardSearch();
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [templatePickerId, setTemplatePickerId] = useState<string | null>(null);
  const [switchingTemplate, setSwitchingTemplate] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResumeListItem | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const templatePickerRef = useRef<HTMLDivElement>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filteredResumes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return resumes;
    return resumes.filter((r) => {
      const templateLabel = TEMPLATE_DISPLAY[r.template] || r.template;
      return (
        r.title.toLowerCase().includes(q) ||
        templateLabel.toLowerCase().includes(q) ||
        r.template.toLowerCase().includes(q)
      );
    });
  }, [resumes, searchQuery]);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/login");
      return;
    }
    if (authenticated) fetchResumes();
  }, [authenticated, authLoading, router]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
      if (templatePickerRef.current && !templatePickerRef.current.contains(e.target as Node)) {
        setTemplatePickerId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchResumes() {
    try {
      const res = await fetch("/api/resumes");
      // Explicitly check if the response was successful (status 200-299)
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      const json = await res.json();
      if (json.success) setResumes(json.data);
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(targetLevel: string = "fresher", title: string = "Untitled Resume", template?: string) {
    setCreateModalOpen(false);
    
    // Choose a default template based on the target level
    const templateMap: Record<string, string> = {
      student: "student",
      fresher: "modern",
      student_internship: "minimal",
      experienced: "executive"
    };
    
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title, 
        targetLevel,
        template: template || templateMap[targetLevel] || "modern" 
      }),
    });
    const json = await res.json();
    if (json.success) router.push(`/builder/${json.data.id}`);
  }

  async function handleCreateWithTemplate(templateId: string, targetLevel: string) {
    const displayName = TEMPLATE_DISPLAY[templateId] || templateId;
    await handleCreate(targetLevel, `${displayName} Resume`, templateId);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete resume. Please try again.");
        return;
      }
      toast.success("Resume deleted");
      fetchResumes();
    } catch {
      toast.error("Failed to delete resume. Please try again.");
    }
  }

  async function handleDuplicate(id: string) {
    setMenuOpenId(null);
    setLoading(true);
    await fetch(`/api/resumes/${id}/duplicate`, { method: "POST" });
    await fetchResumes();
  }

  function handleDownload(id: string) {
    setMenuOpenId(null);
    window.open(`/api/export/${id}`, "_blank");
  }

  async function handleSaveTitle(id: string) {
    if (!editTitle.trim()) return setEditingId(null);
    setResumes(prev => prev.map(r => r.id === id ? { ...r, title: editTitle } : r));
    setEditingId(null);
    await fetch(`/api/resumes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle }),
    });
  }

  async function handleChangeTemplate(id: string, newTemplate: string) {
    setTemplatePickerId(null);
    setSwitchingTemplate(id);
    // Optimistic update
    setResumes(prev => prev.map(r => r.id === id ? { ...r, template: newTemplate } : r));
    await fetch(`/api/resumes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: newTemplate }),
    });
    setSwitchingTemplate(null);
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pl-12 lg:pl-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Resumes</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage, edit, and export your resumes.</p>
          </div>
          {resumes.length > 0 && (
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2 bg-black text-white hover:bg-gray-800 w-full sm:w-auto shrink-0">
              New Resume +
            </Button>
          )}
        </div>

        {/* Dashboard intelligence widgets — stacked + collapsible on mobile, 2-col on tablet, 3-col on desktop */}
        {resumes.length > 0 && !searchQuery.trim() && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <ResponsiveWidget
              className="lg:col-span-2"
              icon={
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-100">
                  <Sparkles className="w-4 h-4 text-accent-600" />
                </span>
              }
              title="Continue Working"
              subtitle="Pick up where you left off"
            >
              <ContinueWorkingCard resume={resumes[0]} hideHeaderOnMobile className="h-full" />
            </ResponsiveWidget>

            <ResponsiveWidget
              icon={
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-700">
                  <Sparkles className="w-4 h-4 text-white" />
                </span>
              }
              title="AI Suggestions"
              subtitle="Personalized next steps"
            >
              <AiRecommendationsCard resume={resumes[0]} hideHeaderOnMobile className="h-full" />
            </ResponsiveWidget>
          </div>
        )}

        {resumes.length > 0 && searchQuery.trim() && filteredResumes.length > 0 && (
          <p className="mb-4 text-xs text-gray-400">
            {filteredResumes.length} of {resumes.length} resumes match
          </p>
        )}

        {resumes.length === 0 ? (
          <WelcomeEmptyState
            onCreate={() => setCreateModalOpen(true)}
            onCreateWithTemplate={handleCreateWithTemplate}
          />
        ) : filteredResumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-white shadow-sm">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">No resumes found</h2>
            <p className="text-gray-500 mb-5 text-sm">Try a different search term or clear the search.</p>
            <Button variant="secondary" size="sm" onClick={() => setSearchQuery("")}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-4 sm:gap-6">
            {filteredResumes.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 group flex flex-col relative",
                  menuOpenId === r.id ? "z-50" : "z-10"
                )}
              >
                {/* Thumbnail Header */}
                <div 
                  className="h-32 bg-gray-50 border-b border-gray-200 flex items-center justify-center relative cursor-pointer rounded-t-xl overflow-hidden"
                  onClick={() => router.push(`/builder/${r.id}`)}
                >
                  <div className="w-20 h-28 bg-white border border-gray-200 shadow-sm rounded-sm p-2 flex flex-col gap-2">
                    <div className="h-1 w-full bg-gray-300 rounded-full" />
                    <div className="h-1 w-3/4 bg-gray-200 rounded-full" />
                    <div className="h-1 w-full bg-gray-200 rounded-full" />
                    <div className="h-1 w-5/6 bg-gray-200 rounded-full" />
                  </div>
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white text-gray-900 text-sm font-medium px-4 py-2 rounded-full shadow-sm">
                      Open Builder
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-1 relative">
                    {editingId === r.id ? (
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(r.id)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveTitle(r.id)}
                        className="text-lg font-bold text-gray-900 border-b-2 border-accent-500 outline-none w-full bg-transparent"
                      />
                    ) : (
                      <h3 className="text-lg font-bold text-gray-900 truncate flex-1 group-hover:text-accent-600 transition-colors cursor-pointer" onClick={() => {
                        setEditTitle(r.title);
                        setEditingId(r.id);
                      }}>
                        {r.title}
                      </h3>
                    )}

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === r.id ? null : r.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {menuOpenId === r.id && (
                        <div ref={menuRef} className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                          <button onClick={() => {
                            setEditTitle(r.title);
                            setEditingId(r.id);
                            setMenuOpenId(null);
                          }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Edit3 className="w-4 h-4" /> Rename
                          </button>
                          <button onClick={() => handleDuplicate(r.id)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Copy className="w-4 h-4" /> Duplicate
                          </button>
                          <button onClick={() => handleDownload(r.id)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Download className="w-4 h-4" /> Download PDF
                          </button>
                          <div className="h-px bg-gray-200 my-1" />
                          <button
                            onClick={() => {
                              setMenuOpenId(null);
                              setDeleteTarget(r);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 relative flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTemplatePickerId(templatePickerId === r.id ? null : r.id);
                        setMenuOpenId(null);
                      }}
                      disabled={switchingTemplate === r.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:scale-105 active:scale-95",
                        TEMPLATE_BADGE[r.template]?.bg || "bg-gray-100",
                        TEMPLATE_BADGE[r.template]?.text || "text-gray-600",
                        switchingTemplate === r.id && "opacity-50 animate-pulse"
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", TEMPLATE_BADGE[r.template]?.dot || "bg-gray-400")} />
                      <Palette className="w-3 h-3 opacity-70" />
                      {TEMPLATE_DISPLAY[r.template] || r.template}
                      <ChevronDown className={cn("w-3 h-3 opacity-50 transition-transform", templatePickerId === r.id && "rotate-180")} />
                    </button>

                    {/* ATS score badge (K-03) — or a "Run ATS" CTA when never scored */}
                    {r.ats_score != null ? (
                      <span
                        title="Latest ATS estimate"
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border",
                          r.ats_score >= 70
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : r.ats_score >= 40
                              ? "text-amber-700 bg-amber-50 border-amber-200"
                              : "text-rose-700 bg-rose-50 border-rose-200"
                        )}
                      >
                        <Gauge className="w-3 h-3" />
                        ATS {r.ats_score}%
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/resume/${r.id}/ats-score`);
                        }}
                        title="Run an ATS analysis on this resume"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-dashed border-gray-300 text-gray-500 hover:text-accent-600 hover:border-accent-400 hover:bg-accent-50 transition-all active:scale-95"
                      >
                        <Gauge className="w-3 h-3" />
                        Run ATS
                      </button>
                    )}

                    {/* Template picker dropdown */}
                    {templatePickerId === r.id && (
                      <div
                        ref={templatePickerRef}
                        className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-[220px] grid grid-cols-2 gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {Object.entries(TEMPLATE_DISPLAY).map(([key, label]) => {
                          const badge = TEMPLATE_BADGE[key];
                          const isActive = r.template === key;
                          return (
                            <button
                              key={key}
                              onClick={() => handleChangeTemplate(r.id, key)}
                              className={cn(
                                "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                isActive
                                  ? "ring-2 ring-offset-1 ring-gray-300"
                                  : "hover:bg-gray-50",
                                badge?.bg,
                                badge?.text || "text-gray-600"
                              )}
                            >
                              <span className={cn("w-2 h-2 rounded-full shrink-0", badge?.dot || "bg-gray-400")} />
                              <span className="flex-1 truncate">{label}</span>
                              {isActive && <Check className="w-3 h-3 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <ResumeProgress completion={r.completion} className="mt-auto mb-3" />

                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-2 text-xs text-gray-400">
                    <span>Edited {formatRelativeTime(r.updated_at)}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {r.view_count}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <DownloadIcon className="w-3 h-3" />
                        {r.download_count}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this resume?"
        message={`"${deleteTarget?.title || "This resume"}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete Resume"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />

      {/* Create Resume Modal — 3 ways to start: create from scratch, fetch from
          LinkedIn + GitHub, or upload an existing resume */}
      <CreateResumeModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />
    </DashboardLayout>
  );
}
