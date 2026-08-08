"use client";
import Preloader from "@/components/ui/Preloader";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowRight, TrendingUp, AlertCircle, CheckCircle2, Target, FileText, Layout, Key, GraduationCap, Briefcase, Loader2, LucideIcon } from "lucide-react";


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

const SUBSCORE_LABELS: { key: keyof AtsSubscores; label: string; icon: LucideIcon }[] = [
  { key: "keywordRelevance", label: "Keyword Relevance", icon: Key },
  { key: "formatting", label: "Formatting", icon: Layout },
  { key: "readability", label: "Readability", icon: FileText },
  { key: "sections", label: "Sections", icon: Target },
  { key: "contactInfo", label: "Contact Info", icon: CheckCircle2 },
  { key: "educationRelevance", label: "Education", icon: GraduationCap },
  { key: "experienceDepth", label: "Experience Depth", icon: Briefcase },
  { key: "projectQuality", label: "Project Quality", icon: Target },
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

  if (authLoading || initialLoading) return <Preloader />;

  const overallColor =
    (score?.overall ?? 0) >= 70 ? "border-emerald-500 text-emerald-600 bg-emerald-50" :
      (score?.overall ?? 0) >= 40 ? "border-amber-500 text-amber-600 bg-amber-50" :
        "border-red-500 text-red-600 bg-red-50";

  const overallRingColor =
    (score?.overall ?? 0) >= 70 ? "from-emerald-400 to-emerald-600" :
      (score?.overall ?? 0) >= 40 ? "from-amber-400 to-amber-600" :
        "from-red-400 to-red-600";

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
        <div className="space-y-6 mb-8">
          {/* Overall Score Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-8 mb-8">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center text-4xl font-bold ${overallColor}`}>
                  {score.overall}
                </div>
                <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br ${overallRingColor} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                  {score.grade}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-2xl font-bold text-gray-900">Overall Score</p>
                  {score.overall >= 70 && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                  {score.overall >= 40 && score.overall < 70 && <AlertCircle className="w-6 h-6 text-amber-500" />}
                  {score.overall < 40 && <AlertCircle className="w-6 h-6 text-red-500" />}
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {score.overall >= 70 ? "Great job! Your resume is well-optimized for ATS systems." :
                    score.overall >= 40 ? "Your resume needs some improvements to pass ATS filters." :
                      "Your resume needs significant work to be ATS-compatible."}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Target className="w-4 h-4" />
                  <span>Category: {score.category}</span>
                </div>
              </div>
            </div>

            {/* Subscore Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SUBSCORE_LABELS.map(({ key, label, icon: Icon }) => {
                const value = score.subscores[key];
                const color = value >= 70 ? "text-emerald-600" : value >= 40 ? "text-amber-600" : "text-red-600";
                const bgColor = value >= 70 ? "bg-emerald-50 border-emerald-200" : value >= 40 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
                const barColor = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
                return (
                  <div key={key} className={`rounded-xl border p-4 ${bgColor}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <p className="text-xs font-semibold text-gray-700">{label}</p>
                    </div>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="w-full h-2 bg-white/50 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, value)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Score Trend / Breakdown */}
            <div className="pt-6 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Score Breakdown</h4>
              <div className="space-y-3">
                {SUBSCORE_LABELS.map(({ key, label }) => {
                  const value = score.subscores[key];
                  const barColor = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
                  const avgScore = Object.values(score.subscores).reduce((a, b) => a + b, 0) / Object.keys(score.subscores).length;
                  const isAboveAvg = value >= avgScore;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-32 text-xs text-gray-600 truncate">{label}</div>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(100, value)}%` }}
                        />
                      </div>
                      <div className="w-12 text-xs font-bold text-gray-700 text-right">{value}</div>
                      {isAboveAvg && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {!isAboveAvg && value < avgScore && <AlertCircle className="w-4 h-4 text-amber-500" />}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Average subscore: {Math.round(Object.values(score.subscores).reduce((a, b) => a + b, 0) / Object.keys(score.subscores).length)}</span>
                <span>Focus on areas below average to improve your overall score</span>
              </div>
            </div>
          </div>

          {/* Suggestions Panel */}
          {score.suggestions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-accent-600" />
                <h3 className="text-lg font-bold text-gray-900">Top Suggestions</h3>
              </div>
              <div className="space-y-3">
                {score.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Sections Alert */}
          {score.sectionDetails.missing.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-amber-900 mb-1">Missing Sections</h4>
                  <p className="text-sm text-amber-800 mb-2">Add these sections to improve your ATS score:</p>
                  <div className="flex flex-wrap gap-2">
                    {score.sectionDetails.missing.map((section) => (
                      <span key={section} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold">
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!score && !initialLoading && !error && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center mb-8 shadow-sm">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-body text-gray-500">Add more content to your resume to get a compatibility estimate.</p>
        </div>
      )}

      {/* Job Description Scoring */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-accent-600" />
          <h3 className="text-lg font-bold text-gray-900">Score against a job description</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Paste a job description to see how well your resume matches the requirements.</p>
        <textarea
          className="w-full h-32 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300 resize-y transition-all"
          placeholder="Paste a job description here..."
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            {jd.length > 0 ? `${jd.length} characters` : "Enter a job description to analyze"}
          </p>
          <Button
            onClick={handleCalculate}
            disabled={calculating || !jd}
            className="flex items-center gap-2"
          >
            {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {calculating ? "Analyzing..." : "Calculate Score"}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      {score && score.overall < 70 && (
        <div className="bg-gradient-to-r from-accent-50 to-accent-100/50 border border-accent-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-accent-600" />
            <h3 className="text-lg font-bold text-gray-900">Quick Actions to Improve</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push(`/builder/${params.resumeId}/summary`)}
              className="flex items-center gap-2 justify-start"
            >
              <FileText className="w-4 h-4" />
              Improve Summary
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push(`/builder/${params.resumeId}/experience`)}
              className="flex items-center gap-2 justify-start"
            >
              <Briefcase className="w-4 h-4" />
              Enhance Experience
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push(`/builder/${params.resumeId}/skills`)}
              className="flex items-center gap-2 justify-start"
            >
              <Key className="w-4 h-4" />
              Add Keywords
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push(`/builder/${params.resumeId}/projects`)}
              className="flex items-center gap-2 justify-start"
            >
              <Target className="w-4 h-4" />
              Strengthen Projects
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
