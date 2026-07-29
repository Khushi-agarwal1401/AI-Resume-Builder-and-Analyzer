"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Briefcase,
  Target,
  Award,
  Calendar,
  ChevronDown,
  BarChart3,
  FileText,
} from "lucide-react";

interface ScorePoint {
  date: string;
  score: number;
  label?: string;
}

interface AnalyticsData {
  scoreHistory: ScorePoint[];
  totalApplications: number;
  interviewCount: number;
  offerCount: number;
  interviewRate: number | null;
}

type ViewMode = "score" | "applications";
type PeriodFilter = "all" | "7" | "30" | "90";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-green-600 bg-green-50 border-green-200" :
    score >= 60 ? "text-amber-600 bg-amber-50 border-amber-200" :
    "text-red-500 bg-red-50 border-red-200";
  const label =
    score >= 80 ? "Great" :
    score >= 60 ? "Good" :
    score >= 40 ? "Fair" : "Needs Work";

  return (
    <span className={cn("px-2 py-0.5 rounded-lg text-micro font-semibold border", color)}>
      {label}
    </span>
  );
}

function TrendIndicator({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 1) {
    return <span className="text-micro text-gray-400">—</span>;
  }
  return (
    <span className={cn("flex items-center gap-0.5 text-micro font-semibold", diff > 0 ? "text-green-600" : "text-red-500")}>
      {diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {diff > 0 ? "+" : ""}{diff.toFixed(0)} pts
    </span>
  );
}

// SVG Line Chart Component
function ScoreChart({ data, width = 700, height = 220 }: { data: ScorePoint[]; width?: number; height?: number }) {
  const padding = { top: 10, right: 10, bottom: 25, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const { pathD, areaD, points, yLabels, xLabels } = useMemo(() => {
    if (data.length < 2) return { pathD: "", areaD: "", points: [], yLabels: [], xLabels: [] };

    const scores = data.map((p) => p.score);
    const minScore = Math.max(0, Math.min(...scores) - 10);
    const maxScore = Math.min(100, Math.max(...scores) + 10);
    const range = maxScore - minScore || 1;

    const pts = data.map((p, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + chartH - ((p.score - minScore) / range) * chartH;
      return { ...p, x, y };
    });

    const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const area = `${path} L ${pts[pts.length - 1].x} ${padding.top + chartH} L ${pts[0].x} ${padding.top + chartH} Z`;

    const yVals = [0, 25, 50, 75, 100].map((v) => ({
      value: v,
      y: padding.top + chartH - ((v - minScore) / range) * chartH,
    }));

    const xVals = data.map((p, i) => ({
      label: formatDate(p.date),
      x: padding.left + (i / (data.length - 1)) * chartW,
    }));

    return { pathD: path, areaD: area, points: pts, yLabels: yVals, xLabels: xVals };
  }, [data, chartW, chartH]);

  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-small">
        Need at least 2 data points for a chart
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {yLabels.map((yl) => (
        <g key={yl.value}>
          <line
            x1={padding.left} y1={yl.y}
            x2={width - padding.right} y2={yl.y}
            stroke="#f0f0f5" strokeWidth="1"
          />
          <text
            x={padding.left - 6} y={yl.y + 3}
            textAnchor="end" className="text-[10px]"
            fill="#a3a3b0"
          >
            {yl.value}
          </text>
        </g>
      ))}

      {/* Area fill */}
      {areaD && <path d={areaD} fill="url(#chartGradient)" />}

      {/* Line */}
      {pathD && (
        <path
          d={pathD}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />
      )}

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x} cy={p.y} r={hoveredPoint === i ? 6 : 4}
            fill="#6366f1"
            className="transition-all duration-200 cursor-pointer"
            stroke="white"
            strokeWidth="2"
            onMouseEnter={() => setHoveredPoint(i)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
          {/* Tooltip */}
          {hoveredPoint === i && (
            <g>
              <rect
                x={p.x - 45} y={p.y - 38}
                width="90" height="28" rx="6"
                fill="#1f2937"
              />
              <text
                x={p.x} y={p.y - 20}
                textAnchor="middle"
                className="text-[10px]"
                fill="white"
                fontWeight="bold"
              >
                {p.score} pts — {p.label || formatDate(p.date)}
              </text>
            </g>
          )}
        </g>
      ))}

      {/* X-axis labels */}
      {xLabels.map((xl, i) => (
        <text
          key={i}
          x={xl.x} y={height - 4}
          textAnchor="middle"
          className="text-[9px]"
          fill="#a3a3b0"
        >
          {xl.label}
        </text>
      ))}
    </svg>
  );
}

