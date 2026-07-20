"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

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

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/login");
      return;
    }
    if (authenticated) fetchResumes();
  }, [authenticated, authLoading, router]);

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
            <h1 className="text-h1 text-black">Your Resumes</h1>
            <p className="text-body text-gray-500 mt-1">Manage and edit your resumes</p>
          </div>
          <Button onClick={handleCreate}>Create New Resume</Button>
        </div>

        {resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-300 rounded-md bg-white">
            <div className="w-16 h-16 rounded-sm bg-gray-100 flex items-center justify-center text-3xl mb-6">📄</div>
            <h2 className="text-h3 text-black mb-2">Create your first resume</h2>
            <p className="text-body text-gray-500 mb-6">Get started with an AI-powered resume</p>
            <Button onClick={handleCreate}>Create Your First Resume</Button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {resumes.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-gray-300 rounded-sm p-5 hover:shadow-2 transition-all duration-200 hover:-translate-y-0.5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-h3 text-black truncate flex-1">{r.title}</h3>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-gray-300 hover:text-error opacity-0 group-hover:opacity-100 transition-all text-small p-1"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-small text-gray-500 capitalize mb-1">{r.template} template</p>
                <p className="text-micro text-gray-500 mb-4">
                  Updated {new Date(r.updated_at).toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="flex-1" onClick={() => router.push(`/builder/${r.id}`)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => router.push(`/preview/${r.id}`)}>
                    Preview
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => router.push(`/resume/${r.id}/ats-score`)}>
                    ATS
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => router.push(`/resume/${r.id}/variants/company`)}>
                    Company
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
