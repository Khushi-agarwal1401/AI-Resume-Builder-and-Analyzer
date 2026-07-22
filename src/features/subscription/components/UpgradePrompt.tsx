"use client";

import Link from "next/link";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { Button } from "@/components/ui/Button";

export function UpgradePrompt({ variant = "banner" }: { variant?: "banner" | "inline" }) {
  const { isPro, loading } = useSubscription();

  if (loading || isPro) return null;

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 text-small text-gray-500">
        <span>Free plan</span>
        <Link href="/pricing" className="text-accent-500 hover:text-accent-600 font-medium underline underline-offset-2">
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-sm">
      <div className="flex items-center gap-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><path d="M12 2l3 7h7l-5.5 5 2 7L12 16.5 5.5 21l2-7L2 9h7z"/></svg>
        <p className="text-small text-gray-700">Unlock unlimited resumes, AI actions, and more with Pro.</p>
      </div>
      <Link href="/pricing">
        <Button variant="accent" size="sm">Upgrade</Button>
      </Link>
    </div>
  );
}
