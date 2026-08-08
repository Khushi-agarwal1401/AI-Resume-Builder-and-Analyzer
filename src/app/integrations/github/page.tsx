"use client";
import Preloader from "@/components/ui/Preloader";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { Star, GitFork, GitPullRequest, Flame, X, Search, Sparkles, CheckCircle2, AlertCircle, Clock, User, Code, FolderGit2 } from "lucide-react";


interface Repo {
  id: number | string;
  name: string;
  description: string;
  url: string;
  language: string;
  stars?: number;
  forks?: number;
  type?: string;
}

interface ResumeOption {
  id: string;
  title: string;
  template: string;
}

interface RepoCandidate {
  name: string;
  url?: string;
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
  type?: string;
}

function GithubIntegrationContent() {
  const { loading: authLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [importing, setImporting] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [usernameImported, setUsernameImported] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // A-20: Open-source contribution + trending repo discovery
  const [contribOpen, setContribOpen] = useState(false);
  const [trendingOpen, setTrendingOpen] = useState(false);
  const [candidates, setCandidates] = useState<RepoCandidate[]>([]);
  const [search, setSearch] = useState("");
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [activeTarget, setActiveTarget] = useState<"contributions" | "trending" | null>(null);
  const [addingToResume, setAddingToResume] = useState<string | null>(null);

  // A-07: AI suggestions for repos to feature
  const [targetRole, setTargetRole] = useState("");
  const [suggestions, setSuggestions] = useState<{ name: string; reason: string }[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  // Connection and data tracking
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [importedData, setImportedData] = useState({
    profile: false,
    repositories: false,
    contributions: false,
    skills: false,
  });

  async function fetchResumes() {
    try {
      const res = await fetch("/api/resumes");
      const json = await res.json();
      if (json.success) {
        setResumes((json.data as ResumeOption[]).map((r) => ({
          id: r.id,
          title: r.title,
          template: r.template,
        })));
      }
    } catch {
      // ignore — picker shows empty state
    }
  }

  async function importByUsername(manualUsername?: string) {
    const name = ((manualUsername ?? username) || "").trim().replace(/^@/, "");
    if (!name) {
      setUsernameError("Enter a GitHub username to import their public repositories.");
      return;
    }
    setImporting(true);
    setUsernameError("");
    setRepos([]);
    setUsernameImported("");
    try {
      const res = await fetch("/api/github/import-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.repos)) {
        const list = json.data.repos as Repo[];
        setRepos(list);
        setUsernameImported(name);
        setUsername(name);
        setIsConnected(true);
        setLastSync("just now");
        setImportedData(prev => ({ ...prev, profile: true, repositories: true }));
        setMessage({ type: "success", text: `Loaded ${list.length} public repositor${list.length === 1 ? "y" : "ies"} for @${name}.` });
      } else {
        setUsernameError(json.error || "Could not import repositories for that username.");
      }
    } catch {
      setUsernameError("Failed to import repositories. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  async function openDiscover(mode: "contributions" | "trending") {
    setActiveTarget(mode);
    setCandidates([]);
    setSearch("");
    setAddingId(null);
    setAddingToResume(null);
    if (mode === "contributions") {
      setContribOpen(true);
      fetchResumes();
      if (!usernameImported) {
        setDiscoveryLoading(false);
        setMessage({ type: "error", text: "Enter a GitHub username first — contributions are detected from a username's public activity." });
        return;
      }
      setDiscoveryLoading(true);
      try {
        const res = await fetch(`/api/github/contributions?username=${encodeURIComponent(usernameImported)}&per_page=30`);
        const json = await res.json();
        if (json.success) setCandidates(json.data);
        else if (json.error) setMessage({ type: "error", text: json.error });
      } catch {
        setMessage({ type: "error", text: "Failed to load contributions." });
      } finally {
        setDiscoveryLoading(false);
      }
    }
    if (mode === "trending") setTrendingOpen(true);
  }

  async function searchTrending() {
    if (!search.trim()) return;
    setDiscoveryLoading(true);
    setCandidates([]);
    try {
      const res = await fetch(`/api/github/trending?q=${encodeURIComponent(search.trim())}&sort=stars&per_page=10`);
      const json = await res.json();
      if (json.success) setCandidates(json.data);
      else if (json.error) setMessage({ type: "error", text: json.error });
    } catch {
      setMessage({ type: "error", text: "Failed to search repositories." });
    } finally {
      setDiscoveryLoading(false);
    }
  }

  async function addCandidate(candidate: RepoCandidate, resumeId: string) {
    setAddingId(candidate.name);
    try {
      const endpoint = activeTarget === "contributions" ? "/api/github/contributions" : "/api/github/trending";
      const body = activeTarget === "contributions"
        ? { repoName: candidate.name, repoUrl: candidate.url, resumeId }
        : {
          repoName: candidate.name,
          repoDescription: candidate.description,
          repoUrl: candidate.url,
          repoLanguage: candidate.language,
          resumeId,
        };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: `Added "${candidate.name}" to your resume.` });
        if (activeTarget === "contributions") {
          setContribOpen(false);
          setImportedData(prev => ({ ...prev, contributions: true }));
        }
        else setTrendingOpen(false);
      } else {
        setMessage({ type: "error", text: json.error || "Failed to add repository." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to add repository." });
    } finally {
      setAddingId(null);
    }
  }

  async function addImportedRepo(repo: Repo, resumeId: string) {
    setAddingId(repo.name);
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
        setMessage({ type: "success", text: `Added "${repo.name}" to your resume.` });
      } else {
        setMessage({ type: "error", text: json.error || "Failed to add repository." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to add repository." });
    } finally {
      setAddingId(null);
    }
  }

  // A-07: AI recommends which imported repos to feature for a target role
  async function getSuggestions() {
    const role = targetRole.trim();
    if (!role) {
      setSuggestError("Enter a target role first (e.g. Frontend Engineer).");
      return;
    }
    if (repos.length === 0) {
      setSuggestError("Import a GitHub username first so the AI has repositories to recommend from.");
      return;
    }
    setSuggesting(true);
    setSuggestError("");
    setSuggestions([]);
    try {
      const res = await fetch("/api/github/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: role,
          repos: repos.map((r) => ({ name: r.name, description: r.description, language: r.language, stars: r.stars })),
        }),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSuggestions(json.data);
        if (json.data.length === 0) setSuggestError("No suggestions returned. Try again.");
      } else {
        setSuggestError(json.error || "Could not generate suggestions.");
      }
    } catch {
      setSuggestError("Failed to generate suggestions. Please try again.");
    } finally {
      setSuggesting(false);
    }
  }

  if (authLoading) {
    return (
      <DashboardLayout>
        <Preloader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-h1 text-black">GitHub Integration</h1>
            <p className="text-body text-gray-500 mt-1">Import public repositories by username — no OAuth needed</p>
          </div>
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
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

        {/* Connection Status Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 text-gray-700">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">GitHub Connection Status</h2>
                <div className="flex items-center gap-2 mt-1">
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Username Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Not Connected
                    </span>
                  )}
                  {lastSync && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      Synced {lastSync}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Data Types Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "profile", label: "Profile", icon: User, available: true },
              { key: "repositories", label: "Repositories", icon: FolderGit2, available: true },
              { key: "contributions", label: "Contributions", icon: GitPullRequest, available: true },
              { key: "skills", label: "Skills", icon: Code, available: false },
            ].map((item) => {
              const Icon = item.icon;
              const isImported = importedData[item.key as keyof typeof importedData];
              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border ${item.available
                    ? isImported
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                    : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="flex-1">{item.label}</span>
                  {isImported && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {!item.available && <AlertCircle className="w-3.5 h-3.5" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Username import */}
        <div className="bg-white border border-gray-300 rounded-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-sm flex items-center justify-center bg-gray-100 text-gray-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <div>
              <h2 className="text-h3 text-black">Import by GitHub username</h2>
              <p className="text-small text-gray-500 mt-1">
                Enter anyone's GitHub username (yours or a profile you'd like to reference) and we'll fetch their
                public repositories straight from the GitHub API — no OAuth, no Connect button.
              </p>
            </div>
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); importByUsername(); }}
          >
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="octocat"
                className="h-10 w-full rounded-sm border border-gray-300 pl-8 pr-4 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                aria-label="GitHub username"
              />
            </div>
            <Button variant="secondary" type="submit" disabled={importing}>
              {importing ? <Spinner /> : <>
                <Search className="w-3.5 h-3.5 mr-1.5" /> Fetch Repos
              </>}
            </Button>
          </form>
          {usernameError && (
            <p className="text-small text-red-600 mt-3">{usernameError}</p>
          )}
        </div>

        {/* A-07: AI suggestions for repos to feature */}
        {repos.length > 0 && (
          <div className="bg-white border border-gray-300 rounded-sm p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-sm flex items-center justify-center bg-accent-50 text-accent-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-h3 text-black">AI repo suggestions</h2>
                <p className="text-small text-gray-500 mt-1">
                  Enter a target role and the AI will recommend which of @{usernameImported}'s repositories best
                  showcase the skills for it — with one-line reasons.
                </p>
              </div>
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => { e.preventDefault(); getSuggestions(); }}
            >
              <input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Frontend Engineer"
                className="h-10 flex-1 rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                aria-label="Target role"
              />
              <Button variant="secondary" type="submit" disabled={suggesting}>
                {suggesting ? <Spinner /> : <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Suggest Repos
                </>}
              </Button>
            </form>
            {suggestError && <p className="text-small text-red-600 mt-3">{suggestError}</p>}

            {suggestions.length > 0 && (
              <div className="mt-4 space-y-2">
                {suggestions.map((s) => (
                  <div key={s.name} className="rounded-sm border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-body font-medium text-black">{s.name}</p>
                    <p className="text-small text-gray-500 mt-0.5">{s.reason}</p>
                  </div>
                ))}
                <p className="text-micro text-gray-400 pt-1">
                  Suggestions are AI-generated — add them to a resume using the "+ Add to Resume" button on the repo cards above.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Imported repos */}
        {repos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-small text-gray-500">
                {repos.length} public repositor{repos.length === 1 ? "y" : "ies"} for @{usernameImported} — add any to a resume below.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => importByUsername(usernameImported)}
                  className="text-accent-600"
                >
                  ⟳ Refresh
                </Button>
                {/* A-20: discover open-source contributions / trendings */}
                <Button variant="secondary" size="sm" onClick={() => openDiscover("contributions")}>
                  <GitPullRequest className="w-3.5 h-3.5 mr-1.5" />
                  Add Contribution
                </Button>
                <Button variant="secondary" size="sm" onClick={() => openDiscover("trending")}>
                  <Flame className="w-3.5 h-3.5 mr-1.5" />
                  Add Trending Repo
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
                    {(typeof repo.stars === "number" || typeof repo.forks === "number") && (
                      <span className="flex items-center gap-3">
                        {typeof repo.stars === "number" && (
                          <span className="flex items-center gap-1" title="Stars">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {repo.stars.toLocaleString()}
                          </span>
                        )}
                        {typeof repo.forks === "number" && (
                          <span className="flex items-center gap-1" title="Forks">
                            <GitFork className="w-3 h-3 text-gray-400" />
                            {repo.forks.toLocaleString()}
                          </span>
                        )}
                      </span>
                    )}
                    <a href={repo.url} target="_blank" rel="noreferrer" className="hover:text-accent-500">
                      View on GitHub ↗
                    </a>
                  </div>
                </div>
                <div className="relative shrink-0 ml-4">
                  {addingToResume === repo.name ? (
                    <div className="absolute right-0 bottom-full mb-1 z-20 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-[240px]">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-1">
                        Add to which resume?
                      </p>
                      {resumes.length === 0 ? (
                        <p className="text-xs text-gray-500 px-1 pb-1">No resumes yet. Create one in the dashboard first.</p>
                      ) : (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {resumes.map((r) => (
                            <button
                              key={r.id}
                              disabled={addingId === repo.name}
                              onClick={() => { fetchResumes(); addImportedRepo(repo, r.id); }}
                              className="w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-accent-50 text-left transition-colors"
                            >
                              <span className="text-xs font-medium text-gray-800 truncate">{r.title}</span>
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase shrink-0">{r.template}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={addingId === repo.name}
                      onClick={async () => {
                        await fetchResumes();
                        setAddingToResume(addingToResume === repo.name ? null : repo.name);
                      }}
                    >
                      {addingId === repo.name ? <Spinner /> : "+ Add to Resume"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {repos.length === 0 && !importing && (
          <div className="bg-white border border-gray-300 rounded-sm p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl mb-4 mx-auto">📦</div>
            <h3 className="text-h3 text-black mb-2">No repositories loaded yet</h3>
            <p className="text-body text-gray-500 mb-6 max-w-md mx-auto">
              Enter a GitHub username above to load their public repositories. You can then add
              projects to a resume, detect recent open-source contributions, or find trending repos.
            </p>
          </div>
        )}

        {/* Imported Data Preview */}
        {isConnected && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mt-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-gray-900">Imported Data Preview</h3>
            </div>
            <div className="space-y-4">
              {usernameImported && (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <User className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-900">GitHub Profile</p>
                    <a href={`https://github.com/${usernameImported}`} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 hover:underline mt-1 block">
                      @{usernameImported}
                    </a>
                  </div>
                </div>
              )}
              {importedData.repositories && repos.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <FolderGit2 className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Repositories</p>
                    <p className="text-sm text-gray-600 mt-1">{repos.length} public repositories imported. Add them to your resume using the "+ Add to Resume" buttons above.</p>
                  </div>
                </div>
              )}
              {importedData.contributions && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <GitPullRequest className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">Contributions</p>
                    <p className="text-sm text-blue-700 mt-1">Open-source contributions added to your resume's projects section.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* A-20: Contribution discovery dialog */}
        {contribOpen && (
          <DiscoverDialog
            title="Add an open-source contribution"
            subtitle={`Repos @${usernameImported || "…"} recently pushed to, reviewed, or opened issues/PRs for.`}
            loading={discoveryLoading}
            candidates={candidates}
            showResumePicker
            onResumesRequest={fetchResumes}
            resumes={resumes}
            addingId={addingId}
            addingToResume={addingToResume}
            setAddingToResume={setAddingToResume}
            onClose={() => setContribOpen(false)}
            onAdd={addCandidate}
          />
        )}

        {/* A-20: Trending repo discovery dialog */}
        {trendingOpen && (
          <DiscoverDialog
            title="Add a trending repository"
            subtitle="Search GitHub's public repo index by stars — e.g. react, vector database, RAG."
            loading={discoveryLoading}
            candidates={candidates}
            search={search}
            setSearch={setSearch}
            onSearch={searchTrending}
            onClose={() => setTrendingOpen(false)}
            onAdd={addCandidate}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default function GithubIntegrationPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <Preloader />
        </DashboardLayout>
      }
    >
      <GithubIntegrationContent />
    </Suspense>
  );
}

interface DiscoverDialogProps {
  title: string;
  subtitle: string;
  loading: boolean;
  candidates: RepoCandidate[];
  onClose: () => void;
  onAdd: (candidate: RepoCandidate, resumeId: string) => void;
  showResumePicker?: boolean;
  onResumesRequest?: () => void;
  resumes?: ResumeOption[];
  addingId?: string | null;
  addingToResume?: string | null;
  setAddingToResume?: (id: string | null) => void;
  search?: string;
  setSearch?: (v: string) => void;
  onSearch?: () => void;
}

function DiscoverDialog(props: DiscoverDialogProps) {
  const {
    title,
    subtitle,
    loading,
    candidates,
    onClose,
    onAdd,
    showResumePicker = false,
    onResumesRequest,
    resumes = [],
    addingId,
    addingToResume,
    setAddingToResume,
    search,
    setSearch,
    onSearch,
  } = props;

  const pickResumes = () => {
    onResumesRequest?.();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {showResumePicker && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-500">Found {candidates.length} contributions.</p>
              <Button size="sm" variant="ghost" onClick={pickResumes}>Refresh</Button>
            </div>
          )}

          {!showResumePicker && (
            <div className="flex gap-2 mb-4">
              <input
                value={search}
                onChange={(e) => setSearch?.(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
                placeholder="Search repos… e.g. react, RAG, vector DB"
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-accent-500"
              />
              <Button size="sm" variant="secondary" onClick={onSearch} disabled={loading}>
                {loading ? <Spinner /> : "Search"}
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16"><Spinner /></div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No repositories found yet.</p>
              {!showResumePicker && (
                <p className="text-xs text-gray-400 mt-1">Try a different search term.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {candidates.map((c) => (
                <div key={c.name} className="border border-gray-200 rounded-xl p-3.5 hover:border-accent-300 hover:bg-accent-50/30 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-gray-800 truncate">{c.name}</p>
                        {(typeof c.stars === "number" || typeof c.forks === "number") && (
                          <span className="flex items-center gap-2 text-micro text-gray-400 shrink-0">
                            {typeof c.stars === "number" && (
                              <span className="flex items-center gap-1" title="Stars">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{c.stars.toLocaleString()}
                              </span>
                            )}
                            {typeof c.forks === "number" && (
                              <span className="flex items-center gap-1" title="Forks">
                                <GitFork className="w-3 h-3" />{c.forks.toLocaleString()}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      {c.description ? (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                      ) : null}
                      {c.language ? (
                        <span className="inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {c.language}
                        </span>
                      ) : null}
                      {c.type ? (
                        <span className="inline-block ml-1 text-[10px] text-gray-400">{c.type}</span>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={addingId === c.name}
                      onClick={() => {
                        pickResumes();
                        setAddingToResume?.(addingToResume === c.name ? null : c.name);
                      }}
                    >
                      {addingId === c.name ? <Spinner /> : "+ Add"}
                    </Button>
                  </div>

                  {addingToResume === c.name && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Add to which resume?
                      </p>
                      {resumes.length === 0 ? (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-500">No resumes yet. Create one in the dashboard first.</p>
                          <Button size="sm" variant="secondary" onClick={() => { window.location.href = "/dashboard"; }}>Go to Dashboard</Button>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {resumes.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => onAdd(c, r.id)}
                              className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-accent-400 hover:bg-accent-50 text-left transition-all"
                            >
                              <span className="text-xs font-medium text-gray-800 truncate">{r.title}</span>
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase shrink-0">{r.template}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}