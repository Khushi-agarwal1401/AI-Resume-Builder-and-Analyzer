"use client";

import Link from "next/link";
import { computeResumeCompletion } from "@/services/resume/completion";
import type { ResumeData } from "@/types/resume";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ResumeCompletionWidgetProps {
  data: ResumeData | null;
  resumeId: string;
}

export function ResumeCompletionWidget({ data, resumeId }: ResumeCompletionWidgetProps) {
  if (!data) return null;

  const completion = computeResumeCompletion(data);
  const requiredMissing = completion.missing.filter((m) => !m.isOptional);

  return (
    <div className="border-t border-gray-100 px-4 py-3 bg-white">
      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
        <span className="font-semibold text-gray-700">Resume Completion</span>
        <span className="font-bold text-accent-600">{completion.percentage}%</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-accent-500 to-accent-600 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${completion.percentage}%` }}
        />
      </div>

      {/* Missing Sections */}
      {requiredMissing.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-red-500 uppercase tracking-wider">
            <AlertCircle size={10} strokeWidth={3} />
            <span>Missing Required</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {requiredMissing.slice(0, 3).map((section) => (
              <Link
                key={section.id}
                href={`/builder/${resumeId}/${section.id}`}
                className="text-[10px] font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full hover:bg-red-100 transition-colors border border-red-100"
              >
                {section.label}
              </Link>
            ))}
            {requiredMissing.length > 3 && (
              <span className="text-[10px] font-medium text-gray-400 px-1 py-0.5">
                +{requiredMissing.length - 3} more
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100">
          <CheckCircle2 size={13} className="shrink-0" />
          <span>All required sections filled!</span>
        </div>
      )}
    </div>
  );
}
