"use client";
import Preloader from "@/components/ui/Preloader";

import { useState, useEffect, useCallback, useRef } from "react";
import { FileText, FolderGit2 } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { cleanResumeRewrite } from "@/features/ai-assistant/lib/cleanRewrite";
import type { AnalysisResult } from "@/types/ai";


type KitTab = "overview" | "resume" | "keyword" | "skills" | "cover" | "analysis" | "email" | "email-analysis" | "linkedin" | "linkedin-analysis" | "questions";

/** Where the resume content comes from: a saved resume or a freshly uploaded file. */
type ResumeSource = "saved" | "upload";

/** Uploaded resumes are used in memory only — never saved to the account, so
 *  the upload path is not blocked by the plan's saved-resume limit. */
const UPLOAD_CONTEXT_MAX = 28_000; // /api/ai caps context at 30k chars.

interface ResumeItem {
  id: string;
  title: string;
}

interface GeneratedText {
  status: "idle" | "loading" | "done" | "error";
  text: string;
  error?: string;
}

const EMPTY_TEXT: GeneratedText = { status: "idle", text: "" };

/**
 * Split an AI-generated document at its appended analysis section (e.g.
 * "Cover Letter Analysis:", "Email Analysis:", "Message Analysis:"). Returns
 * the content without the analysis and the analysis itself (or null when the
 * output has none). Used defensively — the email/LinkedIn prompts don't ask
 * for analysis, but the model sometimes adds one anyway.
 */
function splitAtAnalysisMarker(output: string): { content: string; analysis: string | null } {
  // Match an analysis heading at the start of a line, tolerating markdown
  // decoration (`**`, `#`) and an optional trailing colon, e.g.
  //   Email Analysis:
  //   **Message Analysis:**
  //   ## Cover Letter Analysis
  const marker = output.search(/(?:^|\n)\s*(?:#{1,6}\s+|\*\*\s*)?(?:[A-Z][A-Za-z' -]*\s+)?Analysis(?:\s*:)?(?:\s*\*\*)?\s*(?=\n|$)/i);
  if (marker === -1) return { content: output.trim(), analysis: null };
  return {
    content: output.slice(0, marker).trim(),
    analysis: output.slice(marker).trim(),
  };
}



const TAB_DEFS: { key: KitTab; label: string; emoji: string }[] = [
  { key: "overview", label: "Overview", emoji: "🎯" },
  { key: "resume", label: "Resume", emoji: "📄" },
  { key: "keyword", label: "ATS Keywords", emoji: "🔑" },
  { key: "skills", label: "Skills", emoji: "🧩" },
  { key: "cover", label: "Cover Letter", emoji: "✉️" },
  { key: "analysis", label: "Cover Letter Analysis", emoji: "📊" },
  { key: "email", label: "Recruiter Email", emoji: "📧" },
  { key: "email-analysis", label: "Email Analysis", emoji: "📊" },
  { key: "linkedin", label: "LinkedIn", emoji: "💼" },
  { key: "linkedin-analysis", label: "LinkedIn Analysis", emoji: "📊" },
  { key: "questions", label: "Interview Qs", emoji: "❓" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
        copied
          ? "bg-green-50 text-green-700 border-green-300"
          : "bg-white text-gray-600 border-gray-300 hover:border-accent-500 hover:text-accent-700"
      )}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" /><path d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h1" stroke="currentColor" strokeWidth="1.2" /></svg>
          Copy
        </>
      )}
    </button>
  );
}

