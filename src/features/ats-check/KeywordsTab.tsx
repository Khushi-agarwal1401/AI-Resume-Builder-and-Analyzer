"use client";

import { Check, Plus } from "lucide-react";
import type { DeepAtsReport } from "@/services/resume-analyzer/deep-ats";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Loader2, Wand2 } from "lucide-react";
import { ApplyStatusMessage, ApplyTargetRow, Chip } from "./components";
import type { AiMeta, ApplyMessage, InputMode, ResumeOption } from "./types";

interface KeywordsTabProps {
  report: DeepAtsReport;
  resumes: ResumeOption[];
  mode: InputMode;
  selectedResumeId: string;
  applyTargetId: string;
  onApplyTargetChange: (id: string) => void;
  applySelected: string[];
  onToggleKeyword: (kw: string) => void;
  onSelectAll: () => void;
  applying: boolean;
  applyMsg: ApplyMessage | null;
  onApplyToResume: () => void;
  onRecheck: () => void;
  aiMeta: AiMeta | null;
}

export function KeywordsTab({
  report,
  resumes,
  mode,
  selectedResumeId,
  applyTargetId,
  onApplyTargetChange,
  applySelected,
  onToggleKeyword,
  onSelectAll,
  applying,
  applyMsg,
  onApplyToResume,
  onRecheck,
  aiMeta,
}: KeywordsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-2">
          Found Keywords ({report.foundKeywords.length})
          <span className="text-xs font-normal text-gray-400 ml-2">
            {report.keywordScan === "job-description" ? "from the job description" : "from in-demand skills"}
          </span>
        </h3>
        {report.foundKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {report.foundKeywords.map((k, i) => <Chip key={i} tone="green"><Check className="w-3 h-3" strokeWidth={3} /> {k}</Chip>)}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No matching keywords found.</p>
        )}
      </div>

      {report.missingKeywords.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-gray-900">Missing Keywords ({report.missingKeywords.length})</h3>
            {resumes.length > 0 && (
              <button
                onClick={onSelectAll}
                className="text-[11px] font-semibold text-accent-600 hover:text-accent-700 hover:underline"
              >
                Select all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {report.missingKeywords.map((k, i) => {
              const selected = applySelected.includes(k);
              return (
                <button
                  key={i}
                  onClick={() => onToggleKeyword(k)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                    selected
                      ? "bg-accent-500 text-white border-accent-500 shadow-sm"
                      : "bg-white text-gray-500 border-gray-300 hover:border-accent-400 hover:text-accent-600"
                  )}
                >
                  {selected ? <Check className="w-3 h-3" strokeWidth={3} /> : <Plus className="w-3 h-3" strokeWidth={3} />} {k}
                </button>
              );
            })}
          </div>

          {/* One-click apply */}
          {resumes.length === 0 && (
            <p className="text-[11px] text-gray-500 mt-3">
              Create a resume from the{" "}
              <a href="/templates" className="text-accent-600 font-semibold hover:underline">Templates</a>{" "}
              page to apply these keywords in one click.
            </p>
          )}
          {resumes.length > 0 && applySelected.length > 0 && (
            <div className="mt-4 rounded-xl bg-white border border-gray-200 p-3">
              <ApplyTargetRow
                mode={mode}
                resumes={resumes}
                applyTargetId={applyTargetId}
                onApplyTargetChange={onApplyTargetChange}
                description={
                  <>
                    Will be added to <span className="font-semibold text-gray-800">{resumes.find((r) => r.id === selectedResumeId)?.title || "the selected resume"}</span>.
                  </>
                }
                action={
                  <Button
                    variant="accent"
                    size="sm"
                    className="rounded-lg inline-flex items-center gap-1.5"
                    onClick={onApplyToResume}
                    disabled={applying}
                  >
                    {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    {applying ? "Applying…" : `Apply ${applySelected.length} to resume`}
                  </Button>
                }
              />
              {applyMsg && <ApplyStatusMessage message={applyMsg} onRecheck={onRecheck} />}
              <p className="text-[10px] text-gray-400 mt-1.5">Missing keywords are added to your Skills section (deduplicated). Re-check to see your updated score.</p>
            </div>
          )}
        </div>
      )}

      {aiMeta?.keywordDensityNote && (
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
          <span className="font-semibold text-gray-800">Keyword density (AI): </span>{aiMeta.keywordDensityNote}
        </div>
      )}

      {report.keywordDensity.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Keyword Density</h3>
          <div className="space-y-2">
            {report.keywordDensity.slice(0, 12).map((d) => (
              <div key={d.term} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-700 w-32 truncate">{d.term}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", d.flagged ? "bg-amber-500" : "bg-green-500")}
                    style={{ width: `${Math.min(100, d.count * 6)}%` }}
                  />
                </div>
                <span className={cn("text-xs font-bold w-8 text-right", d.flagged ? "text-amber-600" : "text-green-600")}>{d.count}x</span>
                {d.flagged && <span className="text-[10px] text-amber-600 w-28 text-right">{d.recommended}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
