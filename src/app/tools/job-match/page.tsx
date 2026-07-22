"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { AnalysisResult, AnalysisHistory } from "@/types/ai";

type InputMode = "paste" | "url" | "upload";
type Tab = "overview" | "keywords" | "skills" | "experience";

function MatchGauge({ pct }: { pct: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" className="transform -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-h1 font-bold" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-body border-b-2 transition-all ${
        active
          ? "border-accent-500 text-black font-medium"
          : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function MissingItem({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-micro text-gray-500 uppercase tracking-widest mb-2">{label}</h4>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-red-50 text-red-700 text-small border border-red-200">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-small text-success">None — great match!</p>
      )}
    </div>
  );
}

function MatchedChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-green-50 text-green-700 text-small border border-green-200">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {item}
        </span>
      ))}
    </div>
  );
}

export default function JobMatchPage() {
  const { loading: authLoading } = useAuth();
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [jd, setJd] = useState("");
  const [url, setUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [addToResumeKeywords, setAddToResumeKeywords] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/analyze-jd");
      const json = await res.json();
      if (json.success) setHistory(json.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  async function handleAnalyze() {
    let inputText = "";
    if (inputMode === "paste") inputText = jd;
    else if (inputMode === "url") inputText = url;

    if (!inputText && !uploadedFile) {
      setError("Please provide a job description");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const body = new FormData();
      if (inputText) body.append("jd", inputText);
      if (uploadedFile) body.append("file", uploadedFile);

      const res = await fetch("/api/analyze-jd", { method: "POST", body });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        setActiveTab("overview");
        fetchHistory();
      } else {
        setError(json.error || "Analysis failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function viewHistoryItem(item: AnalysisHistory) {
    setResult(item.result as unknown as AnalysisResult);
    setShowHistory(false);
    setActiveTab("overview");
  }

  function handleAddToResume(keyword: string) {
    setAddToResumeKeywords((prev) =>
      prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]
    );
  }

  if (authLoading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-[960px] mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-h1 text-black mb-1">Job Description Analyzer</h1>
            <p className="text-body text-gray-500">Paste a JD or upload a file to see how your resume matches.</p>
          </div>
          {history.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setShowHistory(!showHistory)}>
              History ({history.length})
            </Button>
          )}
        </div>

        {showHistory && (
          <div className="bg-white border border-gray-300 rounded-sm p-4 mb-8 max-h-[320px] overflow-y-auto">
            <h3 className="text-small font-medium text-black mb-3">Previous Analyses</h3>
            {history.length === 0 ? (
              <p className="text-small text-gray-500">No analyses yet</p>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => viewHistoryItem(item)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-sm hover:bg-gray-50 text-left transition-colors border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-small text-black truncate">
                        {item.jd_snippet?.substring(0, 80)}...
                      </p>
                      <p className="text-micro text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                        {item.match_percentage ? ` · ${item.match_percentage}% match` : ""}
                      </p>
                    </div>
                    <span className={`text-small font-medium ml-3 ${(item.match_percentage || 0) >= 70 ? "text-success" : (item.match_percentage || 0) >= 40 ? "text-warning" : "text-error"}`}>
                      {item.match_percentage}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white border border-gray-300 rounded-sm p-6 mb-8">
          <div className="flex gap-2 mb-6">
            {(["paste", "url", "upload"] as InputMode[]).map((m) => (
              <Button key={m} variant={inputMode === m ? "primary" : "secondary"} size="sm" onClick={() => setInputMode(m)}>
                {m === "paste" ? "Paste Text" : m === "url" ? "Job URL" : "Upload File"}
              </Button>
            ))}
          </div>

          {inputMode === "paste" && (
            <textarea
              className="w-full h-48 rounded-sm border border-gray-300 px-4 py-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y"
              placeholder="Paste the full job description here..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          )}

          {inputMode === "url" && (
            <div>
              <input
                className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                placeholder="https://example.com/jobs/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-micro text-gray-500 mt-2">Note: URL content is processed as-is; for best results paste the JD text directly.</p>
            </div>
          )}

          {inputMode === "upload" && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-sm p-12 text-center cursor-pointer hover:border-accent-500 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={(e) => setUploadedFile(e.target.files?.[0] || null)} />
              {uploadedFile ? (
                <div>
                  <p className="text-body text-black">{uploadedFile.name}</p>
                  <p className="text-small text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  <Button variant="secondary" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div>
                  <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  <p className="text-body text-gray-500">Drop a file here or click to browse</p>
                  <p className="text-small text-gray-400 mt-1">Supports .txt, .pdf, .doc, .docx</p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-small text-error mt-3">{error}</p>}

          <Button className="mt-4" onClick={handleAnalyze} disabled={loading || (!jd && !url && !uploadedFile)}>
            {loading ? <Spinner /> : "Analyze Match"}
          </Button>
        </div>

        {result && (
          <div className="bg-white border border-gray-300 rounded-sm">
            <div className="flex gap-0 border-b border-gray-300 px-6">
              {(["overview", "keywords", "skills", "experience"] as Tab[]).map((tab) => (
                <TabButton key={tab} label={tab.charAt(0).toUpperCase() + tab.slice(1)} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
              ))}
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div>
                  <div className="flex items-center gap-8 mb-8">
                    <div className="relative flex items-center justify-center">
                      <MatchGauge pct={result.matchPercentage} />
                    </div>
                    <div>
                      <p className="text-h3 text-black mb-1">
                        {result.matchPercentage >= 70 ? "Strong Match" : result.matchPercentage >= 40 ? "Moderate Match" : "Low Match"}
                      </p>
                      <p className="text-body text-gray-500 mb-2">
                        {result.totalJdKeywords} keywords extracted · {result.matchedKeywords.length} matched
                      </p>
                      {result.experienceGap && (
                        <div className="flex items-center gap-2 text-small text-warning bg-yellow-50 border border-yellow-200 rounded-sm px-3 py-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#eab308" strokeWidth="1.5"/><path d="M8 4.5v4M8 11.5v.5" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          {result.experienceGap}
                        </div>
                      )}
                      {!result.hasRelevantExperience && (
                        <div className="flex items-center gap-2 text-small text-error bg-red-50 border border-red-200 rounded-sm px-3 py-2 mt-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5"/></svg>
                          No directly relevant experience detected for this role
                        </div>
                      )}
                    </div>
                  </div>

                  {result.aiSuggestions.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-sm border border-gray-200">
                      <h3 className="text-small font-medium text-black mb-2">AI Suggestions</h3>
                      <ul className="space-y-1">
                        {result.aiSuggestions.map((s, i) => (
                          <li key={i} className="text-small text-gray-600 flex items-start gap-2">
                            <span className="text-accent-500 mt-px">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="border border-gray-200 rounded-sm p-4 text-center">
                      <p className="text-h2 text-black">{result.totalJdKeywords}</p>
                      <p className="text-micro text-gray-500 uppercase tracking-widest mt-1">Keywords Found</p>
                    </div>
                    <div className="border border-gray-200 rounded-sm p-4 text-center">
                      <p className="text-h2 text-black">{result.missingKeywords.length}</p>
                      <p className="text-micro text-gray-500 uppercase tracking-widest mt-1">Missing Keywords</p>
                    </div>
                    <div className="border border-gray-200 rounded-sm p-4 text-center">
                      <p className="text-h2 text-black">{result.missingSkills.length}</p>
                      <p className="text-micro text-gray-500 uppercase tracking-widest mt-1">Missing Skills</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "keywords" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-h3 text-black mb-3">Matched Keywords ({result.matchedKeywords.length})</h3>
                    <MatchedChips items={result.matchedKeywords} />
                  </div>

                  <div>
                    <h3 className="text-h3 text-black mb-3">Missing Keywords ({result.missingKeywords.length})</h3>
                    <MissingItem label="Keywords to add" items={result.missingKeywords} />
                  </div>

                  {result.missingKeywords.length > 0 && (
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-sm">
                      <h4 className="text-small font-medium text-black mb-2">Add missing keywords to resume</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.missingKeywords.map((kw) => (
                          <button
                            key={kw}
                            onClick={() => handleAddToResume(kw)}
                            className={`px-3 py-1.5 rounded-sm text-small border transition-colors ${
                              addToResumeKeywords.includes(kw)
                                ? "bg-accent-500 text-white border-accent-500"
                                : "bg-white text-gray-700 border-gray-300 hover:border-accent-500"
                            }`}
                          >
                            {addToResumeKeywords.includes(kw) ? "✓ Added" : `+ ${kw}`}
                          </button>
                        ))}
                      </div>
                      <p className="text-micro text-gray-500 mt-2">Selected keywords can be added to your Skills section.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "skills" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-h3 text-black mb-3">Matched Skills ({result.matchedSkills.length})</h3>
                    <MatchedChips items={result.matchedSkills} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-red-200 rounded-sm p-4 bg-red-50">
                      <h4 className="text-small font-medium text-black mb-3 flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.3"/><path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#ef4444" strokeWidth="1.3"/></svg>
                        Missing Skills ({result.missingSkills.length})
                      </h4>
                      {result.missingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {result.missingSkills.map((s, i) => (
                            <span key={i} className="px-2 py-1 text-small bg-white border border-red-200 rounded-sm text-red-700">{s}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-small text-gray-500">No missing skills</p>
                      )}
                    </div>

                    <div className="border border-red-200 rounded-sm p-4 bg-red-50">
                      <h4 className="text-small font-medium text-black mb-3 flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.3"/><path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#ef4444" strokeWidth="1.3"/></svg>
                        Missing Tools ({result.missingTools.length})
                      </h4>
                      {result.missingTools.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {result.missingTools.map((t, i) => (
                            <span key={i} className="px-2 py-1 text-small bg-white border border-red-200 rounded-sm text-red-700">{t}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-small text-gray-500">No missing tools</p>
                      )}
                    </div>
                  </div>

                  {result.otherMissing.length > 0 && (
                    <div>
                      <h4 className="text-h3 text-black mb-2">Other Missing Terms ({result.otherMissing.length})</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {result.otherMissing.map((t, i) => (
                          <span key={i} className="px-2 py-1 text-small bg-gray-100 border border-gray-200 rounded-sm text-gray-600">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "experience" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`border rounded-sm p-5 ${result.hasRelevantExperience ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.hasRelevantExperience ? "bg-green-100" : "bg-red-100"}`}>
                          {result.hasRelevantExperience ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#22c55e" strokeWidth="1.5"/><path d="M6 10l3 3 5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#ef4444" strokeWidth="1.5"/><path d="M7 7l6 6M13 7l-6 6" stroke="#ef4444" strokeWidth="1.5"/></svg>
                          )}
                        </div>
                        <div>
                          <p className="text-body font-medium text-black">Relevant Experience</p>
                          <p className="text-small text-gray-500">{result.hasRelevantExperience ? "Your resume shows experience relevant to this role" : "No directly relevant experience detected"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-sm p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#6366f1" strokeWidth="1.5"/><path d="M10 5v5l3 3" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </div>
                        <div>
                          <p className="text-body font-medium text-black">Years Required</p>
                          <p className="text-small text-gray-500">{result.requiredYears ? `${result.requiredYears}+ years` : "Not specified"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {result.relevantRoles.length > 0 && (
                    <div>
                      <h3 className="text-h3 text-black mb-3">Detected Role Types</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.relevantRoles.map((role, i) => (
                          <span key={i} className="px-3 py-1.5 text-small bg-indigo-50 border border-indigo-200 rounded-sm text-indigo-700 font-medium">
                            {role.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.experienceGap && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-sm">
                      <div className="flex items-start gap-3">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5"><circle cx="10" cy="10" r="9" stroke="#eab308" strokeWidth="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        <div>
                          <p className="text-small font-medium text-black">Experience Gap Detected</p>
                          <p className="text-small text-gray-600 mt-1">{result.experienceGap}. Consider highlighting relevant projects or internships that demonstrate equivalent experience.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-sm">
                    <h4 className="text-small font-medium text-black mb-2">Tips to Bridge Experience Gaps</h4>
                    <ul className="space-y-1.5 text-small text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-accent-500 mt-px">•</span>
                        Highlight transferable skills from other roles
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent-500 mt-px">•</span>
                        Emphasize relevant coursework or certifications
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent-500 mt-px">•</span>
                        Quantify achievements to demonstrate impact beyond years
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent-500 mt-px">•</span>
                        Include side projects or open source contributions
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