export default function AnalyticsPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("score");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/login");
      return;
    }
    if (authenticated) fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, authLoading, router]);

  async function fetchAnalytics() {
    try {
      const atsRes = await fetch("/api/analyze-jd");
      const atsJson = await atsRes.json();
      const scoreHistory: ScorePoint[] = (atsJson.data || [])
        .filter((a: Record<string, unknown>) => typeof a.match_percentage === "number")
        .map((a: Record<string, unknown>) => ({
          date: (a.created_at as string)?.split("T")[0] || "",
          score: a.match_percentage as number,
          label: (a.target_role as string) || undefined,
        }))
        .sort((a: ScorePoint, b: ScorePoint) => a.date.localeCompare(b.date));

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

  const filteredScores = useMemo(() => {
    if (!data) return [];
    if (period === "all") return data.scoreHistory;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(period));
    return data.scoreHistory.filter((s) => new Date(s.date) >= cutoff);
  }, [data, period]);

  const avgScore = useMemo(() => {
    if (!filteredScores.length) return null;
    return Math.round(filteredScores.reduce((sum, s) => sum + s.score, 0) / filteredScores.length);
  }, [filteredScores]);

  const latestScore = filteredScores[filteredScores.length - 1]?.score;
  const prevScore = filteredScores.length >= 2 ? filteredScores[filteredScores.length - 2]?.score : undefined;

  const hasScoreData = data && data.scoreHistory.length >= 2;
  const hasAppData = data && data.totalApplications >= 2;

  const periodLabels: Record<PeriodFilter, string> = {
    all: "All time",
    "7": "Last 7 days",
    "30": "Last 30 days",
    "90": "Last 90 days",
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-50 flex items-center justify-center mx-auto">
              <BarChart3 size={22} className="text-accent-600 animate-pulse" />
            </div>
            <Spinner />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-h1 text-gray-900">Analytics</h1>
          <p className="text-body text-gray-500 mt-1">
            Track your resume performance, ATS scores, and job search progress.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-0.5 p-1 bg-gray-100 rounded-xl">
            {([
              { id: "score" as ViewMode, label: "ATS Score", icon: Target },
              { id: "applications" as ViewMode, label: "Applications", icon: Briefcase },
            ]).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-small font-semibold transition-all duration-200",
                    viewMode === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Score View */}
        {viewMode === "score" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {hasScoreData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Activity size={15} />
                    <span className="text-micro font-medium uppercase tracking-wider">Latest</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-h2 font-bold text-gray-900">{latestScore || "—"}</span>
                    <TrendIndicator current={latestScore || 0} previous={prevScore} />
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Award size={15} />
                    <span className="text-micro font-medium uppercase tracking-wider">Average</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-h2 font-bold text-gray-900">{avgScore || "—"}</span>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <BarChart3 size={15} />
                    <span className="text-micro font-medium uppercase tracking-wider">Analyses</span>
                  </div>
                  <p className="text-h2 font-bold text-gray-900">{filteredScores.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Calendar size={15} />
                    <span className="text-micro font-medium uppercase tracking-wider">Period</span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                      className="flex items-center gap-1.5 text-small font-semibold text-accent-600 hover:text-accent-700 transition-colors"
                    >
                      {periodLabels[period]}
                      <ChevronDown size={13} />
                    </button>
                    {showPeriodMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowPeriodMenu(false)} />
                        <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-1 min-w-[140px]">
                          {(["all", "7", "30", "90"] as PeriodFilter[]).map((p) => (
                            <button
                              key={p}
                              onClick={() => { setPeriod(p); setShowPeriodMenu(false); }}
                              className={cn(
                                "w-full text-left px-3 py-1.5 rounded-lg text-small font-medium transition-colors",
                                period === p ? "bg-accent-50 text-accent-700" : "text-gray-600 hover:bg-gray-50"
                              )}
                            >
                              {periodLabels[p]}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-body font-semibold text-gray-900">Score Trend</h2>
                  <p className="text-micro text-gray-400 mt-0.5">
                    Estimated compatibility scores from your resume analyses
                  </p>
                </div>
                <span className="text-micro text-gray-400">
                  (lower = needs work, higher = better)
                </span>
              </div>

              {hasScoreData && filteredScores.length >= 2 ? (
                <div className="h-[240px]">
                  <ScoreChart data={filteredScores} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-50 flex items-center justify-center mb-4">
                    <Target size={26} className="text-accent-600" />
                  </div>
                  <h3 className="text-h3 text-gray-900 mb-1">Not enough data</h3>
                  <p className="text-body text-gray-500 max-w-sm">
                    {filteredScores.length === 1
                      ? "One analysis found. Run another to see your score trend."
                      : "Check back after you&apos;ve analyzed at least 2 resumes to see your score trend."}
                  </p>
                  <a
                    href="/tools/job-match"
                    className="mt-5 px-5 py-2.5 rounded-xl bg-accent-600 text-white text-small font-semibold hover:bg-accent-700 transition-colors shadow-sm"
                  >
                    Analyze a Resume
                  </a>
                </div>
              )}
            </div>

            {/* Score List */}
            {filteredScores.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-body font-semibold text-gray-900 mb-4">Score History</h2>
                <div className="space-y-1">
                  {[...filteredScores].reverse().map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-white text-micro font-bold",
                          s.score >= 80 ? "bg-green-500" :
                          s.score >= 60 ? "bg-amber-500" :
                          "bg-red-400"
                        )}>
                          {s.score}
                        </div>
                        <div>
                          <p className="text-small font-medium text-gray-800">
                            {s.label || `Analysis #${filteredScores.length - i}`}
                          </p>
                          <p className="text-micro text-gray-400">{formatDate(s.date)}</p>
                        </div>
                      </div>
                      <ScoreBadge score={s.score} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Applications View */}
        {viewMode === "applications" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <FileText size={18} className="text-gray-600" />
                </div>
                <p className="text-h1 font-bold text-gray-900">{data?.totalApplications || 0}</p>
                <p className="text-small text-gray-500 mt-1">Total Applications</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                  <Briefcase size={18} className="text-amber-600" />
                </div>
                <p className="text-h1 font-bold text-gray-900">{data?.interviewCount || 0}</p>
                <p className="text-small text-gray-500 mt-1">Interviews & Offers</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                  <TrendingUp size={18} className="text-green-600" />
                </div>
                <p className="text-h1 font-bold text-gray-900">
                  {data?.interviewRate != null ? `${data.interviewRate}%` : "—"}
                </p>
                <p className="text-small text-gray-500 mt-1">Interview Rate</p>
              </div>
            </div>

            {hasAppData ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-body font-semibold text-gray-900 mb-2">Application Breakdown</h2>
                <p className="text-micro text-gray-400 mb-6">
                  Based on outcomes logged in Job Tracker
                </p>
                <div className="space-y-4">
                  {/* Progress bar breakdown */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-small text-gray-600">Applications → Interviews</span>
                      <span className="text-small font-semibold text-gray-800">
                        {data?.interviewCount || 0} / {data?.totalApplications || 0}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-500"
                        style={{
                          width: `${data && data.totalApplications > 0
                            ? ((data.interviewCount / data.totalApplications) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-small text-gray-600">Interviews → Offers</span>
                      <span className="text-small font-semibold text-gray-800">
                        {data?.offerCount || 0} / {data?.interviewCount || 0}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                        style={{
                          width: `${data && data.interviewCount > 0
                            ? ((data.offerCount / data.interviewCount) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-small text-gray-600">Applications → Offers (Overall)</span>
                      <span className="text-small font-semibold text-gray-800">
                        {data?.offerCount || 0} / {data?.totalApplications || 0}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{
                          width: `${data && data.totalApplications > 0
                            ? ((data.offerCount / data.totalApplications) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={26} className="text-amber-600" />
                </div>
                <h3 className="text-h3 text-gray-900 mb-1">No applications tracked yet</h3>
                <p className="text-body text-gray-500 max-w-sm mx-auto mb-5">
                  Log your job applications in Job Tracker to see your interview and offer rates.
                </p>
                <a
                  href="/jobs"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 text-white text-small font-semibold hover:bg-accent-700 transition-colors shadow-sm"
                >
                  Go to Job Tracker
                </a>
              </div>
            )}

            {/* Congrats card */}
            {data && data.offerCount > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="text-small font-semibold text-green-800">
                      <strong>{data.offerCount}</strong> offer{data.offerCount !== 1 ? "s" : ""} received!
                    </p>
                    <p className="text-micro text-green-700 mt-0.5">
                      Keep up the great work! Your resume is performing well.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
