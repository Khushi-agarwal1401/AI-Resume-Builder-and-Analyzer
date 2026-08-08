"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Settings, LogOut, ChevronDown, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Desktop user menu — avatar + name that opens a dropdown with account
 * shortcuts and a Sign out action. Placed in the top navbar for
 * authenticated sessions; the mobile drawer already offers Sign out.
 */
export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape / route change
  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  if (loading || !user) return null;

  const initial = user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U";

  const itemClass =
    "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 pl-1.5 pr-2.5 h-10 rounded-xl transition-all duration-200 active:scale-[0.98]",
          open
            ? "bg-gray-100/90 dark:bg-gray-800/80"
            : "hover:bg-gray-100/80 dark:hover:bg-gray-800/60"
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center text-[13px] font-bold text-accent-700 shadow-sm shrink-0">
          {initial}
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-[13px] font-bold text-gray-900 dark:text-white max-w-[130px] truncate">
            {user.name || user.email?.split("@")[0] || "Account"}
          </span>
          <span className="text-[10px] text-gray-400 font-medium max-w-[130px] truncate">
            {user.email || ""}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "text-gray-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            role="menu"
            className="absolute right-0 top-[calc(100%+10px)] w-60 p-1.5 rounded-2xl bg-white border border-gray-200 shadow-xl shadow-gray-300/40 dark:bg-gray-900 dark:border-gray-800 dark:shadow-black/40 z-[80]"
          >
            {/* Signed in as */}
            <div className="px-3 pt-2.5 pb-2 mb-1 border-b border-gray-100 dark:border-gray-800">
              <p className="text-[12px] font-bold text-gray-900 dark:text-white truncate">
                {user.name || "Account"}
              </p>
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
            </div>

            <Link href="/dashboard" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              <LayoutDashboard size={16} className="text-gray-400 shrink-0" />
              Dashboard
            </Link>
            <Link href="/settings" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              <Settings size={16} className="text-gray-400 shrink-0" />
              Settings
            </Link>
            <Link href="/settings?tab=account" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              <User size={16} className="text-gray-400 shrink-0" />
              Account
            </Link>

            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors duration-150 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <LogOut size={16} className="shrink-0" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
