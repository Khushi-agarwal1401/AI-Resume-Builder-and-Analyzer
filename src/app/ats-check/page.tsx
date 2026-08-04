"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  Target,
  FileText,
  Sparkles,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Wand2,
  Gauge,
  CheckCircle2,
  PenLine,
  FolderGit2,
} from "lucide-react";
import type { DeepAtsReport } from "@/services/resume-analyzer/deep-ats";

type InputMode = "resume" | "upload" | "paste";
type ReportTab = "overview" | "keywords" | "bullets" | "formatting" | "improvements";

interface ResumeOption {
  id: string;
  title: string;
  template: string;
}

const CATEGORIES = [
  { value: "student", label: "Student" },
  { value: "fresher", label: "Fresher" },
  { value: "experienced", label: "Experienced" },
  { value: "internship", label: "Internship" },
];

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width="150" height="150" className="transform -rotate-90">
          <circle cx="75" cy="75" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="75" cy="75" r={radius} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-4xl font-extrabold" style={{ color }}>{value}</div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{label}</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: "green" | "amber" | "red" | "indigo" }) {
  const tones = {
    green: "text-green-600",
    amber: "text-amber-600",
    red: "text-red-500",
    indigo: "text-indigo-600",
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
      <p className={cn("text-2xl font-extrabold", tones[tone])}>{value}</p>
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mt-1">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone: "green" | "red" | "gray" | "indigo" | "amber" }) {
  const tones = {
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border", tones[tone])}>
      {children}
    </span>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all",
        active ? "border-accent-500 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
      )}
    >
      {label}
    </button>
  );
}

