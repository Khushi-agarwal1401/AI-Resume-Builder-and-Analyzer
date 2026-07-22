"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
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
          ? "bg-white/70 backdrop-blur-md border-b border-gray-200 shadow-sm py-3"
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="text-h3 font-bold text-black tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
          AI Resume Builder
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-small font-medium text-gray-500 hover:text-black transition-colors">
            Features
          </Link>
          <Link href="/templates" className="text-small font-medium text-gray-500 hover:text-black transition-colors">
            Templates
          </Link>
          <Link href="/pricing" className="text-small font-medium text-gray-500 hover:text-black transition-colors">
            Pricing
          </Link>
          <Link href="/#faq" className="text-small font-medium text-gray-500 hover:text-black transition-colors">
            FAQ
          </Link>
          
          <div className="h-4 w-px bg-gray-300 mx-2" />

          {loading ? null : authenticated ? (
            <Link href="/dashboard">
              <Button size="sm" variant="accent" className="rounded-md shadow-sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-small font-medium text-gray-500 hover:text-black transition-colors">
                Login
              </Link>
              <Link href="/sign-up">
                <Button size="sm" variant="accent" className="rounded-md shadow-sm">Create Resume</Button>
              </Link>
            </>
          )}
        </nav>

        <button
          className="md:hidden flex items-center justify-center text-black"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-border shadow-lg md:hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              <Link href="/#features" onClick={() => setMobileOpen(false)} className="text-body font-medium text-gray-600">Features</Link>
              <Link href="/templates" onClick={() => setMobileOpen(false)} className="text-body font-medium text-gray-600">Templates</Link>
              <Link href="/pricing" onClick={() => setMobileOpen(false)} className="text-body font-medium text-gray-600">Pricing</Link>
              <Link href="/#faq" onClick={() => setMobileOpen(false)} className="text-body font-medium text-gray-600">FAQ</Link>
              <hr className="border-border" />
              {authenticated ? (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="accent" className="w-full">Dashboard</Button>
                </Link>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full text-black hover:bg-white border border-border">Login</Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                    <Button variant="accent" className="w-full">Create Resume</Button>
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
