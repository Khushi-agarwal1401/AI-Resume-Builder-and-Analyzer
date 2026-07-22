"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "◻" },
  { href: "/admin/users", label: "Users", icon: "◇" },
  { href: "/admin/templates", label: "Templates", icon: "◇" },
  { href: "/admin/prompts", label: "AI Prompts", icon: "◇" },
];

const defaultTemplates = [
  { id: "modern", name: "Modern", description: "Clean two-column layout with accent sidebar", previewOnly: false },
  { id: "ats-professional", name: "ATS Professional", description: "Single-column, ATS-optimized with clear section headers", previewOnly: false },
  { id: "student", name: "Student", description: "Education-first layout highlighting academics and projects", previewOnly: false },
  { id: "minimal", name: "Minimal", description: "Typography-focused design with ample whitespace", previewOnly: false },
];

export default function AdminTemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const [templates] = useState(defaultTemplates);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
  if (user?.email !== "admin@resumeai.com") {
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
          <h1 className="text-h1 text-black mb-6">Templates</h1>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {templates.map((t) => (
              <div
                key={t.id}
                className={`bg-white border rounded-sm p-5 cursor-pointer transition-all ${
                  selected === t.id ? "border-accent-500 ring-1 ring-accent-500" : "border-gray-300 hover:border-gray-500"
                }`}
                onClick={() => setSelected(t.id)}
              >
                <h3 className="text-h3 text-black mb-1">{t.name}</h3>
                <p className="text-small text-gray-500">{t.description}</p>
              </div>
            ))}
          </div>

          {selected && (
            <div className="bg-white border border-gray-300 rounded-sm p-6">
              <h3 className="text-h3 text-black mb-4">Edit Template: {templates.find((t) => t.id === selected)?.name}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-small font-medium text-black block mb-2">Template ID</label>
                  <input className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body bg-gray-50 text-gray-500 cursor-not-allowed" value={selected} disabled />
                </div>
                <div>
                  <label className="text-small font-medium text-black block mb-2">Name</label>
                  <input className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15" defaultValue={templates.find((t) => t.id === selected)?.name} />
                </div>
                <div>
                  <label className="text-small font-medium text-black block mb-2">Description</label>
                  <textarea className="w-full h-24 rounded-sm border border-gray-300 px-4 py-2 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y" defaultValue={templates.find((t) => t.id === selected)?.description} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="previewOnly" className="w-4 h-4 accent-accent-500" />
                  <label htmlFor="previewOnly" className="text-small text-gray-700">Preview only (users can view but not use)</label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="primary">Save Changes</Button>
                <Button variant="secondary" onClick={() => { setSelected(null); setMessage(""); }}>Cancel</Button>
              </div>
              {message && <p className="text-small text-success mt-3">{message}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
