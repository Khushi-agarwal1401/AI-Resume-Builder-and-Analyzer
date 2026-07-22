"use client";

import { useState, useEffect } from "react";
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

const categories = [
  { value: "ats-professional", label: "ATS Professional" },
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
  { value: "executive", label: "Executive" },
  { value: "student", label: "Student" },
  { value: "creative", label: "Creative" },
];

interface TemplateRow {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail_url: string;
  component_key: string;
  is_active: boolean;
  sort_order: number;
}

export default function AdminTemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminVerified, setAdminVerified] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", description: "", component_key: "", is_active: true });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", category: "modern", description: "", component_key: "", is_active: true });

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    // Verify admin status via server-side API check
    async function verifyAndFetch() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (json.success) {
          setAdminVerified(true);
          // Fetch templates from the catalog (via admin/templates API or seed data)
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { data } = await supabase.from("templates").select("*").order("sort_order");
          if (data) setTemplates(data as unknown as TemplateRow[]);
          else setTemplates(categories.map((c) => ({
            id: c.value,
            name: c.label,
            category: c.value,
            description: "",
            thumbnail_url: "",
            component_key: c.label.replace(/\s+/g, ""),
            is_active: true,
            sort_order: categories.indexOf(c) + 1,
          })));
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    verifyAndFetch();
  }, [user, authLoading]);

  function handleSelect(template: TemplateRow) {
    setSelected(template.id);
    setEditForm({
      name: template.name,
      category: template.category,
      description: template.description,
      component_key: template.component_key,
      is_active: template.is_active,
    });
    setMessage("");
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Save to the templates table via the API
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const selectedTemplate = templates.find((t) => t.id === selected);
      if (selectedTemplate) {
        await supabase.from("templates").upsert({
          id: selectedTemplate.id,
          name: editForm.name,
          category: editForm.category,
          description: editForm.description,
          component_key: editForm.component_key,
          is_active: editForm.is_active,
          sort_order: selectedTemplate.sort_order,
        }, { onConflict: "id" });
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === selected ? { ...t, ...editForm } : t
          )
        );
        setMessage("Template updated successfully.");
      }
    } catch {
      setMessage("Failed to save. Supabase might need RLS or service role.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd() {
    const newTemplate: TemplateRow = {
      id: `new-${Date.now()}`,
      ...addForm,
      thumbnail_url: "",
      sort_order: templates.length + 1,
    };
    setTemplates((prev) => [...prev, newTemplate]);
    setShowAdd(false);
    setAddForm({ name: "", category: "modern", description: "", component_key: "", is_active: true });
    setMessage("Template added. Select it to edit details and save.");
  }

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;

  if (!adminVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-h1 text-black mb-2">Access Denied</h1>
          <p className="text-body text-gray-500">You do not have admin access.</p>
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
              <Link key={item.href} href={item.href} className="flex items-center gap-3 h-11 px-3 rounded-sm text-body text-gray-500 hover:text-black hover:bg-gray-100 transition-all">
                <span className="text-lg w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-h1 text-black">Template Management</h1>
            <Button variant="primary" onClick={() => setShowAdd(true)}>+ Add Template</Button>
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {(templates.length > 0 ? templates : categories.map((c) => ({
              id: c.value,
              name: c.label,
              category: c.value,
              description: "",
              thumbnail_url: "",
              component_key: c.label.replace(/\s+/g, ""),
              is_active: true,
              sort_order: categories.indexOf(c) + 1,
            }))).map((t) => {
              const isSelected = selected === t.id;
              return (
                <div
                  key={t.id}
                  className={`bg-white border rounded-sm p-5 cursor-pointer transition-all ${
                    isSelected ? "border-accent-500 ring-1 ring-accent-500" : "border-gray-300 hover:border-gray-500"
                  }`}
                  onClick={() => handleSelect(t)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-h3 text-black">{t.name}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      t.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-small text-gray-500 mb-2">{t.description || "No description"}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-micro text-gray-400">{t.category}</span>
                    <span className="text-micro text-gray-300">|</span>
                    <span className="text-micro text-accent-500">{t.component_key}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edit panel */}
          {selected && (() => {
            const t = templates.find((t) => t.id === selected);
            if (!t) return null;
            return (
              <div className="bg-white border border-gray-300 rounded-sm p-6">
                <h3 className="text-h3 text-black mb-4">Edit: {t.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-small font-medium text-black block mb-2">Name</label>
                    <input
                      className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-small font-medium text-black block mb-2">Category</label>
                    <select
                      className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500"
                      value={editForm.category}
                      onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                    >
                      {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-small font-medium text-black block mb-2">Description</label>
                    <textarea
                      className="w-full h-20 rounded-sm border border-gray-300 px-4 py-2 text-body outline-none focus:border-accent-500 resize-y"
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-small font-medium text-black block mb-2">Component Key</label>
                    <input
                      className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500"
                      value={editForm.component_key}
                      onChange={(e) => setEditForm((f) => ({ ...f, component_key: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="isActive" checked={editForm.is_active}
                      onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-accent-500" />
                    <label htmlFor="isActive" className="text-small text-gray-700">Active (visible to users)</label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? <Spinner /> : "Save Changes"}
                  </Button>
                  <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
                </div>
                {message && <p className="text-small mt-3" style={{color: message.includes("failed") ? "#dc2626" : "#16a34a"}}>{message}</p>}
              </div>
            );
          })()}

          {/* Add Modal */}
          {showAdd && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-full max-w-md mx-4">
                <h3 className="text-h3 text-black mb-4">Add Template</h3>
                <div className="space-y-4">
                  <div><label className="text-small font-medium text-black block mb-2">Name</label>
                    <input className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500"
                      value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} /></div>
                  <div><label className="text-small font-medium text-black block mb-2">Category</label>
                    <select className="h-10 w-full rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500"
                      value={addForm.category} onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}>
                      {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select></div>
                  <div><label className="text-small font-medium text-black block mb-2">Component Key</label>
                    <input className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500"
                      value={addForm.component_key} onChange={(e) => setAddForm((f) => ({ ...f, component_key: e.target.value }))} /></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="primary" onClick={handleAdd}>Add</Button>
                  <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
