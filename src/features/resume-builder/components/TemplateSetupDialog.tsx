"use client";

import { useEffect, useMemo, useState } from "react";
import { X, PenLine, Sparkles, GitBranch, Check, Loader2, Star, FolderGit2, Link2, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import type { TargetLevel } from "@/types/resume";
import type { RepoCandidate } from "@/services/projects/suggest";
import type { LinkedInUrlImportResult } from "@/app/api/linkedin/import-url/route";

// ══════════════════════════════════════════════════════════════════════════
//  Types
// ══════════════════════════════════════════════════════════════════════════

interface ImportedRepo {
  id: number;
  name: string;
  description: string;
  url: string;
  language: string;
  stars: number;
}

interface Ranking {
  repo: string;
  score: number;
  reason: string;
}

/** AI/deterministic recommendation of the best template for the job. */
interface TemplateRec {
  templateId: string;
  name: string;
  score: number;
  reason: string;
  bullets: string[];
  atsScore: number;
  source: "ai" | "deterministic";
}

interface TemplateSetupDialogProps {
  open: boolean;
  onClose: () => void;
  template: { id: string; name: string };
  targetLevel?: TargetLevel;
  /** Called with the new resume id so the parent can navigate. */
  onCreated: (resumeId: string) => void;
}

// ══════════════════════════════════════════════════════════════════════════
//  LinkedIn import options
// ══════════════════════════════════════════════════════════════════════════

/** Sections the LinkedIn import can write into the resume, in display order. */
const LINKEDIN_SECTION_META: { key: string; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "education", label: "Education" },
  { key: "experience", label: "Experience" },
  { key: "skills", label: "Skills" },
  { key: "certifications", label: "Certifications" },
  { key: "languages", label: "Languages" },
];

/** Keys of the LinkedIn sections that actually have data in the fetched profile. */
function availableLinkedinSections(data: LinkedInUrlImportResult): string[] {
  const available: string[] = [];
  if (data.summary) available.push("summary");
  if (data.education?.length) available.push("education");
  if (data.experience?.length) available.push("experience");
  const skills = data.skills;
  if (skills?.technical?.length || skills?.soft?.length || skills?.tools?.length || skills?.frameworks?.length) {
    available.push("skills");
  }
  if (data.certifications?.length) available.push("certifications");
  if (data.languages?.length) available.push("languages");
  return available;
}

// ══════════════════════════════════════════════════════════════════════════
//  Component
// ══════════════════════════════════════════════════════════════════════════

