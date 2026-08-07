"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  LayoutTemplate,
  ChevronRight,
  Sparkles,
  Zap,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  IMPORTED_TEMPLATES,
  BUILTIN_TEMPLATE_IDS,
  templateDisplayName,
} from "@/features/resume-builder/templates/imported/catalog";

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

/**
 * Full 83-template catalog (8 built-in + 75 curated imported) as admin rows. The DB
 * only carries visibility/metadata overrides — the catalog is the source of
 * truth for the template set, so the admin panel always shows every template
 * even if the seeded DB rows are missing or the API is temporarily down.
 */
const CATALOG_ROWS: TemplateRow[] = [
  ...BUILTIN_TEMPLATE_IDS.map((id, i) => ({
    id,
    name: templateDisplayName(id),
    category: id,
    description: "",
    thumbnail_url: "",
    component_key: id,
    is_active: true,
    sort_order: i + 1,
  })),
  ...IMPORTED_TEMPLATES.map((t, i) => ({
    id: t.id,
    name: t.name,
    category: "imported",
    description: t.description,
    thumbnail_url: "",
    component_key: t.id,
    is_active: true,
    sort_order: 50 + i,
  })),
];

export default function AdminTemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminVerified, setAdminVerified] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", description: "", component_key: "", is_active: true });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", category: "modern", description: "", component_key: "", is_active: true });

  const categories = [
    { value: "ats-professional", label: "ATS Professional" },
    { value: "modern", label: "Modern" },
    { value: "minimal", label: "Minimal" },
    { value: "executive", label: "Executive" },
    { value: "executive-sidebar", label: "Exec Sidebar" },
    { value: "modern-card", label: "Card Modern" },
    { value: "student", label: "Student" },
    { value: "creative", label: "Creative" },
    { value: "imported", label: "Imported" },
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    async function verifyAndFetch() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (json.success) {
          setAdminVerified(true);
          // Start from the full 83-template catalog, then overlay the DB rows
          // (visibility, sort order, edited metadata). DB keys are matched in
          // kebab-case ("Modern" → "modern") so built-in rows line up with the
          // catalog; stale rows from earlier import iterations (old key scheme)
          // are ignored rather than shown as duplicates.
          let merged: TemplateRow[] = [...CATALOG_ROWS];
          try {
            const tRes = await fetch("/api/admin/templates");
            const tJson = await tRes.json();
            if (tJson.success && Array.isArray(tJson.data) && tJson.data.length > 0) {
              const byKey = new Map<string, TemplateRow>(
                merged.map((t) => [t.component_key, t])
              );
              for (const row of tJson.data as TemplateRow[]) {
                if (!row?.component_key) continue;
                const kebab = row.component_key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
                const existing = byKey.get(kebab);
                if (!existing) continue; // stale key not in the catalog
                byKey.set(kebab, { ...existing, ...row, id: row.id });
              }
              merged = [...byKey.values()];
            }
          } catch {
            // API down — the catalog rows already cover all 83 templates.
          }
          setTemplates(merged);
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
    if (!selected) return;
    setSaving(true);

    try {
      // Catalog-only rows (no DB row yet, e.g. imported designs before the
      // seed migration ran) are created on save; DB-backed rows are updated.
      const isDbRow = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selected);
      const res = await fetch("/api/admin/templates", {
        method: isDbRow ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isDbRow ? { id: selected, ...editForm } : editForm),
      });
      const json = await res.json();
      if (json.success) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === selected
              ? isDbRow
                ? { ...t, ...editForm }
                : { ...t, ...editForm, id: json.data?.id ?? t.id }
              : t
          )
        );
        setMessage("Template saved successfully.");
        setMessageType("success");
      } else {
        setMessage(json.error || "Failed to save");
        setMessageType("error");
      }
    } catch {
      setMessage("Failed to save template.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (json.success) {
        setTemplates((prev) => [...prev, json.data]);
        setMessage("Template added successfully.");
        setMessageType("success");
        setShowAdd(false);
        setAddForm({ name: "", category: "modern", description: "", component_key: "", is_active: true });
      } else {
        setMessage(json.error || "Failed to add");
        setMessageType("error");
      }
    } catch {
      setMessage("Failed to add template.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
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

  if (!adminVerified) {
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
            <p className="text-sm text-gray-500 mb-6">You do not have admin access to manage templates.</p>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-sm">
                  <LayoutTemplate size={16} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
              </div>
              <p className="text-sm text-gray-500 ml-11">
                Manage resume templates, visibility, and metadata.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 shadow-lg shadow-accent-500/20"
            >
              <Plus size={15} />
              Add Template
            </Button>
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {templates.map((t) => {
              const isSelected = selected === t.id;
              return (
                <div
                  key={t.id}
                  className={cn(
                    "bg-white rounded-xl border p-5 cursor-pointer transition-all duration-200 hover:shadow-md group",
                    isSelected
                      ? "border-accent-400 ring-2 ring-accent-500/15 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handleSelect(t)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-accent-700 transition-colors">{t.name}</h3>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold",
                      t.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-100 text-gray-500 border border-gray-200"
                    )}>
                      {t.is_active ? <><Eye size={10} /> Active</> : <><EyeOff size={10} /> Inactive</>}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description || "No description"}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                      {t.category}
                    </span>
                    <span className="text-[10px] font-mono text-accent-600 bg-accent-50 px-2 py-0.5 rounded-md border border-accent-200">
                      {t.component_key}
                    </span>
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
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">Edit: {t.name}</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-2">Name</label>
                      <input
                        className="h-10 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all"
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-2">Category</label>
                      <select
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all"
                        value={editForm.category}
                        onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                      >
                        {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-700 block mb-2">Description</label>
                      <textarea
                        className="w-full h-20 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all resize-y"
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-2">Component Key</label>
                      <input
                        className="h-10 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all"
                        value={editForm.component_key}
                        onChange={(e) => setEditForm((f) => ({ ...f, component_key: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.is_active}
                          onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500" />
                      </label>
                      <span className="text-sm text-gray-700">Active (visible to users)</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <Button variant="primary" onClick={handleSave} disabled={saving} className="flex items-center gap-1.5">
                      {saving ? <Spinner /> : <><CheckCircle2 size={14} /> Save Changes</>}
                    </Button>
                    <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
                  </div>

                  {message && (
                    <div className={cn(
                      "flex items-center gap-2 mt-4 px-4 py-3 rounded-xl text-sm border",
                      messageType === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-red-50 border-red-200 text-red-700"
                    )}>
                      {messageType === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {message}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Add Modal */}
          {showAdd && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
              <div
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-full max-w-md mx-4 animate-in"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-5">Add Template</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">Name</label>
                    <input
                      className="h-10 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all"
                      value={addForm.name}
                      onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g., Modern Dark"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">Category</label>
                    <select
                      className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all"
                      value={addForm.category}
                      onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
                    >
                      {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">Component Key</label>
                    <input
                      className="h-10 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all"
                      value={addForm.component_key}
                      onChange={(e) => setAddForm((f) => ({ ...f, component_key: e.target.value }))}
                      placeholder="e.g., ModernDark"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="primary" onClick={handleAdd} disabled={saving || !addForm.name}>
                    {saving ? <Spinner /> : "Add"}
                  </Button>
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
