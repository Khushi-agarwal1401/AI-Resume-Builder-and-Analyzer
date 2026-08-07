"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { FileText, ArrowRightLeft, Copy, Download, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

interface ResumeOption {
  id: string;
  title: string;
}

interface SyncItem {
  jd: string;
  coverLetter: string | null;
  generating: boolean;
  error: string;
  expanded: boolean;
}

export default function CoverLetterSyncPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [items, setItems] = useState<SyncItem[]>([
    { jd: "", coverLetter: null, generating: false, error: "", expanded: true },
  ]);

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

  function addItem() {
    setItems((prev) => [...prev, { jd: "", coverLetter: null, generating: false, error: "", expanded: true }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, fields: Partial<SyncItem>) {
    setItems((prev) => prev.map((v, i) => (i === idx ? { ...v, ...fields } : v)));
  }

  async function generateCoverLetter(idx: number) {
    const item = items[idx];
    if (!selectedResumeId || !item.jd.trim()) return;
    updateItem(idx, { generating: true, error: "" });
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cover-letter",
          input: item.jd,
          context: `resume:${selectedResumeId}`,
        }),
      });
      const json = await res.json();
      if (json.success && json.output) {
        updateItem(idx, { coverLetter: json.output, generating: false });
      } else {
        updateItem(idx, { error: json.error || "Failed to generate.", generating: false });
      }
    } catch {
      updateItem(idx, { error: "Request failed.", generating: false });
    }
  }

  async function syncFromResume(idx: number) {
    const item = items[idx];
    if (!selectedResumeId || !item.coverLetter) return;
    updateItem(idx, { generating: true, error: "" });
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cover-letter",
          input: item.jd,
          context: `resume:${selectedResumeId}|sync:true|existing:${item.coverLetter}`,
        }),
      });
      const json = await res.json();
      if (json.success && json.output) {
        updateItem(idx, { coverLetter: json.output, generating: false });
      } else {
        updateItem(idx, { error: json.error || "Failed to sync.", generating: false });
      }
    } catch {
      updateItem(idx, { error: "Request failed.", generating: false });
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  function exportText(text: string, suffix: string) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${suffix}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;

  return (
    <div className="max-w-[900px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent-600" />
            Cover Letter ↔ Resume Sync
          </h1>
          <p className="text-body text-gray-500 mt-1">
            Generate cover letters from job descriptions, then keep them in sync with resume edits.
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>Back</Button>
      </div>

      {/* Resume selector */}
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

      {/* Items */}
      <div className="space-y-3 mb-6">
        {items.map((item, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded uppercase">
                  Letter {i + 1}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {items.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="text-red-500">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => updateItem(i, { expanded: !item.expanded })}>
                  {item.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            {item.expanded && (
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-small font-medium text-black mb-1 block">Job Description</label>
                  <textarea
                    className="w-full h-24 rounded-sm border border-gray-300 px-4 py-3 text-body outline-none focus:border-accent-500 resize-none"
                    placeholder="Paste job description..."
                    value={item.jd}
                    onChange={(e) => updateItem(i, { jd: e.target.value })}
                  />
                </div>

                {item.error && <p className="text-[11px] text-red-600">{item.error}</p>}

                {item.coverLetter ? (
                  <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-sm p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] text-green-700 font-medium">Cover Letter Generated</p>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => copyText(item.coverLetter || "")} className="text-[11px]">
                            <Copy className="w-3 h-3 mr-0.5" /> Copy
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => exportText(item.coverLetter || "", `letter-${i + 1}`)} className="text-[11px]">
                            <Download className="w-3 h-3 mr-0.5" /> Export
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => syncFromResume(i)} disabled={item.generating} className="text-[11px]">
                            <RefreshCw className="w-3 h-3 mr-0.5" /> Sync
                          </Button>
                        </div>
                      </div>
                      <div className="text-small text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                        {item.coverLetter}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => generateCoverLetter(i)} disabled={item.generating}>
                      {item.generating ? <Spinner /> : <><ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> Regenerate</>}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => generateCoverLetter(i)}
                    disabled={item.generating || !item.jd.trim()}
                  >
                    {item.generating ? <Spinner /> : <><FileText className="w-3.5 h-3.5 mr-1" /> Generate Cover Letter</>}
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button variant="secondary" onClick={addItem}>
        <ChevronDown className="w-4 h-4 mr-1" /> Add Another
      </Button>
    </div>
  );
}