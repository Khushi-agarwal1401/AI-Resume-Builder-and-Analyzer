"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  user_type: string | null;
  role: string | null;
  plan_id: string;
  resume_count: number;
  created_at: string;
}

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "◻" },
  { href: "/admin/users", label: "Users", icon: "◇" },
  { href: "/admin/templates", label: "Templates", icon: "◇" },
  { href: "/admin/prompts", label: "AI Prompts", icon: "◇" },
];

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminVerified, setAdminVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    async function verifyAndFetch() {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (json.success) {
          setAdminVerified(true);
          setUsers(json.data);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    verifyAndFetch();
  }, [user, authLoading]);

  const filteredUsers = searchQuery
    ? users.filter((u) =>
        (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;

  if (!adminVerified && !loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-body text-gray-500">Access Denied. <Link href="/dashboard" className="text-accent-500">Go back</Link></p></div>;
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
              <Link key={item.href} href={item.href} className="flex items-center gap-3 h-11 px-3 rounded-sm text-body text-gray-500 hover:text-black hover:bg-gray-100 transition-all">
                <span className="text-lg w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1 p-8">
          <h1 className="text-h1 text-black mb-6">User Management</h1>

          {/* Search */}
          <div className="mb-6">
            <input
              className="h-10 w-full max-w-md rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500 focus:ring-[3px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Spinner /></div>
          ) : (
            <div className="bg-white border border-gray-300 rounded-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="px-4 py-3 text-micro text-gray-500 uppercase tracking-widest">Name</th>
                    <th className="px-4 py-3 text-micro text-gray-500 uppercase tracking-widest">Email</th>
                    <th className="px-4 py-3 text-micro text-gray-500 uppercase tracking-widest">Type</th>
                    <th className="px-4 py-3 text-micro text-gray-500 uppercase tracking-widest">Role</th>
                    <th className="px-4 py-3 text-micro text-gray-500 uppercase tracking-widest">Plan</th>
                    <th className="px-4 py-3 text-micro text-gray-500 uppercase tracking-widest">Resumes</th>
                    <th className="px-4 py-3 text-micro text-gray-500 uppercase tracking-widest">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-300 last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-body text-black">{u.full_name || "—"}</td>
                      <td className="px-4 py-3 text-body text-gray-500">{u.email || "—"}</td>
                      <td className="px-4 py-3 text-body text-gray-500">{u.user_type || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-micro rounded-sm font-medium ${
                          u.role === "admin" ? "bg-purple-100 text-purple-700 border border-purple-200" : "text-gray-500"
                        }`}>{u.role || "user"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-micro rounded-sm font-medium ${
                          u.plan_id === "pro" ? "bg-indigo-50 text-accent-600 border border-indigo-200" : "bg-gray-100 text-gray-500 border border-gray-300"
                        }`}>{u.plan_id}</span>
                      </td>
                      <td className="px-4 py-3 text-body text-gray-500">{u.resume_count}</td>
                      <td className="px-4 py-3 text-small text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <p className="px-4 py-8 text-center text-body text-gray-500">
                  {searchQuery ? "No users match your search." : "No users found."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
