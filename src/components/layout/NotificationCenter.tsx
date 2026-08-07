"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Download,
  Gauge,
  GitBranch,
  Sparkles,
  Info,
  CheckCheck,
  X,
  Link2,
  Briefcase,
  CreditCard,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

export const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  export: { icon: Download, color: "text-blue-600", bg: "bg-blue-50" },
  ats: { icon: Gauge, color: "text-purple-600", bg: "bg-purple-50" },
  github: { icon: GitBranch, color: "text-gray-700", bg: "bg-gray-100" },
  ai: { icon: Sparkles, color: "text-accent-600", bg: "bg-accent-50" },
  share: { icon: Link2, color: "text-sky-600", bg: "bg-sky-50" },
  job: { icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
  sub: { icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50" },
  info: { icon: Info, color: "text-gray-600", bg: "bg-gray-100" },
};

/** Filter chips for the dropdown + history page (Task 2.1 — filter notifications). */
export const FILTERS: { key: "all" | "unread" | string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "ats", label: "ATS" },
  { key: "ai", label: "AI" },
  { key: "export", label: "Export" },
  { key: "share", label: "Share" },
  { key: "job", label: "Jobs" },
  { key: "github", label: "GitHub" },
  { key: "sub", label: "Subscription" },
];

const POLL_INTERVAL_MS = 60_000;

export function NotificationCenter({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterKey, setFilterKey] = useState("all");
  const panelRef = useRef<HTMLDivElement>(null);

  // Client-side filter over the loaded list (All / Unread / by type).
  const filteredNotifications = notifications.filter((n) => {
    if (filterKey === "all") return true;
    if (filterKey === "unread") return !n.read;
    return n.type === filterKey;
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch {
      // Silent — keep whatever we have
    }
  }, []);

  // Fetch on mount, when opened, and poll periodically for fresh events
  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  async function handleMarkAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  async function handleClickNotification(n: AppNotification) {
    if (!n.read) {
      await fetch(`/api/notifications?id=${n.id}`, { method: "PATCH" });
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - (notifications.find((n) => n.id === id && !n.read) ? 1 : 0)));
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150 active:scale-[0.93]",
          "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
          className
        )}
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-800">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/60 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-600 hover:text-accent-700 hover:bg-accent-50 px-2 py-1 rounded-lg transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter chips (Task 2.1) */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-50 overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterKey(f.key)}
                className={cn(
                  "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors",
                  filterKey === f.key
                    ? "bg-accent-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[min(24rem,60vh)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Export a resume, run an ATS check, or sync GitHub to see updates here.
                </p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No notifications in this filter</p>
                <p className="text-xs text-gray-400 mt-1">Try another filter to see more activity.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {filteredNotifications.map((n) => {
                  const meta = TYPE_META[n.type] || TYPE_META.info;
                  const Icon = meta.icon;
                  return (
                    <li key={n.id} className="relative group">
                      <button
                        onClick={() => handleClickNotification(n)}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 pr-9 sm:pr-4 py-3 text-left transition-colors hover:bg-gray-50/80",
                          !n.read && "bg-accent-50/40"
                        )}
                      >
                        <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", meta.bg)}>
                          <Icon className={cn("w-4 h-4", meta.color)} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className={cn("block text-[13px] leading-tight", n.read ? "text-gray-600 font-medium" : "text-gray-900 font-bold")}>
                            {n.title}
                          </span>
                          {n.message && (
                            <span className="block text-xs text-gray-400 leading-snug mt-0.5 line-clamp-2">
                              {n.message}
                            </span>
                          )}
                          <span className="block text-[10px] text-gray-300 mt-1 font-medium">
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2" aria-hidden />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(n.id);
                        }}
                        aria-label="Delete notification"
                        className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
              <span className="text-[10px] text-gray-300 font-medium">
                {notifications.length} shown · {unreadCount} unread
              </span>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/notifications");
                }}
                className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition-colors"
              >
                View all history →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
