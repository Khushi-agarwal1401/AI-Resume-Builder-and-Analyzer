"use client";
import Preloader from "@/components/ui/Preloader";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Users, Plus, Trash2, Edit, Copy, Check, ExternalLink, Mail, Phone } from "lucide-react";


interface Reference {
  id?: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  relationship: string;
  notes: string;
  saved?: boolean;
}

export default function ReferenceManagerPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [references, setReferences] = useState<Reference[]>([{ name: "", title: "", company: "", email: "", phone: "", relationship: "", notes: "", saved: false }]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !authenticated) router.push("/login");
  }, [authLoading, authenticated, router]);

  useEffect(() => {
    fetch("/api/references")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          setReferences(json.data.map((r: Reference) => ({ ...r, saved: true })));
        }
      })
      .catch(() => {});
  }, []);

  function addReference() {
    setReferences((prev) => [...prev, { name: "", title: "", company: "", email: "", phone: "", relationship: "", notes: "", saved: false }]);
  }

  function removeReference(idx: number) {
    const ref = references[idx];
    if (ref.id) {
      fetch(`/api/references/${ref.id}`, { method: "DELETE" }).catch(() => {});
    }
    setReferences((prev) => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
  }

  function cancelEdit(idx: number) {
    setEditingIdx(null);
    if (!references[idx].saved) {
      setReferences((prev) => prev.filter((_, i) => i !== idx));
    }
  }

  function updateField(idx: number, field: keyof Reference, value: string) {
    setReferences((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  async function saveReference(idx: number) {
    const ref = references[idx];
    setSavingIdx(idx);
    try {
      if (ref.id) {
        const res = await fetch(`/api/references/${ref.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ref),
        });
        if (!res.ok) throw new Error("Failed to update");
      } else {
        const res = await fetch("/api/references", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ref),
        });
        const json = await res.json();
        if (json.success && json.data?.id) {
          setReferences((prev) => prev.map((r, i) => (i === idx ? { ...r, id: json.data.id, saved: true } : r)));
        } else {
          throw new Error("Failed to create");
        }
      }
    } catch {
      alert("Failed to save reference. Please try again.");
    } finally {
      setSavingIdx(null);
      setEditingIdx(null);
    }
  }

  function copyReference(ref: Reference) {
    const text = `${ref.name}\n${ref.title} at ${ref.company}\nEmail: ${ref.email}\nPhone: ${ref.phone}\nRelationship: ${ref.relationship}\n${ref.notes ? `Notes: ${ref.notes}` : ""}`;
    navigator.clipboard.writeText(text);
    setCopiedIdx(references.indexOf(ref));
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  function exportAll() {
    const text = references
      .filter((r) => r.name || r.email)
      .map((r, i) => `${i + 1}. ${r.name}\n   ${r.title} at ${r.company}\n   Email: ${r.email}\n   Phone: ${r.phone}\n   Relationship: ${r.relationship}\n   ${r.notes ? `Notes: ${r.notes}` : ""}`)
      .join("\n\n");
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "references.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (authLoading) return <Preloader />;

  return (
    <div className="max-w-[800px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-600" />
            Reference Manager
          </h1>
          <p className="text-body text-gray-500 mt-1">
            Store and manage professional references for job applications.
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>Back</Button>
      </div>

      <div className="space-y-3 mb-6">
        {references.map((ref, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-sm overflow-hidden">
            {editingIdx === i ? (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1 block">Name *</label>
                    <input className="w-full h-10 rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500" value={ref.name} onChange={(e) => updateField(i, "name", e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1 block">Title *</label>
                    <input className="w-full h-10 rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500" value={ref.title} onChange={(e) => updateField(i, "title", e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1 block">Company *</label>
                    <input className="w-full h-10 rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500" value={ref.company} onChange={(e) => updateField(i, "company", e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1 block">Relationship</label>
                    <input className="w-full h-10 rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500" value={ref.relationship} onChange={(e) => updateField(i, "relationship", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1 block">Email *</label>
                    <input type="email" className="w-full h-10 rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500" value={ref.email} onChange={(e) => updateField(i, "email", e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1 block">Phone</label>
                    <input type="tel" className="w-full h-10 rounded-sm border border-gray-300 px-3 text-body outline-none focus:border-accent-500" value={ref.phone} onChange={(e) => updateField(i, "phone", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
                  <textarea className="w-full h-20 rounded-sm border border-gray-300 px-3 py-2 text-body outline-none focus:border-accent-500 resize-none" value={ref.notes} onChange={(e) => updateField(i, "notes", e.target.value)} placeholder="How you know them, preferred contact time, etc." />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button variant="ghost" onClick={() => cancelEdit(i)} disabled={savingIdx === i}>Cancel</Button>
                  <Button onClick={() => saveReference(i)} disabled={savingIdx === i || !ref.name || !ref.title || !ref.company || !ref.email}>
                    {savingIdx === i ? <Spinner /> : ref.saved ? "Update" : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-body font-medium text-black">{ref.name || "Unnamed reference"}</span>
                      {ref.saved && <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Saved</span>}
                    </div>
                    {ref.title && <p className="text-small text-gray-600">{ref.title} at {ref.company}</p>}
                    <div className="flex items-center gap-4 mt-2 text-small text-gray-500">
                      {ref.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {ref.email}</span>}
                      {ref.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {ref.phone}</span>}
                    </div>
                    {ref.relationship && <p className="text-[11px] text-gray-400 mt-1">Relationship: {ref.relationship}</p>}
                    {ref.notes && <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{ref.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => copyReference(ref)} className="text-[11px]">
                      {copiedIdx === i ? <Check className="w-3 h-3 mr-0.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-0.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(i)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeReference(i)} className="text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={addReference}>
          <Plus className="w-4 h-4 mr-1" /> Add Reference
        </Button>
        <Button variant="ghost" onClick={exportAll}>
          <ExternalLink className="w-4 h-4 mr-1" /> Export All
        </Button>
      </div>
    </div>
  );
}