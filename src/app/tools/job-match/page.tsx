"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface AnalysisResult {
  matchPercentage: number;
  missingKeywords: string[];
  missingSkills: string[];
  missingTools: string[];
}

export default function JobMatchPage() {
  const { loading: authLoading } = useAuth();
  const [jd, setJd] = useState("");
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"paste" | "url">("paste");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    const input = mode === "paste" ? jd : url;
    if (!input) { setError("Please provide a job description"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze-jd",
          input: mode === "url" ? `URL: ${url}` : jd,
          context: "",
        }),
      });
      const json = await res.json();
      if (json.success) {
        const parsed = JSON.parse(json.output);
        setResult(parsed);
      } else {
        setError("Analysis failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-[720px] mx-auto px-8 py-12">
        <h1 className="text-h1 text-black mb-2">Job Description Analyzer</h1>
        <p className="text-body text-gray-500 mb-8">Paste a job description to see how your resume matches.</p>

        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === "paste" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("paste")}
          >
            Paste Text
          </Button>
          <Button
            variant={mode === "url" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("url")}
          >
            Paste URL
          </Button>
        </div>

        {mode === "paste" ? (
          <textarea
            className="w-full h-48 rounded-sm border border-gray-300 px-4 py-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
            placeholder="Paste the full job description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        ) : (
          <input
            className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
            placeholder="https://example.com/jobs/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}

        {error && <p className="text-small text-error mt-2">{error}</p>}

        <Button className="mt-4" onClick={handleAnalyze} disabled={loading}>
          {loading ? <Spinner /> : "Analyze"}
        </Button>

        {result && (
          <div className="bg-white border border-gray-300 rounded-sm p-6 mt-8">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-h2 font-bold ${
                result.matchPercentage >= 70 ? "border-success text-success" :
                result.matchPercentage >= 40 ? "border-warning text-warning" :
                "border-error text-error"
              }`}>
                {result.matchPercentage}%
              </div>
              <div>
                <p className="text-h3 text-black">Keyword Match</p>
                <p className="text-small text-gray-500">Based on common keywords in the description</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Missing Keywords", items: result.missingKeywords },
                { label: "Missing Skills", items: result.missingSkills },
                { label: "Missing Tools", items: result.missingTools },
              ].map((section) => (
                <div key={section.label}>
                  <h3 className="text-micro text-gray-500 uppercase tracking-widest mb-3">{section.label}</h3>
                  {section.items.length > 0 ? (
                    <ul className="space-y-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="text-body text-gray-700 flex items-center gap-2">
                          <span className="text-error">✕</span> {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-small text-gray-500">None found</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
