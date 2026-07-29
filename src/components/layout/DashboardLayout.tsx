"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  RefreshCw,
  BarChart3,
  Layout,
  Crosshair,
  FileText,
  GitBranch, // Github not available in this lucide-react version
  Settings,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/updates", label: "Updates", icon: RefreshCw },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/templates", label: "Templates", icon: Layout },
  { href: "/tools/job-match", label: "Job Match", icon: Crosshair },
  { href: "/tools/cover-letter", label: "Cover Letter", icon: FileText },
  { href: "/integrations/github", label: "GitHub", icon: GitBranch },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen relative pt-[72px] bg-gray-50/30">
      {/* Mobile toggle button */}
      <button
        className={cn(
          "lg:hidden fixed top-[84px] z-50 w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200",
          mobileOpen
            ? "left-[260px] bg-white shadow-lg border border-gray-200 hover:bg-gray-50"
            : "left-4 bg-white shadow-md border border-gray-200 hover:shadow-lg hover:bg-gray-50"
        )}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? (
          <X size={18} className="text-gray-600" />
        ) : (
          <Menu size={18} className="text-gray-600" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "w-[260px] border-r border-gray-200 bg-white flex flex-col shrink-0 transition-all duration-300 ease-out",
          "lg:relative lg:translate-x-0",
          "fixed inset-y-0 left-0 z-40 shadow-lg lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 lg:hidden">
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

        {/* Top spacer on desktop */}
        <div className="hidden lg:block h-4 shrink-0" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 h-[42px] px-3 rounded-xl text-[14px] font-medium transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-accent-50 to-accent-50/50 text-accent-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80"
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-accent-500 to-accent-600 shadow-sm" />
                )}
                <Icon
                  size={18}
                  className={cn(
                    "shrink-0 transition-all duration-200",
                    active
                      ? "text-accent-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                <span>{item.label}</span>
                {active && (
                  <ChevronRight
                    size={14}
                    className="ml-auto text-accent-400/60 shrink-0"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade banner for free users */}
        {!subLoading && !isPro && (
          <div className="mx-3 mb-2 p-3 rounded-xl bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700 shadow-md">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white leading-tight mb-0.5">Upgrade to Pro</p>
                <p className="text-[10px] text-white/80 leading-tight mb-2">Unlock AI features & more</p>                  <Link
                  href="/pricing"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors"
                >
                  See Plans
                  <ChevronRight size={10} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* User profile */}
        <div className="border-t border-gray-100 px-3 py-3">
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/80 transition-all duration-200"
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center text-[14px] font-bold text-accent-700 shadow-sm">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate group-hover:text-accent-700 transition-colors">
                {user?.email?.split("@")[0] || "User"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {subLoading ? (
                  <span className="w-12 h-3 rounded bg-gray-100 animate-pulse" />
                ) : (
                  <>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                        isPro
                          ? "bg-accent-100 text-accent-700"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {isPro ? (
                        <>
                          <Sparkles size={8} className="text-accent-600" />
                          Pro
                        </>
                      ) : (
                        "Free"
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
