"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "◻" },
  { href: "/admin/users", label: "Users", icon: "◇" },
  { href: "/admin/templates", label: "Templates", icon: "◇" },
  { href: "/admin/prompts", label: "AI Prompts", icon: "◇" },
];

interface PromptEntry {
  key: string;
  label: string;
  template: string;
  versions?: { template: string; savedAt: string }[];
}

const defaultPrompts: PromptEntry[] = [
  { key: "generate-summary", label: "Summary Generation", template: "Write a professional resume summary (3-4 sentences) based on this information. Only use facts provided. Do not invent metrics or experience.\n\nContext: {context}\n\nUser input: {input}", versions: [] },
  { key: "enhance-bullet", label: "Bullet Enhancer", template: "Improve this resume bullet point using strong action verbs. Add metrics only if explicitly provided by the user. Never fabricate numbers.\n\nOriginal: {input}\n\nContext: {context}", versions: [] },
  { key: "cover-letter", label: "Cover Letter", template: "Write a professional cover letter based on the resume below. Use only facts from the resume. Never invent experience, skills, or metrics.\n\nResume: {context}\n\nJob description: {input}", versions: [] },
  { key: "ats-score", label: "ATS Score", template: "Analyze this resume and return a JSON object with overall (0-100), skillsMatch (0-40), formatting (0-30), keywords (0-30), suggestions (array of strings). Label concept as \"Estimated Compatibility Score\" not \"ATS Score\".", versions: [] },
  { key: "analyze-jd", label: "JD Analysis", template: "Compare this resume against the job description. Identify missing keywords, missing skills, and missing tools.", versions: [] },
  { key: "check-grammar", label: "Grammar Check", template: "Fix grammar and spelling in this text. Do not rewrite content or add information.\n\nText: {input}", versions: [] },
  { key: "company-variant", label: "Company Variant", template: "Rewrite this resume content to emphasize qualities relevant to a {input} company culture. Do not add fabricated metrics, experience, or skills.\n\nResume: {context}", versions: [] },
  { key: "role-variant", label: "Role Variant", template: "Rewrite this resume content to emphasize skills relevant to a {input} role. Do not add fabricated metrics, experience, or skills.\n\nResume: {context}", versions: [] },
  { key: "suggest-achievements", label: "Achievement Suggestions", template: "Suggest 2-3 quantifiable achievements based on this experience. Only use metrics the user has provided.\n\nExperience: {input}\n\nContext: {context}", versions: [] },
  { key: "add-keywords", label: "Keyword Suggestions", template: "Identify missing keywords from this job description and suggest which to add to the resume.\n\nResume section: {input}\n\nJob description: {context}", versions: [] },
  { key: "rewrite-section", label: "Section Rewriter", template: "Rewrite this resume section to be more impactful. Use action verbs. Do not add fabricated metrics.\n\nSection: {input}\n\nContext: {context}", versions: [] },
];

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

  useEffect(() => {
    fetch("/api/admin/prompts")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.length > 0) {
          setPrompts(json.data.map((p: Record<string, unknown>) => ({
            key: p.key as string,
            label: p.label as string,
            template: p.template as string,
            versions: [],
          })));
        }
      })
      .catch(() => {});
  }, []);

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
    // Store current edit as a version
    setPrompts((prev) =>
      prev.map((p) =>
        p.key === selectedKey
          ? { ...p, versions: [...(p.versions || []), { template: p.template, savedAt: new Date().toISOString() }], template: editText }
          : p
      )
    );
    setPublishedText(publishedText); // Published version stays the same
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
      setTestOutput("Test run failed — API error");
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

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
  if (user?.email !== "admin@resumeai.com") {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-body text-gray-500">Access Denied. <Link href="/dashboard" className="text-accent-500">Go back</Link></p></div>;
  }

  const selectedPrompt = prompts.find((p) => p.key === selectedKey);
  const hasUnsavedChanges = selectedPrompt && editText !== publishedText;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-[240px] border-r border-gray-300 bg-white min-h-screen flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-300">
            <h2 className="text-h3 text-black">Admin</h2>
            <p className="text-micro text-gray-500">Super Admin Panel</p>
          </div>
          <nav className="flex flex-col px-3 py-4 space-y-1">
            {adminNav.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 h-11 px-3 rounded-sm text-body text-gray-500 hover:text-black hover:bg-gray-100 transition-all">
                <span className="text-lg w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1 p-8">
          <h1 className="text-h1 text-black mb-2">AI Prompt Management</h1>
          <p className="text-body text-gray-500 mb-6">
            View and edit AI system prompts. Draft changes, test them in the sandbox, then publish when ready.
          </p>

          {/* Prompt selection grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {prompts.map((p) => (
              <button
                key={p.key}
                onClick={() => handleSelect(p.key)}
                className={`text-left bg-white border rounded-sm p-4 transition-all ${
                  selectedKey === p.key
                    ? "border-accent-500 ring-1 ring-accent-500"
                    : "border-gray-300 hover:border-gray-500"
                }`}
              >
                <h3 className="text-body font-medium text-black">{p.label}</h3>
                <p className="text-micro text-gray-500 mt-1 truncate">{p.template.substring(0, 50)}...</p>
                {p.versions && p.versions.length > 0 && (
                  <span className="text-[10px] text-gray-400 mt-1 block">{p.versions.length} saved versions</span>
                )}
              </button>
            ))}
          </div>

          {/* Editor panel */}
          {selectedKey && (
            <div className="space-y-6">
              {/* Prompt editor */}
              <div className="bg-white border border-gray-300 rounded-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-h3 text-black">{selectedPrompt?.label}</h3>
                    <p className="text-micro text-gray-500">Key: {selectedKey}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <span className="text-micro text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">
                        Unsaved changes
                      </span>
                    )}
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-micro text-accent-500 hover:underline"
                    >
                      {showHistory ? "Hide History" : `Version History (${selectedPrompt?.versions?.length || 0})`}
                    </button>
                  </div>
                </div>

                <textarea
                  className="w-full h-48 rounded-sm border border-gray-300 px-4 py-3 text-body font-mono text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />

                {showHistory && selectedPrompt?.versions && selectedPrompt.versions.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h4 className="text-small font-medium text-black mb-2">Version History</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedPrompt.versions.map((v, i) => (
                        <div key={i} className="flex items-center justify-between text-small">
                          <span className="text-gray-500">
                            {new Date(v.savedAt).toLocaleString()} — {v.template.substring(0, 40)}...
                          </span>
                          <button
                            onClick={() => handleRollback(v)}
                            className="text-accent-500 hover:underline text-micro"
                          >
                            Rollback
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Button variant="secondary" onClick={handleSaveDraft}>
                    Save Draft
                  </Button>
                  <Button variant="primary" onClick={handlePublish} disabled={saving}>
                    {saving ? <Spinner /> : hasUnsavedChanges ? "Publish Changes" : "Published ✓"}
                  </Button>
                </div>
              </div>

              {/* Sandbox Test */}
              <div className="bg-white border border-gray-300 rounded-sm p-6">
                <h3 className="text-h3 text-black mb-2">Sandbox Test Run</h3>
                <p className="text-small text-gray-500 mb-4">
                  Test the current draft prompt before publishing. This sends the draft to the AI service.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-small font-medium text-black block mb-2">Test Input</label>
                    <textarea
                      className="w-full h-20 rounded-sm border border-gray-300 px-4 py-2 text-body outline-none focus:border-accent-500 focus:ring-[3px] resize-y"
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Enter test input to send to the AI service..."
                    />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleTestRun}
                    disabled={testLoading || !testInput}
                  >
                    {testLoading ? <Spinner /> : "▶ Run Test"}
                  </Button>
                  {testOutput && (
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                      <h4 className="text-small font-medium text-black mb-2">Output</h4>
                      <pre className="text-small text-gray-700 whitespace-pre-wrap font-sans">{testOutput}</pre>
                    </div>
                  )}
                </div>
              </div>

              {message && (
                <div className={`px-4 py-3 rounded-sm text-small border ${
                  messageType === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}>
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
