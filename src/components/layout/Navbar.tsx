"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown, ArrowRight, FileText, Sparkles, BookOpen, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { authenticated, loading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname === "/login" || pathname === "/sign-up") {
    return null;
  }

  const navLinks = [
    { href: "#product", label: "Product" },
    { href: "#features", label: "Features" },
    { href: "/templates", label: "Templates" },
    { href: "#ats", label: "ATS Check" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg py-3"
          : "bg-white/80 backdrop-blur-md border-b border-gray-100/50 py-4"
      )}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-600 to-accent-700 flex items-center justify-center relative overflow-hidden shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
            <FileText className="w-5 h-5 text-white relative z-10" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-none tracking-tight">
              Resume Builder
            </span>
            <span className="text-xs font-semibold text-accent-600 mt-0.5">AI-Powered</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative px-4 py-2 text-sm font-semibold text-gray-700 hover:text-accent-600 transition-all duration-200 rounded-lg hover:bg-gray-50/50"
            >
              {link.label}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent-600 transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          
          {/* Resources Dropdown */}
          <div className="relative">
            <button
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-accent-600 transition-all duration-200 rounded-lg hover:bg-gray-50/50"
            >
              Resources <ChevronDown size={14} className="transition-transform duration-200" />
            </button>
            
            <AnimatePresence>
              {resourcesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onMouseEnter={() => setResourcesOpen(true)}
                  onMouseLeave={() => setResourcesOpen(false)}
                  className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
                >
                  <div className="p-2">
                    <Link href="/blog" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Blog</p>
                        <p className="text-xs text-gray-500">Tips & guides</p>
                      </div>
                    </Link>
                    <Link href="/examples" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Examples</p>
                        <p className="text-xs text-gray-500">Resume samples</p>
                      </div>
                    </Link>
                    <Link href="/tools" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Tools</p>
                        <p className="text-xs text-gray-500">Free utilities</p>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {loading ? null : authenticated ? (
            <Link href="/dashboard">
              <Button 
                size="sm" 
                className="rounded-xl font-semibold bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-5"
              >
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-accent-600 transition-colors rounded-lg hover:bg-gray-50/50"
              >
                Sign in
              </Link>
              <Link href="/sign-up">
                <Button 
                  size="sm" 
                  className="rounded-xl font-semibold bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-5"
                >
                  Start for Free <ArrowRight size={16} className="ml-1.5" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-white border-b border-gray-200/50 shadow-2xl"
          >
            <div className="max-w-[1400px] mx-auto px-6 py-6 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-base font-semibold text-gray-700 hover:text-accent-600 hover:bg-gray-50 rounded-xl transition-all"
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="px-4 py-3 text-base font-semibold text-gray-700 hover:text-accent-600 hover:bg-gray-50 rounded-xl transition-all cursor-pointer">
                Resources
              </div>
              
              <div className="pl-4 space-y-1">
                <Link href="/blog" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:text-accent-600 hover:bg-gray-50 rounded-lg transition-all">
                  Blog
                </Link>
                <Link href="/examples" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:text-accent-600 hover:bg-gray-50 rounded-lg transition-all">
                  Examples
                </Link>
                <Link href="/tools" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:text-accent-600 hover:bg-gray-50 rounded-lg transition-all">
                  Tools
                </Link>
              </div>
              
              <hr className="border-gray-200 my-3" />
              
              {authenticated ? (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full rounded-xl font-semibold bg-gradient-to-r from-accent-600 to-accent-700 text-white shadow-lg">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full font-semibold text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-xl">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full rounded-xl font-semibold bg-gradient-to-r from-accent-600 to-accent-700 text-white shadow-lg">
                      Start for Free
                    </Button>
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
