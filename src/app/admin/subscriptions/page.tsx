"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  ChevronRight,
  Sparkles,
  Zap,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface Subscription {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  plan: "free" | "pro";
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
}

export default function AdminSubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "canceled" | "past_due" | "trialing">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "pro">("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    async function fetchSubscriptions() {
      try {
        const res = await fetch("/api/admin/subscriptions");
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (json.success) setSubscriptions(json.data);
      } catch { } finally {
        setLoading(false);
      }
    }
    fetchSubscriptions();
  }, [user, authLoading]);

  const filteredSubscriptions = subscriptions
    .filter((s) => {
      const matchesSearch =
        (s.userEmail || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.userName || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || s.status === statusFilter;

      const matchesPlan =
        planFilter === "all" || s.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    })
    .sort((a, b) => new Date(b.currentPeriodStart).getTime() - new Date(a.currentPeriodStart).getTime());

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active" && s.plan === "pro");
  const monthlyRevenue = activeSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);
  const proUsers = subscriptions.filter((s) => s.plan === "pro").length;
  const churnRate = subscriptions.length > 0
    ? Math.round((subscriptions.filter((s) => s.status === "canceled").length / subscriptions.length) * 100)
    : 0;

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

  if (!loading && subscriptions.length === 0) {
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
                <CreditCard size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            </div>
            <p className="text-sm text-gray-500 ml-11">
              Overview of all subscriptions, revenue, and user plans.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <DollarSign size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Monthly Revenue</p>
                  <p className="text-[11px] text-gray-400">Active Pro plans</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                ${monthlyRevenue.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center">
                  <Sparkles size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Pro Users</p>
                  <p className="text-[11px] text-gray-400">Total subscriptions</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{proUsers}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <Users size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Total Users</p>
                  <p className="text-[11px] text-gray-400">All plans</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{subscriptions.length}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <TrendingUp size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Churn Rate</p>
                  <p className="text-[11px] text-gray-400">Canceled / Total</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{churnRate}%</p>
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
                  placeholder="Search by user or email..."
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "canceled" | "past_due" | "trialing")}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="canceled">Canceled</option>
                  <option value="past_due">Past Due</option>
                  <option value="trialing">Trial</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all"
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as "all" | "free" | "pro")}
                >
                  <option value="all">All Plans</option>
                  <option value="pro">Pro</option>
                  <option value="free">Free</option>
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
              {/* Subscription count */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{filteredSubscriptions.length}</span> subscription{filteredSubscriptions.length !== 1 ? "s" : ""}
                  {filteredSubscriptions.length !== subscriptions.length && ` (filtered from ${subscriptions.length})`}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Renewal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center text-xs font-bold text-accent-700 shrink-0">
                              {(s.userName || "U")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{s.userName || "—"}</p>
                              <p className="text-xs text-gray-400 truncate">{s.userEmail || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold",
                            s.plan === "pro"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-gray-50 text-gray-500 border border-gray-200"
                          )}>
                            {s.plan === "pro" && <Sparkles size={10} className="text-purple-600" />}
                            {s.plan === "pro" ? "Pro" : "Free"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold",
                            s.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : s.status === "canceled"
                                ? "bg-gray-100 text-gray-500 border border-gray-200"
                                : s.status === "past_due"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                          )}>
                            {s.status === "active" && <CheckCircle2 size={10} />}
                            {s.status === "past_due" && <AlertCircle size={10} />}
                            {s.status.charAt(0).toUpperCase() + s.status.slice(1).replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900 tabular-nums">
                            ${s.amount || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className="text-gray-400" />
                            {new Date(s.currentPeriodEnd).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {s.cancelAtPeriodEnd ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <ArrowDownRight size={12} />
                              Canceling
                            </span>
                          ) : s.status === "active" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <ArrowUpRight size={12} />
                              Auto-renew
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredSubscriptions.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <CreditCard size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {searchQuery || statusFilter !== "all" || planFilter !== "all"
                      ? "No subscriptions match your filters."
                      : "No subscriptions found."}
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
