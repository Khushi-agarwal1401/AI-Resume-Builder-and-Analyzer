"use client";

import Link from "next/link";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
  variant?: "banner" | "inline" | "compact";
  /** Optional count of used items to display */
  used?: number;
  /** Optional total limit */
  limit?: number;
  /** Feature label for context */
  feature?: string;
}

export function UpgradePrompt({ variant = "banner", used, limit, feature }: UpgradePromptProps) {
  const { isPro, loading } = useSubscription();

  if (loading || isPro) return null;

  const hasLimitInfo = used !== undefined && limit !== undefined;

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 text-small text-gray-500">
        <span>Free plan</span>
        {hasLimitInfo && (
          <span className="text-gray-400">
            ({used}/{limit} {feature})
          </span>
        )}
        <Link href="/settings/subscription" className="text-accent-500 hover:text-accent-600 font-medium underline underline-offset-2">
          Upgrade
        </Link>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-sm text-small">
        <span className="text-gray-700">
          {hasLimitInfo
            ? `${used}/${limit} ${feature} used — `
            : ""}
          <Link href="/settings/subscription" className="text-accent-600 font-medium hover:underline">
            Upgrade to Pro
          </Link>
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-sm",
      hasLimitInfo ? "flex-col sm:flex-row gap-3" : ""
    )}>
      <div className="flex items-center gap-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><path d="M12 2l3 7h7l-5.5 5 2 7L12 16.5 5.5 21l2-7L2 9h7z"/></svg>
        <div>
          <p className="text-small text-gray-700">
            {hasLimitInfo
              ? `You've used ${used} of ${limit} free ${feature}${limit! > 1 ? "s" : ""}. `
              : ""}
            Unlock unlimited resumes, AI actions, and more with Pro.
          </p>
          {hasLimitInfo && (
            <div className="mt-1.5 w-full max-w-[200px] h-1.5 bg-indigo-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-500 rounded-full transition-all"
                style={{ width: `${limit! > 0 ? Math.min(100, (used! / limit!) * 100) : 0}%` }}
              />
            </div>
          )}
        </div>
      </div>
      <Link href="/settings/subscription">
        <Button variant="accent" size="sm">Upgrade</Button>
      </Link>
    </div>
  );
}
