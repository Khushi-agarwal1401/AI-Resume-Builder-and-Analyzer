"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { MoreVertical, Copy, Download, Trash, Edit3, FileText, GraduationCap, Briefcase, Sparkles, TrendingUp, X } from "lucide-react";
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
  const [createModalOpen, setCreateModalOpen] = useState(false);

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
      // Explicitly check if the response was successful (status 200-299)
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      const json = await res.json();
      if (json.success) setResumes(json.data);
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(targetLevel: string = "fresher", title: string = "Untitled Resume") {
    setCreateModalOpen(false);
    
    // Choose a default template based on the target level
    const templateMap: Record<string, string> = {
      student: "student",
      fresher: "modern",
      student_internship: "minimal",
      experienced: "executive"
    };
    
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title, 
        targetLevel,
        template: templateMap[targetLevel] || "modern" 
      }),
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
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2 bg-black text-white hover:bg-gray-800">New Resume +
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
            <Button onClick={() => setCreateModalOpen(true)} size="lg" className="bg-black text-white hover:bg-gray-800">
              Create Resume
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {resumes.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 group flex flex-col relative",
                  menuOpenId === r.id ? "z-50" : "z-10"
                )}
              >
                {/* Thumbnail Header */}
                <div 
                  className="h-32 bg-gray-50 border-b border-gray-200 flex items-center justify-center relative cursor-pointer rounded-t-xl overflow-hidden"
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

      {/* Create Resume Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Choose your level</h2>
                <p className="text-sm text-gray-500 mt-1">We'll tailor the template and suggestions to your experience.</p>
              </div>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student */}
              <button 
                onClick={() => handleCreate("student", "Student Resume")}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-md hover:bg-green-50/30 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Student</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Showcase your academic achievements, projects, and extracurriculars.</p>
                </div>
              </button>

              {/* Internship */}
              <button 
                onClick={() => handleCreate("student_internship", "Internship Resume")}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md hover:bg-blue-50/30 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Internship</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Highlight your foundational skills and previous internship experiences.</p>
                </div>
              </button>

              {/* Fresher */}
              <button 
                onClick={() => handleCreate("fresher", "Fresher Resume")}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md hover:bg-purple-50/30 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Fresher</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Stand out for entry-level roles with a focus on potential and core skills.</p>
                </div>
              </button>

              {/* Experienced */}
              <button 
                onClick={() => handleCreate("experienced", "Professional Resume")}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-red-500 hover:shadow-md hover:bg-red-50/30 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Experienced</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Present your career progression, leadership, and measurable impact.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
