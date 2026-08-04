"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { authenticated, loading } = useAuth();
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

  if (pathname === "/login" || pathname === "/sign-up" || pathname === "/post-login") {
    return null;
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-gray-200/80 shadow-sm py-3.5"
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
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
        <div className="hidden lg:flex items-center gap-4">
          {loading ? null : authenticated ? (
            isLandingPage ? (
              <Link href="/dashboard">
                <Button size="sm" variant="accent" className="rounded-xl font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-md">
                  Dashboard
                </Button>
              </Link>
            ) : null
          ) : (
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
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden flex items-center justify-center p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileOpen && (
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

