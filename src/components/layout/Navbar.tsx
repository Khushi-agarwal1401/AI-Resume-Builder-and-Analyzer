"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { authenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm py-3"
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="max-w-[1320px] mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center relative overflow-hidden shrink-0">
            {/* Simple logo mark */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
            <div className="w-3.5 h-3.5 bg-white rounded-sm rotate-45" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[22px] font-extrabold text-gray-900 leading-none tracking-tight">Resume Builder</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link href="#product" className="text-small font-semibold text-gray-700 hover:text-accent-600 transition-colors">
            Product
          </Link>
          <Link href="#features" className="text-small font-semibold text-gray-700 hover:text-accent-600 transition-colors">
            Features
          </Link>
          <Link href="/templates" className="text-small font-semibold text-gray-700 hover:text-accent-600 transition-colors">
            Templates
          </Link>
          <Link href="#ats" className="text-small font-semibold text-gray-700 hover:text-accent-600 transition-colors">
            ATS Check
          </Link>
          <button className="flex items-center gap-1 text-small font-semibold text-gray-700 hover:text-accent-600 transition-colors">
            Resources <ChevronDown size={14} />
          </button>
          <Link href="/pricing" className="text-small font-semibold text-gray-700 hover:text-accent-600 transition-colors">
            Pricing
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-6">
          {loading ? null : authenticated ? (
            <Link href="/dashboard">
              <Button size="sm" variant="accent" className="rounded-xl font-bold bg-accent-600 hover:bg-accent-700">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-small font-bold text-gray-700 hover:text-black transition-colors">
                Sign in
              </Link>
              <Link href="/sign-up">
                <Button size="sm" variant="accent" className="rounded-xl font-bold bg-accent-600 hover:bg-accent-700 px-6">
                  Start for Free <ArrowRight size={16} className="ml-1" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden flex items-center justify-center text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg lg:hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              <Link href="#product" onClick={() => setMobileOpen(false)} className="text-body font-bold text-gray-700">Product</Link>
              <Link href="#features" onClick={() => setMobileOpen(false)} className="text-body font-bold text-gray-700">Features</Link>
              <Link href="/templates" onClick={() => setMobileOpen(false)} className="text-body font-bold text-gray-700">Templates</Link>
              <Link href="#ats" onClick={() => setMobileOpen(false)} className="text-body font-bold text-gray-700">ATS Check</Link>
              <Link href="#resources" onClick={() => setMobileOpen(false)} className="text-body font-bold text-gray-700">Resources</Link>
              <Link href="/pricing" onClick={() => setMobileOpen(false)} className="text-body font-bold text-gray-700">Pricing</Link>
              
              <hr className="border-gray-100 my-2" />
              
              {authenticated ? (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="accent" className="w-full rounded-xl bg-accent-600">Dashboard</Button>
                </Link>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full text-black hover:bg-gray-50 border border-gray-200 rounded-xl">Sign in</Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                    <Button variant="accent" className="w-full rounded-xl bg-accent-600">Start for Free</Button>
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
