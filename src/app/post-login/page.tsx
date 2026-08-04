"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { isAdminEmail } from "@/lib/admin-emails";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Post-login/signup decision page.
 *
 * Every auth entry point (credentials login, OAuth callback, login/signup
 * page effects) lands here so admins are automatically routed to /admin while
 * everyone else goes to /dashboard. Rendering a spinner (instead of a hard
 * redirect) lets the next-auth session hydrate so the decision is correct.
 */
export default function PostLoginPage() {
  const { user, loading, authenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!authenticated) {
      router.replace("/login");
      return;
    }
    router.replace(isAdminEmail(user?.email) ? "/admin" : "/dashboard");
  }, [loading, authenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-50 flex items-center justify-center mx-auto animate-pulse">
          <Spinner />
        </div>
        <p className="text-sm text-gray-500">Taking you to your dashboard…</p>
      </div>
    </div>
  );
}
