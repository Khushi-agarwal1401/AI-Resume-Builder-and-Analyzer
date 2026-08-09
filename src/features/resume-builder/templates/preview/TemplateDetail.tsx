"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { TemplateDevicePreview } from "../../components/TemplateDevicePreview";
import { getTemplateMetadata } from "../../config/template-registry";
import { getFamilyForTemplate } from "../../config/template-families";
import { TEMPLATE_NAMES, LAYOUT_BADGE } from "../../config/template-constants";
import { getTemplateInfo } from "../../config/template-discovery";
import { AtsBadge, TierBadge } from "@/components/ui/AtsBadge";
import type { ResumeData, ResumeTemplate } from "@/types/resume";

interface TemplateDetailProps {
  templateId: string;
  /** The resume rendered inside the large interactive preview. */
  resume: ResumeData;
  /** Optional accent override for the live preview (theme swatches). */
  accent?: string;
  onAccentChange?: (hex: string) => void;
  onClose: () => void;
  onUse?: (id: string) => void;
  busy?: boolean;
}

const ACCENT_SWATCHES = ["#64748b", "#2563eb", "#059669", "#d97706", "#db2777", "#7c3aed", "#dc2626", "#111827"];

/**
 * Full-screen template detail view: a large interactive preview with device
 * toggle (desktop/tablet/mobile), zoom in/out, fit-to-screen, the template's
 * full metadata, and the "Use this template" call-to-action.
 */
export function TemplateDetail({
  templateId,
  resume,
  accent,
  onAccentChange,
  onClose,
  onUse,
  busy = false,
}: TemplateDetailProps) {
  const [previewAccent, setPreviewAccent] = useState<string>(accent ?? "#64748b");

  // Close on Escape + lock background scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const meta = getTemplateMetadata(templateId);
  const family = getFamilyForTemplate(templateId);
  const info = getTemplateInfo(templateId, meta?.name || TEMPLATE_NAMES[templateId] || family.name || templateId);

  const previewResume = useMemo<ResumeData>(() => {
    const base = { ...resume, template: templateId as ResumeTemplate };
    return accent === undefined ? base : { ...base, accentColor: previewAccent };
  }, [resume, templateId, accent, previewAccent]);

  const name = meta?.name || family.name || templateId;
  const description = meta?.description || family.description || "";
  const roles = meta?.targetRoles ?? [];

  function handleAccent(hex: string) {
    setPreviewAccent(hex);
    onAccentChange?.(hex);
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </button>

          <div className="min-w-0 flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 truncate">{name}</h2>
            {meta && (
              <div className="hidden md:flex items-center gap-1.5">
                <AtsBadge score={meta.atsScore} size="xs" />
                <TierBadge tier={meta.tier} />
              </div>
            )}
          </div>

          <button
            onClick={onUse ? () => onUse(templateId) : onClose}
            disabled={busy}
            className="inline-flex items-center gap-1.5 bg-accent-500 hover:bg-accent-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg shadow-accent-500/25 transition-all active:scale-95 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Use this template
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Interactive live preview */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-5 h-[75vh] min-h-[480px]">
            <TemplateDevicePreview
              resume={previewResume}
              className="h-full"
              accentColors={ACCENT_SWATCHES}
              accent={previewAccent}
              onAccentChange={handleAccent}
            />
          </div>

          {/* Metadata panel */}
          <aside className="space-y-4">
            {/* Description */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">About this template</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              <p className="text-xs text-gray-400 mt-3">
                <span className="font-semibold text-gray-500">Best for:</span> {meta?.bestFor || family.bestFor}
              </p>
            </section>

            {/* Category + badges */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Details</h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {meta && <AtsBadge score={meta.atsScore} size="sm" />}
                {meta && <TierBadge tier={meta.tier} />}
                {meta && (
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    LAYOUT_BADGE[meta.layout].bg,
                    LAYOUT_BADGE[meta.layout].text
                  )}>
                    {LAYOUT_BADGE[meta.layout].label} · {info.layout}
                  </span>
                )}
              </div>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-400">Category</dt>
                  <dd className="font-semibold text-gray-700 capitalize">{meta?.category ?? family.category}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-400">Pages</dt>
                  <dd className="font-semibold text-gray-700">{info.pages}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-400">ATS status</dt>
                  <dd className="font-semibold text-gray-700">{meta?.atsLabel ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-400">Emphasizes</dt>
                  <dd className="font-semibold text-gray-700 text-right max-w-[180px]">
                    {info.sections.slice(0, 4).join(", ")}
                  </dd>
                </div>
              </dl>
            </section>


            {/* Target roles */}
            {roles.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Good for roles</h3>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <span key={r} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-medium text-gray-600">
                      <Check className="w-3 h-3 text-accent-500" strokeWidth={3} />
                      {r}
                    </span>
                  ))}
                </div>
              </section>
            )}

          </aside>
        </div>
      </div>
    </div>
  );
}
