"use client";

import { Check, Plus, Target } from "lucide-react";
import type { DeepAtsReport } from "@/services/resume-analyzer/deep-ats";
import { KEYWORD_CATEGORY_LABELS, KEYWORD_CATEGORY_ORDER } from "@/services/resume-analyzer/jd-keywords";
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

function CategoryRow({
  category,
  terms,
  weight,
  matched,
}: {
  category: (typeof KEYWORD_CATEGORY_ORDER)[number];
  terms: string[];
  weight: number;
  matched: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-36 shrink-0">
        <p className="text-[11px] font-bold text-gray-700">{KEYWORD_CATEGORY_LABELS[category]}</p>
        {weight > 0 && (
          <p className={cn("text-[10px] font-semibold mt-0.5", matched ? "text-green-600" : "text-red-500")}>
            {Math.round(weight)} pts
          </p>
        )}
      </div>
      <div className="flex-1 flex flex-wrap gap-1.5">
        {terms.map((k, i) => (
          <Chip key={i} tone={matched ? "green" : "red"}>
            {matched ? <Check className="w-3 h-3" strokeWidth={3} /> : <Plus className="w-3 h-3" strokeWidth={3} />} {k}
          </Chip>
        ))}
      </div>
    </div>
  );
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
  const isJd = report.keywordScan === "job-description";
  const matchedCount = isJd ? report.jdKeywords.filter((k) => k.matched).length : report.foundKeywords.length;
  const totalCount = isJd ? report.jdKeywords.length : report.foundKeywords.length + report.missingKeywords.length;

  return (
    <div className="space-y-6">
      {/* Jobscan-style weighted match summary (only when scanning a JD) */}
      {isJd && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-5">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Weighted Job Match</p>
              <p className={cn(
                "text-4xl font-extrabold tabular-nums",
                report.jdMatchScore >= 70 ? "text-green-600" : report.jdMatchScore >= 45 ? "text-amber-600" : "text-red-500"
              )}>
                {report.jdMatchScore}%
              </p>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    report.jdMatchScore >= 70 ? "bg-green-500" : report.jdMatchScore >= 45 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(100, report.jdMatchScore)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-600">
                  <span className="font-bold text-gray-900">{matchedCount}</span> of <span className="font-bold text-gray-900">{totalCount}</span> job keywords matched
                </p>
                <p className="text-[10px] text-gray-400">
                  {report.jdMatchScore >= 70 ? "Great fit" : report.jdMatchScore >= 45 ? "Partial match" : "Weak match"}
                </p>
              </div>
            </div>
            {report.jobTitleMatched ? (
              <Chip tone="green"><Check className="w-3 h-3" strokeWidth={3} /> Target title found</Chip>
            ) : (
              <Chip tone="amber">Target title not found</Chip>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-2">
          Found Keywords ({matchedCount})
          <span className="text-xs font-normal text-gray-400 ml-2">
            {isJd ? "from the job description" : "from in-demand skills"}
          </span>
        </h3>
        {isJd ? (
          report.keywordMatchBreakdown.matched.length > 0 ? (
            <div className="space-y-3">
              {report.keywordMatchBreakdown.matched.map((group) => (
                <CategoryRow key={group.category} category={group.category} terms={group.terms} weight={group.weight} matched />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No matching keywords found.</p>
          )
        ) : report.foundKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {report.foundKeywords.map((k, i) => <Chip key={i} tone="green"><Check className="w-3 h-3" strokeWidth={3} /> {k}</Chip>)}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No matching keywords found.</p>
        )}
      </div>

      {(isJd ? report.keywordMatchBreakdown.missing.length > 0 : report.missingKeywords.length > 0) && (
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-gray-900">
              Missing Keywords ({isJd ? report.keywordMatchBreakdown.missing.reduce((s, g) => s + g.terms.length, 0) : report.missingKeywords.length})
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

          {isJd ? (
            <div className="space-y-3">
              {report.keywordMatchBreakdown.missing.map((group) => (
                <div key={group.category} className="flex items-start gap-3">
                  <div className="w-36 shrink-0">
                    <p className="text-[11px] font-bold text-gray-700">{KEYWORD_CATEGORY_LABELS[group.category]}</p>
                    <p className="text-[10px] font-semibold mt-0.5 text-red-500">{Math.round(group.weight)} pts</p>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-1.5">
                    {group.terms.map((k, i) => {
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
                </div>
              ))}
            </div>
          ) : (
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
          )}

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

      {isJd && report.jdKeywords.length === 0 && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-start gap-2">
          <Target className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
          We couldn't extract recognizable skills from that job description. Add a fuller job description to get a weighted keyword match.
        </div>
      )}
    </div>
  );
}