export default function ApplicationKitPage() {
  const { loading: authLoading } = useAuth();
  const [source, setSource] = useState<ResumeSource>("saved");
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Which source produced the current results — drives the Resume tab's
  // "Open Resume Builder" link (only meaningful for saved resumes).
  const [generatedFrom, setGeneratedFrom] = useState<ResumeSource | null>(null);
  const [jd, setJd] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [cover, setCover] = useState<GeneratedText>(EMPTY_TEXT);
  const [email, setEmail] = useState<GeneratedText>(EMPTY_TEXT);
  const [emailAnalysis, setEmailAnalysis] = useState<GeneratedText>(EMPTY_TEXT);
  const [linkedin, setLinkedin] = useState<GeneratedText>(EMPTY_TEXT);
  const [linkedinAnalysis, setLinkedinAnalysis] = useState<GeneratedText>(EMPTY_TEXT);
  const [keywordResume, setKeywordResume] = useState<GeneratedText>(EMPTY_TEXT);
  const [coverAnalysis, setCoverAnalysis] = useState<GeneratedText>(EMPTY_TEXT);
  const [skills, setSkills] = useState<GeneratedText>(EMPTY_TEXT);
  const [questions, setQuestions] = useState<GeneratedText>(EMPTY_TEXT);
  const [activeTab, setActiveTab] = useState<KitTab>("overview");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/resumes")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const items = json.data.map((r: { id: string; title: string }) => ({ id: r.id, title: r.title }));
          setResumes(items);
          if (items.length > 0) setSelectedResumeId(items[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const runAiAction = useCallback(async (action: string, input: string, context: string) => {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, input, context }),
    });
    return res.json();
  }, []);

  const generateOne = useCallback(
    async (setter: (v: GeneratedText) => void, action: string, input: string, context: string): Promise<string> => {
      setter({ status: "loading", text: "" });
      try {
        const json = await runAiAction(action, input, context);
        if (json.success && json.output) {
          setter({ status: "done", text: json.output });
          return json.output;
        } else {
          setter({ status: "error", text: "", error: json.error || "Generation failed" });
          return "";
        }
      } catch {
        setter({ status: "error", text: "", error: "Something went wrong. Please try again." });
        return "";
      }
    },
    [runAiAction]
  );

  async function handleGenerate() {
    if (source === "upload" ? !file : !selectedResumeId) {
      setError(
        source === "upload"
          ? "Upload a resume file first."
          : "Select a resume and paste a job description first."
      );
      return;
    }
    if (!jd.trim()) {
      setError("Paste a job description first.");
      return;
    }
    setError("");
    setGenerating(true);
    setActiveTab("overview");
    setGeneratedFrom(source);

    // Reset outputs
    setAnalysis(null);
    setCover(EMPTY_TEXT);
    setEmail(EMPTY_TEXT);
    setEmailAnalysis(EMPTY_TEXT);
    setLinkedin(EMPTY_TEXT);
    setLinkedinAnalysis(EMPTY_TEXT);
    setKeywordResume(EMPTY_TEXT);
    setCoverAnalysis(EMPTY_TEXT);
    setSkills(EMPTY_TEXT);
    setQuestions(EMPTY_TEXT);

    try {
      let resumeContext: string;
      const jdForm = new FormData();
      jdForm.append("jd", jd);

      if (source === "upload" && file) {
        // 1a. Uploaded resume — parse it to text in memory (no DB write, no
        //     saved-resume plan limit) and reuse that text everywhere below.
        const parseForm = new FormData();
        parseForm.append("file", file);
        const analyzeRes = await fetch("/api/resume-analyze", { method: "POST", body: parseForm });
        const analyzeJson = await analyzeRes.json();
        if (!analyzeJson.success || !analyzeJson.data?.parsed?.text) {
          throw new Error(analyzeJson.error || "Could not read the uploaded resume.");
        }
        resumeContext = analyzeJson.data.parsed.text;
        jdForm.append("resumeText", resumeContext);
      } else {
        // 1b. Saved resume — point the analyzer at the resume id and load the
        //     full resume for the AI context.
        jdForm.append("resumeId", selectedResumeId);
        const resumeRes = await fetch(`/api/resumes/${selectedResumeId}`);
        const resumeJson = await resumeRes.json();
        if (!resumeJson.success || !resumeJson.data) {
          throw new Error("Could not load the selected resume.");
        }
        resumeContext = JSON.stringify(resumeJson.data);
      }

      // 2. Deterministic JD analysis (skill gaps, keywords, match %)
      const jdRes = await fetch("/api/analyze-jd", { method: "POST", body: jdForm });
      const jdJson = await jdRes.json();
      if (jdJson.success) setAnalysis(jdJson.data);

      // 3. Cap the AI context (the /api/ai route allows 30k chars)
      if (resumeContext.length > UPLOAD_CONTEXT_MAX) {
        resumeContext = resumeContext.slice(0, UPLOAD_CONTEXT_MAX);
      }
      const input = `Company: ${companyName || "the hiring team"}\n\nJob Description: ${jd}`;

      // 3. Fire all six text generators in parallel
      const [coverOut, emailOut, linkedinOut, keywordOut] = await Promise.all([
        generateOne(setCover, "cover-letter", input, resumeContext),
        generateOne(setEmail, "recruiter-email", input, resumeContext),
        generateOne(setLinkedin, "linkedin-message", input, resumeContext),
        generateOne(setKeywordResume, "ats-keyword-optimization", input, resumeContext),
        generateOne(setSkills, "targeted-skills", input, resumeContext),
        generateOne(setQuestions, "interview-questions", input, resumeContext),
      ]);

      // 4. Clean the cover letter (strip prefixes and any appended analysis)
      //    and strip the keyword optimizer's trailing note.
      if (coverOut) {
        const { content, analysis: letterAnalysis } = splitAtAnalysisMarker(coverOut);
        const letter = content
          .replace(/^(?:here'?s|here is)\s+(?:your\s+)?(?:the\s+)?cover letter:?\s*/i, "")
          .trim();
        setCover({ status: "done", text: letter });
        if (letterAnalysis) setCoverAnalysis({ status: "done", text: letterAnalysis });
      }
      if (keywordOut) {
        setKeywordResume({ status: "done", text: cleanResumeRewrite(keywordOut) });
      }
      if (emailOut) {
        const { content, analysis: emailAnalysisOut } = splitAtAnalysisMarker(emailOut);
        setEmail({ status: "done", text: content });
        if (emailAnalysisOut) setEmailAnalysis({ status: "done", text: emailAnalysisOut });
      }
      if (linkedinOut) {
        const { content, analysis: linkedinAnalysisOut } = splitAtAnalysisMarker(linkedinOut);
        setLinkedin({ status: "done", text: content });
        if (linkedinAnalysisOut) setLinkedinAnalysis({ status: "done", text: linkedinAnalysisOut });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (authLoading) {
    return (
      <DashboardLayout>
        <Preloader />
      </DashboardLayout>
    );
  }

  const textOutputs: { key: KitTab; label: string; value: GeneratedText }[] = [
    { key: "cover", label: "Cover Letter", value: cover },
    { key: "analysis", label: "Cover Letter Analysis", value: coverAnalysis },
    { key: "email", label: "Recruiter Email", value: email },
    { key: "email-analysis", label: "Email Analysis", value: emailAnalysis },
    { key: "linkedin", label: "LinkedIn Message", value: linkedin },
    { key: "linkedin-analysis", label: "LinkedIn Analysis", value: linkedinAnalysis },
    { key: "keyword", label: "ATS Keyword Resume", value: keywordResume },
    { key: "skills", label: "Targeted Skills", value: skills },
    { key: "questions", label: "Interview Questions", value: questions },
  ];
  const activeText = textOutputs.find((t) => t.key === activeTab);

  return (
    <DashboardLayout>
      <div className="max-w-[960px] mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="white" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </div>
            <h1 className="text-h1 text-black">Application Kit</h1>
          </div>
          <p className="text-body text-gray-500">
            Paste a job description once — get an ATS keyword-optimized resume, resume tips, targeted skills section, cover letter, recruiter email, LinkedIn message, interview questions, and skill gaps in one workflow.
          </p>
        </div>

        {/* Input card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-8">
          {/* Resume source: saved resume or freshly uploaded file */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={source === "saved" ? "accent" : "secondary"}
              size="sm"
              onClick={() => setSource("saved")}
              className="rounded-lg"
            >
              <FolderGit2 className="w-4 h-4 mr-1.5" /> My Resumes
            </Button>
            <Button
              variant={source === "upload" ? "accent" : "secondary"}
              size="sm"
              onClick={() => setSource("upload")}
              className="rounded-lg"
            >
              <FileText className="w-4 h-4 mr-1.5" /> Upload Resume
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Resume
              </label>
              {source === "saved" ? (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                >
                  {resumes.length === 0 && <option value="">No resumes yet</option>}
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg px-3 py-2.5 cursor-pointer hover:border-accent-400 hover:bg-accent-50/30 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5 min-w-0">
                        <FileText className="w-4 h-4 text-accent-500 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </span>
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-gray-400 hover:text-red-600 shrink-0"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      Upload your resume (.pdf, .docx, .txt)
                    </span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Company (optional)
              </label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Job Description
            </label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description here..."
              className="w-full h-44 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
            />
          </div>

          {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={generating || (source === "saved" && resumes.length === 0)}
              className="rounded-lg"
            >
              {generating ? <Spinner /> : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5 inline"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                  Generate Application Kit
                </>
              )}
            </Button>
            {generating && (
              <span className="text-xs text-gray-400 animate-pulse">
                Analyzing job + writing your materials…
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        {(analysis || textOutputs.some((t) => t.value.status !== "idle")) && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-0 border-b border-gray-200 px-4 overflow-x-auto">
              {TAB_DEFS.map((tab) => {
                const item = textOutputs.find((t) => t.key === tab.key);
                const isBusy = item?.value.status === "loading";
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "px-4 py-3.5 text-[13px] font-medium border-b-2 transition-all shrink-0",
                      activeTab === tab.key
                        ? "border-accent-500 text-accent-700"
                        : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                    )}
                  >
                    <span className="mr-1.5">{tab.emoji}</span>
                    {tab.label}
                    {isBusy && <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-accent-500 animate-pulse" />}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {/* Overview tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {analysis && (
                    <>
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
                            <circle cx="56" cy="56" r="48" fill="none" stroke="#e5e7eb" strokeWidth="9" />
                            <circle
                              cx="56" cy="56" r="48" fill="none"
                              stroke={analysis.matchPercentage >= 70 ? "#16a34a" : analysis.matchPercentage >= 40 ? "#d97706" : "#ef4444"}
                              strokeWidth="9" strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 48}
                              strokeDashoffset={2 * Math.PI * 48 * (1 - analysis.matchPercentage / 100)}
                              className="transition-all duration-700"
                            />
                          </svg>
                          <span className="text-2xl font-bold text-gray-900">{analysis.matchPercentage}%</span>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900 mb-1">
                            {analysis.matchPercentage >= 70 ? "Strong Match" : analysis.matchPercentage >= 40 ? "Moderate Match" : "Low Match"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {analysis.matchedKeywords.length} of {analysis.totalJdKeywords} keywords matched
                          </p>
                          {analysis.experienceGap && (
                            <p className="text-xs text-amber-600 mt-1.5 max-w-md">{analysis.experienceGap}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border border-gray-200 rounded-xl p-4">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Skill Gaps</p>
                          <p className="text-xl font-bold text-gray-900">{analysis.missingSkills.length}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {analysis.missingSkills.slice(0, 6).map((s, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 text-[10px]">{s}</span>
                            ))}
                            {analysis.missingSkills.length === 0 && <span className="text-[11px] text-green-600">None — great match!</span>}
                          </div>
                        </div>
                        <div className="border border-gray-200 rounded-xl p-4">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Missing Keywords</p>
                          <p className="text-xl font-bold text-gray-900">{analysis.missingKeywords.length}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {analysis.missingKeywords.slice(0, 6).map((k, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">{k}</span>
                            ))}
                            {analysis.missingKeywords.length === 0 && <span className="text-[11px] text-green-600">All keywords covered!</span>}
                          </div>
                        </div>
                        <div className="border border-gray-200 rounded-xl p-4">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Missing Tools</p>
                          <p className="text-xl font-bold text-gray-900">{analysis.missingTools.length}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {analysis.missingTools.slice(0, 6).map((t, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 text-[10px]">{t}</span>
                            ))}
                            {analysis.missingTools.length === 0 && <span className="text-[11px] text-green-600">All tools covered!</span>}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {textOutputs.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={cn(
                          "text-left p-4 rounded-xl border transition-all",
                          t.value.status === "done" ? "border-green-200 bg-green-50/40 hover:border-green-300" :
                          t.value.status === "error" ? "border-red-200 bg-red-50/40 hover:border-red-300" :
                          t.value.status === "loading" ? "border-accent-200 bg-accent-50/40 animate-pulse" :
                          "border-gray-200 bg-white hover:border-gray-300"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-900">{t.label}</span>
                          {t.value.status === "done" && (
                            <span className="text-[10px] font-bold text-green-600 uppercase">✓ Ready</span>
                          )}
                          {t.value.status === "error" && (
                            <span className="text-[10px] font-bold text-red-600 uppercase">Failed</span>
                          )}
                          {t.value.status === "loading" && (
                            <span className="text-[10px] font-bold text-accent-600 uppercase">Writing…</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {t.value.status === "done" ? `${t.value.text.length.toLocaleString()} chars — click to view & copy` :
                           t.value.status === "error" ? (t.value.error || "Failed") :
                           t.value.status === "loading" ? "Generating with AI…" : "Not generated yet"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume tab */}
              {activeTab === "resume" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 max-w-2xl">
                    Open your resume in the builder to apply the suggestions below, or use the ATS Check page to rewrite weak bullets in one click.
                  </p>
                  {analysis && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                          Keywords to add to your resume ({analysis.missingKeywords.length})
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.missingKeywords.map((k, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs">{k}</span>
                          ))}
                          {analysis.missingKeywords.length === 0 && <p className="text-xs text-green-600">All keywords covered!</p>}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                          Skills to strengthen ({analysis.missingSkills.length})
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.missingSkills.map((s, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs">{s}</span>
                          ))}
                          {analysis.missingSkills.length === 0 && <p className="text-xs text-green-600">None — great match!</p>}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                          Tools worth adding ({analysis.missingTools.length})
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.missingTools.map((t, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 text-xs">{t}</span>
                          ))}
                          {analysis.missingTools.length === 0 && <p className="text-xs text-green-600">All tools covered!</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button variant="secondary" size="sm" className="rounded-lg" onClick={() => (window.location.href = "/ats-check")}>
                          Open ATS Check →
                        </Button>
                        {generatedFrom === "saved" && selectedResumeId && (
                          <Button variant="secondary" size="sm" className="rounded-lg" onClick={() => (window.location.href = `/builder/${selectedResumeId}`)}>
                            Open Resume Builder →
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text output tabs */}
              {activeText && activeTab !== "overview" && activeTab !== "resume" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-900">{activeText.label}</h2>
                    <CopyButton text={activeText.value.text} />
                  </div>

                  {activeText.value.status === "idle" && (
                    <p className="text-sm text-gray-400 py-8 text-center">Generate the kit to create this.</p>
                  )}
                  {activeText.value.status === "loading" && (
                    <div className="py-12 flex flex-col items-center gap-3">
                      <Spinner />
                      <p className="text-xs text-gray-400">Writing with AI…</p>
                    </div>
                  )}
                  {activeText.value.status === "error" && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                      {activeText.value.error}
                    </div>
                  )}
                  {activeText.value.status === "done" && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {activeText.value.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
