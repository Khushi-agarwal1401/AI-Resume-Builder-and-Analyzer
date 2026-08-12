"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { authenticated, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLandingPage = pathname === "/";
  // App pages (dashboard & co.) keep a glass bar at all times — the landing
  // page stays transparent until scrolled so the hero bleeds through.
  const isAppBar = authenticated && !isLandingPage;

  if (
    pathname === "/login" ||
    pathname === "/sign-up" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/post-login"
  ) {
    return null;
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isAppBar
          ? scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-gray-200/80 shadow-sm py-3.5 dark:bg-gray-900/90 dark:border-gray-800"
            : "bg-white/70 backdrop-blur-lg border-b border-gray-200/60 py-5 dark:bg-gray-950/70 dark:border-gray-800/70"
          : scrolled
            ? "bg-white/85 backdrop-blur-xl border-b border-gray-200/80 shadow-sm py-3.5 dark:bg-gray-900/85 dark:border-gray-800"
            : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo — dashboard for signed-in users, landing otherwise */}
        <BrandLogo href={authenticated ? "/dashboard" : "/"} className="mr-2" />

        {/* Back to Dashboard — shown on the resume builder so users can leave easily */}
        {authenticated && pathname.startsWith("/builder") && (
          <Link
            href="/dashboard"
            title="Back to Dashboard"
            className="inline-flex shrink-0 items-center gap-1.5 ml-2 px-2 sm:px-3.5 h-9 rounded-xl text-[13px] font-bold text-gray-700 bg-gray-100/80 hover:bg-gray-200/80 border border-gray-200/60 hover:border-gray-300 transition-all duration-200 active:scale-95 dark:text-gray-200 dark:bg-gray-800/60 dark:hover:bg-gray-800 dark:border-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        )}

        {/* Universal search (Task 1.1) — authenticated users, any page */}
        {authenticated && !isLandingPage ? (
          <div className="flex-1 flex justify-center px-4">
            <GlobalSearch className="w-full max-w-md" />
          </div>
        ) : null}

        {/* Desktop Nav Links */}
        {isLandingPage ? (
          <nav className="hidden lg:flex items-center gap-1.5 bg-gray-100/70 p-1.5 rounded-full border border-gray-200/60 backdrop-blur-md">
            <Link href="#product" className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-white transition-all">
              Overview
            </Link>
            <Link href="#features" className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-white transition-all">
              Features
            </Link>
            <Link href="#ats" className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-white transition-all">
              ATS Simulator
            </Link>
            <Link href="#templates" className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-white transition-all">
              Templates
            </Link>
            <Link href="#pricing" className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-white transition-all">
              Pricing
            </Link>
          </nav>
        ) : null}

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          {authenticated && !loading && <NotificationCenter />}
          <ThemeToggle compact />
          {loading ? null : authenticated ? (
            <>
              {isLandingPage && (
                <Link href="/dashboard">
                  <Button size="sm" variant="accent" className="rounded-xl font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-md">
                    Dashboard
                  </Button>
                </Link>
              )}
              <UserMenu />
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs font-bold text-gray-700 hover:text-gray-900 px-3 py-2 transition-colors dark:text-gray-300 dark:hover:text-white">
                Sign in
              </Link>
              <Link href="/sign-up">
                <Button size="sm" variant="accent" className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white px-5 shadow-lg shadow-blue-500/20 border-none">
                  Get Started Free <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: notifications + theme toggle + menu */}
        <div className="lg:hidden flex items-center gap-2">
          {authenticated && !loading && <NotificationCenter />}
          <ThemeToggle compact />
          <button
            className="flex items-center justify-center p-2 rounded-xl text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-xl lg:hidden dark:bg-gray-900/95 dark:border-gray-800"
          >
            <div className="px-6 py-6 flex flex-col gap-3">
              {isLandingPage ? (
                <>
                  <Link href="#product" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-gray-800 py-2 border-b border-gray-50 dark:text-gray-200 dark:border-gray-800">Overview</Link>
                  <Link href="#features" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-gray-800 py-2 border-b border-gray-50 dark:text-gray-200 dark:border-gray-800">Features</Link>
                  <Link href="#ats" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-gray-800 py-2 border-b border-gray-50 dark:text-gray-200 dark:border-gray-800">ATS Simulator</Link>
                  <Link href="#templates" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-gray-800 py-2 border-b border-gray-50 dark:text-gray-200 dark:border-gray-800">Templates</Link>
                  <Link href="#pricing" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-gray-800 py-2 border-b border-gray-50 dark:text-gray-200 dark:border-gray-800">Pricing</Link>
                  
                  <div className="my-2" />
                </>
              ) : null}
              
              {authenticated ? (
                isLandingPage ? (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="accent" className="w-full rounded-xl bg-gray-900 text-white font-bold">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm font-bold text-gray-800 py-2 border-b border-gray-50 dark:text-gray-200 dark:border-gray-800"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm font-bold text-gray-800 py-2 border-b border-gray-50 dark:text-gray-200 dark:border-gray-800"
                    >
                      Settings
                    </Link>
                    <button onClick={() => signOut()} className="text-sm font-bold text-red-600 py-2 text-left transition-colors">
                      Sign out
                    </button>
                  </>
                )
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-xl font-bold">Sign in</Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                    <Button variant="accent" className="w-full rounded-xl bg-blue-600 text-white font-bold">Get Started Free</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