export default function AtsCheckPage() {
  const { loading: authLoading } = useAuth();
  const [mode, setMode] = useState<InputMode>("resume");

  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [category, setCategory] = useState("experienced");

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DeepAtsReport | null>(null);
  const [aiMeta, setAiMeta] = useState<{
    status: "ai" | "heuristic";
    semanticMatch?: number;
    keywordMatch?: number;
    keywordDensityNote?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/resumes")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const list: ResumeOption[] = json.data.map((r: { id: string; title: string; template: string }) => ({
            id: r.id,
            title: r.title,
            template: r.template || "",
          }));
          setResumes(list);

          // Deep-link support: /ats-check?resume=<id> preselects that resume
          // (used by the dashboard ATS card) and switches to the My Resumes mode.
          const preset = new URLSearchParams(window.location.search).get("resume");
          const preselectId =
            preset && list.some((r) => r.id === preset) ? preset : list[0]?.id || "";
          if (preselectId) {
            setSelectedResumeId(preselectId);
            if (preset && list.some((r) => r.id === preset)) setMode("resume");
          }
        }
      })
      .catch(() => {});
  }, []);

  function canAnalyze() {
    if (mode === "resume") return selectedResumeId !== "";
    if (mode === "upload") return file !== null;
    return pastedText.trim().length >= 10;
  }

  async function handleAnalyze() {
    if (!canAnalyze()) {
      setError(
        mode === "resume"
          ? "Select a resume to check."
          : mode === "upload"
          ? "Upload a resume file first."
          : "Paste at least 10 characters of resume text."
      );
      return;
    }
    setError(null);
    setReport(null);
    setAnalyzing(true);

    try {
      const fields: Record<string, string> = {
        jobTitle,
        jobDescription,
        category,
      };

      let res: Response;
      if (mode === "upload" && file) {
        const body = new FormData();
        body.append("file", file);
        for (const [k, v] of Object.entries(fields)) if (v) body.append(k, v);
        res = await fetch("/api/ats-analyze", { method: "POST", body });
      } else {
        const body: Record<string, string> = { ...fields };
        if (mode === "resume") body.resumeId = selectedResumeId;
        else body.text = pastedText;
        res = await fetch("/api/ats-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const json = await res.json();
      if (json.success && json.data) {
        setReport(json.data as DeepAtsReport);
        setAiMeta(json.ai || { status: "heuristic" });
        setActiveTab("overview");
      } else {
        setError(json.error || "Analysis failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  const scoreTone = (s: number) => (s >= 70 ? "#16a34a" : s >= 45 ? "#d97706" : "#ef4444");

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1080px] mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-md">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">ATS Resume Check</h1>
              <p className="text-sm text-gray-500">Upload a resume or analyze one you built — get an ATS score plus AI improvement tips.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Chip tone="indigo"><Sparkles className="w-3 h-3" /> Works with or without a job description</Chip>
            <Chip tone="green"><CheckCircle2 className="w-3 h-3" /> Scans headings, keywords &amp; formatting</Chip>
            <Chip tone="amber"><Wand2 className="w-3 h-3" /> AI rewrites weak bullets &amp; ranks improvements</Chip>
          </div>
        </div>

        {/* Input card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          {/* Source tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {([
              { id: "resume", label: "My Resumes", icon: FolderGit2 },
              { id: "upload", label: "Upload File", icon: FileText },
              { id: "paste", label: "Paste Text", icon: PenLine },
            ] as { id: InputMode; label: string; icon: typeof FileText }[]).map((t) => (
              <Button
                key={t.id}
                variant={mode === t.id ? "accent" : "secondary"}
                size="sm"
                onClick={() => setMode(t.id)}
                className="rounded-xl"
              >
                <t.icon className="w-4 h-4 mr-1.5" /> {t.label}
              </Button>
            ))}
          </div>

          {mode === "resume" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Choose a resume you created</label>
              {resumes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                  You don't have any resumes yet. Create one from the{" "}
                  <a href="/templates" className="text-accent-600 font-semibold hover:underline">Templates</a> page first.
                </div>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={(e) => {
                    setSelectedResumeId(e.target.value);
                    const r = resumes.find((x) => x.id === e.target.value);
                    if (r?.template === "student") setCategory("student");
                  }}
                  className="h-11 w-full max-w-md rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {mode === "upload" && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-accent-400 hover:bg-accent-50/30 transition-colors"
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
                <div>
                  <FileText className="w-10 h-10 text-accent-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  <Button variant="secondary" size="sm" className="mt-3 rounded-xl" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div>
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Drop your resume here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">Supports .pdf, .docx, .txt</p>
                </div>
              )}
            </div>
          )}

          {mode === "paste" && (
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={8}
              placeholder="Paste your full resume text here…"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
            />
          )}

          {/* Optional job context */}
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Job Title (optional)</label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Job Description (optional)</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={3}
              placeholder="Paste the job description to get an exact keyword comparison…"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
            />
            <p className="text-[11px] text-gray-400 mt-2">
              Leave the job fields blank and we'll score your resume against its own headings and in-demand keywords — you still get a full ATS report.
            </p>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
            </div>
          )}

          <div className="mt-6">
            <Button variant="accent" size="lg" onClick={handleAnalyze} disabled={analyzing || !canAnalyze()} className="rounded-xl inline-flex items-center gap-2">
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              {analyzing ? "Analyzing…" : "Check ATS Score"}
            </Button>
          </div>
        </div>

        {/* Report */}
        {report && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Score hero */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Analysis Report</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {aiMeta?.status === "ai" ? "AI-powered deep analysis" : "Smart heuristic analysis (AI unavailable)"} ·{" "}
                    {report.keywordScan === "job-description" ? "scanned against job description" : "scanned by headings & in-demand keywords"}
                  </p>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold",
                  aiMeta?.status === "ai" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-gray-100 text-gray-600 border border-gray-200"
                )}>
                  {aiMeta?.status === "ai" ? <Wand2 className="w-3.5 h-3.5" /> : <Gauge className="w-3.5 h-3.5" />}
                  {aiMeta?.status === "ai" ? "AI Analysis" : "Heuristic"}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="flex flex-col items-center">
                  <ScoreRing value={report.atsScore} label="ATS Score" color={scoreTone(report.atsScore)} />
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm font-bold text-gray-700">Grade</span>
                    <span className={cn(
                      "text-lg font-extrabold",
                      report.grade.startsWith("A") ? "text-green-600" : report.grade.startsWith("B") ? "text-blue-600" : report.grade.startsWith("C") ? "text-amber-600" : "text-red-500"
                    )}>{report.grade}</span>
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-4 max-w-sm leading-relaxed">{report.verdict}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Recruiter Score" value={`${report.recruiterScore}`} sub={`Interview: ${report.interviewChance}`} tone={report.recruiterScore >= 70 ? "green" : report.recruiterScore >= 45 ? "amber" : "red"} />
                  <StatCard label="Hiring Probability" value={`${report.hiringProbability}%`} tone={report.hiringProbability >= 60 ? "green" : report.hiringProbability >= 35 ? "amber" : "red"} />
                  <StatCard label="Parser Confidence" value={`${report.parserConfidence}%`} tone={report.parserConfidence >= 75 ? "green" : report.parserConfidence >= 50 ? "amber" : "red"} />
                  <StatCard label="Keyword Density" value={`${report.densityScore}%`} tone={report.densityScore >= 75 ? "green" : report.densityScore >= 50 ? "amber" : "red"} />
                </div>
              </div>

              {aiMeta?.semanticMatch !== undefined || aiMeta?.keywordMatch !== undefined ? (
                <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
                  {aiMeta.keywordMatch !== undefined && (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">{aiMeta.keywordMatch}%</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">AI Keyword Match</p>
                    </div>
                  )}
                  {aiMeta.semanticMatch !== undefined && (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">{aiMeta.semanticMatch}%</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">AI Semantic Match</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Detail tabs */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="flex gap-0 border-b border-gray-200 px-6 overflow-x-auto">
                <TabButton label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
                <TabButton label="Keywords" active={activeTab === "keywords"} onClick={() => setActiveTab("keywords")} />
                <TabButton label="Bullets" active={activeTab === "bullets"} onClick={() => setActiveTab("bullets")} />
                <TabButton label="Formatting & Grammar" active={activeTab === "formatting"} onClick={() => setActiveTab("formatting")} />
                <TabButton label="Improvements" active={activeTab === "improvements"} onClick={() => setActiveTab("improvements")} />
              </div>

              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">ATS Parsing Simulation</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {report.detected.map((d) => <Chip key={d} tone="green"><Check className="w-3 h-3" strokeWidth={3} /> {d}</Chip>)}
                        {report.missing.map((m) => <Chip key={m} tone="red"><X className="w-3 h-3" strokeWidth={3} /> {m}</Chip>)}
                      </div>
                    </div>

                    {report.parserRiskFlags.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Parsing Risks</h3>
                        <div className="space-y-2">
                          {report.parserRiskFlags.map((f, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-3 gap-3">
                      {([
                        { label: "Bullets", value: `${report.bullets.strong}/${report.bullets.total} strong` },
                        { label: "Grammar", value: report.grammarIssues.length === 0 ? "Clean" : `${report.grammarIssues.length} issues` },
                        { label: "English Quality", value: `${report.englishScore}/100` },
                      ] as { label: string; value: string }[]).map((s) => (
                        <div key={s.label} className="rounded-xl border border-gray-200 p-4 text-center">
                          <p className="text-lg font-bold text-gray-900">{s.value}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "keywords" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">
                        Found Keywords ({report.foundKeywords.length})
                        <span className="text-xs font-normal text-gray-400 ml-2">
                          {report.keywordScan === "job-description" ? "from the job description" : "from in-demand skills"}
                        </span>
                      </h3>
                      {report.foundKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {report.foundKeywords.map((k, i) => <Chip key={i} tone="green"><Check className="w-3 h-3" strokeWidth={3} /> {k}</Chip>)}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No matching keywords found.</p>
                      )}
                    </div>

                    {report.missingKeywords.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Missing Keywords ({report.missingKeywords.length})</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {report.missingKeywords.map((k, i) => <Chip key={i} tone="red"><X className="w-3 h-3" strokeWidth={3} /> {k}</Chip>)}
                        </div>
                      </div>
                    )}

                    {aiMeta?.keywordDensityNote && (
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
                        <span className="font-semibold text-gray-800">Keyword density (AI): </span>{aiMeta.keywordDensityNote}
                      </div>
                    )}

                    {report.keywordDensity.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Keyword Density</h3>
                        <div className="space-y-2">
                          {report.keywordDensity.slice(0, 12).map((d) => (
                            <div key={d.term} className="flex items-center gap-3">
                              <span className="text-xs font-medium text-gray-700 w-32 truncate">{d.term}</span>
                              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", d.flagged ? "bg-amber-500" : "bg-green-500")}
                                  style={{ width: `${Math.min(100, d.count * 6)}%` }}
                                />
                              </div>
                              <span className={cn("text-xs font-bold w-8 text-right", d.flagged ? "text-amber-600" : "text-green-600")}>{d.count}x</span>
                              {d.flagged && <span className="text-[10px] text-amber-600 w-28 text-right">{d.recommended}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "bullets" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 text-center">
                        <p className="text-xl font-extrabold text-green-600">{report.bullets.strong}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Strong bullets</p>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center">
                        <p className="text-xl font-extrabold text-amber-600">{report.bullets.weak.length}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Weak bullets</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4 text-center">
                        <p className="text-xl font-extrabold text-gray-900">{report.bullets.total}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Total</p>
                      </div>
                    </div>

                    {report.bullets.weak.length > 0 ? (
                      <div className="space-y-3">
                        {report.bullets.weak.map((w, i) => (
                          <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                            <p className="text-xs text-gray-800"><span className="font-semibold text-amber-700">Original:</span> “{w.bullet}”</p>
                            <p className="text-[11px] text-gray-500 mt-1.5">{w.reason}</p>
                            <div className="mt-2 rounded-lg bg-white border border-amber-200 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-accent-600 mb-1">
                                {aiMeta?.status === "ai" ? <Wand2 className="w-3 h-3 inline mr-1" /> : null}
                                {aiMeta?.status === "ai" ? "AI rewrite" : "Improved version"}
                              </p>
                              <p className="text-xs text-gray-700">{w.rewrite}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
                        <CheckCircle2 className="w-5 h-5" /> All detected bullets use action verbs and measurable outcomes. Nice work!
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "formatting" && (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-gray-200 p-4 text-center">
                        <p className="text-xl font-extrabold text-gray-900">{report.grammarScore}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Grammar Score</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4 text-center">
                        <p className="text-xl font-extrabold text-gray-900">{report.englishScore}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Business English</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4 text-center">
                        <p className="text-xl font-extrabold text-gray-900">{report.avgSentenceLength}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Words / sentence</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Formatting Issues ({report.formattingIssues.length})</h3>
                      {report.formattingIssues.length > 0 ? (
                        <div className="space-y-2">
                          {report.formattingIssues.map((f, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                              <X className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2.5} /> <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-green-700">No formatting issues detected.</p>
                      )}
                    </div>

                    {report.repetition.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Repetition & Buzzwords</h3>
                        <div className="space-y-2">
                          {report.repetition.map((r, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span><span className="font-bold">“{r.term}”</span> ({r.count}x) — {r.suggestion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.grammarIssues.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Grammar & Style</h3>
                        <div className="space-y-1.5">
                          {report.grammarIssues.slice(0, 10).map((g, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 shrink-0" />
                              <span><span className="font-semibold text-gray-800">“{g.text}”</span> — {g.suggestion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "improvements" && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      Top Improvements
                      {aiMeta?.status === "ai" && <span className="ml-2 text-[11px] font-semibold text-indigo-600"><Wand2 className="w-3 h-3 inline mr-1" />ranked by AI</span>}
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">Ranked by estimated impact on your ATS and recruiter scores.</p>
                    <ol className="space-y-2">
                      {report.topImprovements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-accent-300 hover:bg-accent-50/30 transition-colors">
                          <span className="w-6 h-6 rounded-full bg-accent-100 text-accent-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 leading-relaxed">{imp.text}</p>
                          </div>
                          {imp.impact && (
                            <span className={cn(
                              "inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold shrink-0",
                              imp.impact.includes("Recruiter") ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-green-50 text-green-700 border border-green-200"
                            )}>
                              {imp.impact}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-500 leading-relaxed">
              {report.disclaimer}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
