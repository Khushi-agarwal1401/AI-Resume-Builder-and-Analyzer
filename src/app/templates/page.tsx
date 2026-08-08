"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { Check, Loader2, LayoutTemplate, Eye, Star, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { TEMPLATE_LAYOUT, LAYOUT_BADGE } from "@/features/resume-builder/config/template-constants";
import {
  getCatalogFamilies,
  getFamilyVariants,
  familyCategoryToFilter,
  type FamilyLevel,
} from "@/features/resume-builder/config/template-families";
import { getTemplateMetadata, templateAtsScore } from "@/features/resume-builder/config/template-registry";
import { AtsBadge, TierBadge } from "@/components/ui/AtsBadge";
import type { ResumeTemplate, TargetLevel } from "@/types/resume";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import { TemplateSetupDialog } from "@/features/resume-builder/components/TemplateSetupDialog";
import { SAMPLE_RESUME } from "@/features/resume-builder/config/sample-resume";

/** Hex → subtle two-stop CSS gradient for card shells. */
function gradientFromHex(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const lighten = (amt: number) => {
    const r = Math.min(255, Math.max(0, (n >> 16) + amt));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
    const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };
  return `linear-gradient(135deg, ${lighten(28)} 0%, ${hex} 100%)`;
}

/** The 30 curated layout families (canonical hero + duplicate variants). */
const CATALOG = getCatalogFamilies();

/** Families flagged as "popular" in the catalog. */
const POPULAR_FAMILIES = new Set(["ats-pro", "prof-modern", "ex-serif", "st-band", "mod-sidebar"]);

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
  { id: "academic", label: "Academic" },
  { id: "technical", label: "Technical" },
  { id: "designer", label: "Designer" },
  { id: "premium", label: "Premium" },
];

