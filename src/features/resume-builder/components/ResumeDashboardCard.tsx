"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  MoreVertical,
  Copy,
  Download,
  Trash,
  Edit3,
  Palette,
  ChevronDown,
  Check,
  Gauge,
  Target,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  Eye,
  Star,
  Clock,
} from "lucide-react";
import { TEMPLATE_DISPLAY, TEMPLATE_BADGE } from "@/features/resume-builder/config/template-constants";
import { getTemplateMetadata } from "@/features/resume-builder/config/template-registry";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import { useResume, type ResumeListItem } from "@/lib/query/resume-hooks";
import type { ResumeTemplate } from "@/types/resume";

/** A4 is 210mm wide (~794px @96dpi). Cards render the REAL resume at this
 * scale and clip to the top of the page — masthead + first sections. */
const PREVIEW_SCALE = 0.26;

function AtsRing({ score, size = 46 }: { score: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative shrink-0" title={`ATS score ${score}/100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, score)) / 100)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums"
        style={{ color: tone }}
      >
        {score}
      </span>
    </div>
  );
}

/** Design-aware placeholder used while data loads or if the fetch fails. */
function FallbackThumb({ template, accent }: { template: string; accent: string }) {
  const meta = getTemplateMetadata(template);
  const layout = meta?.layout ?? "single";
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${accent}1f 0%, ${accent}05 100%)` }}
    >
      <div className="w-[130px] h-[172px] bg-white rounded-[5px] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)] p-3 space-y-2">
        <div className="h-2 w-16 rounded-full" style={{ background: accent }} />
        <div className="h-1.5 w-full bg-gray-200 rounded-full" />
        <div className="h-1.5 w-4/5 bg-gray-200 rounded-full" />
        <div className="h-1.5 w-11/12 bg-gray-200 rounded-full" />
        {layout !== "single" && (
          <div className="flex gap-2 pt-1.5">
            <div className="w-[70%] space-y-1.5">
              <div className="h-1.5 w-full bg-gray-200 rounded-full" />
              <div className="h-1.5 w-5/6 bg-gray-200 rounded-full" />
              <div className="h-1.5 w-2/3 bg-gray-200 rounded-full" />
            </div>
            <div className="w-[24%] rounded-sm" style={{ background: `${accent}22` }} />
          </div>
        )}
      </div>
      <span className="absolute bottom-2 right-2.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">
        {meta?.name || layout}
      </span>
    </div>
  );
}

interface ResumeDashboardCardProps {
  resume: ResumeListItem;
  isSwitching: boolean;
  onOpen: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onChangeTemplate: (id: string, template: string) => void;
  onCheckAts: (id: string) => void;
  onTogglePin?: (id: string, pinned: boolean) => void;
}

export function ResumeDashboardCard({
  resume,
  isSwitching,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onDownload,
  onChangeTemplate,
  onCheckAts,
  onTogglePin,
}: ResumeDashboardCardProps) {
  const { data, isLoading } = useResume(resume.id);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(resume.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const accent = getTemplateMetadata(resume.template)?.accent ?? "#64748b";
  const badge = TEMPLATE_BADGE[resume.template];

  function commitRename() {
    setEditing(false);
    if (editTitle.trim() && editTitle.trim() !== resume.title) {
      onRename(resume.id, editTitle.trim());
    }
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm",
        "dark:bg-gray-900 dark:border-gray-800",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_-18px_rgba(0,0,0,0.22)]",
        "dark:hover:shadow-[0_18px_44px_-18px_rgba(0,0,0,0.65)]",
        menuOpen ? "z-50" : "z-10",
        resume.is_pinned
          ? "border-amber-300 ring-1 ring-amber-200/60 dark:border-amber-500/50 dark:ring-amber-400/20 hover:border-amber-400 dark:hover:border-amber-400/70"
          : "hover:border-gray-300 dark:hover:border-gray-700"
      )}
    >
      {/* ── Real resume preview ─────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open ${resume.title}`}
        onClick={() => onOpen(resume.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(resume.id);
          }
        }}
        style={{ contentVisibility: "auto" }}
        className="relative h-48 w-full overflow-hidden rounded-t-2xl text-left bg-gray-50 border-b border-gray-100 cursor-pointer dark:bg-gray-800/50 dark:border-gray-700/60"
      >
        {/* Soft accent wash behind the paper */}
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(120% 90% at 50% 0%, ${accent}14 0%, transparent 70%)` }}
        />

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[150px] h-[196px] bg-white rounded-[5px] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] p-3.5 space-y-2.5">
              {[3, 2.5, 4, 3, 3.5].map((w, i) => (
                <div key={i} className="rounded-full bg-gray-100 shimmer-badge animate-pulse" style={{ width: `${w * 8}%`, height: 7 }} />
              ))}
            </div>
          </div>
        ) : data ? (
          <div className="absolute left-1/2 top-5 -translate-x-1/2">
            {/* Paper stack — two offset sheets behind for depth.
                Width ≈ 210mm × PREVIEW_SCALE (0.26) ≈ 206px, matching the scaled paper. */}
            <div className="absolute -left-2.5 top-2 w-[206px] h-[190px] bg-white/70 rounded-[3px] shadow-sm dark:bg-gray-700/60" />
            <div className="absolute -right-2.5 top-1.5 w-[206px] h-[190px] bg-white/85 rounded-[3px] shadow-sm dark:bg-gray-600/60" />
            <div className="relative bg-white rounded-[3px] shadow-[0_12px_36px_-14px_rgba(0,0,0,0.32)] overflow-hidden">
              <div
                className="origin-top-left"
                style={{ width: "210mm", transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left" }}
              >
                <TemplateRenderer
                  resume={{ ...data, template: (data.template || resume.template) as ResumeTemplate }}
                />
              </div>
            </div>
          </div>
        ) : (
          <FallbackThumb template={resume.template} accent={accent} />
        )}

        {/* Hover action — gradient veil + quick actions.
            `invisible` (not just opacity-0) keeps the hidden buttons out of the tab order. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 flex items-center justify-center">
          <div className="flex items-center gap-2 scale-90 group-hover:scale-100 transition-transform duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen(resume.id);
              }}
              className="inline-flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-xl hover:bg-gray-50 active:scale-95 transition-all"
            >
              Open Builder <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(resume.id);
              }}
              className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur text-gray-700 text-xs font-bold px-4 py-2 rounded-full shadow-xl hover:bg-white active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {/* ATS ring — top right, over the paper */}
        {resume.ats_score !== null ? (
          <div className="absolute top-3 right-3">
            <AtsRing score={resume.ats_score} />
          </div>
        ) : (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur border border-gray-200 text-[10px] font-bold text-gray-500 shadow-sm dark:bg-gray-800/90 dark:border-gray-700 dark:text-gray-300">
            <Target className="w-3 h-3" /> Check ATS
          </span>
        )}
      </div>

      {/* ── Card body ───────────────────────────────────────────────── */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {resume.is_pinned && (
          <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/70 text-[10px] font-bold uppercase tracking-wider dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
            Pinned
          </span>
        )}
        <div className="flex items-start justify-between gap-2">
          {editing ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => e.key === "Enter" && commitRename()}
              className="flex-1 min-w-0 text-[15px] font-bold text-gray-900 border-b-2 border-accent-500 outline-none bg-transparent pb-0.5 dark:text-gray-100"
              aria-label="Resume title"
            />
          ) : (
            <h3
              onClick={() => onOpen(resume.id)}
              className="flex-1 min-w-0 text-[15px] font-bold text-gray-900 dark:text-gray-100 truncate cursor-pointer group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors"
            >
              {resume.title}
            </h3>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {onTogglePin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(resume.id, !resume.is_pinned);
                }}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  resume.is_pinned
                    ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                    : "text-gray-300 dark:text-gray-600 hover:text-amber-500 hover:bg-amber-50/60 dark:hover:bg-amber-500/10"
                )}
                aria-label={resume.is_pinned ? "Unpin resume" : "Pin resume"}
                title={resume.is_pinned ? "Unpin" : "Pin to top"}
              >
                <Star
                  size={17}
                  className={cn(
                    "transition-all duration-200",
                    resume.is_pinned ? "fill-amber-400 text-amber-500 scale-105" : "hover:scale-110"
                  )}
                />
              </button>
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                  setPickerOpen(false);
                }}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-500 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                aria-label="Resume actions"
              >
                <MoreVertical size={18} />
              </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-20 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <MenuItem
                  icon={<Edit3 size={15} />}
                  label="Rename"
                  onClick={() => {
                    setEditTitle(resume.title);
                    setEditing(true);
                    setMenuOpen(false);
                  }}
                />
                <MenuItem icon={<Copy size={15} />} label="Duplicate" onClick={() => { setMenuOpen(false); onDuplicate(resume.id); }} />
                <MenuItem icon={<Download size={15} />} label="Download PDF" onClick={() => { setMenuOpen(false); onDownload(resume.id); }} />
                <div className="h-px bg-gray-100 my-1 dark:bg-gray-700" />
                <MenuItem
                  icon={<Trash size={15} />}
                  label="Delete"
                  danger
                  onClick={() => { setMenuOpen(false); onDelete(resume.id); }}
                />
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Template chip + switcher */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPickerOpen((v) => !v);
              setMenuOpen(false);
            }}
            disabled={isSwitching}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:scale-[1.03] active:scale-95",
              badge?.bg || "bg-gray-100",
              badge?.text || "text-gray-600",
              isSwitching && "opacity-50 animate-pulse"
            )}
            title="Change template"
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", badge?.dot || "bg-gray-400")} />
            <Palette className="w-3 h-3 opacity-70" />
            {TEMPLATE_DISPLAY[resume.template] || resume.template}
            <ChevronDown className={cn("w-3 h-3 opacity-50 transition-transform", pickerOpen && "rotate-180")} />
          </button>

          {pickerOpen && (
            <div
              className="absolute left-0 top-full mt-1.5 z-20 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-[230px] grid grid-cols-2 gap-1 dark:bg-gray-800 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {Object.entries(TEMPLATE_DISPLAY).map(([key, label]) => {
                const b = TEMPLATE_BADGE[key];
                const active = resume.template === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setPickerOpen(false);
                      onChangeTemplate(resume.id, key);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left",
                      active ? "ring-2 ring-offset-1 ring-gray-300 dark:ring-gray-600" : "hover:bg-gray-50 dark:hover:bg-gray-700/50",
                      b?.bg,
                      b?.text || "text-gray-600 dark:text-gray-300"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", b?.dot || "bg-gray-400")} />
                    <span className="flex-1 truncate">{label}</span>
                    {active && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Top skills — surfaces the resume's actual technical skills on the card */}
        {data && !isLoading && (
          <div>
            {(() => {
              const technical = data.skills?.technical ?? [];
              const tools = data.skills?.tools ?? [];
              const all = [...technical, ...tools];
              const shown = all.slice(0, 5);
              if (shown.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-1.5">
                  {shown.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium border truncate max-w-[110px]"
                      style={{ color: accent, borderColor: `${accent}33`, backgroundColor: `${accent}0d` }}
                      title={s}
                    >
                      {s}
                    </span>
                  ))}
                  {all.length > shown.length && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-gray-400 dark:text-gray-500">
                      +{all.length - shown.length}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Footer: ATS + edited date */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCheckAts(resume.id);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all hover:scale-[1.03] active:scale-95 group/chip",
              resume.ats_score === null
                ? "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                : resume.ats_score >= 70
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
                  : resume.ats_score >= 45
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25"
                    : "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
            )}
            title="Check or recheck this resume's ATS score"
          >
            {resume.ats_score === null ? (
              <>
                <Target className="w-3 h-3" /> Check ATS
              </>
            ) : (
              <>
                <Gauge className="w-3 h-3" /> ATS {resume.ats_score}
                <RefreshCw className="w-2.5 h-2.5 opacity-60 group-hover/chip:rotate-180 transition-transform duration-300" />
              </>
            )}
          </button>
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 truncate dark:text-gray-500">
            <Clock className="w-3 h-3" />
            Edited {new Date(resume.updated_at).toLocaleDateString()}
          </span>
        </div>

        {/* View / download counters (K-02) */}
        <div className="flex items-center gap-4 pt-2.5 mt-1 border-t border-gray-100 text-[11px] text-gray-400 dark:border-gray-800 dark:text-gray-500">
          <span className="inline-flex items-center gap-1.5" title="Times viewed via share link">
            <Eye className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span className="font-semibold tabular-nums text-gray-500 dark:text-gray-300">{resume.view_count ?? 0}</span>
            <span className="text-gray-400 dark:text-gray-500">views</span>
          </span>
          <span className="inline-flex items-center gap-1.5" title="Times downloaded">
            <Download className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span className="font-semibold tabular-nums text-gray-500 dark:text-gray-300">{resume.download_count ?? 0}</span>
            <span className="text-gray-400 dark:text-gray-500">downloads</span>
          </span>
        </div>
      </div>

      {isSwitching && (
        <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center z-30">
          <Loader2 className="w-6 h-6 text-accent-500 animate-spin" />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-2 text-[13px] flex items-center gap-2.5 transition-colors",
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/60"
      )}
    >
      {icon} {label}
    </button>
  );
}
