"use client";

import { AlertTriangle, Check, CheckCircle2, Loader2, Wand2 } from "lucide-react";
import type { DeepAtsReport } from "@/services/resume-analyzer/deep-ats";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ApplyTargetRow } from "./components";
import type {
  AiMeta,
  ImproveMessage,
  ImproveToggleKey,
  ImproveToggles,
  InputMode,
  ResumeOption,
} from "./types";

interface ImprovementsTabProps {
  report: DeepAtsReport;
  resumes: ResumeOption[];
  mode: InputMode;
  selectedResumeId: string;
  applyTargetId: string;
  onApplyTargetChange: (id: string) => void;
  improveToggles: ImproveToggles;
  onToggleImprove: (key: ImproveToggleKey) => void;
  improving: boolean;
  improveMsg: ImproveMessage | null;
  onApplyImprovements: () => void;
  onRecheck: () => void;
  aiMeta: AiMeta | null;
  manualItems: string[];
}

export function ImprovementsTab({
  report,
  resumes,
  mode,
  selectedResumeId,
  applyTargetId,
  onApplyTargetChange,
  improveToggles,
  onToggleImprove,
  improving,
  improveMsg,
  onApplyImprovements,
  onRecheck,
  aiMeta,
  manualItems,
}: ImprovementsTabProps) {
  return (
    <div className="space-y-6">
      {/* One-click apply-all card */}
      <div className="rounded-xl border border-accent-200 bg-accent-50/40 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="w-4 h-4 text-accent-600" />
          <h3 className="text-sm font-bold text-gray-900">Apply top improvements in one click</h3>
        </div>
        <p className="text-[11px] text-gray-500 mb-3">
          Automatically adds missing keywords, rewrites weak bullets, and applies safe grammar/style fixes to your resume.
        </p>

        {/* Toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            { key: "keywords" as const, label: `Missing keywords (${report.missingKeywords.length})`, disabled: report.missingKeywords.length === 0 },
            { key: "bullets" as const, label: `Weak bullet rewrites (${report.bullets.weak.length})`, disabled: report.bullets.weak.length === 0 },
            { key: "grammar" as const, label: "Grammar & style fixes", disabled: report.grammarIssues.length === 0 },
          ]).map((t) => (
            <button
              key={t.key}
              type="button"
              disabled={t.disabled}
              onClick={() => onToggleImprove(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                improveToggles[t.key] && !t.disabled
                  ? "bg-accent-500 text-white border-accent-500 shadow-sm"
                  : "bg-white text-gray-500 border-gray-300",
                t.disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <span className={cn(
                "w-3.5 h-3.5 rounded border flex items-center justify-center",
                improveToggles[t.key] && !t.disabled ? "bg-white border-white" : "border-gray-400"
              )}>
                {improveToggles[t.key] && !t.disabled && <Check className="w-2.5 h-2.5 text-accent-600" strokeWidth={4} />}
              </span>
              {t.label}
            </button>
          ))}
        </div>

        {resumes.length === 0 ? (
          <p className="text-[11px] text-gray-500">
            Create a resume from the{" "}
            <a href="/templates" className="text-accent-600 font-semibold hover:underline">Templates</a>{" "}
            page to apply improvements in one click.
          </p>
        ) : (
          <ApplyTargetRow
            mode={mode}
            resumes={resumes}
            applyTargetId={applyTargetId}
            onApplyTargetChange={onApplyTargetChange}
            description={
              <>
                Applied to <span className="font-semibold text-gray-800">{resumes.find((r) => r.id === selectedResumeId)?.title || "the selected resume"}</span>.
              </>
            }
            action={
              <Button
                variant="accent"
                size="sm"
                className="rounded-lg inline-flex items-center gap-1.5"
                onClick={onApplyImprovements}
                disabled={improving}
              >
                {improving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {improving ? "Applying…" : "Apply improvements"}
              </Button>
            }
          />
        )}

        {improveMsg && (
          <div className={cn("mt-3 rounded-xl border p-3 text-[11px]", improveMsg.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-100 text-red-700")}>
            <p className="font-semibold flex items-center gap-1.5">
              {improveMsg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {improveMsg.text}
              {improveMsg.ok && (
                <button
                  onClick={onRecheck}
                  className="ml-1 font-semibold text-accent-600 hover:text-accent-700 hover:underline"
                >
                  Re-check my score →
                </button>
              )}
            </p>
            {improveMsg.detail.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {improveMsg.detail.map((d, i) => (
                  <li key={i} className="flex items-center gap-1">• {d}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Manual checklist */}
      {manualItems.length > 0 && (
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Still needs your input</h3>
          <p className="text-[11px] text-gray-400 mb-3">
            These improvements need your judgment — the one-click fixer won't invent facts for you.
          </p>
          <ul className="space-y-1.5">
            {manualItems.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">
          Top Improvements
          {aiMeta?.status === "ai" && <span className="ml-2 text-[11px] font-semibold text-indigo-600"><Wand2 className="w-3 h-3 inline mr-1" />ranked by AI</span>}
        </h3>
        <p className="text-xs text-gray-400 mb-4">Ranked by estimated impact on your ATS and recruiter scores.</p>
        <ol className="space-y-2">
          {report.topImprovements.map((imp, i) => (
            <li key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-accent-300 hover:bg-accent-50/30 transition-colors">
              <span className="w-6 h-6 rounded-full bg-accent-100 text-accent-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-relaxed">{imp.text}</p>
              </div>
              {imp.impact && (
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold shrink-0",
                  imp.impact.includes("Recruiter") ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-green-50 text-green-700 border border-green-200"
                )}>
                  {imp.impact}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
