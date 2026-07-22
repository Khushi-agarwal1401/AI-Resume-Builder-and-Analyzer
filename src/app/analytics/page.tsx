"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Spinner } from "@/components/ui/Spinner";

interface AnalyticsData {
  // ATS score history from resume analyses
  scoreHistory: { date: string; score: number }[];
  // Application stats from Job Tracker self-reporting
  totalApplications: number;
  interviewCount: number;
  offerCount: number;
  interviewRate: number | null;
}

export default function AnalyticsPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"score" | "applications">("score");

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/login");
      return;
    }
    if (authenticated) fetchAnalytics();
  }, [authenticated, authLoading, router]);

  async function fetchAnalytics() {
    try {
      // 1. Fetch ATS score history from job_analyses
      const atsRes = await fetch("/api/analyze-jd");
      const atsJson = await atsRes.json();
      const scoreHistory = (atsJson.data || [])
        .filter((a: Record<string, unknown>) => typeof a.match_percentage === "number")
        .map((a: Record<string, unknown>) => ({
          date: (a.created_at as string)?.split("T")[0] || "",
          score: a.match_percentage as number,
        }))
        .slice(-10); // Last 10 data points

      // 2. Fetch application stats from Job Tracker
      const appRes = await fetch("/api/applications");
      const appJson = await appRes.json();
      const applications = appJson.data || [];
      const totalApplications = applications.length;
      const interviewCount = applications.filter(
        (a: Record<string, unknown>) => a.status === "interview" || a.status === "offer"
      ).length;
      const offerCount = applications.filter(
        (a: Record<string, unknown>) => a.status === "offer"
      ).length;
      const interviewRate = totalApplications > 0
        ? Math.round((interviewCount / totalApplications) * 100)
        : null;

      setData({ scoreHistory, totalApplications, interviewCount, offerCount, interviewRate });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>
      </DashboardLayout>
    );
  }

  const hasScoreData = data && data.scoreHistory.length >= 2;
  const hasAppData = data && data.totalApplications >= 2;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-h1 text-black">Analytics</h1>
          <p className="text-body text-gray-500 mt-1">
            Track your resume performance and job search progress.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-0 border-b border-gray-300 mb-8">
          <button
            onClick={() => setViewMode("score")}
            className={`px-4 py-2.5 text-body border-b-2 transition-all ${
              viewMode === "score"
                ? "border-accent-500 text-black font-medium"
                : "border-transparent text-gray-500 hover:text-black"
            }`}
          >
            Estimated Compatibility Score
          </button>
          <button
            onClick={() => setViewMode("applications")}
            className={`px-4 py-2.5 text-body border-b-2 transition-all ${
              viewMode === "applications"
                ? "border-accent-500 text-black font-medium"
                : "border-transparent text-gray-500 hover:text-black"
            }`}
          >
            Self-Reported Interview Rate
          </button>
        </div>

        {viewMode === "score" && (
          <div className="bg-white border border-gray-300 rounded-sm p-6">
            <h2 className="text-h3 text-black mb-2">Estimated Compatibility Score Trend</h2>
            <p className="text-small text-gray-500 mb-6">
              Based on your resume analysis history. This is an estimated score, not a guaranteed ATS result.
            </p>

            {hasScoreData ? (
              <div className="h-64 relative">
                {/* Simple inline SVG line chart */}
                <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((val) => (
                    <g key={val}>
                      <line
                        x1="0" y1={200 - (val * 2)}
                        x2="600" y2={200 - (val * 2)}
                        stroke="#e5e7eb" strokeWidth="1"
                      />
                      <text x="-10" y={200 - (val * 2) + 4} textAnchor="end" className="text-[10px]" fill="#9ca3af">
                        {val}
                      </text>
                    </g>
                  ))}

                  {/* Line chart */}
                  {data && data.scoreHistory.length > 1 && (() => {
                    const points = data.scoreHistory;
                    const minScore = Math.min(...points.map(p => p.score)) - 10;
                    const maxScore = Math.max(...points.map(p => p.score)) + 10;
                    const range = maxScore - minScore || 1;
                    const xStep = 600 / (points.length - 1 || 1);
                    
                    const pathD = points.map((p, i) => {
                      const x = i * xStep;
                      const y = 200 - ((p.score - minScore) / range) * 180;
                      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                    }).join(" ");

                    return (
                      <>
                        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
                        {/* Dots */}
                        {points.map((p, i) => {
                          const x = i * xStep;
                          const y = 200 - ((p.score - minScore) / range) * 180;
                          return (
                            <circle key={i} cx={x} cy={y} r="4" fill="#6366f1" className="hover:r-6 transition-all">
                              <title>{p.date}: {p.score}</title>
                            </circle>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between mt-2 px-2">
                  {data && data.scoreHistory.map((p, i) => (
                    <span key={i} className="text-[9px] text-gray-400">
                      {new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl mb-4">📈</div>
                <h3 className="text-h3 text-black mb-1">Not enough data yet</h3>
                <p className="text-body text-gray-500 max-w-sm">
                  Check back after you&apos;ve analyzed at least 2 resumes to see your score trend.
                </p>
              </div>
            )}
          </div>
        )}

        {viewMode === "applications" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-300 rounded-sm p-6">
              <h2 className="text-h3 text-black mb-2">Self-Reported Interview Rate</h2>
              <p className="text-small text-gray-500 mb-6">
                Based on outcomes you&apos;ve logged in Job Tracker — not a prediction.
              </p>

              {hasAppData ? (
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-sm">
                    <p className="text-h1 text-black font-bold">{data?.totalApplications || 0}</p>
                    <p className="text-small text-gray-500">Applications</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-sm">
                    <p className="text-h1 text-amber-600 font-bold">{data?.interviewCount || 0}</p>
                    <p className="text-small text-amber-700">Interviews / Offers</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-sm">
                    <p className="text-h1 text-green-600 font-bold">{data?.interviewRate || 0}%</p>
                    <p className="text-small text-green-700">Interview Rate</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl mb-4">📊</div>
                  <h3 className="text-h3 text-black mb-1">Not enough data yet</h3>
                  <p className="text-body text-gray-500 max-w-sm">
                    Check back after you&apos;ve logged at least 2 applications in Job Tracker.
                  </p>
                  <a href="/jobs" className="text-accent-500 hover:underline mt-4 text-small font-medium">
                    Go to Job Tracker →
                  </a>
                </div>
              )}
            </div>

            {data && data.offerCount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-sm p-4">
                <p className="text-small text-green-800">
                  🎉 <strong>{data.offerCount}</strong> offer{data.offerCount !== 1 ? "s" : ""} received! Keep up the great work.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
