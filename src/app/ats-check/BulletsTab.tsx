"use client";

import { Check, CheckCircle2, Loader2, Wand2 } from "lucide-react";
import type { DeepAtsReport } from "@/services/resume-analyzer/deep-ats";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ApplyStatusMessage, ApplyTargetRow } from "./components";
import type { AiMeta, ApplyMessage, InputMode, ResumeOption } from "./types";

interface BulletsTabProps {
  report: DeepAtsReport;
  resumes: ResumeOption[];
  mode: InputMode;
  selectedResumeId: string;
  applyTargetId: string;
  onApplyTargetChange: (id: string) => void;
  bulletSelected: string[];
  onToggleBullet: (bullet: string) => void;
  onSelectAll: () => void;
  bulletsApplying: boolean;
  bulletsMsg: ApplyMessage | null;
  onApplyBullets: () => void;
  onRecheck: () => void;
  aiMeta: AiMeta | null;
}

export function BulletsTab({
  report,
  resumes,
  mode,
  selectedResumeId,
  applyTargetId,
  onApplyTargetChange,
  bulletSelected,
  onToggleBullet,
  onSelectAll,
  bulletsApplying,
  bulletsMsg,
  onApplyBullets,
  onRecheck,
  aiMeta,
}: BulletsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 text-center">
          <p className="text-xl font-extrabold text-green-600">{report.bullets.strong}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Strong bullets</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center">
          <p className="text-xl font-extrabold text-amber-600">{report.bullets.weak.length}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Weak bullets</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xl font-extrabold text-gray-900">{report.bullets.total}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Total</p>
        </div>
      </div>

      {report.bullets.weak.length > 0 ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-gray-900">
              Weak bullets
              {resumes.length > 0 && (
                <span className="text-xs font-normal text-gray-400 ml-2">
                  tap a card to include its rewrite
                </span>
              )}
            </h3>
            {resumes.length > 0 && (
              <button
                onClick={onSelectAll}
                className="text-[11px] font-semibold text-accent-600 hover:text-accent-700 hover:underline"
              >
                Select all
              </button>
            )}
          </div>
          <div className="space-y-3">
            {report.bullets.weak.map((w, i) => {
              const selected = bulletSelected.includes(w.bullet);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onToggleBullet(w.bullet)}
                  className={cn(
                    "w-full text-left rounded-xl border p-4 transition-all",
                    selected
                      ? "border-accent-400 bg-accent-50/40 shadow-sm"
                      : "border-amber-200 bg-amber-50/40 hover:border-amber-300"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                        selected
                          ? "bg-accent-500 border-accent-500 text-white"
                          : "bg-white border-gray-300"
                      )}
                    >
                      {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800"><span className="font-semibold text-amber-700">Original:</span> “{w.bullet}”</p>
                      <p className="text-[11px] text-gray-500 mt-1.5">{w.reason}</p>
                      <div className="mt-2 rounded-lg bg-white border border-amber-200 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-accent-600 mb-1">
                          {aiMeta?.status === "ai" ? <Wand2 className="w-3 h-3 inline mr-1" /> : null}
                          {aiMeta?.status === "ai" ? "AI rewrite" : "Improved version"}
                        </p>
                        <p className="text-xs text-gray-700">{w.rewrite}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* One-click apply rewrites */}
          {resumes.length === 0 && (
            <p className="text-[11px] text-gray-500 mt-4">
              Create a resume from the{" "}
              <a href="/templates" className="text-accent-600 font-semibold hover:underline">Templates</a>{" "}
              page to apply these rewrites in one click.
            </p>
          )}
          {resumes.length > 0 && bulletSelected.length > 0 && (
            <div className="mt-4 rounded-xl bg-white border border-gray-200 p-3">
              <ApplyTargetRow
                mode={mode}
                resumes={resumes}
                applyTargetId={applyTargetId}
                onApplyTargetChange={onApplyTargetChange}
                description={
                  <>
                    Rewrites will replace matching bullets on{" "}
                    <span className="font-semibold text-gray-800">{resumes.find((r) => r.id === selectedResumeId)?.title || "the selected resume"}</span>.
                  </>
                }
                action={
                  <Button
                    variant="accent"
                    size="sm"
                    className="rounded-lg inline-flex items-center gap-1.5"
                    onClick={onApplyBullets}
                    disabled={bulletsApplying}
                  >
                    {bulletsApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    {bulletsApplying ? "Applying…" : `Apply ${bulletSelected.length} to resume`}
                  </Button>
                }
              />
              {bulletsMsg && <ApplyStatusMessage message={bulletsMsg} onRecheck={onRecheck} />}
              <p className="text-[10px] text-gray-400 mt-1.5">Each rewrite replaces the matching bullet in your Experience section. Re-check to see your updated score.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
          <CheckCircle2 className="w-5 h-5" /> All detected bullets use action verbs and measurable outcomes. Nice work!
        </div>
      )}
    </div>
  );
}
