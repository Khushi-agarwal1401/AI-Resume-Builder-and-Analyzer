"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

function LinkedinIntegrationContent() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  if (!authenticated) { router.push("/login"); return null; }

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
        <div className="bg-white border border-gray-300 rounded-sm p-6">
          <h3 className="text-h3 text-black mb-3">Benefits of Connecting</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-body text-gray-600">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>Auto-fill your profile with LinkedIn information</span>
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

        <div className="bg-accent-50 border border-accent-100 rounded-sm p-4 text-small text-gray-700">
          <strong>Note:</strong> LinkedIn&apos;s API has restrictions on data import.
          After connecting, your profile name and email will be synced.
          You can manually add certificates and achievements below.
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
