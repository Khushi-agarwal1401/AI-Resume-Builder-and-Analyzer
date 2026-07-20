"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

interface ResumeItem {
  id: string;
  title: string;
}

export default function CoverLetterPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jd, setJd] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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

  async function handleGenerate() {
    if (!selectedResume) return;
    setLoading(true);
    try {
      const resumeRes = await fetch(`/api/resumes/${selectedResume}`);
      const resumeJson = await resumeRes.json();

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cover-letter",
          input: `Company: ${companyName}\n\nJob Description: ${jd}`,
          context: JSON.stringify(resumeJson.data),
        }),
      });
      const json = await res.json();
      if (json.success) setCoverLetter(json.output);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(coverLetter);
  }

  if (authLoading || fetching) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  return (
    <div className="max-w-[720px] mx-auto px-8 py-12">
      <h1 className="text-h1 text-black mb-2">Cover Letter Builder</h1>
      <p className="text-body text-gray-500 mb-8">Generate a tailored cover letter from your resume.</p>

      {resumes.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-sm p-12 text-center">
          <p className="text-body text-gray-500 mb-4">Create a resume first so we have content to build your cover letter from.</p>
          <Button onClick={() => window.location.href = "/dashboard"}>Go to Dashboard</Button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-body font-medium text-gray-700 mb-1">Select Resume</label>
              <select
                className="h-10 w-full rounded-sm border border-gray-300 bg-white px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
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
            />
            <div>
              <label className="block text-body font-medium text-gray-700 mb-1">Job Description</label>
              <textarea
                className="w-full h-32 rounded-sm border border-gray-300 px-3 py-2 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description (helps tailor the letter)"
              />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading || !selectedResume}>
            {loading ? <Spinner /> : "Generate Cover Letter"}
          </Button>

          {coverLetter && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-h3 text-black">Your Cover Letter</h2>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleCopy}>Copy</Button>
                  <Button variant="secondary" size="sm" onClick={() => window.print()}>Print</Button>
                </div>
              </div>
              <div className="bg-white border border-gray-300 rounded-sm p-6 whitespace-pre-wrap text-body text-gray-700 leading-relaxed">
                {coverLetter}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
