"use client";

import { ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildRecommendations } from "@/features/dashboard/lib/recommendations";
import type { ResumeListItem } from "@/services/resume/completion";

interface AiRecommendationsCardProps {
  resume: ResumeListItem;
  className?: string;
  /** Hide the in-card header below `lg` when the card is wrapped in a ResponsiveWidget accordion header. */
  hideHeaderOnMobile?: boolean;
}

export function AiRecommendationsCard({ resume, className, hideHeaderOnMobile }: AiRecommendationsCardProps) {
  const recommendations = buildRecommendations(resume);

  return (
    <div className={cn("flex flex-col rounded-2xl border border-gray-200 bg-white p-6", className)}>
      <div className={cn("flex items-center gap-2 mb-4", hideHeaderOnMobile && "hidden lg:flex")}>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 shadow-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-gray-900 leading-tight">AI Suggestions</h3>
          <p className="text-[11px] text-gray-400">Personalized next steps</p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center flex-1 py-6">
          <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
          <p className="text-sm font-semibold text-gray-700">You're all caught up!</p>
          <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
            This resume is complete. Export it or run an ATS check to keep improving.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2.5">
          {recommendations.map((rec) => {
            const Icon = rec.icon;
            return (
              <Link
                key={rec.id}
                href={rec.href}
                className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-accent-200 hover:bg-accent-50/40 transition-all duration-200"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-accent-100 group-hover:text-accent-600 transition-colors">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold text-gray-800 group-hover:text-accent-700 transition-colors truncate">
                    {rec.title}
                  </span>
                  <span className="block text-[11px] text-gray-400 truncate">{rec.description}</span>
                </span>
                <ArrowUpRight className="w-4 h-4 shrink-0 text-gray-300 group-hover:text-accent-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
