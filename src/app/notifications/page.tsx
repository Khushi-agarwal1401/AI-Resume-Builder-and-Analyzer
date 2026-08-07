"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  TYPE_META,
  FILTERS,
  type AppNotification,
} from "@/components/layout/NotificationCenter";

const PAGE_SIZE = 25;

export default function NotificationsPage() {
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterKey, setFilterKey] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (filterKey === "unread") params.set("read", "false");
      else if (filterKey !== "all") params.set("type", filterKey);

      const res = await fetch(`/api/notifications?${params}`);
      const json = await res.json();
      if (!json.success) return;
      const items: AppNotification[] = json.data.notifications || [];
      setNotifications((prev) => (append ? [...prev, ...items] : items));
      setUnreadCount(json.data.unreadCount || 0);
      setHasMore(items.length === PAGE_SIZE);
    },
    [filterKey]
  );

  // Load the first page when auth resolves or the filter changes.
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/login");
      return;
    }
    if (authenticated) {
      setLoading(true);
      fetchPage(0, false).finally(() => setLoading(false));
    }
  }, [authLoading, authenticated, router, fetchPage]);

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleOpen(n: AppNotification) {
    if (!n.read) {
      await fetch(`/api/notifications?id=${n.id}`, { method: "PATCH" });
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.link) router.push(n.link);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) =>
      Math.max(0, c - (notifications.find((n) => n.id === id && !n.read) ? 1 : 0))
    );
  }

  function handleLoadMore() {
    setLoadingMore(true);
    fetchPage(notifications.length, true).finally(() => setLoadingMore(false));
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-[760px] mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Notifications</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="rounded-xl"
            >
              {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
              Mark all read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap mb-5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterKey(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
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
        {notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-14 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">No notifications yet</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
              Run an ATS check, export a resume, share a link, or update a job application to see
              activity here.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-50">
              {notifications.map((n) => {
                const meta = TYPE_META[n.type] || TYPE_META.info;
                const Icon = meta.icon;
                return (
                  <li key={n.id} className="relative group">
                    <button
                      onClick={() => handleOpen(n)}
                      className={cn(
                        "w-full flex items-start gap-3.5 px-4 sm:px-5 pr-10 sm:pr-12 py-4 text-left transition-colors hover:bg-gray-50/80",
                        !n.read && "bg-accent-50/40"
                      )}
                    >
                      <span className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", meta.bg)}>
                        <Icon className={cn("w-4 h-4", meta.color)} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={cn("block text-sm leading-tight", n.read ? "text-gray-600 font-medium" : "text-gray-900 font-bold")}>
                          {n.title}
                        </span>
                        {n.message && (
                          <span className="block text-[13px] text-gray-400 leading-snug mt-0.5 line-clamp-2">
                            {n.message}
                          </span>
                        )}
                        <span className="block text-[11px] text-gray-300 mt-1.5 font-medium">
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
                      className="absolute top-3.5 right-3 sm:right-4 w-7 h-7 flex items-center justify-center p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>

            {hasMore && (
              <div className="px-4 py-3 border-t border-gray-100 flex justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-xl"
                >
                  {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
