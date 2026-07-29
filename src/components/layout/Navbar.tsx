"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight } from "lucide-react";
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
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Smooth scroll to anchor sections accounting for fixed navbar height
  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    // Only handle anchor links on the landing page
    if (pathname !== "/" || !href.startsWith("#")) return;

    e.preventDefault();
    const targetId = href.slice(1); // remove "#"
    const element = document.getElementById(targetId);
    if (!element) return;

    // Dynamically calculate the navbar height (handles scrolled vs unscrolled state)
    const header = e.currentTarget.closest("header");
    const navbarHeight = header?.offsetHeight ?? 80;
    const extraPadding = 16;

    const top =
      element.getBoundingClientRect().top +
      window.scrollY -
      navbarHeight -
      extraPadding;

    window.scrollTo({ top, behavior: "smooth" });

    // Close mobile menu after clicking (handled by anchor link clicks)
    setMobileOpen(false);
  };

  const isLandingPage = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/sign-up";

  // Any page that isn't the landing page or auth page is a dashboard/internal page
  const isDashboardPage = !isLandingPage && !isAuthPage;

  if (isAuthPage) return null;

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
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled || isDashboardPage
          ? "bg-white/70 backdrop-blur-xl border-b border-gray-100/80 shadow-[0_1px_20px_-6px_rgba(0,0,0,0.08)] py-3"
          : "bg-transparent border-transparent py-5"
      )}
    >
      {/* Subtle gradient line at bottom on scroll */}
      {(scrolled || isDashboardPage) && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-200/50 to-transparent" />
      )}

      <div className="max-w-[1320px] mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-[0_2px_8px_-2px_rgba(37,99,235,0.3)] group-hover:shadow-[0_4px_14px_-2px_rgba(37,99,235,0.4)] transition-shadow duration-300 shrink-0">
            <div className="w-4 h-4 bg-white rounded-[3px] rotate-45" />
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-accent-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="text-[22px] font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-none tracking-tight">
            Resume Builder
          </span>
        </Link>

        {/* Desktop Nav */}
        {isLandingPage && (
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isAnchor = link.href.startsWith("#");
              const isActive = !isAnchor && pathname === link.href;
              const sharedClasses = cn(
                "relative px-4 py-2 text-[13px] font-semibold rounded-xl transition-all duration-200 group",
                isActive
                  ? "text-accent-700 bg-accent-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
              );
              const underline = (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full bg-accent-500 group-hover:w-4/5 transition-all duration-300" />
              );

              if (isAnchor) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className={sharedClasses}
                  >
                    {link.label}
                    {underline}
                  </a>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={sharedClasses}
                >
                  {link.label}
                  {underline}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {loading ? null : authenticated ? (
            isLandingPage && (
              <Link href="/dashboard">
                <Button size="sm" variant="accent" className="rounded-xl font-bold bg-accent-600 hover:bg-accent-700 text-white shadow-[0_2px_8px_-2px_rgba(37,99,235,0.3)] hover:shadow-[0_4px_12px_-2px_rgba(37,99,235,0.4)] transition-all duration-300">
                  Dashboard
                </Button>
              </Link>
            )
          ) : (
            <>
              <Link
                href="/login"
                className="text-[13px] font-bold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-100/70 transition-all duration-200"
              >
                Sign in
              </Link>
              <Link href="/sign-up" className="group">
                <Button size="sm" variant="accent" className="rounded-xl font-bold bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 text-white shadow-[0_2px_8px_-2px_rgba(37,99,235,0.3)] hover:shadow-[0_4px_14px_-2px_rgba(37,99,235,0.5)] transition-all duration-300 px-5">
                  Start for Free
                  <ArrowRight size={15} className="ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className={cn(
            "lg:hidden relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
            mobileOpen ? "bg-gray-100 text-gray-700" : "text-gray-700 hover:bg-gray-100/70"
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav - Full screen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-white shadow-2xl flex flex-col"
            >
              {/* Mobile panel header */}
              <div className="flex items-center justify-between px-6 h-16 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-sm">
                    <div className="w-3 h-3 bg-white rounded-[3px] rotate-45" />
                  </div>
                  <span className="text-[15px] font-bold text-gray-900">Menu</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                {isLandingPage &&
                  navLinks.map((link, i) => {
                    const isAnchor = link.href.startsWith("#");
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {isAnchor ? (
                          <a
                            href={link.href}
                            onClick={(e) =>
                              handleSmoothScroll(e, link.href)
                            }
                            className="flex items-center h-12 px-4 rounded-xl text-[15px] font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center h-12 px-4 rounded-xl text-[15px] font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200"
                          >
                            {link.label}
                          </Link>
                        )}
                      </motion.div>
                    );
                  })}
              </div>

              {/* Bottom actions */}
              <div className="border-t border-gray-100 px-4 py-5 space-y-3 shrink-0">
                {authenticated ? (
                  isLandingPage ? (
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                      <Button variant="accent" className="w-full rounded-xl bg-accent-600 text-white h-12 font-bold">
                        Dashboard
                      </Button>
                    </Link>
                  ) : null
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full h-12 rounded-xl text-gray-700 hover:bg-gray-100/80 border border-gray-200 font-bold">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                      <Button variant="accent" className="w-full h-12 rounded-xl bg-gradient-to-r from-accent-600 to-accent-500 font-bold shadow-md">
                        Start for Free
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
