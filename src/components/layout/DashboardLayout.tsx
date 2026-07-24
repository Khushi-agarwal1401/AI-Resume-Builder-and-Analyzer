"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Briefcase, 
  Bell, 
  BarChart3, 
  LayoutTemplate, 
  Target, 
  FileText, 
  Link as LinkIcon, 
  Settings, 
  Menu, 
  X,
  Crown
} from "lucide-react";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/updates", label: "Updates", icon: Bell },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const toolsNavItems = [
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/tools/job-match", label: "Job Match", icon: Target },
  { href: "/tools/cover-letter", label: "Cover Letter", icon: FileText },
];

const integrationsNavItems = [
  { href: "/integrations/github", label: "GitHub", icon: LinkIcon },
];

const settingsNavItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => 
    pathname === href || pathname.startsWith(href + "/");

  const NavLink = ({ item }: { item: { href: string; label: string; icon: React.ElementType } }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
          active
            ? "bg-gradient-to-r from-accent-50 to-accent-100/50 text-accent-700 font-semibold shadow-sm"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <Icon 
          className={cn(
            "w-5 h-5 transition-colors",
            active ? "text-accent-600" : "text-gray-400 group-hover:text-gray-600"
          )} 
        />
        <span className="text-sm font-medium">{item.label}</span>
        {active && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-600" />
        )}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} className="text-gray-700" /> : <Menu size={20} className="text-gray-700" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-[280px] bg-white border-r border-gray-200/60 flex flex-col shrink-0 transition-transform duration-300 ease-out",
          "lg:relative lg:translate-x-0",
          "fixed inset-y-0 left-0 z-40 shadow-2xl lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/60 lg:hidden">
          <span className="text-lg font-bold text-gray-900">Menu</span>
          <button 
            onClick={() => setMobileOpen(false)} 
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200/60">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-600 to-accent-700 flex items-center justify-center shadow-lg">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Resume Builder</p>
              <p className="text-xs text-gray-500">AI-Powered</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Main Navigation */}
          <div>
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main</p>
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tools</p>
            <div className="space-y-1">
              {toolsNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div>
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Integrations</p>
            <div className="space-y-1">
              {integrationsNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</p>
            <div className="space-y-1">
              {settingsNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200/60 bg-gradient-to-r from-gray-50 to-white">
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white transition-all duration-200 group"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white font-semibold shadow-md">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              {isPro && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-sm">
                  <Crown size={10} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.email?.split('@')[0]}</p>
              {subLoading ? (
                <span className="text-xs text-gray-500">Loading...</span>
              ) : (
                <span className={cn("text-xs font-medium flex items-center gap-1", isPro ? "text-yellow-600" : "text-gray-500")}>
                  {isPro ? (
                    <>
                      <Crown size={10} /> Pro Plan
                    </>
                  ) : (
                    "Free Plan"
                  )}
                </span>
              )}
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 lg:ml-0 pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
