"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Search } from "lucide-react";

type AddType = "certificate" | "achievement" | "post_reference";

interface ResumeOption {
  id: string;
  title: string;
}

function LinkedinIntegrationContent() {
  const { authenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // LinkedIn username / URL → attach profile link to a resume
  const [linkedinInput, setLinkedinInput] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [savingLink, setSavingLink] = useState(false);
  const [linkError, setLinkError] = useState("");

  // Manual-add state
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
    if (authLoading || !user) return;

    async function load() {
      if (!user) return;
      try {
        await setMessage(null);
        const resumesRes = await fetch("/api/resumes");
        const resumesJson = await resumesRes.json();
        if (resumesJson.success && Array.isArray(resumesJson.data)) {
          setResumes(resumesJson.data.map((r: { id: string; title: string }) => ({ id: r.id, title: r.title })));
        }
      } catch {}
    }
    load();
  }, [user, authLoading]);

  /** Take a LinkedIn profile URL or bare username and return { username, url }. */
  function resolveLinkedIn(value: string): { username: string; url: string } | null {
    const raw = value.trim();
    if (!raw) return null;

    // Full URL form: https://www.linkedin.com/in/octocat or linkedin.com/in/octocat
    const urlMatch = raw.match(/linkedin\.com\/in\/([^/?#&]+)/i);
    if (urlMatch) {
      const username = decodeURIComponent(urlMatch[1]).trim();
      if (!username) return null;
      return { username, url: `https://www.linkedin.com/in/${username}` };
    }

    // Bare username (user can provide a handle): letters, numbers, hyphens, underscores
    const bare = raw.replace(/^@/, "");
    if (!/^[a-zA-Z0-9-]{2,50}$/.test(bare)) return null;
    return { username: bare, url: `https://www.linkedin.com/in/${bare}` };
  }

  async function findProfile() {
    setLinkError("");
    setProfileLink("");
    const resolved = resolveLinkedIn(linkedinInput);
    if (!resolved) {
      setLinkError("Enter a LinkedIn profile link (linkedin.com/in/username) or your username.");
      return;
    }
    setProfileLink(resolved.url);
    setMessage({ type: "success", text: `Resolved LinkedIn profile: ${resolved.url}` });
  }

  /** Attach the profile link to a resume's personal info. */
  async function attachLink(resumeId: string) {
    if (!profileLink) return;
    setSavingLink(true);
    try {
      const resumeRes = await fetch(`/api/resumes/${resumeId}`);
      const resumeJson = await resumeRes.json();
      const current = resumeJson.success && resumeJson.data?.personalInfo ? resumeJson.data.personalInfo : {};

      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo: { ...current, linkedin: profileLink },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: `LinkedIn profile attached to your resume.` });
      } else {
        setMessage({ type: "error", text: json.error || "Failed to save your LinkedIn profile." });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong while saving your profile." });
    } finally {
      setSavingLink(false);
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

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>
      </DashboardLayout>
    );
  }
  if (!authenticated) { router.push("/login"); return null; }

  const inputCls =
    "h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15";
  const labelCls = "text-small font-medium text-black block mb-2";

  return (
    <DashboardLayout>
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black">LinkedIn Integration</h1>
          <p className="text-body text-gray-500 mt-1">Add your LinkedIn profile to a resume — by username, no Connect button</p>
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

      {/* Username / profile-link capture */}
      <div className="bg-white border border-gray-300 rounded-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-sm flex items-center justify-center bg-blue-50 text-blue-600`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-h3 text-black">Add your LinkedIn profile</h3>
            <p className="text-small text-gray-500 mt-1">
              Paste your profile link (linkedin.com/in/username) or just your username, and we'll attach it to a resume.
            </p>
          </div>
        </div>

        <form
          className="flex items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); findProfile(); }}
        >
          <input
            value={linkedinInput}
            onChange={(e) => setLinkedinInput(e.target.value)}
            placeholder="linkedin.com/in/username  (or just username)"
            className={inputCls}
            aria-label="LinkedIn profile link or username"
          />
          <Button variant="secondary" type="submit">
            <Search className="w-3.5 h-3.5 mr-1.5" /> Find
          </Button>
        </form>
        {linkError && <p className="text-small text-red-600 mt-3">{linkError}</p>}

        {profileLink && (
          <div className="mt-4 rounded-sm border border-green-200 bg-green-50 p-4">
            <p className="text-small font-medium text-green-800">
              Found: <a href={profileLink} target="_blank" rel="noreferrer" className="underline">{profileLink}</a>
            </p>
            <p className="text-small text-green-700 mt-1 mb-3">Attach this to a resume (it shows on your personal info):</p>
            {savingLink ? (
              <Spinner />
            ) : resumes.length === 0 ? (
              <p className="text-small text-green-700">No resumes yet. Create one in the dashboard first.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {resumes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => attachLink(r.id)}
                    className="px-3 py-1.5 rounded-sm border border-green-300 bg-white text-small font-medium text-green-800 hover:bg-green-100 transition-all"
                  >
                    Add to {r.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* What syncs vs what doesn't (R-06 disclosure) */}
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 text-small text-gray-700">
          <strong className="text-amber-800">What we can do:</strong> add your LinkedIn profile link to a resume, and add
          certificates, achievements, and post references you paste below — all saved straight to your resume.
          <br />
          <strong className="text-amber-800">What we cannot do:</strong> auto-import your full LinkedIn experience, education,
          and skills. LinkedIn closed its profile-import API in 2015, and deep import requires a LinkedIn Talent Solutions
          partnership. <strong>Workaround:</strong> add certificates, achievements, and post references manually below — we
          save them directly to your resume.
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
            resume data.
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
    </DashboardLayout>
  );
}

export default function LinkedinIntegrationPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>
        </DashboardLayout>
      }
    >
      <LinkedinIntegrationContent />
    </Suspense>
  );
}