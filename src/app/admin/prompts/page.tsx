"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  ChevronRight,
  Sparkles,
  Zap,
  History,
  Play,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const defaultPrompts: PromptEntry[] = [
  { key: "generate-summary", label: "Summary Generation", template: "Write a professional resume summary (3-4 sentences) based on this information. Only use facts provided. Do not invent metrics or experience.\n\nContext: {context}\n\nUser input: {input}", versions: [] },
  { key: "enhance-bullet", label: "Bullet Enhancer", template: "Improve this resume bullet point using strong action verbs. Add metrics only if explicitly provided by the user. Never fabricate numbers.\n\nOriginal: {input}\n\nContext: {context}", versions: [] },
  { key: "cover-letter", label: "Cover Letter", template: "Write a professional cover letter based on the resume below. Use only facts from the resume. Never invent experience, skills, or metrics.\n\nResume: {context}\n\nJob description: {input}", versions: [] },
  { key: "recruiter-email", label: "Recruiter Email", template: "Write a concise, professional outreach email to the recruiter or hiring manager for the job described below. Use only facts from the resume. Never invent experience, skills, or metrics. Structure: friendly greeting, who you are and the role you're applying for, 2-3 sentences connecting your most relevant experience to the role's requirements, a call to action to schedule a conversation, and a professional sign-off with the candidate's name and contact details from the resume. Keep it under 200 words.\n\nResume: {context}\n\nJob description: {input}", versions: [] },
  { key: "linkedin-message", label: "LinkedIn Message", template: "Write a short, professional LinkedIn InMail or connection-request message to the recruiter or hiring manager for the job described below. Use only facts from the resume. Never invent experience, skills, or metrics. Keep it to 3-4 sentences: greet, mention the role you're applying for, one line tying your background to the role, and a polite call to action. No emojis, no links, under 120 words.\n\nResume: {context}\n\nJob description: {input}", versions: [] },
  { key: "interview-questions", label: "Interview Questions", template: "Based on the job description and the candidate's resume below, generate a focused list of likely interview questions the candidate should prepare for. Return 10 questions: 3-4 technical/skill-based tied to the role's requirements, 3 behavioral (STAR-format), 2-3 role-specific scenario questions, and 1-2 questions about the candidate's specific experience from the resume. Number them and group them under headings. Use only the skills and experience present in the resume.\n\nResume: {context}\n\nJob description: {input}", versions: [] },
  { key: "ats-score", label: "ATS Score", template: "Analyze this resume and return a JSON object with overall (0-100), skillsMatch (0-40), formatting (0-30), keywords (0-30), suggestions (array of strings). Label concept as \"Estimated Compatibility Score\" not \"ATS Score\".", versions: [] },
  { key: "analyze-jd", label: "JD Analysis", template: "Compare this resume against the job description. Identify missing keywords, missing skills, and missing tools.", versions: [] },
  { key: "check-grammar", label: "Grammar Check", template: "Fix grammar and spelling in this text. Do not rewrite content or add information.\n\nText: {input}", versions: [] },
  { key: "company-variant", label: "Company Variant", template: "Rewrite this resume content to emphasize qualities relevant to a {input} company culture. Do not add fabricated metrics, experience, or skills.\n\nResume: {context}", versions: [] },
  { key: "role-variant", label: "Role Variant", template: "Rewrite this resume content to emphasize skills relevant to a {input} role. Do not add fabricated metrics, experience, or skills.\n\nResume: {context}", versions: [] },
  { key: "suggest-achievements", label: "Achievement Suggestions", template: "Suggest 2-3 quantifiable achievements based on this experience. Only use metrics the user has provided.\n\nExperience: {input}\n\nContext: {context}", versions: [] },
  { key: "add-keywords", label: "Keyword Suggestions", template: "Identify missing keywords from this job description and suggest which to add to the resume.\n\nResume section: {input}\n\nJob description: {context}", versions: [] },
  { key: "rewrite-section", label: "Section Rewriter", template: "Rewrite this resume section to be more impactful. Use action verbs. Do not add fabricated metrics.\n\nSection: {input}\n\nContext: {context}", versions: [] },
];

interface PromptEntry {
  key: string;
  label: string;
  template: string;
  versions?: { template: string; savedAt: string }[];
}

