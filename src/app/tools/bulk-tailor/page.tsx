"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Layers, Plus, X, FileText, Download, ChevronDown, ChevronUp } from "lucide-react";

interface ResumeOption {
  id: string;
  title: string;
}

interface Variant {
  jd: string;
  company: string;
  result: string | null;
  generating: boolean;
  error: string;
  expanded: boolean;
}

export default function BulkTailorPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [variants, setVariants] = useState<Variant[]>([
    { jd: "", company: "", result: null, generating: false, error: "", expanded: true },
  ]);
  const [generatingAll, setGeneratingAll] = useState(false);

  useEffect(() => {
    if (!authLoading && !authenticated) router.push("/login");
  }, [authLoading, authenticated, router]);

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setResumes(json.data.map((r: { id: string; title: string }) => ({ id: r.id, title: r.title })));
      })
      .catch(() => {});
  }, []);

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { jd: "", company: "", result: null, generating: false, error: "", expanded: true },
    ]);
  }

  function removeVariant(idx: number) {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateVariant(idx: number, fields: Partial<Variant>) {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...fields } : v)));
  }

  async function generateOne(idx: number) {
    const v = variants[idx];
    if (!selectedResumeId || !v.jd.trim()) return;
    updateVariant(idx, { generating: true, error: "" });
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "company-variant",
          input: v.jd || v.company || "general",
          context: `resume:${selectedResumeId}`,
        }),
      });
      const json = await res.json();
      if (json.success && json.output) {
        updateVariant(idx, { result: json.output, generating: false });
      } else {
        updateVariant(idx, { error: json.error || "Failed.", generating: false });
      }
    } catch {
      updateVariant(idx, { error: "Request failed.", generating: false });
    }
  }

  async function generateAll() {
    if (!selectedResumeId) return;
    setGeneratingAll(true);
    for (let i = 0; i < variants.length; i++) {
      if (variants[i].jd.trim() && !variants[i].result) {
        await generateOne(i);
      }
    }
    setGeneratingAll(false);
  }

  function exportVariant(text: string, company: string) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-${company || "variant"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;

  const hasResults = variants.some((v) => v.result);

  return (
    <div className="max-w-[900px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent-600" />
            Bulk Resume Tailoring
          </h1>
          <p className="text-body text-gray-500 mt-1">
            Generate multiple tailored versions of your resume from one base.
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>Back</Button>
      </div>

      {/* Config */}
      <div className="bg-white border border-gray-300 rounded-sm p-6 mb-6">
        <label className="text-small font-medium text-black mb-2 block">Base Resume</label>
        <select
          className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500"
          value={selectedResumeId}
          onChange={(e) => setSelectedResumeId(e.target.value)}
        >
          <option value="">Select a resume...</option>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
      </div>

      {/* Job descriptions */}
      <div className="space-y-3 mb-6">
        {variants.map((v, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded uppercase">
                  Variant {i + 1}
                </span>
                <input
                  className="text-small border-b border-gray-300 bg-transparent outline-none focus:border-accent-500 w-48"
                  placeholder="Company / label"
                  value={v.company}
                  onChange={(e) => updateVariant(i, { company: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-1">
                {variants.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeVariant(i)} className="text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => updateVariant(i, { expanded: !v.expanded })}>
                  {v.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            {v.expanded && (
              <div className="p-4 space-y-3">
                <textarea
                  className="w-full h-28 rounded-sm border border-gray-300 px-4 py-3 text-body outline-none focus:border-accent-500 resize-none"
                  placeholder={`Paste job description for variant ${i + 1}...`}
                  value={v.jd}
                  onChange={(e) => updateVariant(i, { jd: e.target.value })}
                />
                {v.error && (
                  <p className="text-[11px] text-red-600">{v.error}</p>
                )}
                {v.result ? (
                  <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-sm p-3">
                      <p className="text-[11px] text-green-700 font-medium mb-2">Tailored version ready</p>
                      <div className="text-small text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                        {v.result}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => exportVariant(v.result || "", v.company)}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Export
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => generateOne(i)}
                    disabled={generatingAll || !v.jd.trim()}
                  >
                    {v.generating ? <Spinner /> : <><FileText className="w-3.5 h-3.5 mr-1" /> Generate</>}
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={addVariant}>
          <Plus className="w-4 h-4 mr-1" /> Add Variant
        </Button>
        <Button onClick={generateAll} disabled={generatingAll || !selectedResumeId}>
          {generatingAll ? <Spinner /> : <><Layers className="w-4 h-4 mr-1" /> Generate All</>}
        </Button>
      </div>
    </div>
  );
}