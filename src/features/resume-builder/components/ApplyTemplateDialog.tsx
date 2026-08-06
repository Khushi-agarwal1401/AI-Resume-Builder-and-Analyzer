"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, FileText, Gauge, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { TEMPLATE_BADGE, TEMPLATE_DISPLAY } from "@/features/resume-builder/config/template-constants";
import { RESUME_TYPES } from "@/features/resume-builder/config/resume-types";
import { MemoTemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import { useInView } from "@/features/resume-builder/hooks/useInView";
import type { ResumeData, ResumeTemplate } from "@/types/resume";
import type { ResumeListItem } from "@/services/resume/completion";

interface ApplyTemplateDialogProps {
  /** Template key to apply, e.g. "executive". */
  templateKey: string;
  /** Human-friendly template name for messages. */
  templateName: string;
  onClose: () => void;
  /** Fired after the template was successfully applied to a resume. */
  onApplied: (resumeId: string) => void;
}

/** Scale for the live preview thumbnail inside each resume row (~72px wide). */
const THUMB_SCALE = 0.09;
/** Scale for the enlarge-on-hover peek (~150px wide — ~2.1× the thumbnail). */
const PEEK_SCALE = 0.19;
/** Abort a per-row preview fetch that hangs this long — placeholder instead of infinite skeleton. */
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Live preview of one of the user's resumes rendered with the template being
 * applied — so they see exactly how their content will look before restyling.
 * Lazily fetches the resume's full data AND renders the (expensive) template
 * only when the row is near the viewport, so dialogs with many resumes don't
 * fire N full-data requests (or N template renders) up front.
 */
function ResumePreviewThumb({
  resumeId,
  templateKey,
}: {
  resumeId: string;
  templateKey: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "200px 0px", once: true });
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hideTimer = useRef<number | null>(null);

  // Memoize the resume rendered with the target template so both the thumbnail
  // and the hover peek reuse the same prepared data.
  const previewResume = useMemo(
    () => (resume ? { ...resume, template: templateKey as ResumeTemplate } : null),
    [resume, templateKey]
  );

  // Keep the peek alive briefly after the cursor leaves the thumbnail so the
  // user can move toward it to read the enlarged preview (it floats to the
  // right, outside the thumbnail's own hover area).
  const showPeek = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setHovered(true);
  };

  const hidePeek = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setHovered(false), 250);
  };

  // Fetch this resume's full data only once its row scrolls near the viewport.
  // `failed` stops a retry storm if a request errors — the row keeps its
  // fallback placeholder instead of hammering the API.
  useEffect(() => {
    if (!inView || resume || loading || failed) return;
    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, FETCH_TIMEOUT_MS);
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/resumes/${resumeId}`, { signal: controller.signal });
        const json = await res.json();
        if (controller.signal.aborted) {
          // Unmount aborts are a no-op; a timeout abort (response landed right
          // as the timer fired) must still fall back to the placeholder.
          if (timedOut) {
            setFailed(true);
            setLoading(false);
          }
          return;
        }
        if (json.success && json.data) setResume(json.data as ResumeData);
        else setFailed(true);
      } catch {
        // AbortError on unmount is expected — don't flip to the failed state.
        // A timeout abort means the request hung: fall back to the placeholder.
        if (!controller.signal.aborted || timedOut) {
          setFailed(true);
          setLoading(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [inView, resumeId, resume, loading, failed]);

  // Clear the peek hide-timer if the dialog closes mid-grace.
  useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={showPeek}
      onMouseLeave={hidePeek}
      className="relative shrink-0"
    >
      <div
        className={cn(
          "w-[72px] h-[100px] rounded-lg overflow-hidden border border-gray-200",
          previewResume
            ? "bg-white shadow-sm pointer-events-none select-none"
            : "bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
        )}
      >
        {loading || !previewResume ? (
          loading ? (
            <div aria-hidden="true" className="w-full p-2 space-y-1.5">
              <div className="h-1.5 w-2/3 rounded skeleton-shimmer" />
              <div className="h-1 w-full rounded skeleton-shimmer" />
              <div className="h-1 w-5/6 rounded skeleton-shimmer" />
              <div className="h-1 w-1/2 rounded skeleton-shimmer" />
            </div>
          ) : (
            <FileText className="w-5 h-5 text-gray-300" />
          )
        ) : inView ? (
          <div
            className="origin-top-left"
            style={{ width: "210mm", transform: `scale(${THUMB_SCALE})`, transformOrigin: "top left" }}
          >
            <MemoTemplateRenderer resume={previewResume} />
          </div>
        ) : (
          <div aria-hidden="true" className="p-2 space-y-1.5">
            <div className="h-1.5 w-2/3 rounded skeleton-shimmer" />
            <div className="h-1 w-full rounded skeleton-shimmer" />
            <div className="h-1 w-5/6 rounded skeleton-shimmer" />
            <div className="h-1 w-1/2 rounded skeleton-shimmer" />
          </div>
        )}
      </div>

      {/* Enlarge-on-hover: a floating peek of the same resume in the target
          template so the user can inspect it closely before applying. */}
      {hovered && previewResume && (
        <div aria-hidden="true" className="absolute left-full top-0 ml-2.5 z-20 pointer-events-none">
          <div className="relative w-[150px] rounded-lg overflow-hidden border border-gray-100 bg-white shadow-xl shadow-gray-900/20 ring-1 ring-black/5 animate-in zoom-in-95 fade-in duration-150">
            <div
              className="origin-top-left"
              style={{ width: "210mm", transform: `scale(${PEEK_SCALE})`, transformOrigin: "top left" }}
            >
              <MemoTemplateRenderer resume={previewResume} />
            </div>
          </div>
          <div className="absolute -left-[3px] top-3 w-2 h-2 rotate-45 bg-white border-l border-b border-gray-100" />
        </div>
      )}
    </div>
  );
}

/**
 * "Use on existing resume" — lets the user restyle one of their existing
 * resumes with the chosen template. Applies the same write path as the
 * dashboard's template switcher (PUT /api/resumes/[id] with { template }),
 * so the resume's content is preserved and only the layout changes.
 */
export function ApplyTemplateDialog({ templateKey, templateName, onClose, onApplied }: ApplyTemplateDialogProps) {
  const [resumes, setResumes] = useState<ResumeListItem[] | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Fetch the user's resumes for the picker
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/resumes", { signal: controller.signal });
        const json = await res.json();
        if (!controller.signal.aborted) {
          setResumes(json.success && Array.isArray(json.data) ? json.data : []);
        }
      } catch {
        if (!controller.signal.aborted) setResumes([]);
      }
    })();
    return () => controller.abort();
  }, []);

  // Close on Escape and lock background scroll while open
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

  async function handleApply(resumeId: string, title: string) {
    if (applyingId) return;
    setApplyingId(resumeId);
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: templateKey }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Applied ${templateName} to "${title}"`);
        onApplied(resumeId);
      } else {
        toast.error(json.error || "Failed to apply template. Please try again.");
        setApplyingId(null);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setApplyingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Apply ${templateName} to an existing resume`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-gray-900/40 overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h2 className="text-h3 text-black leading-tight">Apply {templateName}</h2>
            <p className="text-micro text-gray-400 mt-0.5">
              Live preview of your content in this template — only the layout changes.
            </p>
          </div>
          <button
            autoFocus
            onClick={onClose}
            aria-label="Close dialog"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 min-h-0 overflow-y-auto">
          {!resumes ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-h3 text-black mb-2">No resumes yet</h3>
              <p className="text-body text-gray-500 mb-6 max-w-sm mx-auto">
                You don't have any resumes to restyle yet. Create one first, then apply templates anytime.
              </p>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {resumes.map((r) => {
                const badge = TEMPLATE_BADGE[r.template];
                const isCurrent = r.template === templateKey;
                const applying = applyingId === r.id;
                // ATS score chip colors — same ≥70 / ≥40 / <40 buckets as the ATS page.
                const ats = r.ats_score;
                const atsChip =
                  ats == null
                    ? "text-gray-400 bg-gray-50 border-gray-200"
                    : ats >= 70
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : ats >= 40
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-rose-700 bg-rose-50 border-rose-200";
                const levelLabel = RESUME_TYPES[r.targetLevel]?.name || r.targetLevel;
                return (
                  <li key={r.id}>
                    <div
                      role="button"
                      tabIndex={isCurrent ? -1 : 0}
                      aria-disabled={isCurrent}
                      onClick={() => {
                        if (!isCurrent) handleApply(r.id, r.title);
                      }}
                      onKeyDown={(e) => {
                        if (isCurrent) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleApply(r.id, r.title);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150",
                        applying
                          ? "border-accent-500 bg-accent-50/50 cursor-wait"
                          : isCurrent
                            ? "border-gray-200 bg-gray-50 opacity-70 cursor-default"
                            : "border-gray-200 hover:border-accent-400 hover:bg-accent-50/40 hover:shadow-sm active:scale-[0.99] cursor-pointer"
                      )}
                    >
                      <ResumePreviewThumb resumeId={r.id} templateKey={templateKey} />
                      <div className="flex-1 min-w-0">
                        <p className="text-small font-semibold text-black truncate">{r.title}</p>
                        <p className="text-micro text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                            badge?.bg || "bg-gray-100",
                            badge?.text || "text-gray-500"
                          )}>
                            {TEMPLATE_DISPLAY[r.template] || r.template}
                          </span>
                          <span className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border",
                            atsChip
                          )}>
                            <Gauge size={10} />
                            {ats == null ? "ATS not scored" : `ATS ${ats}%`}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 border border-gray-200 text-gray-500">
                            {levelLabel}
                          </span>
                          <span>{r.completion.percentage}% complete</span>
                        </p>
                        {!isCurrent && !applying && (
                          <p className="text-micro text-accent-600 mt-1 flex items-center gap-1">
                            <Check size={10} /> Previewing with {templateName} — click to apply
                          </p>
                        )}
                      </div>
                      {applying && <Loader2 className="w-4 h-4 shrink-0 animate-spin text-accent-600" />}
                      {isCurrent && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-micro font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-1">
                          <Check size={11} /> Current
                        </span>
                      )}
                      {!isCurrent && !applying && (
                        <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent-500 text-white shadow-sm">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
