"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDashboardSearch } from "@/features/dashboard/context/DashboardSearchContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  Sparkles,
  Target,
  ArrowRight,
  Gauge,
  Layers,
  CircleCheck,
  TriangleAlert,
  SearchX,
  Star,
  Pin,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useResumes,
  useCreateResume,
  useDeleteResume,
  useDuplicateResume,
  useRenameResume,
  useChangeTemplate,
  useTogglePinResume,
} from "@/lib/query/resume-hooks";
import { ResumeDashboardCard } from "@/features/resume-builder/components/ResumeDashboardCard";
import { RecentActivityWidget } from "@/features/dashboard/components/RecentActivityWidget";
import { WelcomeEmptyState } from "@/features/dashboard/components/WelcomeEmptyState";
import { CreateResumeModal } from "@/features/dashboard/components/CreateResumeModal";
import { TourGuide } from "@/components/TourGuide";

/** Epic 3, Task 3.1 — max pinned (favorite) resumes. */
const MAX_PINNED = 5;

/** Compact stat tile for the summary row. */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
  valueClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm", iconClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className={cn("text-2xl font-extrabold text-gray-900 tabular-nums leading-none", valueClass)}>{value}</p>
        <p className="text-xs text-gray-500 mt-1 truncate">{label}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  // The navbar search filters the resume grid live (Task 1.1).
  const { query: searchQuery, setQuery: setContextQuery } = useDashboardSearch();
  const normalizedSearch = searchQuery.trim().toLowerCase();
  // TanStack Query-managed resume list + mutations (optimistic updates).
  const { data: resumes = [], isLoading } = useResumes({ enabled: authenticated });
  const filteredResumes = normalizedSearch
    ? resumes.filter((r) => r.title.toLowerCase().includes(normalizedSearch))
    : resumes;
  const createResume = useCreateResume();
  const deleteResume = useDeleteResume();
  const duplicateResume = useDuplicateResume();
  const renameResume = useRenameResume();
  const changeTemplate = useChangeTemplate();
  const togglePin = useTogglePinResume();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  // Resume currently switching templates (from the in-flight mutation variables).
  const switchingTemplateId = changeTemplate.variables?.id ?? null;

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/login");
    }
  }, [authenticated, authLoading, router]);

  /** Creates a resume and jumps into the builder. Shared by every create path. */
  function createAndOpen(title: string, targetLevel: string, template?: string) {
    setCreateModalOpen(false);

    // Choose a default template based on the target level
    const templateMap: Record<string, string> = {
      student: "student",
      fresher: "modern",
      student_internship: "minimal",
      experienced: "executive",
    };

    createResume
      .mutateAsync({
        title,
        targetLevel,
        template: template || templateMap[targetLevel] || "modern",
      })
      .then((data) => router.push(`/builder/${data.id}`))
      .catch((err) => {
        console.error("Create Resume Error:", err);
        toast.error(err.message || "Failed to create resume.");
      });
  }

  function handleCreate(targetLevel: string = "fresher", title: string = "Untitled Resume", template?: string) {
    createAndOpen(title, targetLevel, template);
  }

  /** Epic 6, Task 6.1 — quick-start from a suggested template in the empty state. */
  function handleCreateWithTemplate(templateId: string, targetLevel: string) {
    createAndOpen("Untitled Resume", targetLevel, templateId);
  }

  function openCreateWizard() {
    setCreateModalOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this resume? This can't be undone.")) return;
    deleteResume.mutate(id);
  }

  function handleDuplicate(id: string) {
    duplicateResume.mutate(id);
  }

  async function handleDownload(id: string) {
    try {
      const res = await fetch(`/api/export/${id}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.upgradeRequired) {
          // Free plan → PDF export is a Pro feature (K-10). Surface the upgrade.
          router.push("/pricing");
          return;
        }
        alert(json.error || "Export failed");
        return;
      }
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = filenameMatch?.[1] || `resume_${id}.pdf`;
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
    }
  }

  function handleChangeTemplate(id: string, newTemplate: string) {
    // Optimistic update; per-resume pending state comes from mutation.variables.
    changeTemplate.mutate({ id, template: newTemplate });
  }

  function handleTogglePin(id: string, pinned: boolean) {
    if (pinned) {
      const pinnedCount = resumes.filter((r) => r.is_pinned).length;
      if (pinnedCount >= MAX_PINNED) {
        toast.error(`You can pin up to ${MAX_PINNED} resumes. Unpin one first.`);
        return;
      }
    }
    togglePin.mutate({ id, pinned });
  }

  // ── Summary stats ─────────────────────────────────────────────────
  const scored = resumes.filter((r) => r.ats_score !== null);
  const avgAts = scored.length
    ? Math.round(scored.reduce((acc, r) => acc + (r.ats_score ?? 0), 0) / scored.length)
    : null;
  const readyCount = scored.filter((r) => (r.ats_score ?? 0) >= 70).length;
  const needsWorkCount = scored.filter((r) => (r.ats_score ?? 0) < 70).length;
  // Interview prediction: percentage of resumes with ATS score >= 70
  const interviewPrediction = scored.length ? Math.round((readyCount / scored.length) * 100) : null;

  if (authLoading || isLoading) {
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
      <TourGuide />
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Resumes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Craft, check, and export every version of you.
            </p>
          </div>
          {resumes.length > 0 && (
            <Button
              id="tour-step-1"
              onClick={openCreateWizard}
              className="gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 shadow-lg shadow-accent-500/25"
            >
              <Sparkles className="w-4 h-4" /> New Resume
            </Button>
          )}
        </div>

        {/* Stats row */}
        {resumes.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <StatCard
              icon={Layers}
              label="Total Resumes"
              value={String(resumes.length)}
              sub="Across all versions"
              iconClass="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white"
            />
            <StatCard
              icon={Gauge}
              label="Average ATS Score"
              value={avgAts === null ? "—" : `${avgAts}`}
              sub={scored.length ? `From ${scored.length} checked resume${scored.length > 1 ? "s" : ""}` : "Run a check to see scores"}
              iconClass="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white"
              valueClass={avgAts !== null && avgAts >= 70 ? "text-emerald-600" : avgAts !== null && avgAts >= 45 ? "text-amber-600" : undefined}
            />
            <StatCard
              icon={CircleCheck}
              label="Ready to Apply"
              value={String(readyCount)}
              sub="Score 70 or above"
              iconClass="bg-gradient-to-br from-sky-500 to-sky-700 text-white"
              valueClass="text-sky-600"
            />
            <StatCard
              icon={TriangleAlert}
              label="Needs Attention"
              value={String(needsWorkCount)}
              sub="Score below 70"
              iconClass="bg-gradient-to-br from-rose-500 to-rose-700 text-white"
              valueClass="text-rose-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Interview Prediction"
              value={interviewPrediction === null ? "—" : `${interviewPrediction}%`}
              sub={scored.length ? "Based on ATS scores" : "Check ATS to see prediction"}
              iconClass="bg-gradient-to-br from-violet-500 to-violet-700 text-white"
              valueClass={interviewPrediction !== null && interviewPrediction >= 70 ? "text-violet-600" : interviewPrediction !== null && interviewPrediction >= 50 ? "text-amber-600" : undefined}
            />
          </div>
        )}

        {/* Recent Activity (Epic 3, Task 3.2) */}
        {resumes.length > 0 && (
          <div className="mb-6">
            <RecentActivityWidget resumes={resumes} />
          </div>
        )}

        {/* One-click ATS Check card */}
        {resumes.length > 0 && (
          <Link
            href={`/ats-check?resume=${resumes[0].id}`}
            className="group mb-8 flex items-center justify-between gap-4 rounded-2xl border border-accent-200 bg-gradient-to-r from-accent-50 via-white to-accent-50 dark:from-accent-500/10 dark:via-transparent dark:to-accent-500/10 px-5 py-4 hover:border-accent-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:rotate-3 transition-transform shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">Check your ATS Score</p>
                <p className="text-xs text-gray-500 truncate">
                  See how recruiters and ATS software read your resume — with AI improvement tips.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600 shrink-0">
              Check ATS Score
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        )}

        {resumes.length === 0 ? (
          /* ── Epic 6, Task 6.1 — interactive empty state ───────────── */
          <WelcomeEmptyState
            onCreate={openCreateWizard}
            onCreateWithTemplate={handleCreateWithTemplate}
          />
        ) : filteredResumes.length === 0 ? (
          /* ── No matches for the navbar search ─────────────────────── */
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center border border-gray-200 rounded-3xl bg-white shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
              <SearchX className="w-6 h-6 text-gray-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              No resumes match “{searchQuery.trim()}”
            </h2>
            <p className="text-sm text-gray-500 max-w-sm">
              Try a different search, or clear it to see all your resumes.
            </p>
            <Button variant="secondary" size="sm" className="mt-5 rounded-xl" onClick={() => setContextQuery("")}>
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* ── Pinned resumes (Epic 3, Task 3.1) ─────────────────── */}
            {(() => {
              const pinned = filteredResumes.filter((r) => r.is_pinned);
              if (pinned.length === 0) return null;
              return (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200/70 text-[11px] font-bold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      Pinned
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {pinned.length}/{MAX_PINNED}
                    </span>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
                    {pinned.map((r) => (
                      <ResumeDashboardCard
                        key={r.id}
                        resume={r}
                        isSwitching={switchingTemplateId === r.id}
                        onOpen={(id) => router.push(`/builder/${id}`)}
                        onRename={(id, title) => renameResume.mutate({ id, title })}
                        onDuplicate={(id) => handleDuplicate(id)}
                        onDelete={(id) => handleDelete(id)}
                        onDownload={(id) => handleDownload(id)}
                        onChangeTemplate={(id, template) => handleChangeTemplate(id, template)}
                        onCheckAts={(id) => router.push(`/ats-check?resume=${id}`)}
                        onTogglePin={(id, pinned) => handleTogglePin(id, pinned)}
                      />
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* ── All / unpinned resumes ───────────────────────────── */}
            {(() => {
              const rest = filteredResumes.filter((r) => !r.is_pinned);
              if (rest.length === 0) return null;
              return (
                <section>
                  {filteredResumes.some((r) => r.is_pinned) && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold">
                        <Pin className="w-3 h-3" />
                        All Resumes
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
                    {rest.map((r) => (
                      <ResumeDashboardCard
                        key={r.id}
                        resume={r}
                        isSwitching={switchingTemplateId === r.id}
                        onOpen={(id) => router.push(`/builder/${id}`)}
                        onRename={(id, title) => renameResume.mutate({ id, title })}
                        onDuplicate={(id) => handleDuplicate(id)}
                        onDelete={(id) => handleDelete(id)}
                        onDownload={(id) => handleDownload(id)}
                        onChangeTemplate={(id, template) => handleChangeTemplate(id, template)}
                        onCheckAts={(id) => router.push(`/ats-check?resume=${id}`)}
                        onTogglePin={(id, pinned) => handleTogglePin(id, pinned)}
                      />
                    ))}
                  </div>
                </section>
              );
            })()}
          </div>
        )}
      </div>

      {/* Epic 6 — New Resume wizard (create / import from profiles / upload) */}
      <CreateResumeModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />
    </DashboardLayout>
  );
}
