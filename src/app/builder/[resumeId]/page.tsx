"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useResumeForm } from "@/features/resume-builder/hooks/useResumeForm";
import { BuilderForm } from "@/features/resume-builder/components/BuilderForm";
import { AiAssistantPanel } from "@/features/ai-assistant/components/AiAssistantPanel";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const sectionList = [
  { id: "personalInfo", label: "Personal Info" },
  { id: "summary", label: "Summary" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "certifications", label: "Certifications" },
  { id: "achievements", label: "Achievements" },
  { id: "languages", label: "Languages" },
];

export default function BuilderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const resumeId = params.resumeId as string;
  const { data, setData, loading, saving } = useResumeForm(resumeId);

  useEffect(() => {
    if (!authLoading && !authenticated) router.push("/login");
  }, [authLoading, authenticated, router]);

  async function handleSave() {
    if (!data) return;
    if (resumeId === "new") {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          template: searchParams.get("template") || data.template,
          personalInfo: data.personalInfo,
          summary: data.summary,
        }),
      });
      const json = await res.json();
      if (json.success) router.push(`/builder/${json.data.id}`);
    } else {
      await fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      <aside className="w-[240px] border-r border-gray-300 bg-white shrink-0 p-4">
        <h2 className="text-micro text-gray-500 uppercase tracking-widest mb-4">Sections</h2>
        <nav className="space-y-1">
          {sectionList.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-3 h-9 px-3 rounded-sm text-body text-gray-500 hover:text-black hover:bg-gray-100 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-300 bg-white">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              ← Back
            </Button>
            <span className="text-small text-gray-500">
              {saving ? "Saving..." : "Saved"}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => data?.id && router.push(`/resume/${data.id}/ats-score`)}>
              ATS
            </Button>
            <Button variant="secondary" size="sm" onClick={() => data?.id && router.push(`/preview/${data.id}`)}>
              Preview
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Spinner /> : "Save"}
            </Button>
          </div>
        </div>
        <div className="max-w-[720px] mx-auto p-8">
          {data && <BuilderForm data={data} onChange={setData} />}
        </div>
      </div>

      <aside className="w-[400px] border-l border-gray-300 bg-white shrink-0 hidden xl:flex xl:flex-col">
        <div className="p-4 border-b border-gray-300">
          <h2 className="text-micro text-gray-500 uppercase tracking-widest mb-3">Preview</h2>
          <div className="border border-gray-300 rounded-sm p-4 bg-white min-h-[200px] flex items-center justify-center">
            <p className="text-small text-gray-300">Live preview updates as you edit</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AiAssistantPanel />
        </div>
      </aside>
    </div>
  );
}
