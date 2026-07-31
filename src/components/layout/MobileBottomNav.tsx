"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, FileText, Sparkles, Briefcase, User, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/templates", label: "Resume", icon: FileText },
  { href: "/tools/job-match", label: "AI Assistant", icon: Sparkles },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/settings", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  async function handleCreateResume() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Resume",
          targetLevel: "fresher",
          template: "modern",
        }),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/builder/${json.data.id}`);
      } else {
        toast.error(json.error || "Could not create resume.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      {/* Floating Create button */}
      <button
        onClick={handleCreateResume}
        disabled={creating}
        aria-label="Create resume"
        title="Create resume"
        className="lg:hidden fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-lg shadow-accent-500/30 flex items-center justify-center transition-all duration-200 active:scale-90 hover:from-accent-600 hover:to-accent-800 disabled:opacity-60"
      >
        <Plus size={26} className={cn(creating && "animate-spin")} />
      </button>

      {/* Bottom nav bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-5 h-20">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-1 transition-colors duration-150",
                  active ? "text-accent-600" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {active && (
                  <span className="absolute top-0 h-0.5 w-10 rounded-full bg-gradient-to-r from-accent-500 to-accent-600" />
                )}
                <Icon
                  size={20}
                  className={cn(
                    "transition-transform duration-150",
                    active ? "scale-110" : "group-hover:scale-105"
                  )}
                />
                <span className="text-[10px] font-semibold tracking-wide">{tab.label}</span>
              </Link>
            );
          })}
        </div>
        {/* Safe-area spacer for iOS home indicator */}
        <div className="h-[env(safe-area-inset-bottom)] bg-transparent" />
      </nav>
    </>
  );
}
