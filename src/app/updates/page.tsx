"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface ResumeUpdate {
  id: string;
  source: "github";
  repo_name: string;
  repo_description: string;
  repo_url: string;
  repo_language: string;
  detected_at: string;
  status: "pending" | "added" | "ignored";
}

export default function UpdatesPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [updates, setUpdates] = useState<ResumeUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [gitHubConnected, setGitHubConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/login");
      return;
    }
    if (authenticated) {
      checkGitHubStatus();
      fetchUpdates();
    }
  }, [authenticated, authLoading, router]);

  async function checkGitHubStatus() {
    try {
      // Fetch the user profile to check github_connected status via the profiles table
      const res = await fetch("/api/resumes?limit=1");
      // Use a dedicated status check — fetch profile via auth endpoint
      const authRes = await fetch("/api/stripe/checkout");
      // Check github_connected from profiles (we reuse the existing profile fetch)
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("github_connected")
          .eq("id", authUser.id)
          .single();
        setGitHubConnected(profile?.github_connected || false);
      } else {
        setGitHubConnected(false);
      }
    } catch {
      setGitHubConnected(false);
    }
  }

  async function fetchUpdates() {
    try {
      const res = await fetch("/api/resume-updates");
      const json = await res.json();
      if (json.success) setUpdates(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const handlePoll = useCallback(async () => {
    setPolling(true);
    try {
      const res = await fetch("/api/github/poll");
      const json = await res.json();
      if (json.success) {
        setUpdates(json.data);
      }
    } catch {
      // ignore
    } finally {
      setPolling(false);
    }
  }, []);

  const handleStatusChange = useCallback(async (updateId: string, status: "added" | "ignored") => {
    const res = await fetch("/api/resume-updates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updateId, status }),
    });
    const json = await res.json();
    if (json.success) {
      setUpdates((prev) =>
        prev.map((u) => (u.id === updateId ? { ...u, status } : u))
      );
    }
  }, []);

  const pendingCount = updates.filter((u) => u.status === "pending").length;

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-h1 text-black">Resume Update Center</h1>
            <p className="text-body text-gray-500 mt-1">
              Automatically detect new projects from your connected accounts
            </p>
          </div>
          <Button
            variant={gitHubConnected ? "primary" : "secondary"}
            onClick={gitHubConnected ? handlePoll : () => router.push("/integrations/github")}
            disabled={polling}
          >
            {polling ? <Spinner /> : gitHubConnected ? "🔍 Check GitHub" : "🔗 Connect GitHub"}
          </Button>
        </div>

        {/* Status summary */}
        {gitHubConnected && (
          <div className="flex items-center gap-4 mb-6 text-small">
            <span className="text-gray-500">
              {pendingCount > 0
                ? `${pendingCount} new project${pendingCount !== 1 ? "s" : ""} detected`
                : "No pending updates"}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">
              {updates.filter((u) => u.status === "added").length} added to resume
            </span>
          </div>
        )}

        {/* Not Connected State */}
        {!gitHubConnected && !loading && (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-300 rounded-md bg-white">
            <div className="w-16 h-16 rounded-sm bg-gray-100 flex items-center justify-center text-3xl mb-6">🔗</div>
            <h2 className="text-h3 text-black mb-2">Connect GitHub</h2>
            <p className="text-body text-gray-500 mb-6 max-w-md text-center">
              Connect your GitHub account to automatically detect new repositories and add them to your resume.
            </p>
            <Button onClick={() => router.push("/integrations/github")}>Connect GitHub</Button>
          </div>
        )}

        {/* Loading */}
        {loading && gitHubConnected && (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        )}

        {/* Updates List */}
        {!loading && gitHubConnected && (
          <div className="space-y-3">
            {updates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-md bg-white">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl mb-4">📦</div>
                <h3 className="text-h3 text-black mb-1">No updates yet</h3>
                <p className="text-body text-gray-500 mb-4">Click "Check GitHub" to scan for new repositories.</p>
                <Button variant="secondary" onClick={handlePoll} disabled={polling}>
                  {polling ? <Spinner /> : "Check Now"}
                </Button>
              </div>
            ) : (
              updates.map((update) => (
                <div
                  key={update.id}
                  className={cn(
                    "bg-white border rounded-sm p-5 transition-all",
                    update.status === "pending"
                      ? "border-accent-300 border-l-4 border-l-accent-500"
                      : update.status === "added"
                      ? "border-green-200 border-l-4 border-l-green-500"
                      : "border-gray-200 border-l-4 border-l-gray-300"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-h3 text-black truncate">{update.repo_name}</h3>
                        {update.repo_language && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                            {update.repo_language}
                          </span>
                        )}
                        <span className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0",
                          update.status === "pending" ? "bg-accent-100 text-accent-700" :
                          update.status === "added" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-500"
                        )}>
                          {update.status === "pending" ? "New" : update.status === "added" ? "Added" : "Ignored"}
                        </span>
                      </div>
                      {update.repo_description && (
                        <p className="text-small text-gray-600 mb-2 line-clamp-2">{update.repo_description}</p>
                      )}
                      <div className="flex items-center gap-3 text-micro text-gray-400">
                        {update.repo_url && (
                          <a href={update.repo_url} target="_blank" rel="noreferrer" className="hover:text-accent-500">
                            View on GitHub ↗
                          </a>
                        )}
                        <span>Detected {new Date(update.detected_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {update.status === "pending" && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                      <Button size="sm" variant="primary" onClick={() => handleStatusChange(update.id, "added")}>
                        + Add to Resume
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleStatusChange(update.id, "ignored")}>
                        Ignore
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
