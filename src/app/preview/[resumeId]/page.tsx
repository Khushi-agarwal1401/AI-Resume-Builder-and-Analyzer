"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import type { ResumeData } from "@/types/resume";

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-[900px] mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h2 text-black">Preview</h1>
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
  );
}
