"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, Eye, LayoutTemplate, Loader2, Sparkles, Star } from "lucide-react";
import { getTemplateMetadata } from "../../config/template-registry";
import { getFamilyForTemplate } from "../../config/template-families";
import { TEMPLATE_NAMES, LAYOUT_BADGE, TEMPLATE_DISPLAY } from "../../config/template-constants";
import { AtsBadge, TierBadge } from "@/components/ui/AtsBadge";
import type { ResumeData, ResumeTemplate } from "@/types/resume";
import { TemplatePreview } from "./TemplatePreview";

interface TemplateCardProps {
  templateId: string;
  /** Resume rendered inside the real template preview. */
  resume: ResumeData;
  selected?: boolean;
  popular?: boolean;
  scale?: number;
  busy?: boolean;
  onSelect?: (id: string) => void;
  /** Opens the large detail/preview view. */
  onPreview?: (id: string) => void;
  /** Creates a resume / applies the template. */
  onUse?: (id: string) => void;
}

/**
 * Marketplace card: a REAL miniature resume preview (not a placeholder), the
 * template's honest ATS/tier/layout badges, description, and per-card actions.
 */
export function TemplateCard({
  templateId,
  resume,
  selected = false,
  popular = false,
  scale = 0.315,
  busy = false,
  onSelect,
  onPreview,
  onUse,
}: TemplateCardProps) {
  const meta = getTemplateMetadata(templateId);
  const family = getFamilyForTemplate(templateId);

  const previewResume = useMemo(
    () => ({ ...resume, template: templateId as ResumeTemplate }),
    [resume, templateId]
  );

  const layoutBadge = meta ? LAYOUT_BADGE[meta.layout] : null;
  const name = meta?.name || TEMPLATE_NAMES[templateId] || family.name || templateId;
  const description = meta?.description || family.description || "";
  const roles = (meta?.targetRoles ?? []).slice(0, 3);

  return (
    <div
      className={cn(
        "group relative flex flex-col bg-white rounded-xl overflow-hidden text-left transition-all duration-300",
        selected
          ? "ring-2 ring-accent-500 shadow-xl"
          : "border border-gray-200 hover:border-gray-300 hover:shadow-xl shadow-sm",
        busy && "opacity-60 pointer-events-none"
      )}
    >
      {/* Real template preview window — the selection target */}
      <div
        role="button"
        tabIndex={onSelect ? 0 : undefined}
        aria-pressed={selected}
        onClick={() => onSelect?.(templateId)}
        onKeyDown={(e) => {
          if (!onSelect) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(templateId);
          }
        }}
        className="relative w-full bg-white border-b border-gray-100 cursor-pointer"
      >
        <TemplatePreview resume={previewResume} scale={scale} />
        {popular && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur border border-gray-200 text-[10px] font-bold text-amber-600 shadow-sm">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            Popular
          </span>
        )}
        {selected && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-500 text-white text-[10px] font-bold shadow-sm">
            <Check className="w-3 h-3" strokeWidth={3} />
            Selected
          </span>
        )}

        {/* Hover actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4">
          <div className="flex items-center gap-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
            {onPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(templateId);
                }}
                className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur text-gray-900 text-xs font-bold px-3.5 py-2 rounded-full shadow-xl hover:bg-white active:scale-95 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            )}
            {onUse && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUse(templateId);
                }}
                className="inline-flex items-center gap-1.5 bg-accent-500 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-xl hover:bg-accent-600 active:scale-95 transition-all"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Use Template
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-bold text-gray-900 leading-tight group-hover:text-accent-700 transition-colors">
            {name}
          </h3>
          <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            <LayoutTemplate className="w-2.5 h-2.5" />
            {TEMPLATE_DISPLAY[templateId] || name.split(" ")[0]}
          </span>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{description}</p>

        {meta && (
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <AtsBadge score={meta.atsScore} showStars={false} size="xs" />
            <TierBadge tier={meta.tier} />
            {layoutBadge && (
              <span className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                layoutBadge.bg,
                layoutBadge.text
              )}>
                {layoutBadge.label}
              </span>
            )}
          </div>
        )}

        {roles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {roles.map((r) => (
              <span
                key={r}
                className="px-1.5 py-0.5 rounded-md text-[9px] font-medium text-gray-500 bg-gray-50 border border-gray-100"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
