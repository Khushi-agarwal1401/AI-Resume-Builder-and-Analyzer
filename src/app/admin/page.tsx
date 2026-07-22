"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { isAdmin } from "@/lib/admin";
import { Spinner } from "@/components/ui/Spinner";

interface AdminStats {
  totalUsers: number;
  totalResumes: number;
  proUsers: number;
  totalAnalyses: number;
  recentSignups: number;
  templatesUsed: Record<string, number>;
  totalApplications: number;
  averageCompatibilityScore: number | null;
}

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "◻" },
  { href: "/admin/users", label: "Users", icon: "◇" },
  { href: "/admin/templates", label: "Templates", icon: "◇" },
  { href: "/admin/prompts", label: "AI Prompts", icon: "◇" },
];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminVerified, setAdminVerified] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    // Verify admin status server-side on every page load
    async function verifyAndFetch() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (json.success) {
          setAdminVerified(true);
          setStats(json.data);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    verifyAndFetch();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;

  if (!adminVerified && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-h1 text-black mb-2">Access Denied</h1>
          <p className="text-body text-gray-500">You do not have permission to access this page.</p>
          <Link href="/dashboard" className="text-accent-500 hover:underline mt-4 inline-block">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-[240px] border-r border-gray-300 bg-white min-h-screen flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-300">
            <h2 className="text-h3 text-black">Admin</h2>
            <p className="text-micro text-gray-500">Super Admin Panel</p>
          </div>
          <nav className="flex flex-col px-3 py-4 space-y-1">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 h-11 px-3 rounded-sm text-body text-gray-500 hover:text-black hover:bg-gray-100 transition-all"
              >
                <span className="text-lg w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1 p-8">
          <h1 className="text-h1 text-black mb-8">Admin Dashboard</h1>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Spinner /></div>
          ) : stats ? (
            <>
              {/* Top-level KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { label: "Total Users", value: stats.totalUsers, color: "text-accent-500" },
                  { label: "Total Resumes", value: stats.totalResumes, color: "text-black" },
                  { label: "Pro Users", value: stats.proUsers, color: "text-success" },
                  { label: "Estimated Compatibility Score", value: stats.averageCompatibilityScore ?? "—", color: "text-info", suffix: stats.averageCompatibilityScore !== null ? " avg" : "" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white border border-gray-300 rounded-sm p-5">
                    <p className={`text-h1 font-bold ${stat.color}`}>{stat.value}{stat.suffix || ""}</p>
                    <p className="text-small text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-gray-300 rounded-sm p-5">
                  <h3 className="text-h3 text-black mb-4">Recent Signups (7 days)</h3>
                  <p className="text-h2 text-accent-500">{stats.recentSignups}</p>
                </div>
                <div className="bg-white border border-gray-300 rounded-sm p-5">
                  <h3 className="text-h3 text-black mb-4">Total JD Analyses</h3>
                  <p className="text-h2 text-gray-700">{stats.totalAnalyses}</p>
                </div>
              </div>

              {/* Template usage distribution */}
              <div className="bg-white border border-gray-300 rounded-sm p-5">
                <h3 className="text-h3 text-black mb-4">Template Distribution</h3>
                {Object.keys(stats.templatesUsed).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.templatesUsed)
                      .sort(([, a], [, b]) => b - a)
                      .map(([template, count]) => {
                        const total = Object.values(stats.templatesUsed).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={template} className="flex items-center gap-4">
                            <span className="text-small text-gray-700 w-36 capitalize">{template}</span>
                            <div className="flex-1 h-4 bg-gray-100 rounded-sm overflow-hidden">
                              <div className="h-full bg-accent-500 rounded-sm" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-small text-gray-500 w-16 text-right">{count}</span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-body text-gray-500">No template data available.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-body text-gray-500">Could not load stats.</p>
          )}
        </div>
      </div>
    </div>
  );
}
