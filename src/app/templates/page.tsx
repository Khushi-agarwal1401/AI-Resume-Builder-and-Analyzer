"use client";
import Preloader from "@/components/ui/Preloader";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Check, Eye, Loader2, LayoutTemplate, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  getCatalogFamilies,
  type FamilyLevel,
} from "@/features/resume-builder/config/template-families";
import {
  getTemplateMetadata,
  templateAtsScore,
  TEMPLATE_ROLE_OPTIONS,
  TEMPLATE_REGISTRY,
  type TemplateExperienceLevel,
} from "@/features/resume-builder/config/template-registry";
import { getFamilyForTemplate } from "@/features/resume-builder/config/template-families";
import { searchTemplates } from "@/features/resume-builder/config/template-search";
import { AtsBadge, TierBadge } from "@/components/ui/AtsBadge";
import type { ResumeTemplate, TargetLevel } from "@/types/resume";
import { TemplatePreview } from "@/features/resume-builder/templates/preview/TemplatePreview";
import dynamic from "next/dynamic";

const TemplateGrid = dynamic(
  () => Promise.all([
    import("@/features/resume-builder/templates/preview/TemplateGrid"),
    new Promise(resolve => setTimeout(resolve, 2000))
  ]).then(([mod]) => mod.TemplateGrid),
  { loading: () => <Preloader />, ssr: false }
);
import { TemplateDetail } from "@/features/resume-builder/templates/preview/TemplateDetail";
import { TemplateSetupDialog } from "@/features/resume-builder/components/TemplateSetupDialog";
import { sampleResumeForTemplate } from "@/features/resume-builder/config/sample-resume";
import { recommendTemplate, type ExperienceLevel } from "@/features/resume-builder/config/template-recommendation";

/** The 8 curated layout families (canonical hero per family). */
const CATALOG = getCatalogFamilies();

/** Families flagged as "popular" in the catalog. */
const POPULAR_FAMILIES = new Set(["ats-pro", "prof-modern", "ex-serif", "st-band", "mod-cards"]);

const LEVEL_FILTERS: { id: "all" | FamilyLevel; label: string }[] = [
  { id: "all", label: "All Levels" },
  { id: "student", label: "Student" },
  { id: "internship", label: "Internship" },
  { id: "graduate", label: "Graduate" },
  { id: "experienced", label: "Experienced" },
  { id: "senior", label: "Senior" },
  { id: "manager", label: "Manager" },
  { id: "executive", label: "Executive" },
];

const CATEGORY_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "ats-friendly", label: "ATS Friendly" },
  { id: "professional", label: "Professional" },
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "creative", label: "Creative" },
  { id: "executive", label: "Executive" },
  { id: "student", label: "Student" },
  { id: "technical", label: "Technical" },
  { id: "academic", label: "Academic" },
  { id: "designer", label: "Designer" },
  { id: "premium", label: "Premium" },
];

/** Map the family-level filter to the marketplace experience vocabulary. */
const LEVEL_TO_EXPERIENCE: Record<FamilyLevel, TemplateExperienceLevel> = {
  student: "student",
  internship: "entry",
  graduate: "entry",
  experienced: "mid",
  senior: "senior",
  manager: "senior",
  executive: "executive",
};

/**
 * The deterministic recommendation engine's vocabulary tops out at "senior"
 * (executive resumes use the senior bucket), so clamp marketplace levels.
 */
const ENGINE_EXPERIENCE: Record<TemplateExperienceLevel, ExperienceLevel> = {
  student: "student",
  entry: "entry",
  mid: "mid",
  senior: "senior",
  executive: "senior",
};

