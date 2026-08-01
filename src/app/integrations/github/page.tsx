"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { Star, GitFork, Sparkles, Check, ChevronDown, X } from "lucide-react";

interface Repo {
  id: number | string;
  name: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
}

interface RepoSuggestion {
  name: string;
  reason: string;
}

function GithubIntegrationContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // A-07: AI repo suggestions
  const [suggestions, setSuggestions] = useState<RepoSuggestion[] | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [featuredRepos, setFeaturedRepos] = useState<Set<string>>(new Set());

  // A-20: open-source contributions + trending repos
  const [picker, setPicker] = useState<null | { mode: "contributions" | "trending" | "username"; repos: Repo[] }>(null);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [resumeOptions, setResumeOptions] = useState<{ id: string; title: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [trendQuery, setTrendQuery] = useState("");

  // Import public repos by username — no OAuth needed
  const [username, setUsername] = useState("");
  const [usernameImporting, setUsernameImporting] = useState(false);

  // Handle OAuth callback results from URL params
  useEffect(() => {
    const connectedParam = searchParams.get("connected");
    const errorParam = searchParams.get("error");

    if (connectedParam === "true") {
      setConnected(true);
      setMessage({ type: "success", text: "Successfully connected to GitHub!" });
    } else if (errorParam) {
      const errors: Record<string, string> = {
        no_code: "GitHub did not provide an authorization code.",
        token_exchange_failed: "Failed to exchange code for access token.",
        save_failed: "Failed to save GitHub connection to your profile.",
        callback_failed: "An unexpected error occurred during the GitHub callback.",
        access_denied: "You declined the GitHub authorization request.",
      };
      setMessage({ type: "error", text: errors[errorParam] || `Error: ${errorParam}` });
    }
  }, [searchParams]);

  // Check GitHub connection status on mount
  useEffect(() => {
    if (authLoading || !user) return;

    const currentUserId = user.id;

    async function checkStatus() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("github_connected")
          .eq("id", currentUserId)
          .single();

        const isConnected = profile?.github_connected || false;
        setConnected(isConnected);

        if (isConnected) {
          await fetchRepos(false);
        }
      } catch {
        setConnected(false);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, [user, authLoading]);

  async function fetchRepos(showErrors = true) {
    try {
      const res = await fetch("/api/github/poll");
      const json = await res.json();
      if (json.success && json.data) {
        // Extract unique repos from resume_updates
        const seen = new Set<string>();
        const repoList: Repo[] = [];
        for (const update of json.data) {
          if (!seen.has(update.repo_name)) {
            seen.add(update.repo_name);
            repoList.push({
              id: update.id,
              name: update.repo_name,
              description: update.repo_description,
              url: update.repo_url,
              language: update.repo_language,
              stars: Number(update.repo_stars || 0),
              forks: Number(update.repo_forks || 0),
            });
          }
        }
        setRepos(repoList);
      } else if (res.status === 403 && json.upgradeRequired) {
        setMessage({
          type: "error",
          text: "GitHub sync is a Pro feature. Upgrade to Pro to import and refresh your repositories.",
        });
        setShowUpgrade(true);
      } else if (showErrors && json.error) {
        setMessage({ type: "error", text: json.error });
      }
    } catch {
      if (showErrors) {
        setMessage({ type: "error", text: "Failed to fetch repositories. Please try again." });
      }
    }
  }

  async function handleConnect() {
    setConnecting(true);
    window.location.href = "/api/github/connect";
  }

  async function handleDisconnect() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ github_connected: false, github_token: null })
        .eq("id", user!.id);

      setConnected(false);
      setRepos([]);
      setMessage({ type: "success", text: "Disconnected from GitHub. Your imported projects remain on your resume." });
    } catch {
      setMessage({ type: "error", text: "Failed to disconnect. Please try again." });
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchRepos(true);
    setRefreshing(false);
  }

  async function handleSuggest() {
    if (!targetRole.trim()) {
      setMessage({ type: "error", text: "Enter a target role first (e.g. 'Frontend Engineer')." });
      return;
    }
    setSuggesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/github/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: targetRole.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSuggestions(json.data);
      } else {
        setMessage({ type: "error", text: json.error || "Failed to get suggestions." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to get suggestions. Please try again." });
    } finally {
      setSuggesting(false);
    }
  }

  function toggleFeature(name: string) {
    setFeaturedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function loadResumeOptions() {
    try {
      const res = await fetch("/api/resumes");
      const json = await res.json();
      if (json.success) {
        setResumeOptions(
          (json.data as { id: string; title: string }[]).map((r) => ({ id: r.id, title: r.title }))
        );
      }
    } catch {
      setResumeOptions([]);
    }
  }

  async function openContributionsPicker() {
    setPickerLoading(true);
    setPickerError(null);
    setSelectedRepo(null);
    try {
      const res = await fetch("/api/github/contributions?per_page=30");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPicker({
          mode: "contributions",
          repos: json.data.map((c: { name: string; url?: string; type?: string }) => ({
            id: c.name,
            name: c.name,
            description: "",
            url: c.url || "",
            language: "",
            stars: 0,
            forks: 0,
          })),
        });
        await loadResumeOptions();
      } else {
        setPickerError(json.error || "Failed to load contributions.");
      }
    } catch {
      setPickerError("Failed to load contributions. Please try again.");
    } finally {
      setPickerLoading(false);
    }
  }

  async function searchTrendingRepos(query: string) {
    setPickerLoading(true);
    setPickerError(null);
    setSelectedRepo(null);
    try {
      const res = await fetch(`/api/github/trending?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPicker({ mode: "trending", repos: json.data });
        await loadResumeOptions();
      } else {
        setPickerError(json.error || "Search failed.");
      }
    } catch {
      setPickerError("Search failed. Please try again.");
    } finally {
      setPickerLoading(false);
    }
  }

  async function importByUsername() {
    const u = username.trim();
    if (!u) {
      setMessage({ type: "error", text: "Enter a GitHub username first." });
      return;
    }
    setUsernameImporting(true);
    setPickerError(null);
    setSelectedRepo(null);
    setMessage(null);
    try {
      const res = await fetch("/api/github/import-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u }),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPicker({ mode: "username", repos: json.data });
        await loadResumeOptions();
      } else {
        setPickerError(json.error || "Failed to load repositories.");
      }
    } catch {
      setPickerError("Failed to load repositories. Please try again.");
    } finally {
      setUsernameImporting(false);
    }
  }

  async function saveRepoToResume(repo: Repo, resumeId: string) {
    setSaving(true);
    setPickerError(null);
    try {
      const res = await fetch("/api/github/trending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: repo.name,
          repoDescription: repo.description,
          repoUrl: repo.url,
          repoLanguage: repo.language,
          resumeId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: `"${repo.name}" added to your resume.` });
        setPicker(null);
      } else {
        setPickerError(json.error || "Failed to add repository.");
      }
    } catch {
      setPickerError("Failed to add repository. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  return (
    <div className="max-w-[900px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black">GitHub Integration</h1>
          <p className="text-body text-gray-500 mt-1">Import your repositories into your resume</p>
        </div>
        <div className="flex gap-2">
          {connected && (
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Spinner /> : "⟳ Refresh"}
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>

      {/* Status message banner */}
      {message && (
        <div className={cn(
          "mb-6 px-4 py-3 rounded-sm text-small border",
          message.type === "success"
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
        )}>
          {message.text}
        </div>
      )}

      {/* Initial loading state */}
      {loading && connected === null && (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      )}

      {/* Not Connected State */}
      {connected === false && !loading && (
        <div className="bg-white border border-gray-300 rounded-sm p-12 text-center">
          <div className="w-16 h-16 rounded-sm bg-gray-100 flex items-center justify-center text-3xl mb-4 mx-auto">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          <h2 className="text-h3 text-black mb-2">Connect your GitHub account</h2>
          <p className="text-body text-gray-500 mb-6 max-w-md mx-auto">
            We&apos;ll import your public repositories so you can add them to your resume.
            You can also auto-detect new projects from the Resume Update Center.
          </p>
          <Button onClick={handleConnect} disabled={connecting}>
            {connecting ? "Connecting..." : "Connect GitHub"}
          </Button>

          {/* Import by username — no OAuth needed */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-h3 text-black mb-1">No GitHub account to connect?</h3>
            <p className="text-body text-gray-500 mb-4 max-w-md mx-auto">
              Import public repositories by username instead — no sign-in needed.
            </p>
            <div className="flex gap-2 justify-center max-w-md mx-auto">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && importByUsername()}
                placeholder="e.g. ankitbhalke"
                className="flex-1 rounded-sm border border-gray-300 px-3 py-2 text-small text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={importByUsername}
                disabled={usernameImporting}
                className="bg-indigo-600 hover:bg-indigo-700 border-none shrink-0"
              >
                {usernameImporting ? <Spinner /> : "Fetch Repos"}
              </Button>
            </div>
            {pickerError && (
              <p className="mt-3 text-small text-red-600">{pickerError}</p>
            )}
          </div>
        </div>
      )}

      {/* Connected — Show Repos */}
      {connected === true && !loading && (
        <div>
          {/* Pro upgrade banner (A-09) */}
          {showUpgrade && (
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-sm p-6 mb-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-h3 font-bold mb-1">GitHub sync is a Pro feature</h3>
                <p className="text-small text-indigo-100">
                  Upgrade to Pro to auto-detect new repositories and keep stats fresh.
                </p>
              </div>
              <Button
                variant="accent"
                onClick={() => router.push("/pricing")}
                className="bg-white text-indigo-700 hover:bg-indigo-50 border-none shrink-0"
              >
                Upgrade to Pro
              </Button>
            </div>
          )}

          {/* Connection info bar */}
          <div className="bg-green-50 border border-green-200 rounded-sm p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="text-small font-medium text-green-800">Connected to GitHub</p>
                <p className="text-micro text-green-600">{repos.length} repositor{repos.length === 1 ? "y" : "ies"} tracked</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Disconnect
            </Button>
          </div>

          {/* AI Suggestions (A-07) */}
          <div className="bg-white border border-indigo-200 rounded-sm mb-6 overflow-hidden">
            <button
              onClick={() => setSuggestOpen(!suggestOpen)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-indigo-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-small font-bold text-gray-900">AI Suggestions</p>
                  <p className="text-micro text-gray-500">
                    Get 3-5 repos most relevant to a target role, with one-line reasons
                  </p>
                </div>
              </div>
              <ChevronDown size={16} className={cn("text-gray-400 transition-transform", suggestOpen && "rotate-180")} />
            </button>

            {suggestOpen && (
              <div className="px-5 pb-5 border-t border-indigo-100">
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
                    placeholder="e.g. Frontend Engineer, Data Scientist, DevOps"
                    className="flex-1 rounded-sm border border-gray-300 px-3 py-2 text-small text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSuggest}
                    disabled={suggesting}
                    className="bg-indigo-600 hover:bg-indigo-700 border-none"
                  >
                    {suggesting ? <Spinner /> : <><Sparkles size={14} /> Suggest Repos</>}
                  </Button>
                </div>

                {suggestions && suggestions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                      Recommended for "{targetRole}"
                    </p>
                    {suggestions.map((s) => {
                      const featured = featuredRepos.has(s.name);
                      return (
                        <div
                          key={s.name}
                          className={cn(
                            "flex items-start justify-between gap-3 p-3 rounded-sm border transition-colors",
                            featured ? "border-emerald-300 bg-emerald-50" : "border-gray-200"
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-small font-bold text-gray-900 truncate">{s.name}</span>
                              {featured && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wider shrink-0">
                                  Featured
                                </span>
                              )}
                            </div>
                            <p className="text-small text-gray-500 mt-0.5">{s.reason}</p>
                          </div>
                          <button
                            onClick={() => toggleFeature(s.name)}
                            className={cn(
                              "shrink-0 w-8 h-8 rounded-sm flex items-center justify-center border transition-colors",
                              featured
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "bg-white text-gray-400 border-gray-200 hover:border-emerald-400 hover:text-emerald-600"
                            )}
                            title={featured ? "Remove from featured" : "Feature on resume"}
                          >
                            {featured ? <Check size={14} /> : <Check size={14} className="opacity-0" />}
                          </button>
                        </div>
                      );
                    })}
                    <p className="text-micro text-gray-400 pt-1">
                      Open the{" "}
                      <button onClick={() => router.push("/updates")} className="text-accent-600 hover:underline font-medium">
                        Resume Update Center
                      </button>{" "}
                      to add featured repos to a resume.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Repos list */}
          {repos.length === 0 && !refreshing ? (
            <div className="bg-white border border-gray-300 rounded-sm p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl mb-4 mx-auto">📦</div>
              <h3 className="text-h3 text-black mb-2">No repositories found</h3>
              <p className="text-body text-gray-500 mb-6">
                We couldn&apos;t find any new repositories. Go to the{" "}
                <button onClick={() => router.push("/updates")} className="text-accent-500 hover:underline font-medium">
                  Resume Update Center
                </button>{" "}
                to check for updates.
              </p>
              <Button variant="secondary" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <Spinner /> : "Refresh"}
              </Button>
            </div>
          ) : refreshing ? (
            <div className="flex items-center justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-small text-gray-500">
                  Showing {repos.length} tracked repositor{repos.length === 1 ? "y" : "ies"}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openContributionsPicker}
                    className="text-indigo-600"
                  >
                    + Add Open Source Contribution
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTrendQuery("");
                      setPicker({ mode: "trending", repos: [] });
                      setSelectedRepo(null);
                    }}
                    className="text-indigo-600"
                  >
                    + Add Trending Repository
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/updates")}
                    className="text-accent-600"
                  >
                    Manage in Update Center →
                  </Button>
                </div>
              </div>
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-white border border-gray-300 rounded-sm p-5 flex items-center justify-between hover:shadow-sm transition-shadow"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-h3 text-black truncate">{repo.name}</h3>
                      {repo.language && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                          {repo.language}
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-small text-gray-500 mt-1 mb-2 line-clamp-2">{repo.description}</p>
                    )}
                    <div className="flex gap-4 text-micro text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <Star size={11} className="text-amber-400" />
                        {repo.stars.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <GitFork size={11} className="text-gray-500" />
                        {repo.forks.toLocaleString()}
                      </span>
                      <a href={repo.url} target="_blank" rel="noreferrer" className="hover:text-accent-500">
                        View on GitHub ↗
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* A-20: Repo picker modal */}
      {picker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPicker(null)} />
          <div className="relative w-[92vw] max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {picker.mode === "contributions"
                    ? "Your Recent Open Source Contributions"
                    : picker.mode === "username"
                    ? `Public Repos of @${username || "user"}`
                    : "Search Trending Repositories"}
                </h3>
                <p className="text-xs text-gray-500">
                  {picker.mode === "contributions"
                    ? "Repos you recently pushed to or contributed to on GitHub"
                    : picker.mode === "username"
                    ? "Public repositories fetched by username — select one to add to a resume"
                    : "Search GitHub by stars, then add one to a resume"}
                </p>
              </div>
              <button
                onClick={() => setPicker(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {picker.mode === "trending" && (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={trendQuery}
                    onChange={(e) => setTrendQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && trendQuery.trim() && searchTrendingRepos(trendQuery)}
                    placeholder="Search repos, e.g. 'fastapi', 'machine learning'"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => trendQuery.trim() && searchTrendingRepos(trendQuery)}
                    disabled={pickerLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 border-none shrink-0"
                  >
                    {pickerLoading ? <Spinner /> : "Search"}
                  </Button>
                </div>
              )}

              {pickerError && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
                  {pickerError}
                </div>
              )}

              {pickerLoading ? (
                <div className="flex items-center justify-center py-16"><Spinner /></div>
              ) : picker.repos.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500">
                  {picker.mode === "contributions"
                    ? "No recent contributions found. Push some commits to public repos, then refresh."
                    : picker.mode === "username"
                    ? "No public repositories found for this username."
                    : "Search above to find trending repositories."}
                </div>
              ) : (
                <div className="space-y-2">
                  {picker.repos.map((repo) => (
                    <button
                      key={`${repo.id}-${repo.name}`}
                      onClick={() => setSelectedRepo(selectedRepo?.name === repo.name ? null : repo)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedRepo?.name === repo.name
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{repo.name}</p>
                          {repo.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{repo.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <Star size={11} className="text-amber-400" /> {repo.stars.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <GitFork size={11} /> {repo.forks.toLocaleString()}
                          </span>
                          {repo.language && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {repo.language}
                            </span>
                          )}
                        </div>
                      </div>

                      {selectedRepo?.name === repo.name && (
                        <div className="mt-3 pt-3 border-t border-indigo-100">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                            Add to which resume?
                          </p>
                          {resumeOptions.length === 0 ? (
                            <p className="text-xs text-gray-500">
                              No resumes yet.{" "}
                              <button onClick={() => router.push("/dashboard")} className="text-accent-600 hover:underline font-medium">
                                Create one first
                              </button>
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {resumeOptions.map((r) => (
                                <button
                                  key={r.id}
                                  onClick={() => saveRepoToResume(repo, r.id)}
                                  disabled={saving}
                                  className="px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 text-left text-xs font-medium text-gray-800 transition-all disabled:opacity-50"
                                >
                                  {saving ? "Adding..." : `+ ${r.title}`}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GithubIntegrationPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>}>
        <GithubIntegrationContent />
      </Suspense>
    </DashboardLayout>
  );
}
