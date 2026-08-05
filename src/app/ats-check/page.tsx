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
  Plus,
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
  // One-click "apply missing keywords to resume" state.
  const [applySelected, setApplySelected] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [applyTargetId, setApplyTargetId] = useState("");
  // One-click "apply weak-bullet rewrites to resume" state.
  const [bulletSelected, setBulletSelected] = useState<string[]>([]);
  const [bulletsApplying, setBulletsApplying] = useState(false);
  const [bulletsMsg, setBulletsMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // One-click "apply all improvements" state.
  const [improving, setImproving] = useState(false);
  const [improveMsg, setImproveMsg] = useState<{ ok: boolean; text: string; detail: string[] } | null>(null);
  const [improveToggles, setImproveToggles] = useState({
    keywords: true,
    bullets: true,
    grammar: true,
  });
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
          if (list.length > 0) setApplyTargetId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  function canAnalyze() {
    if (mode === "resume") return selectedResumeId !== "";
    if (mode === "upload") return file !== null;
    return pastedText.trim().length >= 10;
  }

  async function handleAnalyze(keepReport = false) {
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
    if (!keepReport) setReport(null);
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
        const data = json.data as DeepAtsReport;
        setReport(data);
        setAiMeta(json.ai || { status: "heuristic" });
        // Default-select all missing keywords + weak bullet rewrites.
        setApplySelected(data.missingKeywords ?? []);
        setApplyMsg(null);
        setBulletSelected((data.bullets?.weak ?? []).map((w) => w.bullet));
        setBulletsMsg(null);
        // Fresh report = fresh apply-all toggles (disable what's already clean).
        setImproveToggles({
          keywords: (data.missingKeywords ?? []).length > 0,
          bullets: (data.bullets?.weak ?? []).length > 0,
          grammar: (data.grammarIssues ?? []).length > 0,
        });
        setImproveMsg(null);
        if (!applyTargetId && selectedResumeId) setApplyTargetId(selectedResumeId);
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

  function toggleApplyKeyword(kw: string) {
    setApplySelected((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
    setApplyMsg(null);
  }

  // The analyzed resume is the target in "My Resumes" mode; in upload/paste
  // modes the user picks which of their resumes to enrich.
  async function handleApplyToResume() {
    const targetId = mode === "resume" ? selectedResumeId : applyTargetId;
    if (!targetId || applySelected.length === 0) {
      setApplyMsg({ ok: false, text: "Select a resume and at least one keyword first." });
      return;
    }
    setApplying(true);
    setApplyMsg(null);
    try {
      const res = await fetch(`/api/resumes/${targetId}/add-keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: applySelected }),
      });
      const json = await res.json();
      if (json.success) {
        setApplyMsg({
          ok: true,
          text: json.added?.length
            ? `Added ${json.added.length} keyword${json.added.length === 1 ? "" : "s"} to the resume.`
            : json.message || "All selected keywords are already on the resume.",
        });
      } else {
        setApplyMsg({ ok: false, text: json.error || "Failed to update resume." });
      }
    } catch {
      setApplyMsg({ ok: false, text: "Something went wrong. Please try again." });
    } finally {
      setApplying(false);
    }
  }

  function toggleApplyBullet(bullet: string) {
    setBulletSelected((prev) =>
      prev.includes(bullet) ? prev.filter((b) => b !== bullet) : [...prev, bullet]
    );
    setBulletsMsg(null);
  }

  // Sends the selected { original, rewrite } pairs to the apply-bullets endpoint.
  async function handleApplyBullets() {
    const targetId = mode === "resume" ? selectedResumeId : applyTargetId;
    if (!targetId || bulletSelected.length === 0) {
      setBulletsMsg({ ok: false, text: "Select a resume and at least one rewrite first." });
      return;
    }
    const weak = report?.bullets?.weak || [];
    const pairs = weak
      .filter((w) => bulletSelected.includes(w.bullet))
      .map((w) => ({ original: w.bullet, rewrite: w.rewrite }));
    if (pairs.length === 0) {
      setBulletsMsg({ ok: false, text: "None of the selected items have a rewrite to apply." });
      return;
    }
    setBulletsApplying(true);
    setBulletsMsg(null);
    try {
      const res = await fetch(`/api/resumes/${targetId}/apply-bullets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullets: pairs }),
      });
      const json = await res.json();
      if (json.success) {
        const n = json.applied?.length ?? 0;
        setBulletsMsg({
          ok: n > 0,
          text: n > 0
            ? `Rewrote ${n} bullet${n === 1 ? "" : "s"} on the resume.`
            : json.message || "None of the rewrites could be applied.",
        });
        if (n > 0) setBulletSelected([]);
      } else {
        setBulletsMsg({ ok: false, text: json.error || "Failed to update resume." });
      }
    } catch {
      setBulletsMsg({ ok: false, text: "Something went wrong. Please try again." });
    } finally {
      setBulletsApplying(false);
    }
  }

  // Runs the enabled improvement actions in sequence against the target resume.
  async function handleApplyImprovements() {
    const targetId = mode === "resume" ? selectedResumeId : applyTargetId;
    const anyOn = improveToggles.keywords || improveToggles.bullets || improveToggles.grammar;
    if (!targetId || !anyOn || !report) {
      setImproveMsg({
        ok: false,
        text: "Select a resume and at least one improvement type first.",
        detail: [],
      });
      return;
    }
    setImproving(true);
    setImproveMsg(null);
    const detail: string[] = [];
    let allOk = true;
    try {
      if (improveToggles.keywords && report.missingKeywords.length > 0) {
        const res = await fetch(`/api/resumes/${targetId}/add-keywords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: report.missingKeywords }),
        });
        const json = await res.json();
        if (json.success) {
          detail.push(`Keywords: added ${json.added?.length ?? 0}`);
        } else {
          allOk = false;
          detail.push(`Keywords: ${json.error || "failed"}`);
        }
      }

      if (improveToggles.bullets && report.bullets.weak.length > 0) {
        // Only include prose rewrites — deterministic heuristic rewrites contain
        // placeholder instructions ("…, cutting load time by 38%") that would be
        // written verbatim into the resume. Those are best applied individually.
        const pairs = report.bullets.weak
          .filter((w) => !/…|e\.g\.|\(\+|add a metric/i.test(w.rewrite))
          .map((w) => ({ original: w.bullet, rewrite: w.rewrite }));
        if (pairs.length > 0) {
          const res = await fetch(`/api/resumes/${targetId}/apply-bullets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bullets: pairs }),
          });
          const json = await res.json();
          if (json.success) {
            detail.push(`Bullets: rewrote ${json.applied?.length ?? 0}`);
          } else {
            allOk = false;
            detail.push(`Bullets: ${json.error || "failed"}`);
          }
        }
      }

      if (improveToggles.grammar) {
        const res = await fetch(`/api/resumes/${targetId}/apply-grammar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (json.success) {
          detail.push(`Grammar: fixed ${json.changes?.length ?? 0}`);
        } else {
          allOk = false;
          detail.push(`Grammar: ${json.error || "failed"}`);
        }
      }

      const done = detail.length > 0;
      setImproveMsg({
        ok: done && allOk,
        text: done
          ? allOk
            ? "Improvements applied to your resume."
            : "Some improvements couldn't be applied — see details below."
          : "Nothing to apply — this resume already passes those checks.",
        detail,
      });
    } catch {
      setImproveMsg({ ok: false, text: "Something went wrong. Please try again.", detail });
    } finally {
      setImproving(false);
    }
  }

  // Items the auto-fixer deliberately does NOT touch (needs human input).
  const manualItems: string[] = [];
  if (report) {
    if (!report.detected.includes("LinkedIn")) manualItems.push("Add your LinkedIn profile URL");
    if (!report.detected.includes("Phone")) manualItems.push("Add your phone number");
    if (report.formattingIssues.some((f) => f.includes("dates"))) {
      manualItems.push("Add years to every role, project, and degree");
    }
    if (report.formattingIssues.some((f) => f.includes("short") || f.includes("long"))) {
      manualItems.push("Adjust resume length toward 400–600 words");
    }
    if (report.topImprovements.some((t) => t.text.toLowerCase().includes("quantify") || t.text.toLowerCase().includes("measurable"))) {
      manualItems.push("Quantify achievements with metrics (% , $, users)");
    }
    if (report.repetition.some((r) => r.count > 3)) {
      manualItems.push("Trim repeated buzzwords for natural, varied phrasing");
    }
    if (report.formattingIssues.some((f) => f.includes("bullet"))) {
      manualItems.push("Convert experience paragraphs into scannable bullet points");
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
                      <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <h3 className="text-sm font-bold text-gray-900">Missing Keywords ({report.missingKeywords.length})</h3>
                          {resumes.length > 0 && (
                            <button
                              onClick={() => setApplySelected([...report.missingKeywords])}
                              className="text-[11px] font-semibold text-accent-600 hover:text-accent-700 hover:underline"
                            >
                              Select all
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {report.missingKeywords.map((k, i) => {
                            const selected = applySelected.includes(k);
                            return (
                              <button
                                key={i}
                                onClick={() => toggleApplyKeyword(k)}
                                className={cn(
                                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                                  selected
                                    ? "bg-accent-500 text-white border-accent-500 shadow-sm"
                                    : "bg-white text-gray-500 border-gray-300 hover:border-accent-400 hover:text-accent-600"
                                )}
                              >
                                {selected ? <Check className="w-3 h-3" strokeWidth={3} /> : <Plus className="w-3 h-3" strokeWidth={3} />} {k}
                              </button>
                            );
                          })}
                        </div>

                        {/* One-click apply */}
                        {resumes.length === 0 && (
                          <p className="text-[11px] text-gray-500 mt-3">
                            Create a resume from the{" "}
                            <a href="/templates" className="text-accent-600 font-semibold hover:underline">Templates</a>{" "}
                            page to apply these keywords in one click.
                          </p>
                        )}
                        {resumes.length > 0 && applySelected.length > 0 && (
                          <div className="mt-4 rounded-xl bg-white border border-gray-200 p-3">
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                              {mode !== "resume" ? (
                                <div className="flex-1 w-full sm:w-auto">
                                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Apply to</label>
                                  <select
                                    value={applyTargetId}
                                    onChange={(e) => setApplyTargetId(e.target.value)}
                                    className="h-9 w-full sm:w-64 rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-900 outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                                  >
                                    {resumes.map((r) => (
                                      <option key={r.id} value={r.id}>{r.title}</option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <p className="text-[11px] text-gray-500 flex-1">
                                  Will be added to <span className="font-semibold text-gray-800">{resumes.find((r) => r.id === selectedResumeId)?.title || "the selected resume"}</span>.
                                </p>
                              )}
                              <Button
                                variant="accent"
                                size="sm"
                                className="rounded-lg inline-flex items-center gap-1.5"
                                onClick={handleApplyToResume}
                                disabled={applying}
                              >
                                {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                                {applying ? "Applying…" : `Apply ${applySelected.length} to resume`}
                              </Button>
                            </div>
                            {applyMsg && (
                              <p className={cn("text-[11px] mt-2 flex items-center gap-1", applyMsg.ok ? "text-green-600" : "text-red-600")}>
                                {applyMsg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                {applyMsg.text}
                                {applyMsg.ok && (
                                  <button
                                    onClick={() => handleAnalyze(true)}
                                    className="ml-1 font-semibold text-accent-600 hover:text-accent-700 hover:underline"
                                  >
                                    Re-check my score →
                                  </button>
                                )}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1.5">Missing keywords are added to your Skills section (deduplicated). Re-check to see your updated score.</p>
                          </div>
                        )}
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
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <h3 className="text-sm font-bold text-gray-900">
                            Weak bullets
                            {resumes.length > 0 && (
                              <span className="text-xs font-normal text-gray-400 ml-2">
                                tap a card to include its rewrite
                              </span>
                            )}
                          </h3>
                          {resumes.length > 0 && (
                            <button
                              onClick={() => setBulletSelected(report.bullets.weak.map((w) => w.bullet))}
                              className="text-[11px] font-semibold text-accent-600 hover:text-accent-700 hover:underline"
                            >
                              Select all
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {report.bullets.weak.map((w, i) => {
                            const selected = bulletSelected.includes(w.bullet);
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => toggleApplyBullet(w.bullet)}
                                className={cn(
                                  "w-full text-left rounded-xl border p-4 transition-all",
                                  selected
                                    ? "border-accent-400 bg-accent-50/40 shadow-sm"
                                    : "border-amber-200 bg-amber-50/40 hover:border-amber-300"
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <span
                                    className={cn(
                                      "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                      selected
                                        ? "bg-accent-500 border-accent-500 text-white"
                                        : "bg-white border-gray-300"
                                    )}
                                  >
                                    {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                                  </span>
                                  <div className="flex-1 min-w-0">
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
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* One-click apply rewrites */}
                        {resumes.length === 0 && (
                          <p className="text-[11px] text-gray-500 mt-4">
                            Create a resume from the{" "}
                            <a href="/templates" className="text-accent-600 font-semibold hover:underline">Templates</a>{" "}
                            page to apply these rewrites in one click.
                          </p>
                        )}
                        {resumes.length > 0 && bulletSelected.length > 0 && (
                          <div className="mt-4 rounded-xl bg-white border border-gray-200 p-3">
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                              {mode !== "resume" ? (
                                <div className="flex-1 w-full sm:w-auto">
                                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Apply to</label>
                                  <select
                                    value={applyTargetId}
                                    onChange={(e) => setApplyTargetId(e.target.value)}
                                    className="h-9 w-full sm:w-64 rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-900 outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                                  >
                                    {resumes.map((r) => (
                                      <option key={r.id} value={r.id}>{r.title}</option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <p className="text-[11px] text-gray-500 flex-1">
                                  Rewrites will replace matching bullets on{" "}
                                  <span className="font-semibold text-gray-800">{resumes.find((r) => r.id === selectedResumeId)?.title || "the selected resume"}</span>.
                                </p>
                              )}
                              <Button
                                variant="accent"
                                size="sm"
                                className="rounded-lg inline-flex items-center gap-1.5"
                                onClick={handleApplyBullets}
                                disabled={bulletsApplying}
                              >
                                {bulletsApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                                {bulletsApplying ? "Applying…" : `Apply ${bulletSelected.length} to resume`}
                              </Button>
                            </div>
                            {bulletsMsg && (
                              <p className={cn("text-[11px] mt-2 flex items-center gap-1", bulletsMsg.ok ? "text-green-600" : "text-red-600")}>
                                {bulletsMsg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                {bulletsMsg.text}
                                {bulletsMsg.ok && (
                                  <button
                                    onClick={() => handleAnalyze(true)}
                                    className="ml-1 font-semibold text-accent-600 hover:text-accent-700 hover:underline"
                                  >
                                    Re-check my score →
                                  </button>
                                )}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1.5">Each rewrite replaces the matching bullet in your Experience section. Re-check to see your updated score.</p>
                          </div>
                        )}
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
                  <div className="space-y-6">
                    {/* One-click apply-all card */}
                    <div className="rounded-xl border border-accent-200 bg-accent-50/40 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Wand2 className="w-4 h-4 text-accent-600" />
                        <h3 className="text-sm font-bold text-gray-900">Apply top improvements in one click</h3>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-3">
                        Automatically adds missing keywords, rewrites weak bullets, and applies safe grammar/style fixes to your resume.
                      </p>

                      {/* Toggles */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {([
                          { key: "keywords" as const, label: `Missing keywords (${report.missingKeywords.length})`, disabled: report.missingKeywords.length === 0 },
                          { key: "bullets" as const, label: `Weak bullet rewrites (${report.bullets.weak.length})`, disabled: report.bullets.weak.length === 0 },
                          { key: "grammar" as const, label: "Grammar & style fixes", disabled: report.grammarIssues.length === 0 },
                        ]).map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            disabled={t.disabled}
                            onClick={() =>
                              setImproveToggles((prev) => ({
                                ...prev,
                                [t.key]: !prev[t.key],
                              }))
                            }
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                              improveToggles[t.key] && !t.disabled
                                ? "bg-accent-500 text-white border-accent-500 shadow-sm"
                                : "bg-white text-gray-500 border-gray-300",
                              t.disabled && "opacity-40 cursor-not-allowed"
                            )}
                          >
                            <span className={cn(
                              "w-3.5 h-3.5 rounded border flex items-center justify-center",
                              improveToggles[t.key] && !t.disabled ? "bg-white border-white" : "border-gray-400"
                            )}>
                              {improveToggles[t.key] && !t.disabled && <Check className="w-2.5 h-2.5 text-accent-600" strokeWidth={4} />}
                            </span>
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {resumes.length === 0 ? (
                        <p className="text-[11px] text-gray-500">
                          Create a resume from the{" "}
                          <a href="/templates" className="text-accent-600 font-semibold hover:underline">Templates</a>{" "}
                          page to apply improvements in one click.
                        </p>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                          {mode !== "resume" ? (
                            <div className="flex-1 w-full sm:w-auto">
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Apply to</label>
                              <select
                                value={applyTargetId}
                                onChange={(e) => setApplyTargetId(e.target.value)}
                                className="h-9 w-full sm:w-64 rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-900 outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                              >
                                {resumes.map((r) => (
                                  <option key={r.id} value={r.id}>{r.title}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-500 flex-1">
                              Applied to <span className="font-semibold text-gray-800">{resumes.find((r) => r.id === selectedResumeId)?.title || "the selected resume"}</span>.
                            </p>
                          )}
                          <Button
                            variant="accent"
                            size="sm"
                            className="rounded-lg inline-flex items-center gap-1.5"
                            onClick={handleApplyImprovements}
                            disabled={improving}
                          >
                            {improving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                            {improving ? "Applying…" : "Apply improvements"}
                          </Button>
                        </div>
                      )}

                      {improveMsg && (
                        <div className={cn("mt-3 rounded-xl border p-3 text-[11px]", improveMsg.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-100 text-red-700")}>
                          <p className="font-semibold flex items-center gap-1.5">
                            {improveMsg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            {improveMsg.text}
                            {improveMsg.ok && (
                              <button
                                onClick={() => handleAnalyze(true)}
                                className="ml-1 font-semibold text-accent-600 hover:text-accent-700 hover:underline"
                              >
                                Re-check my score →
                              </button>
                            )}
                          </p>
                          {improveMsg.detail.length > 0 && (
                            <ul className="mt-2 space-y-0.5">
                              {improveMsg.detail.map((d, i) => (
                                <li key={i} className="flex items-center gap-1">• {d}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Manual checklist */}
                    {manualItems.length > 0 && (
                      <div className="rounded-xl border border-gray-200 p-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">Still needs your input</h3>
                        <p className="text-[11px] text-gray-400 mb-3">
                          These improvements need your judgment — the one-click fixer won't invent facts for you.
                        </p>
                        <ul className="space-y-1.5">
                          {manualItems.map((m, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

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
