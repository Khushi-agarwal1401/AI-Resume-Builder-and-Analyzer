"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface Repo {
  id: number | string;
  name: string;
  description: string;
  url: string;
  language: string;
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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
            });
          }
        }
        setRepos(repoList);
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
        </div>
      )}

      {/* Connected — Show Repos */}
      {connected === true && !loading && (
        <div>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/updates")}
                  className="text-accent-600"
                >
                  Manage in Update Center →
                </Button>
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
    </div>
  );
}

export default function GithubIntegrationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>}>
      <GithubIntegrationContent />
    </Suspense>
  );
}