// Scale factor for family previews in the grid cards
const GRID_PREVIEW_SCALE = 0.38;
// Scale factor for the large detail preview
const DETAIL_PREVIEW_SCALE = 0.55;

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [levelFilter, setLevelFilter] = useState<"all" | FamilyLevel>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>(CATALOG[0].family.id);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [setupTemplate, setSetupTemplate] = useState<{ id: string; name: string } | null>(null);
  const [previewFamily, setPreviewFamily] = useState<string | null>(null);
  const [previewAccent, setPreviewAccent] = useState<string>("#64748b");

  // Reset the selected variant whenever the family changes.
  useEffect(() => {
    setSelectedVariantId(null);
  }, [selectedFamilyId]);

  const filtered = useMemo(() => {
    return CATALOG.filter(({ family, canonicalId }) => {
      if (levelFilter !== "all" && !family.levels.includes(levelFilter)) return false;
      if (categoryFilter === "all") return true;
      if (categoryFilter === "premium") {
        return getTemplateMetadata(canonicalId)?.tier === "premium";
      }
      return familyCategoryToFilter(family.category) === categoryFilter || family.category === categoryFilter;
    });
  }, [levelFilter, categoryFilter]);

  // Keep the selected family visible in the filtered set.
  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((c) => c.family.id === selectedFamilyId)) {
      setSelectedFamilyId(filtered[0].family.id);
    }
  }, [filtered, selectedFamilyId]);

  const selectedEntry =
    filtered.find((c) => c.family.id === selectedFamilyId) ||
    filtered[0] ||
    CATALOG[0];

  const selectedFamily = selectedEntry.family;
  // Variant currently previewed (defaults to the family's canonical hero).
  const previewId =
    selectedVariantId ?? selectedEntry.canonicalId;
  const previewMeta = getTemplateMetadata(previewId);
  const variantIds = getFamilyVariants(selectedFamily.id);
  const variantCount = variantIds.length;

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
    setCreating(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${selectedFamily.name} Resume`,
          template: templateId,
          targetLevel: targetLevelForFamily(selectedFamily),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${previewMeta?.name || selectedFamily.name} resume created! Opening builder...`);
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

  function openTemplateSetup() {
    if (!user) {
      router.push("/sign-up");
      return;
    }
    setSetupTemplate({ id: previewId, name: previewMeta?.name || selectedFamily.name });
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
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1120px] mx-auto px-8 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <LayoutTemplate className="w-5 h-5 text-accent-500" />
            <h1 className="text-h1 text-black">Choose Your Template</h1>
          </div>
          <p className="text-body text-gray-500">
            <span className="font-semibold text-gray-700">{CATALOG.length} template families</span>
            {` — every family is a genuinely different layout. Pick a family, then fine-tune its color, font,
            and photo variants. Your content flows into every design — switch anytime without losing a word.`}
          </p>
        </div>

        {/* Filters */}
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
        </div>

        {/* Family Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl mb-12">
            <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-1">No families match these filters.</p>
            <button
              onClick={() => { setLevelFilter("all"); setCategoryFilter("all"); }}
              className="text-sm font-semibold text-accent-600 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {filtered.map(({ family, canonicalId, variantIds: variants }) => {
              // We'll use a slightly smaller scale for 4 columns
              const CARD_SCALE = 0.315; 
              
              return (
                <button
                  key={family.id}
                  onClick={() => {
                    setSelectedFamilyId(family.id);
                    setPreviewFamily(family.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setPreviewFamily(family.id);
                  }}
                  className={cn(
                    "bg-white rounded-xl overflow-hidden text-left transition-all duration-300 hover:shadow-xl group relative flex flex-col",
                    selectedFamilyId === family.id
                      ? "ring-2 ring-accent-500 shadow-xl"
                      : "border border-gray-200 hover:border-gray-300 shadow-sm"
                  )}
                >
                  {/* Preview window — real template rendering, full page aspect ratio */}
                  <div
                    className="relative w-full bg-white overflow-hidden border-b border-gray-100 flex justify-center"
                    style={{ height: `calc(297mm * ${CARD_SCALE})` }}
                  >
                    <div
                      className="origin-top-center"
                      style={{
                        width: "210mm",
                        minHeight: "297mm",
                        transform: `scale(${CARD_SCALE})`,
                        transformOrigin: "top center",
                      }}
                    >
                      <TemplateRenderer
                        resume={{ ...SAMPLE_RESUME, template: canonicalId as ResumeTemplate }}
                      />
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
                  </div>

                  {/* Info (Clean, exactly as requested) */}
                  <div className="p-5 flex flex-col gap-1.5 flex-1">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{family.name}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{family.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected family detail + CTA */}
        {selectedFamily && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedFamily.name}</h2>
                  {POPULAR_FAMILIES.has(selectedFamily.id) && (
                    <span className="bg-accent-100 text-accent-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-accent-600" />
                      Popular
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <AtsBadge score={templateAtsScore(previewId)} size="md" />
                  <TierBadge tier={previewMeta?.tier ?? "free"} />
                  <span className="inline-block text-xs font-bold text-accent-600 bg-accent-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {selectedFamily.category}
                  </span>
                  <span className="inline-block text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {selectedFamily.levels.slice(0, 3).join(" · ")}
                  </span>
                </div>
                <p className="text-base text-gray-600 mb-3 leading-relaxed">{selectedFamily.description}</p>
                <p className="text-sm text-gray-400 mb-6">
                  {previewMeta?.atsLabel} · Best for: {selectedFamily.bestFor}
                </p>

                {/* Variant picker — color/font/photo siblings of the same family */}
                {variantCount > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Variants — same layout, different look ({variantCount})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedVariantId(null)}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                          previewId === selectedEntry.canonicalId
                            ? "border-accent-500 bg-accent-50 text-accent-700 shadow-sm"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedFamily.accent }}
                        />
                        {getTemplateMetadata(selectedEntry.canonicalId)?.name}
                      </button>
                      {variantIds.map((vid) => {
                        const vmeta = getTemplateMetadata(vid);
                        if (!vmeta) return null;
                        return (
                          <button
                            key={vid}
                            onClick={() => setSelectedVariantId(vid)}
                            className={cn(
                              "inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                              previewId === vid
                                ? "border-accent-500 bg-accent-50 text-accent-700 shadow-sm"
                                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: vmeta.accent }}
                            />
                            {vmeta.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={openTemplateSetup}
                    disabled={creating}
                    className="inline-flex items-center gap-2 h-12 px-6"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Use {previewMeta?.name || selectedFamily.name}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => handleUseTemplate(previewId)}
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
                <div 
                  className="bg-white shadow-xl overflow-hidden border border-gray-200"
                  style={{
                    width: `calc(210mm * ${DETAIL_PREVIEW_SCALE})`,
                    height: `calc(297mm * ${DETAIL_PREVIEW_SCALE})`,
                  }}
                >
                  <div
                    className="origin-top-left"
                    style={{
                      width: "210mm",
                      minHeight: "297mm",
                      transform: `scale(${DETAIL_PREVIEW_SCALE})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <TemplateRenderer
                      resume={{ ...SAMPLE_RESUME, template: previewId as ResumeTemplate }}
                    />
                  </div>
                </div>
                {/* Preview actions */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={() => setPreviewFamily(selectedFamily.id)}
                    className="w-10 h-10 rounded-full bg-white/95 backdrop-blur shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:scale-110 transition-all"
                    title="Full preview"
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
            targetLevel={targetLevelForFamily(selectedFamily)}
            onCreated={handleCreated}
          />
        )}

        {/* Quick Preview Drawer */}
        {previewFamily && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setPreviewFamily(null)}
            />
            <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl shadow-gray-900/40 flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200">
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">
                    {CATALOG.find((c) => c.family.id === previewFamily)?.family.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Right-click on any template card for quick preview
                  </p>
                </div>
                <button
                  onClick={() => setPreviewFamily(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 pt-4 flex-1 min-h-0 overflow-hidden flex items-center justify-center bg-gray-50">
                {(() => {
                  const entry = CATALOG.find((c) => c.family.id === previewFamily);
                  if (!entry) return null;
                  const meta = getTemplateMetadata(entry.canonicalId);
                  const accent = entry.family.accent || meta?.accent || "#64748b";
                  return (
                    <div className="flex flex-col items-center gap-4">
                      {/* Theme swatches */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">Theme:</span>
                        {[
                          accent,
                          "#3b82f6",
                          "#10b981",
                          "#f59e0b",
                          "#ef4444",
                          "#8b5cf6",
                          "#ec4899",
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => setPreviewAccent(color)}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                              previewAccent === color ? "border-gray-900 scale-110" : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div 
                        className="bg-white shadow-2xl overflow-hidden border border-gray-200"
                        style={{
                          width: `calc(210mm * ${DETAIL_PREVIEW_SCALE})`,
                          height: `calc(297mm * ${DETAIL_PREVIEW_SCALE})`,
                        }}
                      >
                        <div
                          className="origin-top-left"
                          style={{
                            width: "210mm",
                            minHeight: "297mm",
                            transform: `scale(${DETAIL_PREVIEW_SCALE})`,
                            transformOrigin: "top left",
                          }}
                        >
                          <TemplateRenderer
                            resume={{ ...SAMPLE_RESUME, template: entry.canonicalId as ResumeTemplate, accentColor: previewAccent }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-4">
                        <Button
                          variant="accent"
                          size="lg"
                          onClick={() => {
                            setPreviewFamily(null);
                            openTemplateSetup();
                          }}
                          disabled={creating}
                          className="inline-flex items-center gap-2 px-8"
                        >
                          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          Use {meta?.name || entry.family.name}
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
