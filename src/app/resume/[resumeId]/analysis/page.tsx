"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type Tab = "overview" | "ats" | "grammar" | "sections" | "content";

interface AtsScore {
  overall: number;
  subscores: {
    keywordRelevance: number;
    formatting: number;
    readability: number;
    sections: number;
    contactInfo: number;
  };
  keywordDetails: Record<string, number>;
  readabilityDetails: { fleschKincaid: number; avgSentenceLength: number };
  sectionDetails: { present: string[]; missing: string[] };
  suggestions: string[];
}

interface GrammarIssue {
  type: string;
  text: string;
  suggestion: string;
  severity: string;
}

interface StrengthReport {
  overall: number;
  grade: string;
  breakdown: Record<string, number>;
  analysis: {
    wordCount: number;
    bulletCount: number;
    hasMetrics: boolean;
    hasActionVerbs: boolean;
    hasSummary: boolean;
    hasContactInfo: boolean;
    missingSections: string[];
    grammarIssues: number;
  };
  recommendations: string[];
}

interface AnalysisData {
  parsed: {
    text: string;
    wordCount: number;
    email: string | null;
    phone: string | null;
    links: string[];
    sections: Record<string, string>;
  };
  ats: AtsScore;
  grammar: GrammarIssue[];
  strength: StrengthReport;
}

