"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type AddType = "certificate" | "achievement" | "post_reference";

interface ResumeOption {
  id: string;
  title: string;
}

function LinkedinIntegrationContent() {
  const { authenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual-add state
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [addType, setAddType] = useState<AddType>("certificate");
  const [addForm, setAddForm] = useState({
    resumeId: "",
    title: "",
    issuer: "",
    description: "",
    date: "",
    url: "",
  });
  const [savingAdd, setSavingAdd] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Suggestions state (R-19)
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");

  useEffect(() => {
    const connectedParam = searchParams.get("connected");
    const errorParam = searchParams.get("error");

    if (connectedParam === "true") {
      setConnected(true);
      setMessage({ type: "success", text: "Successfully connected to LinkedIn!" });
    } else if (errorParam) {
      const errors: Record<string, string> = {
        no_code: "LinkedIn did not provide an authorization code.",
        not_configured: "LinkedIn OAuth is not configured on the server.",
        token_exchange_failed: "Failed to exchange code for access token.",
        profile_fetch_failed: "Failed to fetch LinkedIn profile information.",
        callback_failed: "An unexpected error occurred during the LinkedIn callback.",
        access_denied: "You declined the LinkedIn authorization request.",
      };
      setMessage({ type: "error", text: errors[errorParam] || `Error: ${errorParam}` });
    }
  }, [searchParams]);

  // Load connection state + user resumes for the manual-add forms.
  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      if (!user) return;
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("linkedin_connected")
          .eq("id", user.id)
          .single();
        setConnected(profile?.linkedin_connected || false);

        const resumesRes = await fetch("/api/resumes");
        const resumesJson = await resumesRes.json();
        if (resumesJson.success && Array.isArray(resumesJson.data)) {
          setResumes(resumesJson.data.map((r: { id: string; title: string }) => ({ id: r.id, title: r.title })));
        }
      } catch {}
    }
    load();
  }, [user, authLoading]);

  async function handleConnect() {
    setLoading(true);
    window.location.href = "/api/linkedin/connect";
  }

  async function handleDisconnect() {
    try {
      await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedin_connected: false }),
      });
      setConnected(false);
      setMessage({ type: "success", text: "Disconnected from LinkedIn." });
    } catch {
      setMessage({ type: "error", text: "Failed to disconnect. Please try again." });
    }
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.resumeId || !addForm.title) {
      setMessage({ type: "error", text: "Resume and title are required." });
      return;
    }
    setSavingAdd(true);
    try {
      const res = await fetch("/api/linkedin/manual-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, type: addType }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Added to your resume." });
        setAddForm((f) => ({ ...f, title: "", issuer: "", description: "", date: "", url: "" }));
      } else {
        setMessage({ type: "error", text: json.error || "Failed to add." });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setSavingAdd(false);
    }
  }

  async function handleGetSuggestions() {
    setSuggestionsLoading(true);
    setSuggestionsError("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "profile-improvement",
          input: "",
          context: JSON.stringify({
            userType: (user as { user_type?: string })?.user_type || "",
            desiredRole: (user as { desired_role?: string })?.desired_role || "",
            resumeCount: resumes.length,
          }),
        }),
      });
      const json = await res.json();
      if (json.success && json.output) {
        setSuggestions(json.output.split("\n").map((s: string) => s.trim()).filter(Boolean));
      } else {
        setSuggestionsError(json.error || "Could not generate suggestions.");
      }
    } catch {
      setSuggestionsError("Could not generate suggestions.");
    } finally {
      setSuggestionsLoading(false);
    }
  }

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  if (!authenticated) { router.push("/login"); return null; }

  const inputCls =
    "h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15";
  const labelCls = "text-small font-medium text-black block mb-2";

  return (
    <div className="max-w-[720px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black">LinkedIn Integration</h1>
          <p className="text-body text-gray-500 mt-1">Connect your LinkedIn account to enhance your profile and resume</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>Back</Button>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-sm text-small border ${
          message.type === "success"
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-gray-300 rounded-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-sm flex items-center justify-center ${
              connected ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"
            }`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-h3 text-black">Connection Status</h3>
              <p className="text-small text-gray-500 mt-1">
                {connected ? "Connected to LinkedIn" : "Not connected"}
              </p>
            </div>
          </div>
          {connected ? (
            <Button variant="ghost" onClick={handleDisconnect} className="text-red-500 hover:text-red-600">
              Disconnect
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleConnect} disabled={loading}>
              {loading ? "Connecting..." : "Connect LinkedIn"}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* What syncs vs what doesn't (R-06 disclosure) */}
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 text-small text-gray-700">
          <strong className="text-amber-800">What syncs:</strong> your LinkedIn name, email, and profile photo.
          <br />
          <strong className="text-amber-800">What we cannot sync:</strong> experience, education, skills, certifications,
          posts, and recommendations. LinkedIn closed its profile-import API in 2015, and deep import requires a
          LinkedIn Talent Solutions partnership. <strong>Workaround:</strong> add certificates, achievements, and post
          references manually below — we save them directly to your resume.
        </div>

        <div className="bg-white border border-gray-300 rounded-sm p-6">
          <h3 className="text-h3 text-black mb-3">Benefits of Connecting</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-body text-gray-600">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>Sync your name, email, and profile photo automatically</span>
            </li>
            <li className="flex items-start gap-3 text-body text-gray-600">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>Showcase your LinkedIn presence on your resume</span>
            </li>
            <li className="flex items-start gap-3 text-body text-gray-600">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>Get personalized AI suggestions based on your career profile</span>
            </li>
          </ul>
        </div>

        {/* Manual add (R-05) */}
        <div className="bg-white border border-gray-300 rounded-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-h3 text-black">Add to a Resume Manually</h3>
            <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Hide" : "Add"}
            </Button>
          </div>
          <p className="text-small text-gray-500 mb-4">
            Add a certificate, achievement, or post reference straight into one of your resumes.
          </p>

          {showForm && (
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Type</label>
                  <select
                    className={inputCls}
                    value={addType}
                    onChange={(e) => setAddType(e.target.value as AddType)}
                  >
                    <option value="certificate">Certificate</option>
                    <option value="achievement">Achievement</option>
                    <option value="post_reference">Post / Reference</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Resume</label>
                  <select
                    className={inputCls}
                    value={addForm.resumeId}
                    onChange={(e) => setAddForm((f) => ({ ...f, resumeId: e.target.value }))}
                    required
                  >
                    <option value="">Select a resume...</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Title</label>
                <input
                  className={inputCls}
                  value={addForm.title}
                  onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={addType === "post_reference" ? "Post or article title" : "Certificate / achievement title"}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Issuer / Description</label>
                <input
                  className={inputCls}
                  value={addForm.issuer}
                  onChange={(e) => setAddForm((f) => ({ ...f, issuer: e.target.value }))}
                  placeholder="Issuing organization or context (optional)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={addForm.date}
                    onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>URL (optional)</label>
                  <input
                    type="url"
                    className={inputCls}
                    value={addForm.url}
                    onChange={(e) => setAddForm((f) => ({ ...f, url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <Button variant="primary" type="submit" disabled={savingAdd}>
                {savingAdd ? <Spinner /> : "Add to Resume"}
              </Button>
            </form>
          )}
        </div>

        {/* AI suggestions (R-19) */}
        <div className="bg-white border border-gray-300 rounded-sm p-6">
          <h3 className="text-h3 text-black mb-3">AI Profile Suggestions</h3>
          <p className="text-small text-gray-500 mb-4">
            Get actionable, insertable suggestions to improve your summary, skills, and achievements — based on your
            resume data (no LinkedIn data required).
          </p>
          <Button variant="secondary" onClick={handleGetSuggestions} disabled={suggestionsLoading}>
            {suggestionsLoading ? <Spinner /> : "Get suggestions"}
          </Button>

          {suggestionsError && (
            <p className="text-small text-red-600 mt-3">{suggestionsError}</p>
          )}
          {suggestions.length > 0 && (
            <ul className="mt-4 space-y-2">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-small text-gray-700 bg-gray-50 rounded-sm px-3 py-2">
                  <span className="text-accent-600 font-bold mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LinkedinIntegrationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>}>
      <LinkedinIntegrationContent />
    </Suspense>
  );
}
