"use client";

import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Props {
  feature: string;
  limit: number;
  current: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SubscriptionGuard({ feature, limit, current, children, fallback }: Props) {
  const { loading, isPro } = useSubscription();

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
          You&apos;ve used all {limit} free {feature}. Upgrade to Pro for unlimited access.
        </p>
        <Link href="/pricing">
          <Button variant="primary">View Plans</Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
