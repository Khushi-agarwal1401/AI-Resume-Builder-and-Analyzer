"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { Check, Loader2, LayoutTemplate } from "lucide-react";
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
            <p className="text-gray-500 mb-1">No families match these filters.</p>
            <button
              onClick={() => { setLevelFilter("all"); setCategoryFilter("all"); }}
              className="text-sm font-semibold text-accent-600 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filtered.map(({ family, canonicalId, variantIds: variants }) => {
              const meta = getTemplateMetadata(canonicalId);
              const accent = family.accent || meta?.accent || "#64748b";
              const variantsInFamily = variants.length;
              return (
                <button
                  key={family.id}
                  onClick={() => setSelectedFamilyId(family.id)}
                  className={cn(
                    "bg-white border-2 rounded-xl overflow-hidden text-left transition-all duration-200 hover:shadow-md group",
                    selectedFamilyId === family.id
                      ? "border-accent-500 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {/* Preview window — real template rendering */}
                  <div
                    className="h-[180px] relative overflow-hidden"
                    style={{ background: gradientFromHex(accent) }}
                  >
                    <div className="absolute inset-4 bg-white rounded-sm shadow-md overflow-hidden">
                      <div
                        className="origin-top-left"
                        style={{
                          width: "210mm",
                          transform: `scale(${GRID_PREVIEW_SCALE})`,
                          transformOrigin: "top left",
                        }}
                      >
                        <TemplateRenderer
                          resume={{ ...SAMPLE_RESUME, template: canonicalId as ResumeTemplate }}
                        />
                      </div>
                    </div>
                    {POPULAR_FAMILIES.has(family.id) && (
                      <span className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[9px] font-bold text-accent-600 px-2 py-0.5 rounded-full shadow-sm">
                        Popular
                      </span>
                    )}
                    {selectedFamilyId === family.id && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-accent-500 text-white flex items-center justify-center shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-h3 text-black">{family.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0",
                          LAYOUT_BADGE[TEMPLATE_LAYOUT[canonicalId]]?.bg || "bg-gray-100",
                          LAYOUT_BADGE[TEMPLATE_LAYOUT[canonicalId]]?.text || "text-gray-500"
                        )}>
                          <span className={cn(
                            "w-1 h-1 rounded-full",
                            LAYOUT_BADGE[TEMPLATE_LAYOUT[canonicalId]]?.dot || "bg-gray-400"
                          )} />
                          {LAYOUT_BADGE[TEMPLATE_LAYOUT[canonicalId]]?.label || "—"}
                        </span>
                        <span className="text-micro font-medium text-gray-400 uppercase tracking-wider">
                          {family.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <AtsBadge score={templateAtsScore(canonicalId)} />
                      <TierBadge tier={meta?.tier ?? "free"} />
                      {variantsInFamily > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                          +{variantsInFamily} variant{variantsInFamily > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-small text-gray-500 line-clamp-2">{family.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected family detail + CTA */}
        {selectedFamily && (
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-h2 text-black mb-2">{selectedFamily.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <AtsBadge score={templateAtsScore(previewId)} size="md" />
                  <TierBadge tier={previewMeta?.tier ?? "free"} />
                  <span className="inline-block text-micro font-bold text-accent-600 bg-accent-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    {selectedFamily.category}
                  </span>
                  <span className="inline-block text-micro font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    {selectedFamily.levels.join(" · ")}
                  </span>
                </div>
                <p className="text-body text-gray-600 mb-2 leading-relaxed">{selectedFamily.description}</p>
                <p className="text-small text-gray-400 mb-6">
                  {previewMeta?.atsLabel} · Best for: {selectedFamily.bestFor}
                </p>

                {/* Variant picker — color/font/photo siblings of the same family */}
                {variantCount > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Variants — same layout, different look ({variantCount})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedVariantId(null)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all",
                          previewId === selectedEntry.canonicalId
                            ? "border-accent-500 bg-accent-50 text-accent-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
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
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all",
                              previewId === vid
                                ? "border-accent-500 bg-accent-50 text-accent-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
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
                    className="inline-flex items-center gap-2"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Use {previewMeta?.name || selectedFamily.name}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => handleUseTemplate(previewId)}
                    disabled={creating}
                    className="inline-flex items-center gap-2"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Start with Empty
                  </Button>
                </div>
              </div>

              {/* Large real template preview */}
              <div
                className="h-[360px] rounded-xl overflow-hidden relative flex items-center justify-center"
                style={{ background: gradientFromHex(previewMeta?.accent || selectedFamily.accent) }}
              >
                <div className="absolute inset-5 bg-white rounded-lg shadow-xl overflow-hidden">
                  <div
                    className="origin-top-left"
                    style={{
                      width: "210mm",
                      transform: `scale(${DETAIL_PREVIEW_SCALE})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <TemplateRenderer
                      resume={{ ...SAMPLE_RESUME, template: previewId as ResumeTemplate }}
                    />
                  </div>
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
      </div>
    </DashboardLayout>
  );
}
