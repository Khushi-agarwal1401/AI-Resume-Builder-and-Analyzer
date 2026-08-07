"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FilePenLine,
  Download,
  Sparkles,
  Gauge,
  History,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ResumeListItem } from "@/lib/query/resume-hooks";

interface ActivityNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  created_at: string;
}

interface ActivityItem {
  key: string;
  label: string;
  description: string;
  timestamp: string | null;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}

const ACTIVITY_KINDS: { type: string; label: string; icon: React.ComponentType<{ className?: string }>; iconClass: string; href: string }[] = [
  { type: "export", label: "Last exported", icon: Download, iconClass: "bg-blue-50 text-blue-600", href: "/dashboard" },
  { type: "ai", label: "AI rewritten", icon: Sparkles, iconClass: "bg-indigo-50 text-indigo-600", href: "/dashboard" },
  { type: "ats", label: "ATS analyzed", icon: Gauge, iconClass: "bg-purple-50 text-purple-600", href: "/ats-check" },
];

/**
 * Epic 3, Task 3.2 — Recent Activity widget.
 * Shows "Last edited" (from the resume list) plus the most recent export / AI
 * rewrite / ATS analysis (from the notification feed that event wiring writes).
 */
export function RecentActivityWidget({ resumes }: { resumes: ResumeListItem[] }) {
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=30");
      const json = await res.json();
      if (json.success) setNotifications(json.data.notifications || []);
    } catch {
      // Silent — the widget shows partial data from resumes only.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Last edited = most recently updated resume.
  const lastEdited = resumes.length
    ? [...resumes].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0]
    : null;

  const activity: ActivityItem[] = [
    {
      key: "edited",
      label: "Last edited",
      description: lastEdited?.title ?? "No resumes yet",
      timestamp: lastEdited?.updated_at ?? null,
      href: lastEdited ? `/builder/${lastEdited.id}` : "/dashboard",
      icon: FilePenLine,
      iconClass: "bg-gray-50 text-gray-600",
    },
    ...ACTIVITY_KINDS.map((kind) => {
      const latest = notifications.find((n) => n.type === kind.type);
      return {
        key: kind.type,
        label: kind.label,
        description: latest?.message || latest?.title || "No activity yet",
        timestamp: latest?.created_at ?? null,
        href: latest?.link || kind.href,
        icon: kind.icon,
        iconClass: kind.iconClass,
      } satisfies ActivityItem;
    }),
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <History className="w-4 h-4 text-gray-500" />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
        </div>
        {loading && <Loader2 className="w-3.5 h-3.5 text-gray-300 animate-spin" />}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {activity.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className="group rounded-xl border border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white hover:shadow-sm p-3.5 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", item.iconClass)}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  {item.label}
                </span>
              </div>
              <p className="text-[13px] font-semibold text-gray-800 truncate group-hover:text-accent-700 transition-colors">
                {item.description}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                {item.timestamp ? (
                  <>
                    {formatRelativeTime(item.timestamp)}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                ) : (
                  "—"
                )}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