function ScoreCircle({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  const radius = size === "lg" ? 52 : 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  const textClass = size === "lg" ? "text-h1" : "text-h3";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={radius * 2 + 12} height={radius * 2 + 12} className="transform -rotate-90">
        <circle cx={radius + 6} cy={radius + 6} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={size === "lg" ? 8 : 5} />
        <circle cx={radius + 6} cy={radius + 6} r={radius} fill="none" stroke={color} strokeWidth={size === "lg" ? 8 : 5}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className={`absolute font-bold ${textClass}`} style={{ color }}>{score}</span>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = { A: "bg-green-100 text-green-700 border-green-300", B: "bg-blue-100 text-blue-700 border-blue-300", C: "bg-yellow-100 text-yellow-700 border-yellow-300", D: "bg-orange-100 text-orange-700 border-orange-300", F: "bg-red-100 text-red-700 border-red-300" };
  return <span className={`px-2.5 py-1 text-small font-bold rounded-sm border ${colors[grade] || colors.F}`}>{grade}</span>;
}

export default function ResumeAnalysisPage() {
  const params = useParams();
  const resumeId = params.resumeId as string;
  const { loading: authLoading } = useAuth();
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAnalyze() {
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const body = new FormData();
      if (file) {
        body.append("file", file);
      } else if (text.trim()) {
        body.append("text", text);
      } else {
        setError("Paste your resume or upload a file");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/resume-analyze", {
        method: "POST",
        body: file ? body : JSON.stringify({ text, resumeId }),
        headers: file ? {} : { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (json.success) setResult(json.data);
      else setError(json.error || "Analysis failed");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div></DashboardLayout>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "ats", label: "ATS Score" },
    { key: "grammar", label: "Grammar" },
    { key: "sections", label: "Sections" },
    { key: "content", label: "Content" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-[960px] mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-h1 text-black mb-1">Resume Analysis</h1>
          <p className="text-body text-gray-500">Upload or paste your resume to get a comprehensive analysis report.</p>
        </div>

        <div className="bg-white border border-gray-300 rounded-sm p-6 mb-8">
          <div className="flex gap-2 mb-6">
            <Button variant={inputMode === "paste" ? "primary" : "secondary"} size="sm" onClick={() => setInputMode("paste")}>Paste Text</Button>
            <Button variant={inputMode === "upload" ? "primary" : "secondary"} size="sm" onClick={() => setInputMode("upload")}>Upload File</Button>
          </div>

          {inputMode === "paste" ? (
            <textarea className="w-full h-48 rounded-sm border border-gray-300 px-4 py-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-y" placeholder="Paste your full resume text here..." value={text} onChange={(e) => setText(e.target.value)} />
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-sm p-12 text-center cursor-pointer hover:border-accent-500 transition-colors" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <div>
                  <p className="text-body text-black">{file.name}</p>
                  <p className="text-small text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <Button variant="secondary" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Remove</Button>
                </div>
              ) : (
                <div>
                  <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  <p className="text-body text-gray-500">Drop a PDF, DOCX, or TXT file here</p>
                  <p className="text-small text-gray-400 mt-1">Your file is processed in memory and never stored</p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-small text-error mt-3">{error}</p>}
          <Button className="mt-4" onClick={handleAnalyze} disabled={loading || (!text.trim() && !file)}>
            {loading ? <Spinner /> : "Analyze Resume"}
          </Button>
        </div>

        {result && (
          <div className="bg-white border border-gray-300 rounded-sm">
            <div className="flex gap-0 border-b border-gray-300 px-6 overflow-x-auto">
              {tabs.map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`shrink-0 px-4 py-2.5 text-body border-b-2 transition-all ${activeTab === t.key ? "border-accent-500 text-black font-medium" : "border-transparent text-gray-500 hover:text-black"}`}>{t.label}</button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div>
                  <div className="flex items-start gap-8 mb-8">
                    <div className="flex flex-col items-center">
                      <ScoreCircle score={result.strength.overall} />
                      <div className="mt-2"><GradeBadge grade={result.strength.grade} /></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-h3 text-black mb-2">Resume Strength: {result.strength.overall}/100</p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-small text-gray-600 mb-4">
                        <span>Words: <strong>{result.strength.analysis.wordCount}</strong></span>
                        <span>Bullets: <strong>{result.strength.analysis.bulletCount}</strong></span>
                        <span>Metrics: <strong className={result.strength.analysis.hasMetrics ? "text-success" : "text-error"}>{result.strength.analysis.hasMetrics ? "Yes" : "No"}</strong></span>
                        <span>Action Verbs: <strong className={result.strength.analysis.hasActionVerbs ? "text-success" : "text-error"}>{result.strength.analysis.hasActionVerbs ? "Yes" : "No"}</strong></span>
                        <span>Summary: <strong className={result.strength.analysis.hasSummary ? "text-success" : "text-error"}>{result.strength.analysis.hasSummary ? "Found" : "Missing"}</strong></span>
                        <span>Grammar Issues: <strong className={result.strength.analysis.grammarIssues > 0 ? "text-warning" : "text-success"}>{result.strength.analysis.grammarIssues}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-3 mb-8">
                    {Object.entries(result.strength.breakdown).map(([key, val]) => (
                      <div key={key} className="border border-gray-200 rounded-sm p-3 text-center">
                        <p className={`text-h3 font-bold ${val >= 70 ? "text-success" : val >= 50 ? "text-warning" : "text-error"}`}>{val}</p>
                        <p className="text-micro text-gray-500 uppercase tracking-widest mt-0.5">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                      </div>
                    ))}
                  </div>

                  {result.strength.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-h3 text-black mb-3">Recommendations</h3>
                      <ul className="space-y-2">
                        {result.strength.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-3 text-body text-gray-700 bg-gray-50 rounded-sm p-3 border border-gray-200">
                            <span className="w-5 h-5 rounded-full bg-accent-100 text-accent-600 text-micro font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "ats" && (
                <div>
                  <div className="flex items-center gap-6 mb-8">
                    <ScoreCircle score={result.ats.overall} size="sm" />
                    <div>
                      <p className="text-h3 text-black">ATS Compatibility Score: {result.ats.overall}/100</p>
                      <p className="text-small text-gray-500">Estimated compatibility — not from any specific ATS system.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-3 mb-6">
                    {Object.entries(result.ats.subscores).map(([key, val]) => (
                      <div key={key} className="border border-gray-200 rounded-sm p-3 text-center">
                        <p className={`text-h3 font-bold ${val >= 70 ? "text-success" : val >= 50 ? "text-warning" : "text-error"}`}>{val}</p>
                        <p className="text-micro text-gray-500 uppercase tracking-widest mt-0.5">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="border border-gray-200 rounded-sm p-4">
                      <h4 className="text-small font-medium text-black mb-2">Readability</h4>
                      <p className="text-small text-gray-600">Flesch-Kincaid: {result.ats.readabilityDetails.fleschKincaid}</p>
                      <p className="text-small text-gray-600">Avg sentence: {result.ats.readabilityDetails.avgSentenceLength} words</p>
                    </div>
                    <div className="border border-gray-200 rounded-sm p-4">
                      <h4 className="text-small font-medium text-black mb-2">Keyword Coverage</h4>
                      {Object.entries(result.ats.keywordDetails).map(([k, v]) => (
                        <p key={k} className="text-small text-gray-600">{k.replace("-", " ")}: {v} found</p>
                      ))}
                    </div>
                  </div>

                  {result.ats.suggestions.length > 0 && (
                    <div>
                      <h4 className="text-h3 text-black mb-3">Suggestions</h4>
                      <ul className="space-y-2">
                        {result.ats.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-body text-gray-700"><span className="text-accent-500 mt-1">•</span>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "grammar" && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <span className={`text-h2 font-bold ${result.grammar.length === 0 ? "text-success" : result.grammar.length < 5 ? "text-warning" : "text-error"}`}>
                      {result.grammar.length}
                    </span>
                    <span className="text-body text-gray-500">issues found</span>
                  </div>

                  {result.grammar.length === 0 ? (
                    <p className="text-body text-success bg-green-50 border border-green-200 rounded-sm p-4">No grammar or style issues detected.</p>
                  ) : (
                    <div className="space-y-3">
                      {result.grammar.map((issue, i) => (
                        <div key={i} className={`border rounded-sm p-4 ${
                          issue.severity === "high" ? "border-red-200 bg-red-50" :
                          issue.severity === "medium" ? "border-yellow-200 bg-yellow-50" :
                          "border-gray-200 bg-gray-50"
                        }`}>
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-micro font-medium uppercase tracking-widest text-gray-500">{issue.type.replace("-", " ")}</span>
                            <span className={`text-micro font-medium px-2 py-0.5 rounded-sm ${
                              issue.severity === "high" ? "bg-red-200 text-red-800" :
                              issue.severity === "medium" ? "bg-yellow-200 text-yellow-800" :
                              "bg-gray-200 text-gray-600"
                            }`}>{issue.severity}</span>
                          </div>
                          <p className="text-body text-black mb-1">&ldquo;{issue.text}&rdquo;</p>
                          <p className="text-small text-gray-600">{issue.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "sections" && (
                <div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-h3 text-black mb-3">Found Sections</h3>
                      {Object.keys(result.parsed.sections).length > 0 ? (
                        <ul className="space-y-2">
                          {Object.entries(result.parsed.sections).map(([key, content]) => (
                            <li key={key} className="border border-gray-200 rounded-sm p-3">
                              <p className="text-small font-medium text-black capitalize mb-1">{key}</p>
                              <p className="text-micro text-gray-500 truncate">{content.substring(0, 100)}...</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-body text-gray-500">No standard sections detected.</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-h3 text-black mb-3">Contact Info</h3>
                      <div className="border border-gray-200 rounded-sm p-4 space-y-2">
                        <p className="text-small text-gray-600">Email: <strong className="text-black">{result.parsed.email || "Not found"}</strong></p>
                        <p className="text-small text-gray-600">Phone: <strong className="text-black">{result.parsed.phone || "Not found"}</strong></p>
                        <p className="text-small text-gray-600">Links: <strong className="text-black">{result.parsed.links.length} found</strong></p>
                        {result.parsed.links.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.parsed.links.map((l, i) => (
                              <span key={i} className="text-micro px-2 py-0.5 bg-gray-100 rounded-sm text-gray-600 truncate max-w-[200px]">{l}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <h3 className="text-h3 text-black mt-6 mb-3">Missing Sections</h3>
                      {result.ats.sectionDetails.missing.length > 0 ? (
                        <ul className="space-y-2">
                          {result.ats.sectionDetails.missing.map((s) => (
                            <li key={s} className="flex items-center gap-2 text-body text-error"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg> {s.charAt(0).toUpperCase() + s.slice(1)} section</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-body text-success">All essential sections present!</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "content" && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-h2 font-bold text-black">{result.parsed.wordCount}</span>
                    <span className="text-body text-gray-500">words</span>
                    <span className="text-gray-300 mx-2">|</span>
                    <span className="text-h2 font-bold text-black">{result.strength.analysis.bulletCount}</span>
                    <span className="text-body text-gray-500">bullet points</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { label: "Contains Metrics", value: result.strength.analysis.hasMetrics },
                      { label: "Action Verbs Used", value: result.strength.analysis.hasActionVerbs },
                      { label: "Has Summary", value: result.strength.analysis.hasSummary },
                      { label: "Has Contact Info", value: result.strength.analysis.hasContactInfo },
                    ].map((item) => (
                      <div key={item.label} className="border border-gray-200 rounded-sm p-4 flex items-center justify-between">
                        <span className="text-body text-gray-700">{item.label}</span>
                        <span className={`text-small font-medium ${item.value ? "text-success" : "text-error"}`}>{item.value ? "✓" : "✗"}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-h3 text-black mb-3">Extracted Text Preview</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 max-h-[400px] overflow-y-auto">
                      <pre className="text-small text-gray-700 whitespace-pre-wrap font-sans">{result.parsed.text.substring(0, 3000)}{result.parsed.text.length > 3000 ? "..." : ""}</pre>
                    </div>
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
