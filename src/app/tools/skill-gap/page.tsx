"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Target, AlertTriangle, CheckCircle, BookOpen, ExternalLink } from "lucide-react";

interface ResumeOption {
  id: string;
  title: string;
}

interface GapResult {
  matchedSkills: string[];
  missingSkills: string[];
  missingTools: string[];
  otherMissing: string[];
  matchPercentage: number;
  aiSuggestions: string[];
}

export default function SkillGapPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GapResult | null>(null);

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

  async function analyze() {
    if (!selectedResumeId || !jobDescription.trim()) {
      setError("Select a resume and paste a job description.");
      return;
    }
    setAnalyzing(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze-jd",
          input: jobDescription,
          context: `resume:${selectedResumeId}`,
        }),
      });
      const json = await res.json();
      if (json.success && json.output) {
        const parsed = parseGapResult(json.output);
        setResult(parsed);
      } else {
        setError(json.error || "Could not analyze skill gap.");
      }
    } catch {
      setError("Failed to analyze. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  function parseGapResult(output: string): GapResult {
    const matched = extractSection(output, "matched|present|existing|have");
    const missing = extractSection(output, "missing|gap|need|lacking");
    const tools = extractSection(output, "tools|technologies|platforms");
    return {
      matchedSkills: matched,
      missingSkills: missing,
      missingTools: tools,
      otherMissing: [],
      matchPercentage: extractPercentage(output),
      aiSuggestions: extractSuggestions(output),
    };
  }

  function extractSection(text: string, pattern: string): string[] {
    const regex = new RegExp(`${pattern}[:\\s]*\\n([\\s\\S]*?)(?=\\n\\n|\\n\\*\\*|\\n#{1,3}\\s|\\Z)`, "i");
    const match = text.match(regex);
    if (!match) return [];
    return match[1].split("\n").map((l: string) => l.replace(/^[-•*]\s*/, "").trim()).filter((l: string) => l.length > 0 && l.length < 100);
  }

  function extractPercentage(text: string): number {
    const match = text.match(/(\d{1,3})\s*%/);
    return match ? parseInt(match[1]) : 0;
  }

  function extractSuggestions(text: string): string[] {
    const lines = text.split("\n").filter((l: string) => {
      const lower = l.toLowerCase();
      return (lower.includes("recommend") || lower.includes("suggest") || lower.includes("consider")) && l.trim().length > 10;
    });
    return lines.slice(0, 5).map((l: string) => l.replace(/^[-•*]\s*/, "").trim());
  }

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;

  const totalMissing = result ? result.missingSkills.length + result.missingTools.length + result.otherMissing.length : 0;

  return (
    <div className="max-w-[800px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black flex items-center gap-2">
            <Target className="w-5 h-5 text-accent-600" />
            Skill Gap Radar
          </h1>
          <p className="text-body text-gray-500 mt-1">
            Compare your resume against a job description to find missing skills.
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>Back</Button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-sm text-small border bg-red-50 border-red-200 text-red-700">{error}</div>
      )}

      {/* Config */}
      <div className="bg-white border border-gray-300 rounded-sm p-6 mb-6 space-y-4">
        <div>
          <label className="text-small font-medium text-black mb-2 block">Resume</label>
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
        <div>
          <label className="text-small font-medium text-black mb-2 block">Job Description</label>
          <textarea
            className="w-full h-40 rounded-sm border border-gray-300 px-4 py-3 text-body outline-none focus:border-accent-500 resize-none"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
          />
        </div>
        <Button onClick={analyze} disabled={analyzing}>
          {analyzing ? <Spinner /> : <><Target className="w-4 h-4 mr-1.5" /> Analyze Gap</>}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Match score bar */}
          <div className="bg-white border border-gray-300 rounded-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-small font-medium text-black">Match Score</span>
              <span className={`text-h3 font-bold ${result.matchPercentage >= 70 ? "text-green-600" : result.matchPercentage >= 40 ? "text-amber-600" : "text-red-600"}`}>
                {result.matchPercentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${result.matchPercentage >= 70 ? "bg-green-500" : result.matchPercentage >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${result.matchPercentage}%` }}
              />
            </div>
          </div>

          {/* Skills you have */}
          {result.matchedSkills.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-sm p-5">
              <h3 className="text-small font-bold text-green-700 flex items-center gap-1.5 mb-3">
                <CheckCircle className="w-4 h-4" /> Skills You Have ({result.matchedSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.matchedSkills.map((skill, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-sm bg-green-50 text-green-700 border border-green-200 font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {totalMissing > 0 && (
            <div className="bg-white border border-gray-300 rounded-sm p-5">
              <h3 className="text-small font-bold text-red-700 flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-4 h-4" /> Missing Skills ({totalMissing})
              </h3>
              <div className="space-y-2">
                {result.missingSkills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span className="text-body text-gray-700">{skill}</span>
                  </div>
                ))}
                {result.missingTools.map((tool, i) => (
                  <div key={`t-${i}`} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                    <span className="text-body text-gray-700">{tool} <span className="text-[10px] text-gray-400">(tool)</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {result.aiSuggestions.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-sm p-5">
              <h3 className="text-small font-bold text-accent-700 flex items-center gap-1.5 mb-3">
                <BookOpen className="w-4 h-4" /> Improvement Suggestions
              </h3>
              <ul className="space-y-2">
                {result.aiSuggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-accent-400 mt-1 shrink-0">•</span>
                    <span className="text-body text-gray-600">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}