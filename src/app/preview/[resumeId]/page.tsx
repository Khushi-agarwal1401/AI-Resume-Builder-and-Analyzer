"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import type { ResumeData, ResumeTemplate } from "@/types/resume";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TEMPLATES: { id: ResumeTemplate; name: string; gradient: string }[] = [
  { id: "modern", name: "Modern", gradient: "from-blue-500 to-indigo-600" },
  { id: "ats-professional", name: "ATS Professional", gradient: "from-gray-700 to-gray-900" },
  { id: "student", name: "Student", gradient: "from-green-500 to-emerald-600" },
  { id: "minimal", name: "Minimal", gradient: "from-gray-400 to-gray-500" },
  { id: "executive", name: "Executive", gradient: "from-indigo-900 to-indigo-700" },
  { id: "creative", name: "Creative", gradient: "from-pink-500 to-rose-600" },
];

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !authenticated) { router.push("/login"); return; }
    if (authenticated) {
      fetch(`/api/resumes/${params.resumeId}`)
        .then((r) => r.json())
        .then((json) => { if (json.success) setResume(json.data); })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [authLoading, authenticated, params.resumeId, router]);

  const handleTemplateChange = async (templateId: ResumeTemplate) => {
    if (!resume || resume.template === templateId) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/resumes/${resume.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: templateId }),
      });
      const json = await res.json();
      if (json.success) {
        setResume({ ...resume, template: templateId });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  if (!resume) {
    return (
      <div className="max-w-[1280px] mx-auto px-8 py-12 text-center">
        <p className="text-body text-gray-500 mb-4">Resume not found</p>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] bg-gray-50">
      <aside className="w-[380px] border-r border-gray-200 bg-white p-6 shrink-0 hidden md:flex flex-col">
        <h2 className="text-small font-bold text-gray-900 mb-6 uppercase tracking-wider text-center">Templates</h2>
        <div className="grid grid-cols-2 gap-6 overflow-y-auto flex-1 pb-10 pr-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTemplateChange(t.id)}
              disabled={updating}
              className={cn(
                "group relative flex flex-col items-center gap-3 transition-all",
                updating && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "w-full aspect-[210/297] relative overflow-hidden bg-white border-2 rounded-sm shadow-sm transition-all duration-200",
                resume.template === t.id
                  ? "border-accent-600 shadow-md ring-2 ring-accent-100"
                  : "border-gray-200 group-hover:border-gray-300 group-hover:shadow"
              )}>
                <div className="w-[800px] origin-top-left absolute top-0 left-0 pointer-events-none" style={{ transform: "scale(0.18)" }}>
                  <TemplateRenderer resume={{ ...resume, template: t.id }} />
                </div>
                {resume.template === t.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent-600 text-white flex items-center justify-center shadow-sm z-10">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
              <h3 className={cn(
                "text-sm font-medium text-center",
                resume.template === t.id ? "text-accent-700 font-semibold" : "text-gray-700"
              )}>{t.name}</h3>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-h2 text-black">Preview</h1>
              {updating && <Spinner className="w-4 h-4 text-accent-500" />}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => router.push(`/builder/${resume.id}`)}>
                Edit
              </Button>
              <Button onClick={() => window.print()}>Print / PDF</Button>
            </div>
          </div>
          <div className="bg-white border border-gray-300 rounded-sm shadow-1 p-8">
            <TemplateRenderer resume={resume} />
          </div>
        </div>
      </div>
    </div>
  );
}
