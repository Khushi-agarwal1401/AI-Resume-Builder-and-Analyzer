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

const defaultPrompts = [
  { key: "generate-summary", label: "Summary Generation", template: "Write a professional resume summary (3-4 sentences) based on this information. Only use facts provided. Do not invent metrics or experience." },
  { key: "enhance-bullet", label: "Bullet Enhancer", template: "Improve this resume bullet point using strong action verbs. Add metrics only if explicitly provided." },
  { key: "cover-letter", label: "Cover Letter", template: "Write a professional cover letter based on the resume below. Use only facts from the resume." },
  { key: "ats-score", label: "ATS Score", template: "Analyze this resume and return a JSON object with overall (0-100), skillsMatch (0-40), formatting (0-30), keywords (0-30), suggestions (array of strings)." },
  { key: "analyze-jd", label: "JD Analysis", template: "Compare this resume against the job description. Identify missing keywords, missing skills, and missing tools." },
];

export default function AdminPromptsPage() {
  const { user, loading: authLoading } = useAuth();
  const [prompts, setPrompts] = useState(defaultPrompts);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/prompts")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.length > 0) {
          setPrompts(json.data);
        }
      })
      .catch(() => {});
  }, []);

  function handleSelect(key: string) {
    setSelectedKey(key);
    setEditText(prompts.find((p) => p.key === key)?.template || "");
    setMessage("");
  }

  async function handleSave() {
    if (!selectedKey) return;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: selectedKey, template: editText }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage("Prompt updated");
        setPrompts((prev) => prev.map((p) => p.key === selectedKey ? { ...p, template: editText } : p));
      } else {
        setMessage(json.error || "Failed to save");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
  if (user?.email !== "admin@resumeai.com") {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-body text-gray-500">Access Denied. <Link href="/dashboard" className="text-accent-500">Go back</Link></p></div>;
  }

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
          <h1 className="text-h1 text-black mb-6">AI Prompt Management</h1>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {prompts.map((p) => (
              <button
                key={p.key}
                onClick={() => handleSelect(p.key)}
                className={`text-left bg-white border rounded-sm p-4 transition-all ${
                  selectedKey === p.key ? "border-accent-500 ring-1 ring-accent-500" : "border-gray-300 hover:border-gray-500"
                }`}
              >
                <h3 className="text-body font-medium text-black">{p.label}</h3>
                <p className="text-micro text-gray-500 mt-1 truncate">{p.template.substring(0, 60)}...</p>
              </button>
            ))}
          </div>

          {selectedKey && (
            <div className="bg-white border border-gray-300 rounded-sm p-6">
              <h3 className="text-h3 text-black mb-2">{prompts.find((p) => p.key === selectedKey)?.label}</h3>
              <p className="text-micro text-gray-500 mb-4">Key: {selectedKey}</p>
              <textarea
                className="w-full h-40 rounded-sm border border-gray-300 px-4 py-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
              <div className="flex gap-3 mt-4">
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? <Spinner /> : "Save Prompt"}
                </Button>
                <Button variant="secondary" onClick={() => { setSelectedKey(null); setMessage(""); }}>Cancel</Button>
              </div>
              {message && (
                <p className={`text-small mt-3 ${message === "Prompt updated" ? "text-success" : "text-error"}`}>{message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
