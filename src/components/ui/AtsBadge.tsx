"use client";

import { cn } from "@/lib/utils";

/** Star rating (0–5) from an ATS score. Kept local so this presentational
 * atom never pulls the template catalog into a client bundle. */
function atsStars(score: number): number {
  if (score >= 96) return 5;
  if (score >= 90) return 4.5;
  if (score >= 84) return 4;
  if (score >= 78) return 3.5;
  if (score >= 70) return 3;
  if (score >= 60) return 2.5;
  return 2;
}

/**
 * Honest ATS badge — shows a template's *estimated* parser compatibility,
 * not a marketing claim. Color scales with the score so users can compare
 * templates at a glance:
 *
 *   ≥90  emerald  — Parser Perfect / Parser Friendly
 *   80–89 blue    — Recruiter Approved
 *   70–79 amber   — Design Forward
 *   <70   rose    — Creative Layout (visually rich, parser-risky)
 */
export function AtsBadge({
  score,
  showStars = true,
  size = "sm",
  className,
}: {
  score: number;
  showStars?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const stars = atsStars(score);
  const tone =
    score >= 90
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 80
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : score >= 70
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-rose-50 text-rose-700 border-rose-200";

  const dot =
    score >= 90
      ? "bg-emerald-500"
      : score >= 80
        ? "bg-blue-500"
        : score >= 70
          ? "bg-amber-500"
          : "bg-rose-500";

  const label =
    score >= 96
      ? "Parser Perfect"
      : score >= 90
        ? "Parser Friendly"
        : score >= 80
          ? "Recruiter Approved"
          : score >= 70
            ? "Design Forward"
            : "Creative Layout";

  const sizeCls =
    size === "md"
      ? "px-3 py-1.5 text-xs"
      : size === "sm"
        ? "px-2.5 py-1 text-[11px]"
        : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-bold whitespace-nowrap",
        tone,
        sizeCls,
        className
      )}
      title={`Estimated ATS score: ${score}/100 — ${label}`}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
      <span className="tabular-nums">{score}% ATS</span>
      {showStars && (
        <span className="text-[0.9em] leading-none tracking-tight" aria-hidden>
          {"★".repeat(Math.floor(stars))}
          {stars % 1 !== 0 && "½"}
        </span>
      )}
    </span>
  );
}

/** Tier pill: FREE vs PREMIUM. */
export function TierBadge({
  tier,
  className,
}: {
  tier: "free" | "premium";
  className?: string;
}) {
  return tier === "free" ? (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
        "bg-gray-50 text-gray-600 border-gray-200",
        className
      )}
    >
      Free
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
        "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200",
        className
      )}
    >
      ✦ Premium
    </span>
  );
}
