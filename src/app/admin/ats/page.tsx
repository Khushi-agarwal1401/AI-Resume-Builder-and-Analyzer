"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  Target,
  ChevronRight,
  Sparkles,
  Zap,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  FileText,
  BarChart3,
} from "lucide-react";

interface AtsReport {
  id: string;
  resumeId: string;
  resumeTitle: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  overallScore: number;
  keywordRelevance: number;
  formatting: number;
  readability: number;
  sections: number;
  jobDescription: string | null;
  createdAt: string;
}

export default function AdminAtsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<AtsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    async function fetchReports() {
      try {
        const res = await fetch("/api/admin/ats");
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (json.success) setReports(json.data);
      } catch { } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [user, authLoading]);

  const filteredReports = reports
    .filter((r) => {
      const matchesSearch =
        (r.resumeTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.userEmail || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.userName || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesScore =
        scoreFilter === "all" ||
        (scoreFilter === "high" && r.overallScore >= 80) ||
        (scoreFilter === "medium" && r.overallScore >= 60 && r.overallScore < 80) ||
        (scoreFilter === "low" && r.overallScore < 60);

      return matchesSearch && matchesScore;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return b.overallScore - a.overallScore;
      }
    });

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

  if (!loading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex pt-[72px]">
        <ErrorBoundary>
          <AdminSidebar />
        </ErrorBoundary>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-8">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
              <Zap size={28} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-sm text-gray-500 mb-6">You do not have permission to access this page.</p>
            <a href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 text-white text-sm font-semibold hover:bg-accent-700 transition-all shadow-lg shadow-accent-500/20">
              Go to Dashboard <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const averageScore = reports.length > 0
    ? Math.round(reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50/50 flex pt-[72px]">
      <ErrorBoundary>
        <AdminSidebar />
      </ErrorBoundary>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-sm">
                <Target size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ATS Reports</h1>
            </div>
            <p className="text-sm text-gray-500 ml-11">
              View and analyze ATS scoring reports across all resumes.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <FileText size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Total Reports</p>
                  <p className="text-[11px] text-gray-400">All time</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{reports.length}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <BarChart3 size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Avg. Score</p>
                  <p className="text-[11px] text-gray-400">Platform-wide</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{averageScore}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center">
                  <TrendingUp size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">High Scores</p>
                  <p className="text-[11px] text-gray-400">80+ points</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {reports.filter((r) => r.overallScore >= 80).length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all placeholder:text-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by resume, user, or email..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all"
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value as "all" | "high" | "medium" | "low")}
                >
                  <option value="all">All Scores</option>
                  <option value="high">High (80+)</option>
                  <option value="medium">Medium (60-79)</option>
                  <option value="low">Low (&lt;60)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "score")}
                >
                  <option value="date">Sort by Date</option>
                  <option value="score">Sort by Score</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Report count */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{filteredReports.length}</span> report{filteredReports.length !== 1 ? "s" : ""}
                  {filteredReports.length !== reports.length && ` (filtered from ${reports.length})`}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Resume</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Overall Score</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Keywords</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Formatting</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Readability</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center text-xs font-bold text-accent-700 shrink-0 dark:from-accent-500/25 dark:to-accent-500/15 dark:text-accent-200">
                              <FileText size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{r.resumeTitle || "Untitled"}</p>
                              <p className="text-xs text-gray-400 font-mono truncate">{r.resumeId.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-gray-900">{r.userName || "—"}</p>
                            <p className="text-xs text-gray-400 truncate">{r.userEmail || "—"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                              r.overallScore >= 80 ? "bg-emerald-50 text-emerald-700" :
                                r.overallScore >= 60 ? "bg-amber-50 text-amber-700" :
                                  "bg-red-50 text-red-700"
                            )}>
                              {r.overallScore}
                            </div>
                            {r.overallScore >= 80 ? (
                              <TrendingUp size={14} className="text-emerald-500" />
                            ) : r.overallScore < 60 ? (
                              <TrendingDown size={14} className="text-red-500" />
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  r.keywordRelevance >= 30 ? "bg-emerald-500" :
                                    r.keywordRelevance >= 20 ? "bg-amber-500" :
                                      "bg-red-500"
                                )}
                                style={{ width: `${Math.min(r.keywordRelevance, 40) / 40 * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 tabular-nums w-8">{r.keywordRelevance}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  r.formatting >= 25 ? "bg-emerald-500" :
                                    r.formatting >= 20 ? "bg-amber-500" :
                                      "bg-red-500"
                                )}
                                style={{ width: `${Math.min(r.formatting, 30) / 30 * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 tabular-nums w-8">{r.formatting}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  r.readability >= 25 ? "bg-emerald-500" :
                                    r.readability >= 20 ? "bg-amber-500" :
                                      "bg-red-500"
                                )}
                                style={{ width: `${Math.min(r.readability, 30) / 30 * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 tabular-nums w-8">{r.readability}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400 tabular-nums">
                          {new Date(r.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredReports.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Target size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {searchQuery || scoreFilter !== "all" ? "No reports match your filters." : "No ATS reports found."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
