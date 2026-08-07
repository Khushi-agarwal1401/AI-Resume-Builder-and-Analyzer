"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Layout,
  BrainCircuit,
  ScrollText,
  ChevronRight,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

const adminNav = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview & metrics",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    description: "Manage users",
  },
  {
    href: "/admin/templates",
    label: "Templates",
    icon: Layout,
    description: "Resume templates",
  },
  {
    href: "/admin/prompts",
    label: "AI Prompts",
    icon: BrainCircuit,
    description: "System prompts",
  },
  {
    href: "/admin/audit",
    label: "Audit Log",
    icon: ScrollText,
    description: "Admin activity trail",
  },
];

function isActiveNav(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

/** Shared nav + footer, rendered inside both the desktop sidebar and the mobile drawer. */
function AdminNavContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
        <p className="px-3 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Manage
        </p>
        {adminNav.map((item) => {
          const active = isActiveNav(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-accent-50/80 to-accent-50/40 text-accent-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-gradient-to-b from-accent-500 to-accent-600 shadow-sm" />
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

              <div className="flex-1 min-w-0">
                <span className="block leading-tight">{item.label}</span>
                <span className="block text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                  {item.description}
                </span>
              </div>

              {active && (
                <ChevronRight
                  size={14}
                  className="text-accent-400/60 shrink-0"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
        >
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
            <LayoutDashboard size={14} className="text-gray-500" />
          </div>
          <span>Back to Dashboard</span>
        </Link>
        <p className="px-3.5 pt-3 text-[9px] font-medium text-gray-300 uppercase tracking-widest">
          Restricted area · Admins only
        </p>
      </div>
    </>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer on route change (tapping a link navigates)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close the drawer on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile hamburger (below the global navbar) */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open admin menu"
        className="lg:hidden fixed top-[84px] left-4 z-50 w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-md border border-gray-200 hover:bg-gray-50 hover:shadow-lg transition-all duration-200 active:scale-95"
      >
        <Menu size={18} className="text-gray-600" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white shadow-2xl flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              {/* Header */}
              <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-600 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/20">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-gray-900 leading-tight">
                      Admin
                    </h2>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Super Admin Panel
                    </p>
                  </div>
                </div>
                <button
                  autoFocus
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close admin menu"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <AdminNavContent
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar — sticky, clears the fixed global navbar */}
      <aside className="hidden lg:flex w-[260px] border-r border-gray-200 bg-white flex-col shrink-0 sticky top-[72px] h-[calc(100vh-72px)]">
        {/* Header */}
        <div className="px-5 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-600 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/20">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900 leading-tight">
                Admin
              </h2>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                Super Admin Panel
              </p>
            </div>
          </div>
        </div>

        <AdminNavContent pathname={pathname} />
      </aside>
    </>
  );
}
