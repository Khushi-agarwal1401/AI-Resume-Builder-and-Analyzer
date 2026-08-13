"use client";

import { AlertTriangle, Check, CheckCircle2, X } from "lucide-react";
import type { DeepAtsReport } from "@/services/resume-analyzer/deep-ats";
import { Chip } from "./components";

export function OverviewTab({ report }: { report: DeepAtsReport }) {
  const isJd = report.keywordScan === "job-description";
  const matchedCount = isJd ? report.jdKeywords.filter((k) => k.matched).length : report.foundKeywords.length;
  const totalCount = isJd ? report.jdKeywords.length : report.foundKeywords.length + report.missingKeywords.length;

  return (
    <div className="space-y-6">
      {isJd && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Job Match</p>
            <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{report.jdMatchScore}%</p>
          </div>
          <p className="text-xs text-gray-600 flex-1 min-w-[180px]">
            <span className="font-bold text-gray-900">{matchedCount}</span>/{totalCount} weighted keywords from the job description matched.
          </p>
          {report.jobTitleMatched ? (
            <Chip tone="green"><CheckCircle2 className="w-3 h-3" /> Target title found</Chip>
          ) : (
            <Chip tone="amber"><AlertTriangle className="w-3 h-3" /> Target title not found</Chip>
          )}
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">ATS Parsing Simulation</h3>
        <div className="flex flex-wrap gap-1.5">
          {report.detected.map((d) => <Chip key={d} tone="green"><Check className="w-3 h-3" strokeWidth={3} /> {d}</Chip>)}
          {report.missing.map((m) => <Chip key={m} tone="red"><X className="w-3 h-3" strokeWidth={3} /> {m}</Chip>)}
        </div>
      </div>

      {report.parserRiskFlags.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Parsing Risks</h3>
          <div className="space-y-2">
            {report.parserRiskFlags.map((f, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        {([
          { label: "Bullets", value: `${report.bullets.strong}/${report.bullets.total} strong` },
          { label: "Grammar", value: report.grammarIssues.length === 0 ? "Clean" : `${report.grammarIssues.length} issues` },
          { label: "English Quality", value: `${report.englishScore}/100` },
        ] as { label: string; value: string }[]).map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-lg font-bold text-gray-900">{s.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
