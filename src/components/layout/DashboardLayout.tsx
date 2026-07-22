"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "◻" },
  { href: "/jobs", label: "Jobs", icon: "⚡" },
  { href: "/updates", label: "Updates", icon: "🔄" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/templates", label: "Templates", icon: "◇" },
  { href: "/tools/job-match", label: "Job Match", icon: "◇" },
  { href: "/tools/cover-letter", label: "Cover Letter", icon: "◇" },
  { href: "/integrations/github", label: "GitHub", icon: "◇" },
  { href: "/settings", label: "Settings", icon: "◇" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-64px)] relative">
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-300 rounded-sm flex items-center justify-center"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          {mobileOpen ? (
            <path d="M5 5l10 10M15 5l-10 10" strokeLinecap="round" />
          ) : (
            <>
              <path d="M3 5h14" strokeLinecap="round" />
              <path d="M3 10h14" strokeLinecap="round" />
              <path d="M3 15h14" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "w-[240px] border-r border-gray-300 bg-white flex flex-col shrink-0 transition-transform duration-200",
          "lg:relative lg:translate-x-0",
          "fixed inset-y-0 left-0 z-40",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-300 lg:hidden">
          <span className="text-h3 text-black font-semibold">Menu</span>
          <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 h-11 px-3 rounded-sm text-body transition-all duration-200",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-gray-100 text-black font-medium border-l-[3px] border-accent-500 ml-0 pl-[9px]"
                  : "text-gray-500 hover:text-black hover:bg-gray-100"
              )}
            >
              <span className="text-lg w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="border-t border-gray-300 px-3 py-3">
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-small font-medium">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-small font-medium text-black truncate">{user?.email}</p>
              {subLoading ? (
                <span className="text-micro text-gray-500">Loading...</span>
              ) : (
                <span className={cn("text-micro font-medium", isPro ? "text-accent-500" : "text-gray-500")}>
                  {isPro ? "Pro" : "Free"}
                </span>
              )}
            </div>
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0 lg:pt-0 pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
