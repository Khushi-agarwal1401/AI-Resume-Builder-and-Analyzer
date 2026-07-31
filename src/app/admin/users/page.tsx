"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Search,
  Users,
  ChevronRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Trash2,
  Ban,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  user_type: string | null;
  role: string | null;
  is_active: boolean | null;
  plan_id: string;
  resume_count: number;
  created_at: string;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionMsgType, setActionMsgType] = useState<"success" | "error">("success");
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (json.success) setUsers(json.data);
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [user, authLoading]);

  async function handleUpdate(id: string, body: Record<string, unknown>) {
    setActionMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, ...body } : u))
        );
        setActionMsgType("success");
        setActionMsg("User updated.");
      } else {
        setActionMsgType("error");
        setActionMsg(json.error || "Update failed");
      }
    } catch {
      setActionMsgType("error");
      setActionMsg("Update failed");
    }
  }

  async function handleDelete(id: string) {
    setActionMsg("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setConfirmingDelete(null);
        setActionMsgType("success");
        setActionMsg("User deleted.");
      } else {
        setActionMsgType("error");
        setActionMsg(json.error || "Delete failed");
      }
    } catch {
      setActionMsgType("error");
      setActionMsg("Delete failed");
    }
  }

  const filteredUsers = searchQuery
    ? users.filter((u) =>
        (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

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

  if (!loading && users.length === 0 && searchQuery === "") {
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
    <div className="min-h-screen bg-gray-50/50 flex">
      <ErrorBoundary>
        <AdminSidebar />
      </ErrorBoundary>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-sm">
                <Users size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            </div>
            <p className="text-sm text-gray-500 ml-11">
              View and manage platform users.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
            />
          </div>

          {/* Action message */}
          {actionMsg && (
            <div className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl text-sm border mb-6",
              actionMsgType === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            )}>
              {actionMsgType === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {actionMsg}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* User count */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{filteredUsers.length}</span> user{filteredUsers.length !== 1 ? "s" : ""}
                  {searchQuery && filteredUsers.length !== users.length && ` (filtered from ${users.length})`}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Resumes</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center text-xs font-bold text-accent-700 shrink-0">
                              {(u.full_name || "U")[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{u.full_name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.email || "—"}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500 capitalize">{u.user_type || "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold",
                            u.role === "admin"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-gray-50 text-gray-500 border border-gray-200"
                          )}>
                            {u.role || "user"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold",
                            u.is_active === false
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          )}>
                            {u.is_active === false ? <Ban size={10} /> : <CheckCircle2 size={10} />}
                            {u.is_active === false ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold",
                            u.plan_id === "pro"
                              ? "bg-accent-50 text-accent-700 border border-accent-200"
                              : "bg-gray-50 text-gray-500 border border-gray-200"
                          )}>
                            {u.plan_id === "pro" && <Sparkles size={10} className="text-accent-600" />}
                            {u.plan_id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm tabular-nums text-gray-500">{u.resume_count}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400 tabular-nums">
                          {new Date(u.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdate(u.id, { role: u.role === "admin" ? "user" : "admin" })}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                              title={u.role === "admin" ? "Demote to user" : "Promote to admin"}
                            >
                              <ShieldCheck size={12} />
                              {u.role === "admin" ? "Demote" : "Promote"}
                            </button>
                            <button
                              onClick={() => handleUpdate(u.id, { is_active: u.is_active === false ? true : false })}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors",
                                u.is_active === false
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                              )}
                              title={u.is_active === false ? "Activate account" : "Deactivate account"}
                            >
                              {u.is_active === false ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                              {u.is_active === false ? "Activate" : "Deactivate"}
                            </button>
                            {confirmingDelete === u.id ? (
                              <span className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleDelete(u.id)}
                                  className="inline-flex items-center px-2 py-1.5 rounded-lg text-[11px] font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmingDelete(null)}
                                  className="inline-flex items-center px-2 py-1.5 rounded-lg text-[11px] font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setConfirmingDelete(u.id)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                                title="Delete account (permanent)"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Users size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {searchQuery ? "No users match your search." : "No users found."}
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
