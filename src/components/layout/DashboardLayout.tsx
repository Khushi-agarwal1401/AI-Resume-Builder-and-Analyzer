"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "◻" },
  { href: "/templates", label: "Templates", icon: "◇" },
  { href: "/tools/job-match", label: "Job Match", icon: "◇" },
  { href: "/tools/cover-letter", label: "Cover Letter", icon: "◇" },
  { href: "/integrations/github", label: "GitHub", icon: "◇" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-[240px] border-r border-gray-300 bg-white flex flex-col shrink-0">
        <div className="flex flex-col flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 h-11 px-3 rounded-sm text-body transition-all duration-200",
                pathname === item.href
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
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-small font-medium">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-small font-medium text-black truncate">{user?.email}</p>
              <span className="text-micro text-gray-500">Free</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
