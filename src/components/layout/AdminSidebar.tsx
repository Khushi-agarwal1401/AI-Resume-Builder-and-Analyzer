"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Layout,
  BrainCircuit,
  ScrollText,
  ChevronRight,
  Sparkles,
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

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-[260px] border-r border-gray-200 bg-white flex flex-col shrink-0 min-h-screen">
      {/* Header */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-600 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/20">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 leading-tight">Admin</h2>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Super Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {adminNav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 h-[48px] px-3.5 rounded-xl text-sm font-medium transition-all duration-200",
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
                <span>{item.label}</span>
                <p className="text-[10px] text-gray-400 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.description}
                </p>
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
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
        >
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
            <LayoutDashboard size={14} className="text-gray-500" />
          </div>
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}
