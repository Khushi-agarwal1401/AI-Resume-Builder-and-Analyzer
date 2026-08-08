"use client";
import Preloader from "@/components/ui/Preloader";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";

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
    if (user?.role === "admin") {
      router.replace("/admin");
      return;
    }

    router.replace("/dashboard");
  }, [loading, authenticated, user, router]);

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Preloader />
    </div>
  );
}
