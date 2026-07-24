"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface AtsScore {
  overall: number;
  skillsMatch: number;
  formatting: number;
  keywords: number;
  suggestions: string[];
}

export default function AtsScorePage() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const [score, setScore] = useState<AtsScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [jd, setJd] = useState("");
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (!authLoading && !authenticated) { router.push("/login"); return; }
    if (authenticated) fetchScore();
  }, [authLoading, authenticated, router, params.resumeId]);

  async function fetchScore(jdText?: string) {
    setLoading(true);
    try {
      const resumeRes = await fetch(`/api/resumes/${params.resumeId}`);
      const resumeJson = await resumeRes.json();
      if (!resumeJson.success) return;

      const body: { action: string; input: string; context: string } = {
        action: "ats-score",
        input: jdText || "",
        context: JSON.stringify(resumeJson.data),
      };
      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const aiJson = await aiRes.json();
      if (aiJson.success) {
        const parsed = JSON.parse(aiJson.output);
        setScore(parsed);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleCalculate() {
    setCalculating(true);
    await fetchScore(jd);
    setCalculating(false);
  }

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;

  return (
    <div className="max-w-[720px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black">Estimated Compatibility Score</h1>
          <p className="text-small text-gray-500 mt-1">This is our own estimate based on common ATS patterns — not a score from Workday, Greenhouse, or any specific hiring system.</p>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>Back</Button>
      </div>

      {score && (
        <div className="bg-white border border-gray-300 rounded-sm p-8 mb-8">
          <div className="flex items-center gap-6 mb-8">
            <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-h1 font-bold ${
              score.overall >= 70 ? "border-success text-success" :
              score.overall >= 40 ? "border-warning text-warning" :
              "border-error text-error"
            }`}>
              {score.overall}
            </div>
            <div>
              <p className="text-h3 text-black">Overall Score</p>
              <p className="text-small text-gray-500 mt-1">out of 100</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              { label: "Skills Match", value: score.skillsMatch, max: 40 },
              { label: "Formatting", value: score.formatting, max: 30 },
              { label: "Keywords", value: score.keywords, max: 30 },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-h2 font-bold ${
                  s.value / s.max >= 0.7 ? "text-success" :
                  s.value / s.max >= 0.4 ? "text-warning" : "text-error"
                }`}>
                  {s.value}
                </div>
                <p className="text-micro text-gray-500 uppercase tracking-widest mt-1">{s.label}</p>
                <div className="text-micro text-gray-500">/ {s.max}</div>
              </div>
            ))}
          </div>

          {score.suggestions.length > 0 && (
            <div>
              <h3 className="text-h3 text-black mb-4">Suggestions</h3>
              <ul className="space-y-2">
                {score.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-body text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-accent-50 flex items-center justify-center text-accent-500 text-micro shrink-0 mt-0.5">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!score && !loading && (
        <div className="bg-white border border-gray-300 rounded-sm p-12 text-center mb-8">
          <p className="text-body text-gray-500">Add more content to your resume to get a compatibility estimate.</p>
        </div>
      )}

      <div className="bg-white border border-gray-300 rounded-sm p-6">
        <h3 className="text-h3 text-black mb-3">Score against a job description</h3>
        <textarea
          className="w-full h-32 rounded-sm border border-gray-300 px-3 py-2 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
          placeholder="Paste a job description to see how your resume matches..."
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />
        <Button className="mt-3" onClick={handleCalculate} disabled={calculating || !jd}>
          {calculating ? "Calculating..." : "Calculate Score"}
        </Button>
      </div>
    </div>
  );
}
