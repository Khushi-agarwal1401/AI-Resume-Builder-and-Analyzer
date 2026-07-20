"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function LinkedinIntegrationPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [connected] = useState(false);

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  if (!authenticated) { router.push("/login"); return null; }

  return (
    <div className="max-w-[720px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black">LinkedIn Integration</h1>
          <p className="text-body text-gray-500 mt-1">Connect your LinkedIn account for sign-in</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>Back</Button>
      </div>

      <div className="bg-white border border-gray-300 rounded-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-h3 text-black">Connection Status</h3>
            <p className="text-small text-gray-500 mt-1">
              {connected ? "Connected" : "Not connected"}
            </p>
          </div>
          {!connected && (
            <Button variant="secondary" onClick={() => window.location.href = "/api/linkedin/connect"}>
              Connect LinkedIn
            </Button>
          )}
        </div>
      </div>

      <div className="bg-accent-50 border border-accent-100 rounded-sm p-4 mb-8 text-small text-gray-700">
        LinkedIn doesn&apos;t currently allow us to import your profile data automatically.
        You can connect for sign-in, and add certificates, achievements, or updates manually below.
      </div>

      <div className="bg-white border border-gray-300 rounded-sm p-6">
        <h3 className="text-h3 text-black mb-4">Manual Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="border border-gray-300 rounded-sm p-4 text-left hover:border-gray-500 transition-colors">
            <p className="text-h3 text-black mb-1">+</p>
            <p className="text-small font-medium text-black">Add Certificate</p>
            <p className="text-micro text-gray-500">Manually add a certification</p>
          </button>
          <button className="border border-gray-300 rounded-sm p-4 text-left hover:border-gray-500 transition-colors">
            <p className="text-h3 text-black mb-1">+</p>
            <p className="text-small font-medium text-black">Add Achievement</p>
            <p className="text-micro text-gray-500">Add an award or accomplishment</p>
          </button>
          <button className="border border-gray-300 rounded-sm p-4 text-left hover:border-gray-500 transition-colors">
            <p className="text-h3 text-black mb-1">+</p>
            <p className="text-small font-medium text-black">Add Reference</p>
            <p className="text-micro text-gray-500">Note a LinkedIn post or reference</p>
          </button>
        </div>
      </div>
    </div>
  );
}
