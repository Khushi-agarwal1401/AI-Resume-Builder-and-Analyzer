"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useDashboardSearch } from "@/features/dashboard/context/DashboardSearchContext";
import { Menu, X, ArrowRight, ArrowLeft, Sparkles, Search } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

export function Navbar() {
  const { authenticated, loading, user } = useAuth();
  const pathname = usePathname();
  const { query: searchQuery, setQuery: setSearchQuery } = useDashboardSearch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  const isLandingPage = pathname === "/";
  const isBuilderPage = pathname?.startsWith("/builder");
  const isDashboard = pathname === "/dashboard";
  const isAppPage = isBuilderPage || isDashboard;

  if (pathname === "/login" || pathname === "/sign-up" || pathname?.startsWith("/preview")) {
    return null;
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isAppPage
          ? "bg-white/90 backdrop-blur-xl border-b border-gray-200/80 shadow-sm py-3.5"
          : scrolled
            ? "bg-white/85 backdrop-blur-xl border-b border-gray-200/80 shadow-sm py-3.5"
            : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo + builder back link */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center relative overflow-hidden shrink-0 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xl font-extrabold text-gray-900 leading-none tracking-tight flex items-center gap-1.5">
                Resume<span className="text-blue-600">AI</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Career Copilot</span>
            </div>
          </Link>

          {isBuilderPage && (
            <>
              <span className="hidden sm:block h-6 w-px bg-gray-200" />
              <Link
                href="/dashboard"
                className="group/dash flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 hover:text-gray-900 bg-white/80 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <ArrowLeft
                  size={14}
                  className="transition-transform duration-200 group-hover/dash:-translate-x-0.5"
                />
                Dashboard
              </Link>
            </>
          )}
        </div>

        {/* Dashboard search */}
        {pathname === "/dashboard" && (
          <div className="flex-1 min-w-0 max-w-md mx-auto px-4 md:px-8">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resumes..."
                aria-label="Search resumes"
                className="w-full h-10 pl-10 pr-9 rounded-xl border border-gray-200 bg-white/90 shadow-sm text-sm outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

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
        <div className={cn("flex items-center gap-4", !isBuilderPage && "hidden lg:flex")}>
          {loading ? null : authenticated ? (
            isBuilderPage ? (
              /* User avatar + name/email on builder pages */
              <Link
                href="/settings"
                title="Account settings"
                className="group flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-gray-100/80 transition-colors"
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center text-sm font-bold text-accent-700 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    {(user?.name || user?.email)?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-[13px] font-semibold text-gray-900 leading-tight truncate max-w-[140px] group-hover:text-accent-700 transition-colors duration-150">
                    {user?.name || user?.email?.split("@")[0] || "User"}
                  </p>
                  {user?.email && (
                    <p className="text-[11px] text-gray-500 truncate max-w-[180px]">
                      {user.email}
                    </p>
                  )}
                </div>
              </Link>
            ) : isLandingPage ? (
              <Link href="/dashboard">
                <Button size="sm" variant="accent" className="rounded-xl font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-md">
                  Dashboard
                </Button>
              </Link>
            ) : null            ) : !isBuilderPage ? (
              <>
                <Link href="/login" className="text-xs font-bold text-gray-700 hover:text-gray-900 px-3 py-2 transition-colors">
                  Sign in
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" variant="accent" className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white px-5 shadow-lg shadow-blue-500/20 border-none">
                    Get Started Free <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </Link>
              </>
            ) : null}
        </div>

        {/* Mobile Toggle — hidden on app pages (drawer has nothing to show there) */}
        {!isAppPage && (
          <button
            className="lg:hidden flex items-center justify-center p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
      </div>

      {/* Mobile Nav Drawer — never shown on app pages (empty there) */}
      <AnimatePresence>
        {!isAppPage && mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-xl lg:hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-3">
              {isLandingPage ? (
                <>
                  <Link href="#product" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-gray-800 py-2 border-b border-gray-50">Overview</Link>
                  <Link href="#features" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-gray-800 py-2 border-b border-gray-50">Features</Link>
                  <Link href="#ats" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-gray-800 py-2 border-b border-gray-50">ATS Simulator</Link>
                  <Link href="#templates" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-gray-800 py-2 border-b border-gray-50">Templates</Link>
                  <Link href="#pricing" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-gray-800 py-2 border-b border-gray-50">Pricing</Link>
                  
                  <div className="my-2" />
                </>
              ) : null}
              
              {authenticated ? (
                isLandingPage ? (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="accent" className="w-full rounded-xl bg-gray-900 text-white font-bold">Dashboard</Button>
                  </Link>
                ) : null
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

