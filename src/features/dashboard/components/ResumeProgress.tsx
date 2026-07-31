"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEstimatedMinutes, type ResumeCompletion } from "@/services/resume/completion";

interface ResumeProgressProps {
  completion: ResumeCompletion;
  className?: string;
}

/** Compact per-card completion meter: progress bar, percentage, missing sections, ETA. */
export function ResumeProgress({ completion, className }: ResumeProgressProps) {
  const { percentage, missing, estimatedMinutes } = completion;
  const done = percentage >= 100;
  const missingLabels = missing.slice(0, 3).map((m) => m.label);
  const extraCount = missing.length - missingLabels.length;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
          Resume Progress
        </span>
        <span className="text-xs font-bold tabular-nums text-gray-700">{percentage}%</span>
      </div>

      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            done ? "bg-green-500" : percentage >= 50 ? "bg-gradient-to-r from-accent-500 to-accent-600" : "bg-amber-400"
          )}
          style={{ width: `${Math.max(4, percentage)}%` }}
        />
      </div>

      {missing.length > 0 ? (
        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-gray-500">
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
          <span className="leading-snug">
            <span className="font-medium text-gray-600">Missing:</span>{" "}
            {missingLabels.join(", ")}
            {extraCount > 0 && ` +${extraCount} more`}
            <span className="text-gray-400"> · {formatEstimatedMinutes(estimatedMinutes)} to finish</span>
          </span>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          Complete — ready to export
        </div>
      )}
    </div>
  );
}
