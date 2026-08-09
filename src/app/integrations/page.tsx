"use client";
import Preloader from "@/components/ui/Preloader";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {

  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  User,
  Briefcase,
  GraduationCap,
  Code,
  FolderGit2,
  GitPullRequest
} from "lucide-react";

interface IntegrationStatus {
  platform: "linkedin" | "github";
  connected: boolean;
  lastSync?: string;
  dataTypes: {
    profile: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
    repositories?: boolean;
    contributions?: boolean;
  };
}

function IntegrationsContent() {
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const statuses = useState<IntegrationStatus[]>([
    {
      platform: "linkedin",
      connected: false,
      dataTypes: {
        profile: false,
        experience: false,
        education: false,
        skills: false,
      },
    },
    {
      platform: "github",
      connected: false,
      dataTypes: {
        profile: false,
        experience: false,
        education: false,
        skills: false,
        repositories: false,
        contributions: false,
      },
    },
  ])[0];
  const [syncing, setSyncing] = useState<string | null>(null);

  if (authLoading) {
    return (
      <DashboardLayout>
        <Preloader />
      </DashboardLayout>
    );
  }

  function handleSync(platform: string) {
    setSyncing(platform);
    setTimeout(() => {
      setSyncing(null);
    }, 2000);
  }

  function getPlatformInfo(platform: string) {
    switch (platform) {
      case "linkedin":
        return {
          name: "LinkedIn",
          icon: "linkedin",
          color: "bg-blue-50 text-blue-600 border-blue-200",
          description: "Auto-import your public LinkedIn profile (name, education, experience, skills) in the new-resume wizard — 3 free imports/month, then Pro — and attach your profile link to any resume.",
          features: ["Profile link attachment", "Public profile import (3 free tries)", "Education & experience import", "Skills & certifications import"],
        };
      case "github":
        return {
          name: "GitHub",
          icon: "github",
          color: "bg-gray-50 text-gray-700 border-gray-200",
          description: "Import public repositories by username, detect contributions, and add trending repos to your resume.",
          features: ["Public repository import", "Contribution detection", "Trending repo discovery", "AI-powered repo suggestions"],
        };
      default:
        return null;
    }
  }

  function getDataTypesList(status: IntegrationStatus) {
    const types = [
      { key: "profile", label: "Profile", icon: User },
      { key: "experience", label: "Experience", icon: Briefcase },
      { key: "education", label: "Education", icon: GraduationCap },
      { key: "skills", label: "Skills", icon: Code },
    ];

    if (status.platform === "github") {
      types.push({ key: "repositories", label: "Repositories", icon: FolderGit2 });
      types.push({ key: "contributions", label: "Contributions", icon: GitPullRequest });
    }

    return types.filter(t => t.key in status.dataTypes);
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1120px] mx-auto px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
          <p className="text-base text-gray-500">
            Connect your LinkedIn and GitHub accounts to import data and build a stronger resume.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {statuses.map((status) => {
            const info = getPlatformInfo(status.platform);
            if (!info) return null;

            const dataTypes = getDataTypesList(status);
            const importedCount = Object.values(status.dataTypes).filter(Boolean).length;
            const totalCount = Object.keys(status.dataTypes).length;

            return (
              <div
                key={status.platform}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", info.color)}>
                      {info.icon === "linkedin" && (
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      )}
                      {info.icon === "github" && (
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{info.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        {status.connected ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Connected
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Not Connected
                          </span>
                        )}
                        {status.lastSync && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            Synced {status.lastSync}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSync(status.platform)}
                    disabled={syncing === status.platform}
                    className="shrink-0"
                  >
                    {syncing === status.platform ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">{info.description}</p>

                {/* Data Types */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Data Types</h3>
                    <span className="text-xs text-gray-500">
                      {importedCount} of {totalCount} imported
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {dataTypes.map((type) => {
                      const TypeIcon = type.icon;
                      const isImported = status.dataTypes[type.key as keyof typeof status.dataTypes];
                      return (
                        <div
                          key={type.key}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
                            isImported
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-50 text-gray-500 border border-gray-200"
                          )}
                        >
                          <TypeIcon className="w-3.5 h-3.5" />
                          {type.label}
                          {isImported && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Features</h3>
                  <ul className="space-y-2">
                    {info.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action */}
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={() => router.push(`/integrations/${status.platform}`)}
                >
                  {status.connected ? "Manage Integration" : "Connect Account"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900 mb-1">Important Notes</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• <strong>LinkedIn:</strong> LinkedIn's official API doesn't expose full profiles, so we use Proxycurl to read public profiles (name, education, experience, skills) in the new-resume wizard.</li>
                <li>• <strong>GitHub:</strong> We import public repositories only — no OAuth needed. Your private repositories remain private.</li>
                <li>• <strong>Data Privacy:</strong> All imported data is stored securely and used only for your resume building.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <Preloader />
        </DashboardLayout>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
