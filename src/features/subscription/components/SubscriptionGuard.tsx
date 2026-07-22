"use client";

import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Props {
  feature: string;
  limit: number;
  current: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  metric?: string; // Optional: check against actual usage via checkUsageLimit API
}

export function SubscriptionGuard({ feature, limit, current, children, fallback, metric }: Props) {
  const { loading, isPro, planId } = useSubscription();
  const { user } = useAuth();

  // If checking actual usage, the parent should pass current from server data
  // This component enforces the limit passed in props

  if (loading) return <div className="flex items-center justify-center py-12"><Spinner /></div>;

  if (isPro) return <>{children}</>;

  if (current >= limit) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><path d="M12 2l3 7h7l-5.5 5 2 7L12 16.5 5.5 21l2-7L2 9h7z"/></svg>
        </div>
        <h3 className="text-h3 text-black mb-2">Upgrade to Pro</h3>
        <p className="text-body text-gray-500 mb-6 max-w-[400px]">
          You&apos;ve used all {limit} free {feature}{limit > 1 ? "s" : ""}. Upgrade to Pro for unlimited access.
        </p>
        <div className="flex gap-3">
          <Link href="/pricing">
            <Button variant="primary">View Plans</Button>
          </Link>
          <Link href="/settings/subscription">
            <Button variant="secondary">Compare Plans</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Usage indicator for free users */}
      <div className="absolute -top-3 right-0 z-10">
        <span className="text-[10px] font-medium text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full shadow-sm">
          {current}/{limit} free {feature}{current > 0 ? " used" : ""}
        </span>
      </div>
      {children}
    </div>
  );
}
