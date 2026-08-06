"use client";

import { AlertTriangle, X } from "lucide-react";
import type { DeepAtsReport } from "@/services/resume-analyzer/deep-ats";

export function FormattingTab({ report }: { report: DeepAtsReport }) {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xl font-extrabold text-gray-900">{report.grammarScore}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Grammar Score</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xl font-extrabold text-gray-900">{report.englishScore}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Business English</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xl font-extrabold text-gray-900">{report.avgSentenceLength}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Words / sentence</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Formatting Issues ({report.formattingIssues.length})</h3>
        {report.formattingIssues.length > 0 ? (
          <div className="space-y-2">
            {report.formattingIssues.map((f, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                <X className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2.5} /> <span>{f}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-green-700">No formatting issues detected.</p>
        )}
      </div>

      {report.repetition.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Repetition & Buzzwords</h3>
          <div className="space-y-2">
            {report.repetition.map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span><span className="font-bold">“{r.term}”</span> ({r.count}x) — {r.suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.grammarIssues.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Grammar & Style</h3>
          <div className="space-y-1.5">
            {report.grammarIssues.slice(0, 10).map((g, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 shrink-0" />
                <span><span className="font-semibold text-gray-800">“{g.text}”</span> — {g.suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
