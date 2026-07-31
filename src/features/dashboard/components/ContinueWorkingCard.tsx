"use client";

import { Clock, PenLine, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn, formatRelativeTime } from "@/lib/utils";
import { TEMPLATE_DISPLAY, TEMPLATE_BADGE } from "@/features/resume-builder/config/template-constants";
import { formatEstimatedMinutes } from "@/services/resume/completion";
import type { ResumeListItem } from "@/services/resume/completion";

interface ContinueWorkingCardProps {
  resume: ResumeListItem;
  className?: string;
}

export function ContinueWorkingCard({ resume, className }: ContinueWorkingCardProps) {
  const badge = TEMPLATE_BADGE[resume.template];

  return (
    <Link
      href={`/builder/${resume.id}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col",
        className
      )}
    >
      {/* Decorative gradient wash */}
      <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-accent-500/10 blur-2xl group-hover:bg-accent-500/15 transition-colors duration-300" />

      <div className="relative flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-accent-600 mb-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-100">
          <Sparkles className="w-3 h-3" />
        </span>
        Continue Working
      </div>

      <div className="relative flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 truncate group-hover:text-accent-700 transition-colors">
          {resume.title}
        </h2>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
              badge?.bg || "bg-gray-100",
              badge?.text || "text-gray-600"
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", badge?.dot || "bg-gray-400")} />
            {TEMPLATE_DISPLAY[resume.template] || resume.template}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            Edited {formatRelativeTime(resume.updated_at)}
          </span>
        </div>

        {/* Progress strip */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                resume.completion.percentage >= 100 ? "bg-green-500" : "bg-gradient-to-r from-accent-500 to-accent-600"
              )}
              style={{ width: `${Math.max(4, resume.completion.percentage)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-600 tabular-nums shrink-0">
            {resume.completion.percentage}%
          </span>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          {resume.completion.percentage >= 100
            ? "Looking great — ready to export!"
            : `${formatEstimatedMinutes(resume.completion.estimatedMinutes)} to finish`}
        </p>
      </div>

      <div className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-black text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 group-hover:bg-accent-700 group-hover:shadow-md group-hover:scale-[1.02] active:scale-[0.98]">
        <PenLine className="w-4 h-4" />
        Continue Editing
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
      </div>
    </Link>
  );
}
