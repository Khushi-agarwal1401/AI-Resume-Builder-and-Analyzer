"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { Cpu, CheckCircle2, XCircle, ChevronRight, Activity, Zap } from "lucide-react";

interface AiLogRow {
  id: string;
  action: string;
  provider: string;
  model: string;
  success: boolean;
  latency_ms: number;
  error: string;
  created_at: string;
}

interface AiLogsSummary {
  total: number;
  success: number;
  failed: number;
  successRate: number;
  avgLatencyMs: number;
  groq: number;
  gemini: number;
  none: number;
}

const PROVIDER_STYLES: Record<string, { badge: string; label: string }> = {
  groq: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Groq" },
  gemini: { badge: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Gemini" },
};

function providerStyle(provider: string) {
  return (
    PROVIDER_STYLES[provider] || {
      badge: "bg-gray-100 text-gray-500 border-gray-200",
      label: provider || "—",
    }
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", color)}>{icon}</div>
        {sub && <span className="text-[10px] font-semibold text-gray-400">{sub}</span>}
      </div>
      <p className="text-[28px] font-bold text-gray-900 leading-none mb-1.5 tabular-nums">{value}</p>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
    </div>
  );
}

export default function AdminAiHealthPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AiLogRow[]>([]);
  const [summary, setSummary] = useState<AiLogsSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchPage = useCallback(async (offset: number, append: boolean) => {
    try {
      const res = await fetch(`/api/admin/ai-logs?limit=50&offset=${offset}`);
      const json = await res.json();
      if (json.success) {
        setRows((prev) => (append ? [...prev, ...json.data] : json.data));
        setTotal(json.total);
        if (json.summary) setSummary(json.summary);
        return json.data as AiLogRow[];
      }
      setError(json.error || "Failed to load AI request logs");
      return [];
    } catch {
      setError("Something went wrong loading the AI request logs.");
      return [];
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPage(0, false).finally(() => setLoading(false));
  }, [user, authLoading, fetchPage]);

  async function handleLoadMore() {
    setLoadingMore(true);
    await fetchPage(rows.length, true);
    setLoadingMore(false);
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <Spinner />
      </div>
    );
  }

  const servedTotal = summary ? summary.groq + summary.gemini + summary.none : 0;

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
                <Cpu size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AI Provider Health</h1>
            </div>
            <p className="text-sm text-gray-500 ml-11">
              Every provider attempt is logged — Groq (primary) first, Gemini (fallback) when Groq fails.
              {total > 0 && <span className="text-gray-400"> {total} attempts logged.</span>}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner />
            </div>
          ) : !summary || summary.total === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Cpu size={20} className="text-gray-400" />
              </div>                    <p className="text-sm text-gray-500">No AI requests recorded yet.</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Every AI attempt (Groq first, Gemini fallback) is logged here automatically.
                    </p>
            </div>
          ) : (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard
                  icon={<Activity size={20} className="text-blue-600" />}
                  label="Total Attempts"
                  value={summary.total.toLocaleString()}
                  sub="incl. fallback retries"
                  color="bg-blue-50"
                />
                <StatCard
                  icon={<CheckCircle2 size={20} className="text-emerald-600" />}
                  label="Success Rate"
                  value={`${summary.successRate}%`}
                  sub={`${summary.success.toLocaleString()} ok`}
                  color="bg-emerald-50"
                />
                <StatCard
                  icon={<Zap size={20} className="text-amber-600" />}
                  label="Avg Latency"
                  value={`${summary.avgLatencyMs}ms`}
                  sub="successful calls"
                  color="bg-amber-50"
                />
                <StatCard
                  icon={<XCircle size={20} className="text-red-600" />}
                  label="Failed"
                  value={summary.failed.toLocaleString()}
                  color="bg-red-50"
                />
              </div>

              {/* Provider Split */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <Cpu size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Provider Split</h3>
                      <p className="text-xs text-gray-400">Attempts per provider — a rescued fallback counts both</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {(
                    [
                      { key: "groq", label: "Groq", count: summary.groq, bar: "from-emerald-400 to-emerald-600", text: "text-emerald-700" },
                      { key: "gemini", label: "Gemini", count: summary.gemini, bar: "from-indigo-400 to-indigo-600", text: "text-indigo-700" },
                      { key: "none", label: "No provider (config error)", count: summary.none, bar: "from-gray-300 to-gray-400", text: "text-gray-500" },
                    ] as const
                  ).map((p) => {
                    const pct = servedTotal > 0 ? Math.round((p.count / servedTotal) * 100) : 0;
                    return (
                      <div key={p.key} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-700">{p.label}</span>
                          <span className={cn("text-xs font-semibold tabular-nums", p.text)}>
                            {p.count.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-700 ease-out", p.bar)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Requests */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                      <Activity size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Recent Attempts</h3>
                      <p className="text-xs text-gray-400">Newest first — one row per provider attempt</p>
                    </div>
                  </div>
                </div>

                {rows.length === 0 ? (
                  <p className="px-6 py-10 text-sm text-gray-400 text-center">No requests in this range.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {rows.map((r) => {
                      const style = providerStyle(r.provider);
                      return (
                        <div key={r.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/70 transition-colors">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                              r.success ? "bg-emerald-50" : "bg-red-50"
                            )}
                          >
                            {r.success ? (
                              <CheckCircle2 size={15} className="text-emerald-600" />
                            ) : (
                              <XCircle size={15} className="text-red-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border", style.badge)}>
                                {style.label}
                              </span>
                              {r.model && (
                                <span className="text-[11px] font-medium text-gray-400 font-mono">{r.model}</span>
                              )}
                              <span className="text-xs font-semibold text-gray-700 capitalize">
                                {r.action.replace(/-/g, " ")}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1.5">
                              {r.latency_ms}ms · {new Date(r.created_at).toLocaleString()}
                            </p>
                            {!r.success && r.error && (
                              <p className="mt-1.5 text-[11px] text-red-500 truncate" title={r.error}>
                                {r.error}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {rows.length < total && (
                  <div className="p-5 text-center border-t border-gray-100">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:border-accent-300 hover:text-accent-700 hover:shadow-md transition-all disabled:opacity-60"
                    >
                      {loadingMore ? <Spinner /> : <ChevronRight size={16} className="rotate-90" />}
                      Load more ({rows.length} / {total})
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
