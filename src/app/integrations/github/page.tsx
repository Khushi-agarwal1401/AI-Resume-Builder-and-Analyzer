"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface Repo {
  id: number;
  name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
}

export default function GithubIntegrationPage() {
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const [repos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected] = useState(false);

  async function handleConnect() {
    setLoading(true);
    window.location.href = "/api/github/connect";
  }

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;

  return (
    <div className="max-w-[900px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black">GitHub Integration</h1>
          <p className="text-body text-gray-500 mt-1">Import your repositories into your resume</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>

      {!connected ? (
        <div className="bg-white border border-gray-300 rounded-sm p-12 text-center">
          <div className="w-16 h-16 rounded-sm bg-gray-100 flex items-center justify-center text-3xl mb-4 mx-auto">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </div>
          <h2 className="text-h3 text-black mb-2">Connect your GitHub account</h2>
          <p className="text-body text-gray-500 mb-6">We&apos;ll import your public repositories so you can add them to your resume.</p>
          <Button onClick={handleConnect} disabled={loading}>
            {loading ? "Connecting..." : "Connect GitHub"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {repos.map((repo) => (
            <div key={repo.id} className="bg-white border border-gray-300 rounded-sm p-5 flex items-center justify-between">
              <div>
                <h3 className="text-h3 text-black">{repo.name}</h3>
                <p className="text-small text-gray-500 mt-1">{repo.description || "No description"}</p>
                <div className="flex gap-4 mt-2 text-micro text-gray-500">
                  {repo.language && <span>{repo.language}</span>}
                  <span>★ {repo.stars}</span>
                  <span>⑂ {repo.forks}</span>
                </div>
              </div>
              <Button size="sm" variant="secondary">Add to Resume</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
