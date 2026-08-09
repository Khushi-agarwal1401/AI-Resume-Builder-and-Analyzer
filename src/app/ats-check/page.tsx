"use client";
import Preloader from "@/components/ui/Preloader";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import {
  Target,
  FileText,
  Sparkles,
  Loader2,
  AlertTriangle,
  Wand2,
  Gauge,
  CheckCircle2,
  PenLine,
  FolderGit2,
} from "lucide-react";
import type { DeepAtsReport } from "@/services/resume-analyzer/deep-ats";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/features/ats-check/constants";
import { Chip, ScoreRing, StatCard, TabButton } from "@/features/ats-check/components";
import { OverviewTab } from "@/features/ats-check/OverviewTab";
import { KeywordsTab } from "@/features/ats-check/KeywordsTab";
import { BulletsTab } from "@/features/ats-check/BulletsTab";
import { FormattingTab } from "@/features/ats-check/FormattingTab";
import { ImprovementsTab } from "@/features/ats-check/ImprovementsTab";
import type {

  AiMeta,
  ApplyMessage,
  ImproveMessage,
  ImproveToggleKey,
  ImproveToggles,
  InputMode,
  ReportTab,
  ResumeOption,
} from "@/features/ats-check/types";

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
  const [applyMsg, setApplyMsg] = useState<ApplyMessage | null>(null);
  const [applyTargetId, setApplyTargetId] = useState("");
  // One-click "apply weak-bullet rewrites to resume" state.
  const [bulletSelected, setBulletSelected] = useState<string[]>([]);
  const [bulletsApplying, setBulletsApplying] = useState(false);
  const [bulletsMsg, setBulletsMsg] = useState<ApplyMessage | null>(null);
  // One-click "apply all improvements" state.
  const [improving, setImproving] = useState(false);
  const [improveMsg, setImproveMsg] = useState<ImproveMessage | null>(null);
  const [improveToggles, setImproveToggles] = useState<ImproveToggles>({
    keywords: true,
    bullets: true,
    grammar: true,
  });
  const [aiMeta, setAiMeta] = useState<AiMeta | null>(null);
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
        <Preloader />
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
            <Button variant="accent" size="lg" onClick={() => handleAnalyze()} disabled={analyzing || !canAnalyze()} className="rounded-xl inline-flex items-center gap-2">
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
                  <StatCard label="Recruiter Score" value={`${report.recruiterScore}`} sub={`Interview: ${report.interviewChance}`} progress={report.recruiterScore} tone={report.recruiterScore >= 70 ? "green" : report.recruiterScore >= 45 ? "amber" : "red"} />
                  <StatCard label="Hiring Probability" value={`${report.hiringProbability}%`} progress={report.hiringProbability} tone={report.hiringProbability >= 60 ? "green" : report.hiringProbability >= 35 ? "amber" : "red"} />
                  <StatCard label="Parser Confidence" value={`${report.parserConfidence}%`} progress={report.parserConfidence} tone={report.parserConfidence >= 75 ? "green" : report.parserConfidence >= 50 ? "amber" : "red"} />
                  <StatCard label="Keyword Density" value={`${report.densityScore}%`} progress={report.densityScore} tone={report.densityScore >= 75 ? "green" : report.densityScore >= 50 ? "amber" : "red"} />
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
                {activeTab === "overview" && <OverviewTab report={report} />}
                {activeTab === "keywords" && (
                  <KeywordsTab
                    report={report}
                    resumes={resumes}
                    mode={mode}
                    selectedResumeId={selectedResumeId}
                    applyTargetId={applyTargetId}
                    onApplyTargetChange={setApplyTargetId}
                    applySelected={applySelected}
                    onToggleKeyword={toggleApplyKeyword}
                    onSelectAll={() => setApplySelected([...report.missingKeywords])}
                    applying={applying}
                    applyMsg={applyMsg}
                    onApplyToResume={handleApplyToResume}
                    onRecheck={() => handleAnalyze(true)}
                    aiMeta={aiMeta}
                  />
                )}
                {activeTab === "bullets" && (
                  <BulletsTab
                    report={report}
                    resumes={resumes}
                    mode={mode}
                    selectedResumeId={selectedResumeId}
                    applyTargetId={applyTargetId}
                    onApplyTargetChange={setApplyTargetId}
                    bulletSelected={bulletSelected}
                    onToggleBullet={toggleApplyBullet}
                    onSelectAll={() => setBulletSelected(report.bullets.weak.map((w) => w.bullet))}
                    bulletsApplying={bulletsApplying}
                    bulletsMsg={bulletsMsg}
                    onApplyBullets={handleApplyBullets}
                    onRecheck={() => handleAnalyze(true)}
                    aiMeta={aiMeta}
                  />
                )}
                {activeTab === "formatting" && <FormattingTab report={report} />}
                {activeTab === "improvements" && (
                  <ImprovementsTab
                    report={report}
                    resumes={resumes}
                    mode={mode}
                    selectedResumeId={selectedResumeId}
                    applyTargetId={applyTargetId}
                    onApplyTargetChange={setApplyTargetId}
                    improveToggles={improveToggles}
                    onToggleImprove={(key: ImproveToggleKey) =>
                      setImproveToggles((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    improving={improving}
                    improveMsg={improveMsg}
                    onApplyImprovements={handleApplyImprovements}
                    onRecheck={() => handleAnalyze(true)}
                    aiMeta={aiMeta}
                    manualItems={manualItems}
                  />
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
