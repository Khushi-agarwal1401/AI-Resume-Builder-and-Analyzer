"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  FileText,
  GraduationCap,
  Briefcase,
  Sparkles,
  TrendingUp,
  X,
  Target,
  ArrowRight,
  Gauge,
  Layers,
  CircleCheck,
  TriangleAlert,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useResumes,
  useCreateResume,
  useDeleteResume,
  useDuplicateResume,
  useRenameResume,
  useChangeTemplate,
} from "@/lib/query/resume-hooks";
import { ResumeDashboardCard } from "@/features/resume-builder/components/ResumeDashboardCard";

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
  // TanStack Query-managed resume list + mutations (optimistic updates).
  const { data: resumes = [], isLoading } = useResumes({ enabled: authenticated });
  const createResume = useCreateResume();
  const deleteResume = useDeleteResume();
  const duplicateResume = useDuplicateResume();
  const renameResume = useRenameResume();
  const changeTemplate = useChangeTemplate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  // Resume currently switching templates (from the in-flight mutation variables).
  const switchingTemplateId = changeTemplate.variables?.id ?? null;

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/login");
    }
  }, [authenticated, authLoading, router]);

  function handleCreate(targetLevel: string = "fresher", title: string = "Untitled Resume") {
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
        template: templateMap[targetLevel] || "modern",
      })
      .then((data) => router.push(`/builder/${data.id}`))
      .catch(() => {});
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this resume? This can't be undone.")) return;
    deleteResume.mutate(id);
  }

  function handleDuplicate(id: string) {
    duplicateResume.mutate(id);
  }

  function handleDownload(id: string) {
    window.open(`/api/export/${id}`, "_blank");
  }

  function handleChangeTemplate(id: string, newTemplate: string) {
    // Optimistic update; per-resume pending state comes from mutation.variables.
    changeTemplate.mutate({ id, template: newTemplate });
  }

  // ── Summary stats ─────────────────────────────────────────────────
  const scored = resumes.filter((r) => r.ats_score !== null);
  const avgAts = scored.length
    ? Math.round(scored.reduce((acc, r) => acc + (r.ats_score ?? 0), 0) / scored.length)
    : null;
  const readyCount = scored.filter((r) => (r.ats_score ?? 0) >= 70).length;
  const needsWorkCount = scored.filter((r) => (r.ats_score ?? 0) < 70).length;

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
              onClick={() => setCreateModalOpen(true)}
              className="gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 shadow-lg shadow-accent-500/25"
            >
              <Sparkles className="w-4 h-4" /> New Resume
            </Button>
          )}
        </div>

        {/* Stats row */}
        {resumes.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
          /* ── Premium empty state ─────────────────────────────────── */
          <div className="relative flex flex-col items-center justify-center py-24 px-6 text-center overflow-hidden border border-gray-200 rounded-3xl bg-white shadow-sm">
            {/* Ambient accents */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[280px] bg-gradient-to-b from-accent-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-8 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-8 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Layered document illustration */}
            <div className="relative mb-8">
              <div className="absolute -top-2 left-1/2 -translate-x-[70%] w-24 h-32 bg-white border border-gray-200 rounded-lg shadow-md rotate-[-8deg]" />
              <div className="absolute top-1 left-1/2 -translate-x-[35%] w-24 h-32 bg-white border border-gray-200 rounded-lg shadow-md rotate-[6deg]" />
              <div className="relative w-24 h-32 bg-gradient-to-br from-accent-500 to-accent-700 rounded-lg shadow-xl shadow-accent-500/30 rotate-0 flex items-center justify-center">
                <FileText className="w-9 h-9 text-white" />
                <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm">
                  <Wand2 className="w-3.5 h-3.5 text-white" />
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Your first resume awaits</h2>
            <p className="text-gray-500 mb-8 max-w-sm text-sm leading-relaxed">
              Pick a template from 30 curated layout families, let AI polish your
              bullets, and check your ATS score before you apply.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={() => setCreateModalOpen(true)}
                size="lg"
                className="gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 shadow-lg shadow-accent-500/25"
              >
                <Sparkles className="w-4 h-4" /> Create Resume
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.push("/templates")}
                className="rounded-xl"
              >
                Browse Templates
              </Button>
            </div>
          </div>
        ) : (
          /* ── Resume grid ─────────────────────────────────────────── */
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
            {resumes.map((r) => (
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Resume Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Choose your level</h2>
                <p className="text-sm text-gray-500 mt-1">
                  We&apos;ll tailor the template and suggestions to your experience.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student */}
              <button
                onClick={() => handleCreate("student", "Student Resume")}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-emerald-500 hover:shadow-md hover:bg-emerald-50/30 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Student</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Showcase your academic achievements, projects, and extracurriculars.
                  </p>
                </div>
              </button>

              {/* Internship */}
              <button
                onClick={() => handleCreate("student_internship", "Internship Resume")}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md hover:bg-blue-50/30 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Internship</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Highlight your foundational skills and previous internship experiences.
                  </p>
                </div>
              </button>

              {/* Fresher */}
              <button
                onClick={() => handleCreate("fresher", "Fresher Resume")}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md hover:bg-purple-50/30 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Fresher</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Stand out for entry-level roles with a focus on potential and core skills.
                  </p>
                </div>
              </button>

              {/* Experienced */}
              <button
                onClick={() => handleCreate("experienced", "Professional Resume")}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-rose-500 hover:shadow-md hover:bg-rose-50/30 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Experienced</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Present your career progression, leadership, and measurable impact.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
