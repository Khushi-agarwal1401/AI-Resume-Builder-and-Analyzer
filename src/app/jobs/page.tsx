"use client";
import Preloader from "@/components/ui/Preloader";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";


type ApplicationStatus = "applied" | "interview" | "rejected" | "offer";

interface Application {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  date_applied: string;
  notes: string;
  resume_id: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  interview: "Interview",
  rejected: "Rejected",
  offer: "Offer",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: "border-blue-400 bg-blue-50",
  interview: "border-amber-400 bg-amber-50",
  rejected: "border-red-400 bg-red-50",
  offer: "border-green-400 bg-green-50",
};

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  applied: "bg-blue-100 text-blue-700",
  interview: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  offer: "bg-green-100 text-green-700",
};

const columns: ApplicationStatus[] = ["applied", "interview", "rejected", "offer"];

export default function JobsPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [form, setForm] = useState({ company: "", role: "", notes: "", status: "applied" as ApplicationStatus });

  // A-12: structured interview-outcome capture
  const [outcomeCapture, setOutcomeCapture] = useState<{ appId: string; status: ApplicationStatus } | null>(null);
  const [outcomeForm, setOutcomeForm] = useState({ type: "round_reached", notes: "", round: "" });

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/login");
      return;
    }
    if (authenticated) fetchApplications();
  }, [authenticated, authLoading, router]);

  async function fetchApplications() {
    try {
      const res = await fetch("/api/applications");
      const json = await res.json();
      if (json.success) {
        setApplications(json.data);
        setPage(json.page || 1);
        setHasMore(Boolean(json.hasMore));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // A-16: paginated fetch — appends the next page to the board
  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await fetch(`/api/applications?page=${next}`);
      const json = await res.json();
      if (json.success) {
        setApplications((prev) => {
          const seen = new Set(prev.map((a) => a.id));
          return [...prev, ...(json.data || []).filter((a: Application) => !seen.has(a.id))];
        });
        setPage(next);
        setHasMore(Boolean(json.hasMore));
      }
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore]);

  const handleCreate = useCallback(async () => {
    if (!form.company || !form.role) return;
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.success) {
      setApplications((prev) => [json.data, ...prev]);
      setShowModal(false);
      setForm({ company: "", role: "", notes: "", status: "applied" });
    }
  }, [form]);

  const handleStatusChange = useCallback(async (id: string, newStatus: ApplicationStatus) => {
    // Optimistic update
    const prevApp = applications.find((a) => a.id === id);
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );

    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    if (!json.success) {
      // Revert on failure
      if (prevApp) setApplications((prev) => prev.map((a) => (a.id === prevApp.id ? prevApp : a)));
      return;
    }

    // A-12: structured outcome capture when moving to interview or offer
    if (newStatus === "interview" || newStatus === "offer") {
      setOutcomeCapture({ appId: id, status: newStatus });
    }
  }, [applications]);

  const saveOutcome = useCallback(async () => {
    if (!outcomeCapture) return;
    const res = await fetch(`/api/applications/${outcomeCapture.appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outcome_type: outcomeForm.type,
        outcome_notes: outcomeForm.notes,
        interview_round: outcomeForm.round || null,
      }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("Outcome saved to Analytics");
    } else {
      toast.error("Failed to save outcome. Please try again.");
    }
    setOutcomeCapture(null);
  }, [outcomeCapture, outcomeForm]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error("Failed to delete application. Please try again.");
        return;
      }
      setApplications((prev) => prev.filter((a) => a.id !== id));
      toast.success("Application deleted");
    } catch {
      toast.error("Failed to delete application. Please try again.");
    }
  }, []);

  const getColumnApps = (status: ApplicationStatus) =>
    applications.filter((a) => a.status === status);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <Preloader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-h1 text-black">Job Tracker</h1>
            <p className="text-body text-gray-500 mt-1">Track your applications end-to-end</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/analytics")}
              className="h-10 px-4 text-small font-medium text-gray-600 hover:text-black border border-gray-300 rounded-sm hover:bg-gray-50 transition-all"
            >
              📊 Analytics
            </button>
            <Button onClick={() => setShowModal(true)}>+ Add Application</Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 grid grid-cols-4 gap-4 min-h-0 overflow-hidden">
          {columns.map((col) => (
            <div
              key={col}
              className={cn(
                "flex flex-col rounded-lg border-2 overflow-hidden",
                STATUS_COLORS[col]
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedId) {
                  handleStatusChange(draggedId, col);
                  setDraggedId(null);
                }
              }}
            >
              {/* Column header */}
              <div className="px-3 py-2 bg-white/80 border-b flex items-center justify-between shrink-0">
                <span className="text-small font-bold">{STATUS_LABELS[col]}</span>
                <span className="text-micro text-gray-500 font-medium">
                  {getColumnApps(col).length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {getColumnApps(col).length === 0 && (
                  <div className="flex items-center justify-center h-24 text-micro text-gray-400">
                    Drop applications here
                  </div>
                )}
                {getColumnApps(col).map((app) => (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={() => setDraggedId(app.id)}
                    onDragEnd={() => setDraggedId(null)}
                    className="bg-white rounded-md border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-small font-bold text-black truncate">{app.role}</h3>
                      <button
                        onClick={() => setDeleteTarget(app)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-micro text-gray-500 mb-1">{app.company}</p>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", STATUS_BADGE[app.status])}>
                        {STATUS_LABELS[app.status]}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(app.date_applied).toLocaleDateString()}
                      </span>
                    </div>
                    {app.notes && (
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{app.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* A-16: Load more pagination */}
        {hasMore && (
          <div className="flex justify-center pt-4 pb-1">
            <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Load more applications"}
            </Button>
          </div>
        )}

        {/* Delete confirmation dialog */}
        <ConfirmDialog
          open={deleteTarget !== null}
          title="Delete this application?"
          message={`"${deleteTarget?.role || "This application"}" at ${deleteTarget?.company || "this company"} will be removed from your tracker.`}
          confirmLabel="Delete Application"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) handleDelete(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />

        {/* A-12: Outcome Capture Modal */}
        {outcomeCapture && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-full max-w-md mx-4">
              <h3 className="text-h3 text-black mb-1">
                {outcomeCapture.status === "offer" ? "Log the offer" : "Log this interview"}
              </h3>
              <p className="text-body text-gray-600 mb-4">
                Self-reported outcomes feed your Analytics — interview rate and offer rate stay accurate.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-small font-medium text-gray-700 mb-1">Outcome type</label>
                  <select
                    className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    value={outcomeForm.type}
                    onChange={(e) => setOutcomeForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    <option value="round_reached">Reached a round / in progress</option>
                    <option value="offer">Received offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-small font-medium text-gray-700 mb-1">Interview round</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    value={outcomeForm.round}
                    onChange={(e) => setOutcomeForm((f) => ({ ...f, round: e.target.value }))}
                    placeholder="e.g. 2 (screening = 1)"
                  />
                </div>

                <div>
                  <label className="block text-small font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    className="w-full rounded-sm border border-gray-300 px-3 py-2 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
                    rows={3}
                    value={outcomeForm.notes}
                    onChange={(e) => setOutcomeForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="What went well? What to improve?"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="primary" className="flex-1" onClick={saveOutcome}>
                  Save Outcome
                </Button>
                <Button variant="secondary" onClick={() => setOutcomeCapture(null)}>
                  Skip
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Application Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-full max-w-md mx-4">
              <h2 className="text-h3 text-black mb-4">Add Application</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-small font-medium text-gray-700 mb-1">Company *</label>
                  <input
                    className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="e.g. Google"
                  />
                </div>
                <div>
                  <label className="block text-small font-medium text-gray-700 mb-1">Role *</label>
                  <input
                    className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    placeholder="e.g. Frontend Developer"
                  />
                </div>
                <div>
                  <label className="block text-small font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ApplicationStatus }))}
                  >
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="rejected">Rejected</option>
                    <option value="offer">Offer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-small font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    className="w-full rounded-sm border border-gray-300 px-3 py-2 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Any notes about this application..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="primary" className="flex-1" onClick={handleCreate} disabled={!form.company || !form.role}>
                  Add Application
                </Button>
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
