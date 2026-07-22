"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { MoreVertical, Copy, Download, Trash, Edit3, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumeListItem {
  id: string;
  title: string;
  template: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/login");
      return;
    }
    if (authenticated) fetchResumes();
  }, [authenticated, authLoading, router]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchResumes() {
    try {
      const res = await fetch("/api/resumes");
      const json = await res.json();
      if (json.success) setResumes(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Resume", template: "modern" }),
    });
    const json = await res.json();
    if (json.success) router.push(`/builder/${json.data.id}`);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this resume? This can't be undone.")) return;
    await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    fetchResumes();
  }

  async function handleDuplicate(id: string) {
    setMenuOpenId(null);
    setLoading(true);
    await fetch(`/api/resumes/${id}/duplicate`, { method: "POST" });
    await fetchResumes();
  }

  function handleDownload(id: string) {
    setMenuOpenId(null);
    window.open(`/api/export/${id}`, "_blank");
  }

  async function handleSaveTitle(id: string) {
    if (!editTitle.trim()) return setEditingId(null);
    setResumes(prev => prev.map(r => r.id === id ? { ...r, title: editTitle } : r));
    setEditingId(null);
    await fetch(`/api/resumes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle }),
    });
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Resumes</h1>
            <p className="text-gray-500 mt-1">Manage, edit, and export your resumes.</p>
          </div>
          {resumes.length > 0 && (
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" /> New Resume
            </Button>
          )}
        </div>

        {resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-300 rounded-xl bg-white shadow-sm">
            <div className="w-20 h-20 rounded-full bg-accent-50 flex items-center justify-center text-accent-600 mb-6">
              <FileText className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your first resume</h2>
            <p className="text-gray-500 mb-6 text-center max-w-sm">Get started by building a professional, ATS-friendly resume powered by AI.</p>
            <Button onClick={handleCreate} size="lg" className="gap-2">
              <Plus className="w-5 h-5" /> Create Resume
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {resumes.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col"
              >
                {/* Thumbnail Header */}
                <div 
                  className="h-32 bg-gray-50 border-b border-gray-200 flex items-center justify-center relative cursor-pointer"
                  onClick={() => router.push(`/builder/${r.id}`)}
                >
                  <div className="w-20 h-28 bg-white border border-gray-200 shadow-sm rounded-sm p-2 flex flex-col gap-2">
                    <div className="h-1 w-full bg-gray-300 rounded-full" />
                    <div className="h-1 w-3/4 bg-gray-200 rounded-full" />
                    <div className="h-1 w-full bg-gray-200 rounded-full" />
                    <div className="h-1 w-5/6 bg-gray-200 rounded-full" />
                  </div>
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white text-gray-900 text-sm font-medium px-4 py-2 rounded-full shadow-sm">
                      Open Builder
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-1 relative">
                    {editingId === r.id ? (
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(r.id)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveTitle(r.id)}
                        className="text-lg font-bold text-gray-900 border-b-2 border-accent-500 outline-none w-full bg-transparent"
                      />
                    ) : (
                      <h3 className="text-lg font-bold text-gray-900 truncate flex-1 group-hover:text-accent-600 transition-colors cursor-pointer" onClick={() => {
                        setEditTitle(r.title);
                        setEditingId(r.id);
                      }}>
                        {r.title}
                      </h3>
                    )}

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === r.id ? null : r.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {menuOpenId === r.id && (
                        <div ref={menuRef} className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                          <button onClick={() => {
                            setEditTitle(r.title);
                            setEditingId(r.id);
                            setMenuOpenId(null);
                          }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Edit3 className="w-4 h-4" /> Rename
                          </button>
                          <button onClick={() => handleDuplicate(r.id)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Copy className="w-4 h-4" /> Duplicate
                          </button>
                          <button onClick={() => handleDownload(r.id)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Download className="w-4 h-4" /> Download PDF
                          </button>
                          <div className="h-px bg-gray-200 my-1" />
                          <button onClick={() => { setMenuOpenId(null); handleDelete(r.id); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 capitalize mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> {r.template} Template
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
                    <span>Edited {new Date(r.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
