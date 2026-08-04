"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface AtsSubscores {
  keywordRelevance: number;
  formatting: number;
  readability: number;
  sections: number;
  contactInfo: number;
  educationRelevance: number;
  experienceDepth: number;
  projectQuality: number;
}

interface AtsResult {
  overall: number;
  subscores: AtsSubscores;
  suggestions: string[];
  grade: string;
  category: string;
  sectionDetails: { present: string[]; missing: string[] };
  readabilityDetails: { fleschKincaid: number; avgSentenceLength: number };
  keywordDetails: Record<string, number>;
}

const SUBSCORE_LABELS: { key: keyof AtsSubscores; label: string }[] = [
  { key: "keywordRelevance", label: "Keyword Relevance" },
  { key: "formatting", label: "Formatting" },
  { key: "readability", label: "Readability" },
  { key: "sections", label: "Sections" },
  { key: "contactInfo", label: "Contact Info" },
  { key: "educationRelevance", label: "Education" },
  { key: "experienceDepth", label: "Experience Depth" },
  { key: "projectQuality", label: "Project Quality" },
];

export default function AtsScorePage() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const [score, setScore] = useState<AtsResult | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [jd, setJd] = useState("");
  const [calculating, setCalculating] = useState(false);

  const fetchScore = useCallback(async (jdText?: string, background = false) => {
    // Background re-scores (JD-based) keep the page visible; only the initial
    // load shows a full-page spinner.
    if (!background) setInitialLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ats-score/${params.resumeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jdText || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        setScore(json.data);
      } else {
        setError(json.error || "Failed to calculate score.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setInitialLoading(false);
    }
  }, [params.resumeId]);

  useEffect(() => {
    if (!authLoading && !authenticated) { router.push("/login"); return; }
    if (authenticated) fetchScore();
  }, [authLoading, authenticated, router, fetchScore]);

  async function handleCalculate() {
    if (!jd.trim()) return;
    setCalculating(true);
    await fetchScore(jd, true);
    setCalculating(false);
  }

  if (authLoading || initialLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;

  const overallColor =
    (score?.overall ?? 0) >= 70 ? "border-success text-success" :
    (score?.overall ?? 0) >= 40 ? "border-warning text-warning" :
    "border-error text-error";

  return (
    <div className="max-w-[720px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black">Estimated Compatibility Score</h1>
          <p className="text-small text-gray-500 mt-1">This is our own estimate based on common ATS patterns — not a score from Workday, Greenhouse, or any specific hiring system.</p>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>Back</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-8 text-small text-red-700">
          {error}
        </div>
      )}

      {score && (
        <div className="bg-white border border-gray-300 rounded-sm p-8 mb-8">
          <div className="flex items-center gap-6 mb-8">
            <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-h1 font-bold ${overallColor}`}>
              {score.overall}
            </div>
            <div>
              <p className="text-h3 text-black">Overall Score</p>
              <p className="text-small text-gray-500 mt-1">Grade: <span className="font-semibold text-black">{score.grade}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {SUBSCORE_LABELS.map(({ key, label }) => {
              const value = score.subscores[key];
              const color = value >= 70 ? "text-success" : value >= 40 ? "text-warning" : "text-error";
              return (
                <div key={key} className="text-center">
                  <div className={`text-h2 font-bold ${color}`}>{value}</div>
                  <p className="text-micro text-gray-500 uppercase tracking-widest mt-1">{label}</p>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        value >= 70 ? "bg-success" : value >= 40 ? "bg-warning" : "bg-error"
                      }`}
                      style={{ width: `${Math.min(100, value)}%` }}
                    />
                  </div>
                </div>
              );
            })}
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

          {score.sectionDetails.missing.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-sm">
              <h4 className="text-small font-medium text-black mb-1">Missing Sections</h4>
              <p className="text-small text-gray-600">{score.sectionDetails.missing.join(", ")}</p>
            </div>
          )}
        </div>
      )}

      {!score && !initialLoading && !error && (
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
