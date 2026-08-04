"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  Users,
  FileText,
  Sparkles,
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Target,
  ChevronRight,
  LayoutTemplate,
  type LucideIcon,
} from "lucide-react";

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

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  color: "blue" | "indigo" | "emerald" | "amber" | "gray";
}) {
  const colorMap = {
    blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-700 border-blue-200",
    indigo: "from-indigo-500 to-indigo-600 bg-indigo-50 text-indigo-700 border-indigo-200",
    emerald: "from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "from-amber-500 to-amber-600 bg-amber-50 text-amber-700 border-amber-200",
    gray: "from-gray-500 to-gray-600 bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <div className="relative group">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm",
            colorMap[color].split(" ")[2]
          )}>
            <Icon size={20} className={colorMap[color].split(" ")[3]} />
          </div>
          {trend && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
              <TrendingUp size={10} />
              {trend}
            </span>
          )}
        </div>
        <p className="text-[28px] font-bold text-gray-900 leading-none mb-1.5 tabular-nums">
          {value}
        </p>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (json.success) setStats(json.data);
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-50 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles size={22} className="text-accent-600" />
          </div>
          <Spinner />
        </div>
      </div>
    );
  }

  if (!stats && !loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex">
        <ErrorBoundary>
          <AdminSidebar />
        </ErrorBoundary>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-8">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
              <Zap size={28} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-sm text-gray-500 mb-6">
              You do not have permission to access this page. Contact your administrator if you believe this is an error.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 text-white text-sm font-semibold hover:bg-accent-700 transition-all shadow-lg shadow-accent-500/20"
            >
              Go to Dashboard <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const totalTemplateUsage = Object.values(stats?.templatesUsed || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      <ErrorBoundary>
        <AdminSidebar />
      </ErrorBoundary>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-10">
          {/* Page Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-sm">
                <BarChart3 size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <p className="text-sm text-gray-500 ml-11">
              Platform overview and key metrics at a glance.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner />
            </div>
          ) : stats ? (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard
                  icon={Users}
                  label="Total Users"
                  value={stats.totalUsers.toLocaleString()}
                  trend="+12%"
                  color="blue"
                />
                <StatCard
                  icon={FileText}
                  label="Total Resumes"
                  value={stats.totalResumes.toLocaleString()}
                  trend="+8%"
                  color="indigo"
                />
                <StatCard
                  icon={Sparkles}
                  label="Pro Users"
                  value={stats.proUsers.toLocaleString()}
                  color="emerald"
                />
                <StatCard
                  icon={Target}
                  label="Avg. Compatibility Score"
                  value={stats.averageCompatibilityScore !== null ? `${stats.averageCompatibilityScore} pts` : "—"}
                  color="amber"
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center">
                      <Activity size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Recent Signups</p>
                      <p className="text-[11px] text-gray-400">Last 7 days</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {stats.recentSignups}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <BarChart3 size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">JD Analyses</p>
                      <p className="text-[11px] text-gray-400">Total performed</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {stats.totalAnalyses.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <FileText size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Applications</p>
                      <p className="text-[11px] text-gray-400">Tracked</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {stats.totalApplications.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Template Distribution */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                      <LayoutTemplate size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Template Distribution</h3>
                      <p className="text-xs text-gray-400">How users are using different resume templates</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {Object.keys(stats.templatesUsed).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(stats.templatesUsed)
                        .sort(([, a], [, b]) => b - a)
                        .map(([template, count]) => {
                          const pct = totalTemplateUsage > 0
                            ? Math.round((count / totalTemplateUsage) * 100)
                            : 0;
                          return (
                            <div key={template} className="group">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {template.replace("-", " ")}
                                </span>
                                <span className="text-xs font-semibold text-gray-500 tabular-nums">
                                  {count} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-accent-400 to-accent-600 rounded-full transition-all duration-700 ease-out group-hover:from-accent-500 group-hover:to-accent-700"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <LayoutTemplate size={20} className="text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No template data available yet.</p>
                      <p className="text-xs text-gray-400 mt-1">Templates usage will appear as users create resumes.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
