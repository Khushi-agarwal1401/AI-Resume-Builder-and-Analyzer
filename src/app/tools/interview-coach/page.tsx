"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Lightbulb, MessageSquare, Target, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface ResumeOption {
  id: string;
  title: string;
}

interface Question {
  text: string;
  category: string;
  answer?: string;
}

export default function InterviewCoachPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

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

  async function generateQuestions() {
    if (!selectedResumeId || !jobDescription.trim()) {
      setError("Select a resume and paste a job description.");
      return;
    }
    setGenerating(true);
    setError("");
    setQuestions([]);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview-questions",
          input: jobDescription,
          context: `resume:${selectedResumeId}`,
        }),
      });
      const json = await res.json();
      if (json.success && json.output) {
        const parsed = parseQuestions(json.output);
        setQuestions(parsed);
      } else {
        setError(json.error || "Could not generate questions.");
      }
    } catch {
      setError("Failed to generate questions. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function parseQuestions(output: string): Question[] {
    const lines = output.split("\n").filter((l: string) => l.trim());
    const result: Question[] = [];
    let currentCategory = "General";
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^(technical|behavioral|scenario|experience|general)/i.test(trimmed.replace(/^[#\-\d\.\)]+\s*/, ""))) {
        currentCategory = trimmed.replace(/^[#\-\d\.\)]+\s*/, "").replace(/:$/, "");
        continue;
      }
      const qMatch = trimmed.match(/^[\d\.\)]+\s*(.+)/);
      if (qMatch) {
        result.push({ text: qMatch[1], category: currentCategory });
      }
    }
    return result.length > 0 ? result : [{ text: output.slice(0, 500), category: "General" }];
  }

  function copyAnswer(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;

  return (
    <div className="max-w-[800px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent-600" />
            AI Interview Coach
          </h1>
          <p className="text-body text-gray-500 mt-1">
            Generate targeted interview questions from your resume + a job description.
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
        <Button onClick={generateQuestions} disabled={generating}>
          {generating ? <Spinner /> : <><Target className="w-4 h-4 mr-1.5" /> Generate Questions</>}
        </Button>
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-h3 text-black flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            {questions.length} Questions Generated
          </h2>
          {questions.map((q, i) => (
            <div key={i} className="bg-white border border-gray-300 rounded-sm overflow-hidden">
              <button
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded uppercase shrink-0">
                    {q.category}
                  </span>
                  <span className="text-body text-black">{q.text}</span>
                </div>
                {expandedIdx === i ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>
              {expandedIdx === i && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                  <p className="text-small text-gray-500 mb-2">Tip: Use the STAR method (Situation, Task, Action, Result) for behavioral questions. Be specific with metrics from your resume.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyAnswer(q.text, i)}
                    className="text-accent-600"
                  >
                    {copiedIdx === i ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy question</>}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}