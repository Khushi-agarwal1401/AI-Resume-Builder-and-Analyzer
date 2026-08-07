"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { Activity, ChevronRight, ScrollText } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  targetLabel: string;
  changes: Record<string, unknown> | null;
  adminEmail: string;
  created_at: string;
}

const ACTION_TONES: Record<string, string> = {
  "user.update": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "user.delete": "bg-red-50 text-red-700 border-red-200",
  "template.update": "bg-blue-50 text-blue-700 border-blue-200",
  "template.create": "bg-blue-50 text-blue-700 border-blue-200",
  "prompt.update": "bg-purple-50 text-purple-700 border-purple-200",
};

const ACTION_LABELS: Record<string, string> = {
  "user.update": "Updated user",
  "user.delete": "Deleted user",
  "template.update": "Updated template",
  "template.create": "Created template",
  "template.delete": "Deleted template",
  "prompt.update": "Updated prompt",
};

export default function AdminAuditPage() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchPage = useCallback(async (offset: number, append: boolean) => {
    try {
      const res = await fetch(`/api/admin/audit?limit=50&offset=${offset}`);
      const json = await res.json();
      if (json.success) {
        setEntries((prev) => (append ? [...prev, ...json.data] : json.data));
        setTotal(json.total);
        return json.data as AuditEntry[];
      }
      setError(json.error || "Failed to load audit log");
      return [];
    } catch {
      setError("Something went wrong loading the audit log.");
      return [];
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    setLoading(true);
    fetchPage(0, false).finally(() => setLoading(false));
  }, [user, authLoading, fetchPage]);

  async function handleLoadMore() {
    setLoadingMore(true);
    await fetchPage(entries.length, true);
    setLoadingMore(false);
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex pt-[72px]">
      <ErrorBoundary>
        <AdminSidebar />
      </ErrorBoundary>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-sm">
                <ScrollText size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Audit Log</h1>
            </div>
            <p className="text-sm text-gray-500 ml-11">
              Every action taken by admins across the platform, newest first.
              {total > 0 && <span className="text-gray-400"> {total} total.</span>}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24"><Spinner /></div>
          ) : entries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Activity size={20} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No admin actions recorded yet.</p>
              <p className="text-xs text-gray-400 mt-1">Actions like user role changes and template updates will appear here.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {entries.map((e) => {
                    const tone = ACTION_TONES[e.action] || "bg-gray-100 text-gray-700 border-gray-200";
                    const label = ACTION_LABELS[e.action] || e.action.replace(/\./g, " ");
                    return (
                      <div key={e.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/70 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Activity size={15} className="text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border", tone)}>
                              {label}
                            </span>
                            {e.target_type && (
                              <span className="text-[11px] font-medium text-gray-400 capitalize">
                                on {e.target_type}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1.5 truncate">
                            {e.targetLabel || e.target_id}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            by <span className="font-semibold text-gray-600">{e.adminEmail || "Admin"}</span> ·{" "}
                            {new Date(e.created_at).toLocaleString()}
                          </p>
                          {e.changes && Object.keys(e.changes).length > 0 && (
                            <pre className="mt-2 p-3 rounded-lg bg-gray-50 border border-gray-100 text-[10px] text-gray-500 overflow-x-auto max-h-32">
                              {JSON.stringify(e.changes, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {entries.length < total && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:border-accent-300 hover:text-accent-700 hover:shadow-md transition-all disabled:opacity-60"
                  >
                    {loadingMore ? <Spinner /> : <ChevronRight size={16} className="rotate-90" />}
                    Load more ({entries.length} / {total})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
