"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { authenticated, loading } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-300">
      <div className="max-w-[1280px] mx-auto px-8 h-full flex items-center justify-between">
        <Link href="/" className="text-h3 font-semibold text-black tracking-tight">
          AI Resume Builder
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/templates" className="text-body text-gray-500 hover:text-black transition-colors">
            Templates
          </Link>
          {loading ? null : authenticated ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-body text-gray-500 hover:text-black transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
