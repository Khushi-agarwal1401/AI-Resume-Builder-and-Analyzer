"use client";

import { AlertTriangle, Check, X } from "lucide-react";
import type { DeepAtsReport } from "@/services/resume-analyzer/deep-ats";
import { Chip } from "./components";

export function OverviewTab({ report }: { report: DeepAtsReport }) {
  return (
    <div className="space-y-6">
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