export default function AdminPromptsPage() {
  const { user, loading: authLoading } = useAuth();
  const [prompts, setPrompts] = useState<PromptEntry[]>(defaultPrompts);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [publishedText, setPublishedText] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setVerifying(false); return; }

    async function verifyAndFetch() {
      try {
        // Verify admin via the stats endpoint (which uses server-side isAdmin)
        const res = await fetch("/api/admin/stats");
        if (!res.ok) { setVerifying(false); return; }
        const json = await res.json();
        if (json.success) {
          setAdminVerified(true);
          // Fetch prompts from API
          const promptsRes = await fetch("/api/admin/prompts");
          const promptsJson = await promptsRes.json();
          if (promptsJson.success && promptsJson.data?.length > 0) {
            setPrompts(promptsJson.data.map((p: Record<string, unknown>) => ({
              key: p.key as string,
              label: p.label as string,
              template: p.template as string,
              versions: [],
            })));
          }
        }
      } catch {} finally {
        setVerifying(false);
      }
    }
    verifyAndFetch();
  }, [user, authLoading]);

  function handleSelect(key: string) {
    const prompt = prompts.find((p) => p.key === key);
    if (!prompt) return;
    setSelectedKey(key);
    setEditText(prompt.template);
    setPublishedText(prompt.template);
    setTestInput("");
    setTestOutput("");
    setMessage("");
    setShowHistory(false);
  }

  function handleSaveDraft() {
    if (!selectedKey) return;
    setPrompts((prev) =>
      prev.map((p) =>
        p.key === selectedKey
          ? { ...p, versions: [...(p.versions || []), { template: p.template, savedAt: new Date().toISOString() }], template: editText }
          : p
      )
    );
    setPublishedText(publishedText);
    setMessage("Draft saved. Changes are not live until you publish.");
    setMessageType("success");
  }

  async function handlePublish() {
    if (!selectedKey) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: selectedKey, template: editText }),
      });
      const json = await res.json();
      if (json.success) {
        setPublishedText(editText);
        setMessage("Prompt published and is now live in the AI service.");
        setMessageType("success");
        setPrompts((prev) =>
          prev.map((p) => p.key === selectedKey ? { ...p, template: editText } : p)
        );
      } else {
        setMessage(json.error || "Failed to publish");
        setMessageType("error");
      }
    } catch {
      setMessage("Something went wrong");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestRun() {
    if (!selectedKey || !testInput) return;
    setTestLoading(true);
    setTestOutput("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: selectedKey,
          input: testInput,
          context: "This is a sandbox test. The prompt above is the draft version.",
        }),
      });
      const json = await res.json();
      setTestOutput(json.output || json.error || "No output generated");
    } catch {
      setTestOutput("Test run failed - API error");
    } finally {
      setTestLoading(false);
    }
  }

  function handleRollback(version: { template: string; savedAt: string }) {
    if (!selectedKey) return;
    setEditText(version.template);
    setMessage(`Rolled back to version from ${new Date(version.savedAt).toLocaleString()}. Save draft to keep.`);
    setMessageType("success");
  }

  if (authLoading || verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-50 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles size={22} className="text-accent-600" />
          </div>
          <Spinner />
        </div>
      </div>
    );
  }

  if (!adminVerified) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex pt-[72px]">
        <ErrorBoundary>
          <AdminSidebar />
        </ErrorBoundary>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-8">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
              <Zap size={28} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-sm text-gray-500 mb-6">You do not have admin access to manage AI prompts.</p>
            <a href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 text-white text-sm font-semibold hover:bg-accent-700 transition-all shadow-lg shadow-accent-500/20">
              Go to Dashboard <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const selectedPrompt = prompts.find((p) => p.key === selectedKey);
  const hasUnsavedChanges = selectedPrompt && editText !== publishedText;

  return (
    <div className="min-h-screen bg-gray-50/50 flex pt-[72px]">
      <ErrorBoundary>
        <AdminSidebar />
      </ErrorBoundary>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-sm">
                <BrainCircuit size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AI Prompt Management</h1>
            </div>
            <p className="text-sm text-gray-500 ml-11">
              View, edit, and test AI system prompts. Draft changes in the sandbox before publishing.
            </p>
          </div>

          {/* Prompt selection grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
            {prompts.map((p) => (
              <button
                key={p.key}
                onClick={() => handleSelect(p.key)}
                className={cn(
                  "text-left bg-white rounded-xl border p-4 transition-all duration-200 hover:shadow-md group",
                  selectedKey === p.key
                    ? "border-accent-400 ring-2 ring-accent-500/15 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-accent-700 transition-colors">{p.label}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{p.template.substring(0, 60)}...</p>
                {p.versions && p.versions.length > 0 && (
                  <span className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <History size={10} />
                    {p.versions.length} saved version{p.versions.length !== 1 ? "s" : ""}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Editor panel */}
          {selectedKey && (
            <div className="space-y-6">
              {/* Prompt editor */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{selectedPrompt?.label}</h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">Key: {selectedKey}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasUnsavedChanges && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle size={10} />
                          Unsaved
                        </span>
                      )}
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
                      >
                        <History size={12} />
                        History ({selectedPrompt?.versions?.length || 0})
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <textarea
                    className="w-full h-48 rounded-xl border border-gray-200 px-4 py-3 text-sm font-mono text-gray-800 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all resize-y leading-relaxed"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />

                  {showHistory && selectedPrompt?.versions && selectedPrompt.versions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-700 mb-3">Version History</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedPrompt.versions.map((v, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-gray-500 block truncate">
                                {new Date(v.savedAt).toLocaleString()} - {v.template.substring(0, 50)}...
                              </span>
                            </div>
                            <button
                              onClick={() => handleRollback(v)}
                              className="text-xs font-medium text-accent-600 hover:text-accent-700 shrink-0 ml-3"
                            >
                              Rollback
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-5">
                    <Button variant="secondary" onClick={handleSaveDraft} className="flex items-center gap-1.5">
                      <Save size={14} />
                      Save Draft
                    </Button>
                    <Button variant="primary" onClick={handlePublish} disabled={saving} className="flex items-center gap-1.5">
                      {saving ? <Spinner /> : hasUnsavedChanges ? <><Send size={14} /> Publish</> : <><CheckCircle2 size={14} /> Published</>}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sandbox Test */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <Play size={14} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Sandbox Test Run</h3>
                      <p className="text-xs text-gray-400">Test the current draft prompt before publishing.</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">Test Input</label>
                    <textarea
                      className="w-full h-24 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all resize-y"
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Enter test input to send to the AI service..."
                    />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleTestRun}
                    disabled={testLoading || !testInput}
                    className="flex items-center gap-1.5"
                  >
                    {testLoading ? <Spinner /> : <><Play size={14} /> Run Test</>}
                  </Button>
                  {testOutput && (
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">Output</h4>
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{testOutput}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={cn(
                  "flex items-center gap-2 px-5 py-4 rounded-xl text-sm border",
                  messageType === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-700"
                )}>
                  {messageType === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
