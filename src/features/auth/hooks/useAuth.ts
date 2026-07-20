"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  return {
    user: session?.user ?? null,
    loading: status === "loading",
    authenticated: status === "authenticated",
    signIn: (provider?: string) => signIn(provider),
    signOut: () => signOut({ callbackUrl: "/" }),
    redirectToLogin: () => router.push("/login"),
  };
}
