"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface ResumeItem {
  id: string;
  title: string;
}

const TONES = [
  { value: "Professional", hint: "Polished and confident" },
  { value: "Enthusiastic", hint: "Energetic and warm" },
  { value: "Concise", hint: "Short and direct" },
  { value: "Formal", hint: "Traditional and reserved" },
] as const;

const LENGTHS = [
  { value: "Short", hint: "~200 words" },
  { value: "Standard", hint: "~350 words" },
  { value: "Detailed", hint: "~500 words" },
] as const;

type Tone = (typeof TONES)[number]["value"];
type Length = (typeof LENGTHS)[number]["value"];

export default function CoverLetterPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jd, setJd] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
  const [length, setLength] = useState<Length>("Standard");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authenticated) {
      fetch("/api/resumes")
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setResumes(json.data);
        })
        .catch(console.error)
        .finally(() => setFetching(false));
    }
  }, [authenticated]);

  async function generate() {
    if (!selectedResume) return;
    setLoading(true);
    setError("");
    try {
      const resumeRes = await fetch(`/api/resumes/${selectedResume}`);
      const resumeJson = await resumeRes.json();

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cover-letter",
          input: [
            `Company: ${companyName.trim() || "Not specified"}`,
            `Tone: ${tone}`,
            `Length: ${length}`,
            `Job Description: ${jd.trim() || "Not provided"}`,
          ].join("\n\n"),
          context: JSON.stringify(resumeJson.data),
        }),
      });
      const json = await res.json();
      if (json.success && json.output) {
        setCoverLetter(json.output);
        requestAnimationFrame(() =>
          outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        );
      } else {
        setError(json.error || "Generation failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    const blob = new Blob([coverLetter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = companyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "draft";
    a.href = url;
    a.download = `cover-letter-${slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const wordCount = coverLetter.trim() ? coverLetter.trim().split(/\s+/).length : 0;

  if (authLoading || fetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Cover Letter Builder</h1>
        <p className="text-sm text-gray-500 mb-8">
          Generate a tailored cover letter from your resume — pick a tone and length to match the role.
        </p>

        {resumes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm text-gray-500 mb-4">Create a resume first so we have content to build your cover letter from.</p>
            <Button onClick={() => (window.location.href = "/dashboard")}>Go to Dashboard</Button>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5 mb-6">
              <div>
                <label htmlFor="resume" className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Resume
                </label>
                <select
                  id="resume"
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                >
                  <option value="">Choose a resume...</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              <Input
                id="company"
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google"
                className="rounded-lg"
              />

              <div>
                <label htmlFor="jd" className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Job Description
                </label>
                <textarea
                  id="jd"
                  className="w-full h-32 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the job description (helps tailor the letter)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                    Tone
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {TONES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTone(t.value)}
                        title={t.hint}
                        aria-pressed={tone === t.value}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          tone === t.value
                            ? "bg-accent-50 text-accent-700 border-accent-300 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800"
                        )}
                      >
                        {t.value}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                    Length
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {LENGTHS.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLength(l.value)}
                        title={l.hint}
                        aria-pressed={length === l.value}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          length === l.value
                            ? "bg-accent-50 text-accent-700 border-accent-300 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800"
                        )}
                      >
                        {l.value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600" role="alert">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <Button onClick={generate} disabled={loading || !selectedResume}>
                  {loading ? <Spinner /> : coverLetter ? "Regenerate Cover Letter" : "Generate Cover Letter"}
                </Button>
                {loading && (
                  <span className="text-xs text-gray-400 animate-pulse">Writing your letter…</span>
                )}
              </div>
            </div>

            {coverLetter && (
              <div ref={outputRef} className="scroll-mt-24">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-bold text-gray-900">Your Cover Letter</h2>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-medium">
                      {wordCount} {wordCount === 1 ? "word" : "words"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleCopy} className="rounded-lg">
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleDownload} className="rounded-lg">
                      Download .txt
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => window.print()} className="rounded-lg">
                      Print
                    </Button>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                  {coverLetter}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