export function TemplateSetupDialog({
  open,
  onClose,
  template,
  targetLevel = "fresher",
  onCreated,
}: TemplateSetupDialogProps) {
  const { user } = useAuth();
  const subscription = useSubscription();

  // ── Flow state ──
  const [mode, setMode] = useState<"choice" | "manual" | "wizard">("choice");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // True when the server rejected the LinkedIn import with upgradeRequired —
  // shows an inline upgrade CTA instead of a bare error.
  const [upgradeRequired, setUpgradeRequired] = useState(false);


  // ── LinkedIn import state ──
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [importingLinkedin, setImportingLinkedin] = useState(false);
  const [linkedinData, setLinkedinData] = useState<LinkedInUrlImportResult | null>(null);
  // True once the user skips LinkedIn import — the wizard continues as a
  // GitHub-only flow (this also unblocks free users, whose LinkedIn step shows
  // an upgrade CTA instead of an input).
  const [linkedinSkipped, setLinkedinSkipped] = useState(false);
  // Subset of imported LinkedIn sections to write into the resume (default: all).
  const [linkedinSections, setLinkedinSections] = useState<Set<string>>(new Set());

  // ── GitHub import state ──
  const [username, setUsername] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedBy, setImportedBy] = useState<string | null>(null);
  const [repos, setRepos] = useState<ImportedRepo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── AI suggestion state ──
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    rankings: Ranking[];
    suggestedAdditions: Ranking[];
    source: "ai" | "deterministic";
  } | null>(null);

  // ── AI template recommendation state ──
  const [recommending, setRecommending] = useState(false);
  const [templateRec, setTemplateRec] = useState<TemplateRec | null>(null);
  const [useRecTemplate, setUseRecTemplate] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setMode("choice");
      setCreating(false);
      setError(null);
      setUpgradeRequired(false);
      setLinkedinUrl("");
      setLinkedinData(null);
      setLinkedinSkipped(false);
      setLinkedinSections(new Set());
      setImportingLinkedin(false);
      setUsername("");
      setRepos([]);
      setSelected(new Set());
      setJobTitle("");
      setJobDescription("");
      setSuggestions(null);
      setImportedBy(null);
      setRecommending(false);
      setTemplateRec(null);
      setUseRecTemplate(false);
    }
  }, [open]);

  // Body scroll lock + Escape
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !creating) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [open, onClose, creating]);

  const sortedRepos = useMemo(
    () => [...repos].sort((a, b) => b.stars - a.stars),
    [repos]
  );

  /** The template the resume will actually be created with (AI pick overrides the original). */
  const activeTemplate =
    useRecTemplate && templateRec
      ? { id: templateRec.templateId, name: templateRec.name }
      : template;

  async function handleManual() {
    setMode("manual");
    setCreating(true);
    setError(null);
    try {
      const resumeId = await createResume({
        title: `${activeTemplate.name} Resume`,
        personalInfo: { fullName: user?.name || "", email: user?.email || "" },
      });
      onCreated(resumeId);
    } catch {
      setError("Could not create the resume. Please try again.");
      setCreating(false);
      setMode("choice");
    }
  }


  async function handleImportLinkedin() {
    const u = linkedinUrl.trim();
    if (!u || !u.includes("linkedin.com/in/")) {
      setError("Enter a valid LinkedIn profile URL.");
      return;
    }
    setImportingLinkedin(true);
    setError(null);
    try {
      const res = await fetch("/api/linkedin/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data as LinkedInUrlImportResult;
        setLinkedinData(data);
        // Default to importing every section the profile actually contains.
        setLinkedinSections(new Set(availableLinkedinSections(data)));
      } else if (json.upgradeRequired) {
        setError(json.error || "LinkedIn profile import is a Pro feature.");
        setUpgradeRequired(true);
      } else {
        setError(json.error || "Could not import LinkedIn profile.");
      }
    } catch {
      setError("Something went wrong importing LinkedIn profile.");
    } finally {
      setImportingLinkedin(false);
    }
  }

  /** Discard any LinkedIn import and continue as a GitHub-only flow. */
  function handleSkipLinkedin() {
    setLinkedinData(null);
    setLinkedinSections(new Set());
    setLinkedinSkipped(true);
    setUpgradeRequired(false);
    setError(null);
  }

  /** Return to the importable LinkedIn step. */
  function handleUndoSkipLinkedin() {
    setLinkedinSkipped(false);
  }

  function toggleLinkedinSection(key: string) {
    setLinkedinSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleImportRepos() {
    const u = username.trim();
    if (!u) {
      setError("Enter a GitHub username to import public repositories.");
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/github/import-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u }),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.repos)) {
        const list = json.data.repos as ImportedRepo[];
        setRepos(list);
        setImportedBy(u);
        // Preselect the top 3 starred repos by default.
        setSelected(new Set([...list].sort((a, b) => b.stars - a.stars).slice(0, 3).map((r) => r.name)));
      } else {
        setError(json.error || "Could not import repositories.");
      }
    } catch {
      setError("Something went wrong importing repositories.");
    } finally {
      setImporting(false);
    }
  }

  function toggleRepo(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleSuggest() {
    const selectedRepos = repos.filter((r) => selected.has(r.name));
    if (selectedRepos.length === 0) {
      setError("Select at least one repository first.");
      return;
    }
    if (!jobTitle.trim() && !jobDescription.trim()) {
      setError("Add a job title or a short job description so the AI can rank your projects.");
      return;
    }
    setSuggesting(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          repos: selectedRepos.map((r) => ({
            name: r.name,
            description: r.description,
            language: r.language,
          })) as RepoCandidate[],
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSuggestions({
          rankings: json.data.rankings || [],
          suggestedAdditions: json.data.suggestedAdditions || [],
          source: json.source,
        });
      } else {
        setError(json.error || "Could not get AI suggestions.");
      }
    } catch {
      setError("Something went wrong getting suggestions.");
    } finally {
      setSuggesting(false);
    }

    // Same job context also drives the template pick — recommend in the
    // background so the layout choice is ready alongside the project rankings.
    runTemplateRecommendation({ silent: true });
  }

  /** Fetch the best-fit template for the job from the server (AI + fallback). */
  async function runTemplateRecommendation({ silent }: { silent?: boolean }) {
    // Skip if a request is already in flight (auto-trigger + manual click can race).
    if (recommending) return;
    const selectedRepos = repos.filter((r) => selected.has(r.name));
    if (selectedRepos.length === 0 || (!jobTitle.trim() && !jobDescription.trim())) return;
    setRecommending(true);
    try {
      const res = await fetch("/api/templates/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          targetLevel,
          projects: selectedRepos.map((r) => ({
            name: r.name,
            description: r.description,
            language: r.language,
          })),
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTemplateRec({
          templateId: json.data.templateId,
          name: json.data.name,
          score: json.data.score,
          reason: json.data.reason,
          bullets: json.data.bullets || [],
          atsScore: json.data.atsScore,
          source: json.data.source,
        });
      } else if (!silent) {
        setError(json.error || "Could not recommend a template.");
      }
    } catch {
      if (!silent) setError("Something went wrong recommending a template.");
    } finally {
      setRecommending(false);
    }
  }

  /** Explicit user action — always surfaces errors and keeps the last pick. */
  function handleRecommendTemplate() {
    if (repos.filter((r) => selected.has(r.name)).length === 0) {
      setError("Select at least one repository first.");
      return;
    }
    if (!jobTitle.trim() && !jobDescription.trim()) {
      setError("Add a job title or a short job description so the AI can recommend the best template.");
      return;
    }
    setError(null);
    runTemplateRecommendation({ silent: false });
  }

  function applySuggestion(repoName: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(repoName);
      return next;
    });
  }

  async function handleCreateFromImport() {

    setCreating(true);
    setError(null);
    let resumeId: string | null = null;
    try {
      const selectedRepos = repos.filter((r) => selected.has(r.name));
      const githubSkills = deriveSkills(selectedRepos);
      const projects = selectedRepos.map((r) => ({
        name: r.name,
        description: r.description,
        technologies: [r.language].filter(Boolean),
        live_url: "",
        github_url: r.url,
      }));

      // Merge LinkedIn data
      const personalInfo: Record<string, string> = linkedinData?.personalInfo ? {
        fullName: linkedinData.personalInfo.fullName,
        email: user?.email || "",
        linkedin: linkedinData.personalInfo.linkedin,
      } : {
        fullName: user?.name || "",
        email: user?.email || "",
      };

      resumeId = await createResume({
        title: `${activeTemplate.name} Resume`,
        personalInfo,
        // The About summary is only applied if the user kept the Summary section on.
        summary: linkedinData && linkedinSections.has("summary") ? linkedinData.summary || undefined : undefined,
      });

      const promises = [];
      if (selectedRepos.length > 0) {
        promises.push(fetch(`/api/resumes/${resumeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionType: "projects", data: projects }),
        }));
      }

      // Merge skills (GitHub-derived languages are always included; the LinkedIn
      // skills section only applies when the user kept it on)
      let finalSkills = githubSkills;
      if (linkedinData?.skills && linkedinSections.has("skills")) {
        finalSkills = { ...linkedinData.skills };
        if (githubSkills.technical?.length) {
          finalSkills.technical = Array.from(new Set([...(finalSkills.technical || []), ...githubSkills.technical]));
        }
      }
      
      promises.push(fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionType: "skills", data: finalSkills }),
      }));

      if (linkedinData?.education?.length && linkedinSections.has("education")) {
        promises.push(fetch(`/api/resumes/${resumeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionType: "education", data: linkedinData.education }),
        }));
      }

      if (linkedinData?.experience?.length && linkedinSections.has("experience")) {
        promises.push(fetch(`/api/resumes/${resumeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionType: "experience", data: linkedinData.experience }),
        }));
      }

      if (linkedinData?.certifications?.length && linkedinSections.has("certifications")) {
        promises.push(fetch(`/api/resumes/${resumeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionType: "certifications", data: linkedinData.certifications }),
        }));
      }

      if (linkedinData?.languages?.length && linkedinSections.has("languages")) {
        promises.push(fetch(`/api/resumes/${resumeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionType: "languages", data: linkedinData.languages }),
        }));
      }

      const results = await Promise.all(promises);

      // Check if any write failed
      if (results.some(res => !res.ok)) {
        await fetch(`/api/resumes/${resumeId}`, { method: "DELETE" }).catch(() => {});
        setError("Could not save all imported sections. Please try again.");
        setCreating(false);
        return;
      }

      onCreated(resumeId);
    } catch {
      if (resumeId) await fetch(`/api/resumes/${resumeId}`, { method: "DELETE" }).catch(() => {});
      setError("Could not create the resume. Please try again.");
      setCreating(false);
    }
  }

  async function createResume(body: {
    title: string;
    personalInfo: Record<string, string>;
    summary?: string;
  }) {
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: body.title,
        template: activeTemplate.id,
        targetLevel,
        personalInfo: body.personalInfo,
        summary: body.summary || undefined,
        // Role-aware section structure: the server fills the template's
        // recommended preset order, refined by the job title the user entered.
        role: jobTitle || undefined,
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data?.id) {
      throw new Error(json.error || "Create failed");
    }
    return json.data.id as string;
  }

  if (!open) return null;

  const selectedCount = selected.size;
  // LinkedIn import is Pro, but every user gets 3 free imports/month (server
  // enforces this — 403 upgradeRequired after the trial is used up). Only lock
  // the step when the server actually rejected the import.
  const linkedinLocked = upgradeRequired;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={creating ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative w-[94vw] max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {mode === "choice" && "How do you want to fill this resume?"}
                {mode === "manual" && "Creating your resume…"}
                {mode === "wizard" && "Auto-import from GitHub & LinkedIn"}
              </h2>
              <p className="text-xs text-gray-500">
                {mode === "choice" && `Template: ${template.name}`}
                {mode === "manual" && "We're setting up the empty builder for you."}
                {mode === "wizard" && "Pick your best public projects — AI suggests the ones that fit your target job."}
              </p>
            </div>
          </div>
          <button
            onClick={creating ? undefined : onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {mode === "choice" && (
            <div className="p-6 grid md:grid-cols-2 gap-4">
              {/* Option 1 — Manual */}
              <button
                onClick={handleManual}
                disabled={creating}
                className="group text-left rounded-2xl border-2 border-gray-200 hover:border-accent-400 hover:shadow-lg transition-all duration-200 p-6 bg-gradient-to-br from-white to-gray-50 disabled:opacity-50"
              >
                <div className="w-11 h-11 rounded-xl bg-gray-100 group-hover:bg-accent-100 group-hover:text-accent-700 flex items-center justify-center mb-4 transition-colors">
                  <PenLine className="w-5 h-5 text-gray-500 group-hover:text-accent-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Fill it out manually</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Open the builder and enter your details yourself — name, education,
                  experience, skills, projects. Full control, nothing is guessed.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 group-hover:text-accent-600 transition-colors">
                  Start empty builder <span aria-hidden>→</span>
                </div>
              </button>

              {/* Option 2 — Auto import */}
              <button
                onClick={() => setMode("wizard")}
                className="group text-left rounded-2xl border-2 border-accent-300 bg-gradient-to-br from-accent-50 to-white hover:border-accent-500 hover:shadow-lg transition-all duration-200 p-6"
              >
                <div className="w-11 h-11 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center mb-4">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-base font-bold text-gray-900">
                    Auto-import from GitHub & LinkedIn
                  </h3>
                  {!subscription.isPro && !subscription.loading && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      <Sparkles className="w-2.5 h-2.5" /> 3 free LinkedIn imports
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Import your public repositories by GitHub username, pick your best
                  projects, and let AI rank which ones match the job you're applying for.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600">
                  Import my projects <span aria-hidden>→</span>
                </div>
              </button>
            </div>
          )}

          {mode === "manual" && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-accent-500 animate-spin mb-4" />
              <p className="text-sm text-gray-500">Creating your resume…</p>
            </div>
          )}

          {mode === "wizard" && (
            <div className="p-6 space-y-6">
              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1 — LinkedIn URL (Optional · Pro) */}
              <section className="rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center">1</span>
                  <h3 className="text-sm font-bold text-gray-900">Import from LinkedIn</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    <Sparkles className="w-2.5 h-2.5" /> 3 free tries
                  </span>
                </div>

                {linkedinSkipped ? (
                  <div className="ml-7 mt-1 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <Check className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>LinkedIn import skipped — you can still import GitHub projects below.</span>
                    <button onClick={handleUndoSkipLinkedin} className="ml-auto shrink-0 font-semibold text-accent-600 hover:underline">
                      Undo
                    </button>
                  </div>
                ) : linkedinLocked ? (
                  <div className="ml-7 mt-1 p-3.5 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-lg shadow-accent-500/25">
                    <p className="text-xs font-bold">LinkedIn profile import is a Pro feature</p>
                    <p className="text-[11px] text-white/85 mt-0.5 mb-2.5 leading-snug">
                      Import your name, education, experience, and skills from LinkedIn. GitHub import stays free.
                    </p>
                    <div className="flex items-center gap-3">
                      <a
                        href="/pricing"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-accent-700 bg-white px-3 py-1.5 rounded-lg hover:bg-accent-50 transition-colors"
                      >
                        <Sparkles size={12} />
                        Upgrade to Pro
                      </a>
                      <button onClick={handleSkipLinkedin} className="text-[11px] font-semibold text-white/90 hover:text-white underline underline-offset-2">
                        Skip — use GitHub only
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-3 ml-7">
                      Optional — enter your LinkedIn profile URL to fetch your name, education, experience, and skills.
                    </p>
                    <div className="flex gap-2 ml-7">
                      <div className="flex-1">
                        <input
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleImportLinkedin()}
                          placeholder="https://linkedin.com/in/username"
                          className="h-10 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15"
                        />
                      </div>
                      <Button variant="secondary" onClick={handleImportLinkedin} disabled={importingLinkedin} className="rounded-xl">
                        {importingLinkedin ? <Spinner /> : <><Link2 className="w-4 h-4 mr-2" /> Import</>}
                      </Button>
                    </div>

                    {linkedinData && (
                      <>
                        <div className="mt-3 ml-7 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                          <Check className="w-4 h-4 shrink-0" />
                          Imported profile for <span className="font-semibold">{linkedinData.personalInfo.fullName}</span>
                        </div>

                        {/* Which LinkedIn sections to write into the resume */}
                        <div className="mt-3 ml-7">
                          <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Import these sections:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {availableLinkedinSections(linkedinData).map((key) => {
                              const meta = LINKEDIN_SECTION_META.find((m) => m.key === key);
                              const on = linkedinSections.has(key);
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() => toggleLinkedinSection(key)}
                                  className={cn(
                                    "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors",
                                    on
                                      ? "bg-accent-500 text-white border-accent-500"
                                      : "bg-white text-gray-600 border-gray-300 hover:border-accent-300 hover:text-accent-600"
                                  )}
                                >
                                  {on && <Check className="w-3 h-3" strokeWidth={3} />}
                                  {meta?.label ?? key}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {!linkedinData && !importingLinkedin && (
                      <div className="mt-3 ml-7">
                        <button onClick={handleSkipLinkedin} className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">
                          Skip LinkedIn import — continue with GitHub
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* Step 2 — GitHub username (Optional) */}
              {(linkedinData || linkedinSkipped) && (
              <section className="rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-accent-100 text-accent-700 text-[11px] font-bold flex items-center justify-center">3</span>
                    <h3 className="text-sm font-bold text-gray-900">Import GitHub projects (Optional)</h3>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3 ml-7">
                  Enter your GitHub username to fetch your public repositories and languages.
                </p>
                <div className="flex gap-2 ml-7">
                  <div className="flex-1">
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleImportRepos()}
                      placeholder="e.g. octocat"
                      className="h-10 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none transition-all focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    />
                  </div>
                  <Button variant="accent" onClick={handleImportRepos} disabled={importing} className="rounded-xl">
                    {importing ? <Spinner /> : <><GitBranch className="w-4 h-4" /> Import</>}
                  </Button>
                </div>

                {importedBy && (
                  <div className="mt-3 ml-7 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    <Check className="w-4 h-4 shrink-0" />
                    Imported {repos.length} public repositories for{" "}
                    <span className="font-semibold">@{importedBy}</span>
                  </div>
                )}
              </section>
              )}

              {/* Step 3 — Repo picker */}
              {repos.length > 0 && (
                <section className="rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-accent-100 text-accent-700 text-[11px] font-bold flex items-center justify-center">3</span>
                      <h3 className="text-sm font-bold text-gray-900">Select your top projects</h3>
                    </div>
                    <span className="text-xs font-semibold text-accent-600">{selectedCount} selected</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 ml-7">
                    Pick the repositories you want on this resume. The top 3 starred are preselected.
                  </p>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {sortedRepos.map((repo) => {
                      const isSelected = selected.has(repo.name);
                      const ranking = suggestions?.rankings.find((r) => r.repo === repo.name);
                      const isAddition = suggestions?.suggestedAdditions.some((a) => a.repo === repo.name);
                      return (
                        <button
                          key={repo.id}
                          onClick={() => toggleRepo(repo.name)}
                          className={cn(
                            "w-full text-left rounded-xl border px-3 py-2.5 flex items-start gap-3 transition-all duration-150",
                            isSelected
                              ? "border-accent-400 bg-accent-50/70 shadow-sm"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                            isSelected ? "bg-accent-500 border-accent-500" : "border-gray-300"
                          )}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900">{repo.name}</span>
                              {repo.language && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                  {repo.language}
                                </span>
                              )}
                              {repo.stars > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600">
                                  <Star className="w-3 h-3" /> {repo.stars}
                                </span>
                              )}
                              {ranking && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                  <Sparkles className="w-3 h-3" /> {ranking.score}% match
                                </span>
                              )}
                              {!ranking && isAddition && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                  + boosts chances
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{repo.description}</p>
                            )}
                            {ranking?.reason && (
                              <p className="text-[11px] text-green-700 mt-0.5">{ranking.reason}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Step 4 — AI suggestion */}
              {repos.length > 0 && (
                <section className="rounded-2xl border-2 border-dashed border-accent-200 bg-accent-50/40 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-accent-500 text-white text-[11px] font-bold flex items-center justify-center">4</span>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-accent-600" />
                      AI: which projects fit your target job?
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 ml-7">
                    Paste a job title + short description. We rank your selected projects and
                    suggest additions that cover missing skills — boosting your chances.
                  </p>
                  <div className="grid gap-3 ml-7">
                    <input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Job title, e.g. Frontend Developer / Data Science Intern"
                      className="h-10 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none transition-all focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    />
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Job description (optional) — keywords help the AI match your projects"
                      rows={3}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-none"
                    />
                    <div>
                      <Button
                        variant="accent"
                        onClick={handleSuggest}
                        disabled={suggesting}
                        className="rounded-xl"
                      >
                        {suggesting ? <Spinner /> : <><Sparkles className="w-4 h-4" /> Suggest best projects</>}
                      </Button>
                    </div>
                  </div>

                  {suggestions && (
                    <div className="mt-4 space-y-4 ml-7">
                      {suggestions.source === "deterministic" && (
                        <p className="text-[11px] text-gray-400">
                          AI service unavailable — using smart keyword matching instead.
                        </p>
                      )}

                      {suggestions.rankings.length > 0 && (
                        <div className="rounded-xl bg-white border border-gray-200 p-3">
                          <p className="text-xs font-bold text-gray-700 mb-2">🏆 Best fit for this job</p>
                          <ol className="space-y-2">
                            {suggestions.rankings.map((r, i) => (
                              <li key={r.repo} className="flex items-start gap-2 text-xs">
                                <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold text-gray-900">{r.repo}</span>
                                  <span className="text-gray-400"> — {r.reason}</span>
                                </div>
                                <span className="font-bold text-green-700 shrink-0">{r.score}%</span>
                                {!selected.has(r.repo) && (
                                  <Button size="sm" variant="ghost" className="shrink-0 !h-6 !px-2 text-[11px] text-accent-600" onClick={() => applySuggestion(r.repo)}>
                                    Add
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {suggestions.suggestedAdditions.length > 0 && (
                        <div className="rounded-xl bg-blue-50/60 border border-blue-200 p-3">
                          <p className="text-xs font-bold text-blue-800 mb-2">
                            ⬆ Add these to boost your chances
                          </p>
                          <ul className="space-y-2">
                            {suggestions.suggestedAdditions.map((a) => (
                              <li key={a.repo} className="flex items-start gap-2 text-xs">
                                <span className="mt-0.5 shrink-0"><Check className="w-3.5 h-3.5 text-blue-600" /></span>
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold text-gray-900">{a.repo}</span>
                                  <span className="text-gray-500"> — {a.reason}</span>
                                </div>
                                {!selected.has(a.repo) && (
                                  <Button size="sm" variant="ghost" className="shrink-0 !h-6 !px-2 text-[11px] text-blue-700" onClick={() => applySuggestion(a.repo)}>
                                    Add
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Step 5 — AI template recommendation */}
              {repos.length > 0 && (
                <section className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center">5</span>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <LayoutTemplate className="w-4 h-4 text-indigo-600" />
                      AI: which template wins this job?
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 ml-7">
                    Based on the job title, description, and the projects you picked, we recommend the
                    single best layout — ATS-safe, seniority-matched, and recruiter-friendly.
                  </p>
                  <div className="ml-7">
                    <Button
                      variant="accent"
                      onClick={handleRecommendTemplate}
                      disabled={recommending}
                      className="rounded-xl"
                    >
                      {recommending ? <Spinner /> : <><LayoutTemplate className="w-4 h-4" /> Recommend best template</>}
                    </Button>
                  </div>

                  {templateRec && (
                    <div className="mt-4 ml-7 rounded-xl bg-white border border-indigo-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-0.5">
                            {templateRec.source === "ai" ? "AI recommendation" : "Smart recommendation"}
                          </p>
                          <p className="text-lg font-bold text-gray-900 leading-tight">{templateRec.name}</p>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{templateRec.reason}</p>
                        </div>
                        <div className="text-center shrink-0">
                          <div className="text-2xl font-extrabold text-indigo-600 leading-none">{templateRec.score}%</div>
                          <div className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wider">
                            {templateRec.source === "ai" ? "match" : "ATS score"}
                          </div>
                        </div>
                      </div>

                      {templateRec.bullets.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {templateRec.bullets.map((b, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                            >
                              <Check className="w-3 h-3" strokeWidth={3} /> {b}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-gray-400">
                          {templateRec.source === "ai" ? (
                            <>ATS score <span className="font-bold text-gray-700">{templateRec.atsScore}/100</span></>
                          ) : (
                            <>Ranked best layout for this job</>
                          )}
                        </span>
                        <Button
                          size="sm"
                          variant={useRecTemplate ? "ghost" : "accent"}
                          className="rounded-lg !h-8 !px-3 text-xs shrink-0"
                          onClick={() => setUseRecTemplate((prev) => !prev)}
                        >
                          {useRecTemplate ? (
                            <>Use {template.name} instead</>
                          ) : (
                            <>Use {templateRec.name} instead</>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* LinkedIn note */}
              {repos.length === 0 && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
                  <GitBranch className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>GitHub:</strong> powers the project list — enter your username to start.
                    LinkedIn is optional — 3 free imports/month, then Pro. Pick the sections you want,
                    or skip it — your name and email come from your account either way.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50/60">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            {mode === "wizard" && (linkedinData || linkedinSkipped) && (
              <>
                {repos.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <FolderGit2 className="w-3.5 h-3.5" /> {selectedCount} of {repos.length} projects selected
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <LayoutTemplate className="w-3.5 h-3.5" /> {activeTemplate.name}
                  {useRecTemplate && templateRec && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      <Sparkles className="w-2.5 h-2.5" /> AI pick
                    </span>
                  )}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} disabled={creating} className="rounded-xl">
              Cancel
            </Button>
            {mode === "wizard" && (linkedinData || linkedinSkipped) && (
              <Button variant="accent" onClick={handleCreateFromImport} disabled={creating} className="rounded-xl">
                {creating ? (
                  <><Spinner /> Creating…</>
                ) : (
                  <>Create resume · {activeTemplate.name}</>
                )}
              </Button>
            )}
            {mode === "manual" && (
              <Button variant="accent" disabled className="rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating…
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Derive a Skills payload from the selected repos' languages. */
function deriveSkills(repos: ImportedRepo[]) {
  const languageCounts = new Map<string, number>();
  for (const r of repos) {
    if (!r.language) continue;
    languageCounts.set(r.language, (languageCounts.get(r.language) || 0) + 1);
  }
  const languages = [...languageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);

  return {
    technical: languages,
    soft: [] as string[],
    tools: [] as string[],
    frameworks: [] as string[],
  };
}