/** Default recommendation profile shown to first-time visitors. */
const DEFAULT_PROFILE = {
  role: "Software Engineer",
  experience: "mid" as ExperienceLevel,
  industry: "Technology",
};

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const defaultLevel = (searchParams.get("level") as FamilyLevel) || "all";
  const [levelFilter, setLevelFilter] = useState<"all" | FamilyLevel>(
    LEVEL_FILTERS.some(f => f.id === defaultLevel) ? defaultLevel : "all"
  );
  
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [atsOnly, setAtsOnly] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(CATALOG[0].canonicalId);
  const [creating, setCreating] = useState(false);
  const [setupTemplate, setSetupTemplate] = useState<{ id: string; name: string } | null>(null);
  const [detailTemplateId, setDetailTemplateId] = useState<string | null>(null);
  const [detailAccent, setDetailAccent] = useState<string>("#64748b");

  /** Marketplace filter pipeline — one pure path through searchTemplates(). */
  const filtered = useMemo(() => {
    return searchTemplates({
      query,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      role: roleFilter !== "all" ? roleFilter : undefined,
      experienceLevel: levelFilter !== "all" ? LEVEL_TO_EXPERIENCE[levelFilter] : undefined,
      atsFriendly: atsOnly || undefined,
      tier: categoryFilter === "premium" ? "premium" : undefined,
    }).map((m) => m.id);
  }, [query, categoryFilter, roleFilter, levelFilter, atsOnly]);

  // Keep the selected template visible in the filtered set.
  useEffect(() => {
    if (filtered.length > 0 && !filtered.includes(selectedTemplateId)) {
      setSelectedTemplateId(filtered[0]);
    }
  }, [filtered, selectedTemplateId]);

  // The selected catalog template (canonical or variant) drives the detail pane.
  const fallbackMeta = getTemplateMetadata(CATALOG[0].canonicalId);
  const selectedMeta = getTemplateMetadata(selectedTemplateId) ?? fallbackMeta;
  const selectedFamily = selectedMeta ? getFamilyForTemplate(selectedMeta.id) : getCatalogFamilies()[0].family;

  /** Deterministic "Recommended for you" row — reflects the active filters
   * (or a sensible default profile for first-time visitors). Never changes
   * the user's resume; it only recommends. */
  const recommendedIds = useMemo(() => {
    const isFiltering =
      query.trim() !== "" || roleFilter !== "all" || atsOnly || levelFilter !== "all";
    const role = isFiltering && roleFilter !== "all" ? roleFilter : DEFAULT_PROFILE.role;
    const experience: ExperienceLevel =
      isFiltering && levelFilter !== "all"
        ? ENGINE_EXPERIENCE[LEVEL_TO_EXPERIENCE[levelFilter]]
        : DEFAULT_PROFILE.experience;
    const top = recommendTemplate({ role, experience, industry: DEFAULT_PROFILE.industry });
    // Surface the next-best fits alongside the winner using the same engine.
    const rest = searchTemplates({ role, experienceLevel: experience })
      .filter((m) => m.id !== top.key)
      .slice(0, 2)
      .map((m) => m.id);
    return [top.key, ...rest];
  }, [query, roleFilter, atsOnly, levelFilter]);

  function targetLevelForFamily(family: typeof selectedFamily): TargetLevel {
    if (family.levels.includes("student")) return "student";
    if (family.levels.includes("internship") || family.levels.includes("graduate")) return "student_internship";
    return "experienced";
  }

  async function handleUseTemplate(templateId: string) {
    if (!user) {
      router.push("/sign-up");
      return;
    }
    const family = getFamilyForTemplateId(templateId);
    setCreating(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${getTemplateMetadata(templateId)?.name || family.name || "Resume"} Resume`,
          template: templateId,
          targetLevel: targetLevelForFamily(family),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${getTemplateMetadata(templateId)?.name || "Template"} resume created! Opening builder...`);
        router.push(`/builder/${json.data.id}`);
      } else {
        toast.error("Failed to create resume. Please try again.");
        setCreating(false);
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error("Failed to create resume:", err);
      setCreating(false);
    }
  }

  function getFamilyForTemplateId(templateId: string) {
    return getFamilyForTemplate(templateId);
  }

  function openTemplateSetup(templateId: string) {
    if (!user) {
      router.push("/sign-up");
      return;
    }
    const family = getFamilyForTemplateId(templateId);
    const meta = getTemplateMetadata(templateId);
    setSetupTemplate({ id: templateId, name: meta?.name || family.name || templateId });
  }

  function handleCreated(resumeId: string) {
    setSetupTemplate(null);
    setCreating(false);
    toast.success("Resume created! Opening builder...");
    router.push(`/builder/${resumeId}`);
  }

  if (authLoading) {
    return (
      <DashboardLayout>
        <Preloader />
      </DashboardLayout>
    );
  }

  const hasActiveSearch = query.trim() !== "" || roleFilter !== "all" || atsOnly;

  return (
    <DashboardLayout>
      <div className="max-w-[1120px] mx-auto px-8 py-12">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 mt-1">
              <LayoutTemplate className="w-5 h-5 text-accent-500" />
              <h1 className="text-h1 text-black">Choose Your Template</h1>
            </div>
            {/* Search bar */}
            <div className="relative w-full md:w-[380px] lg:w-[450px] shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates — try 'developer', 'ATS'…"
                className="w-full h-11 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 placeholder:text-gray-400 shadow-sm"
              />
            </div>
          </div>
          <p className="text-body text-gray-500">
            <span className="font-semibold text-gray-700">{TEMPLATE_REGISTRY.length} curated templates</span>
            {` — every card is a real miniature resume, rendered with your content's placeholders. Pick a design, then
            fine-tune its color, font, and layout. Switch anytime without losing a word.`}
          </p>
        </div>

        {/* ── Recommended for you ───────────────────────────────────────── */}
        <div className="mb-10 bg-gradient-to-r from-accent-50 via-white to-white border border-accent-100 rounded-2xl p-5 dark:from-accent-500/15 dark:via-gray-900 dark:to-gray-900 dark:border-accent-500/20">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-500" />
                Recommended for you
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {hasActiveSearch
                  ? `Based on your filters${roleFilter !== "all" ? ` — ${roleFilter}` : ""}${atsOnly ? " · ATS required" : ""}.`
                  : "Best-fit layouts for a mid-level Software Engineer profile — edit your filters to re-rank."}
              </p>
            </div>
            {hasActiveSearch && (
              <button
                onClick={() => { setQuery(""); setRoleFilter("all"); setAtsOnly(false); }}
                className="text-xs font-semibold text-accent-600 hover:underline inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedIds.map((id, i) => (
              <div key={id} className="flex items-stretch gap-3 bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-accent-300 transition-all">
                <div className="relative shrink-0 rounded-lg overflow-hidden border border-gray-100" style={{ width: 92, height: 118 }}>
                  <TemplatePreview resume={{ ...sampleResumeForTemplate(id), template: id as ResumeTemplate }} scale="fit-width" />
                </div>
                <div className="min-w-0 flex flex-col justify-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent-500 text-white text-[10px] font-bold">{i + 1}</span>
                    <h3 className="text-sm font-bold text-gray-900 truncate">{getTemplateMetadata(id)?.name}</h3>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2">{getTemplateMetadata(id)?.description}</p>
                  <div className="flex items-center gap-1.5">
                    <AtsBadge score={templateAtsScore(id)} showStars={false} size="xs" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <button
                      onClick={() => { setDetailTemplateId(id); setDetailAccent("#64748b"); }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button
                      onClick={() => openTemplateSetup(id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-600 hover:text-accent-700"
                    >
                      <Check className="w-3 h-3" strokeWidth={3} /> Use
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────── */}
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-1">Level</span>
            {LEVEL_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setLevelFilter(f.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border",
                  levelFilter === f.id
                    ? "bg-accent-500 text-white border-accent-500 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-1">Category</span>
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border",
                  categoryFilter === f.id
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Role + ATS row */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
              <span className="uppercase tracking-wider text-gray-400 text-[11px] font-bold">Role</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 pr-8 text-xs font-medium text-gray-700 outline-none transition-all focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15"
              >
                <option value="all">All Roles</option>
                {TEMPLATE_ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>
            <label className="inline-flex items-center gap-3 text-xs font-semibold text-gray-600 cursor-pointer select-none group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={atsOnly}
                  onChange={(e) => setAtsOnly(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-9 h-5 bg-gray-200/80 rounded-full border border-gray-200 peer-focus-visible:ring-2 peer-focus-visible:ring-accent-500 peer-focus-visible:ring-offset-2 transition-colors duration-200 peer-checked:bg-accent-500 peer-checked:border-accent-500 dark:bg-gray-700 dark:border-gray-600"></div>
                <div className="absolute left-[2px] top-[2px] w-4 h-4 bg-white rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.1)] transform transition-transform duration-200 peer-checked:translate-x-4"></div>
              </div>
              <span className="inline-flex items-center gap-1.5 transition-colors group-hover:text-gray-900">
                <span className={cn("w-1.5 h-1.5 rounded-full transition-colors", atsOnly ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-gray-300")} />
                ATS Friendly only
              </span>
            </label>

            <span className="ml-auto text-xs font-medium text-gray-400">
              {filtered.length} of {TEMPLATE_REGISTRY.length} templates
            </span>
          </div>
        </div>

        {/* ── Template Grid ────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl mb-12">
            <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-1">No templates match these filters.</p>
            <button
              onClick={() => { setLevelFilter("all"); setCategoryFilter("all"); setQuery(""); setRoleFilter("all"); setAtsOnly(false); }}
              className="text-sm font-semibold text-accent-600 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <TemplateGrid
            templateIds={filtered}
            resume={sampleResumeForTemplate}
            selectedId={selectedTemplateId}
            busyId={creating ? (selectedMeta?.id ?? selectedTemplateId) : null}
            onSelect={(id) => setSelectedTemplateId(id)}
            onPreview={(id) => { setDetailTemplateId(id); setDetailAccent("#64748b"); }}
            onUse={openTemplateSetup}
          />
        )}

        {/* ── Selected template detail + CTA (hidden while no results) ──────── */}
        {filtered.length > 0 && selectedFamily && selectedMeta && (
          <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedMeta.name}</h2>
                  {POPULAR_FAMILIES.has(selectedFamily.id) && (
                    <span className="bg-accent-100 text-accent-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <AtsBadge score={templateAtsScore(selectedMeta.id)} size="md" />
                  <TierBadge tier={selectedMeta.tier} />
                  <span className="inline-block text-xs font-bold text-accent-600 bg-accent-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {selectedFamily.category}
                  </span>
                  <span className="inline-block text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {selectedFamily.levels.slice(0, 3).join(" · ")}
                  </span>
                </div>
                <p className="text-base text-gray-600 mb-3 leading-relaxed">{selectedMeta.description}</p>
                <p className="text-sm text-gray-400 mb-6">
                  {selectedMeta.atsLabel} · Best for: {selectedMeta.bestFor}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={() => openTemplateSetup(selectedMeta.id)}
                    disabled={creating}
                    className="inline-flex items-center gap-2 h-12 px-6"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Use {selectedMeta.name}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => handleUseTemplate(selectedMeta.id)}
                    disabled={creating}
                    className="inline-flex items-center gap-2 h-12 px-6"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Start with Empty
                  </Button>
                </div>
              </div>

              {/* Large real template preview */}
              <div className="relative">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
                  <TemplatePreview
                    resume={{ ...sampleResumeForTemplate(selectedMeta.id), template: selectedMeta.id as ResumeTemplate }}
                    scale="fit-width"
                  />
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={() => { setDetailTemplateId(selectedMeta.id); setDetailAccent("#64748b"); }}
                    className="w-10 h-10 rounded-full bg-white/95 backdrop-blur shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:scale-110 transition-all"
                    title="Full preview with zoom"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post-family-selection setup dialog (manual vs auto-import) */}
        {setupTemplate && (
          <TemplateSetupDialog
            open={!!setupTemplate}
            onClose={() => {
              setSetupTemplate(null);
              setCreating(false);
            }}
            template={setupTemplate}
            targetLevel={targetLevelForFamily(getFamilyForTemplateId(setupTemplate.id) ?? selectedFamily)}
            onCreated={handleCreated}
          />
        )}

        {/* Full-screen detail view with zoom / fit / device preview */}
        {detailTemplateId && (
          <TemplateDetail
            templateId={detailTemplateId}
            resume={sampleResumeForTemplate(detailTemplateId)}
            accent={detailAccent}
            onAccentChange={(hex) => setDetailAccent(hex)}
            onClose={() => setDetailTemplateId(null)}
            onUse={(id) => openTemplateSetup(id)}
            busy={creating}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
