"use client";

import { useState } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import type { ResumeData } from "@/types/resume";
import { cn } from "@/lib/utils";

interface ResumeOptimizerProps {
  resumeData?: ResumeData | null;
}

/** Serialize the full resume into plain text so the AI can rewrite every section. */
function buildResumeText(resume: ResumeData): string {
  const lines: string[] = [];

  const { personalInfo } = resume;
  const contact = [
    personalInfo.fullName,
    personalInfo.email,
    personalInfo.phone,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.portfolio,
  ]
    .filter(Boolean)
    .join(" | ");
  if (contact) lines.push(contact);

  if (resume.summary) {
    lines.push("", "PROFESSIONAL SUMMARY", resume.summary);
  }

  const skills = resume.skills;
  if (skills && (skills.technical?.length || skills.soft?.length || skills.tools?.length || skills.frameworks?.length)) {
    lines.push("", "TECHNICAL SKILLS");
    if (skills.technical?.length) lines.push(`Languages: ${skills.technical.join(", ")}`);
    if (skills.frameworks?.length) lines.push(`Frameworks: ${skills.frameworks.join(", ")}`);
    if (skills.tools?.length) lines.push(`Tools: ${skills.tools.join(", ")}`);
    if (skills.soft?.length) lines.push(`Soft skills: ${skills.soft.join(", ")}`);
  }

  if (resume.experience?.length) {
    lines.push("", "WORK EXPERIENCE / INTERNSHIPS");
    for (const exp of resume.experience) {
      const period = `${exp.startDate} - ${exp.current ? "Present" : exp.endDate}`;
      lines.push(`${exp.role} at ${exp.company}${exp.location ? `, ${exp.location}` : ""} (${period})`);
      for (const r of exp.responsibilities || []) {
        if (r) lines.push(`- ${r}`);
      }
      for (const a of exp.achievements || []) {
        if (a) lines.push(`- [Achievement] ${a}`);
      }
    }
  }

  if (resume.projects?.length) {
    lines.push("", "PROJECTS");
    for (const p of resume.projects) {
      const tech = p.technologies?.length ? ` [${p.technologies.join(", ")}]` : "";
      lines.push(`${p.name}${tech}`);
      if (p.description) lines.push(`- ${p.description}`);
      if (p.impact) lines.push(`- Impact: ${p.impact}`);
      if (p.liveUrl) lines.push(`- Live: ${p.liveUrl}`);
      if (p.githubUrl) lines.push(`- GitHub: ${p.githubUrl}`);
    }
  }

  if (resume.education?.length) {
    lines.push("", "EDUCATION");
    for (const edu of resume.education) {
      const parts = [edu.degree, edu.field, edu.institution].filter(Boolean).join(", ");
      const period = [edu.startDate, edu.endDate].filter(Boolean).join(" - ");
      lines.push(`${parts}${period ? ` (${period})` : ""}${edu.cgpa ? `, CGPA: ${edu.cgpa}` : ""}`);
    }
  }

  if (resume.certifications?.length) {
    lines.push("", "CERTIFICATIONS");
    for (const cert of resume.certifications) {
      lines.push(`- ${cert.name}${cert.issuer ? ` — ${cert.issuer}` : ""}${cert.date ? ` (${cert.date})` : ""}`);
    }
  }

  if (resume.coursework?.length) {
    lines.push("", "RELEVANT COURSEWORK", resume.coursework.join(", "));
  }

  if (resume.achievements?.length) {
    lines.push("", "ACHIEVEMENTS");
    for (const a of resume.achievements) {
      lines.push(`- ${a.title}${a.description ? `: ${a.description}` : ""}${a.date ? ` (${a.date})` : ""}`);
    }
  }

  if (resume.leadership?.length) {
    lines.push("", "LEADERSHIP");
    for (const l of resume.leadership) {
      const period = [l.startDate, l.endDate].filter(Boolean).join(" - ");
      lines.push(`- ${l.title}${l.organization ? ` at ${l.organization}` : ""}${period ? ` (${period})` : ""}`);
      if (l.description) lines.push(`  ${l.description}`);
    }
  }

  if (resume.openSource?.length) {
    lines.push("", "OPEN SOURCE");
    for (const os of resume.openSource) {
      lines.push(`- ${os.projectName}${os.role ? ` (${os.role})` : ""}${os.url ? ` — ${os.url}` : ""}`);
      if (os.description) lines.push(`  ${os.description}`);
    }
  }

  if (resume.languages?.length) {
    lines.push("", "LANGUAGES", resume.languages.map((l) => `${l.name} (${l.proficiency})`).join(", "));
  }

  if (resume.codingProfiles?.length) {
    lines.push("", "CODING PROFILES");
    for (const cp of resume.codingProfiles) {
      lines.push(`- ${cp.platform}: ${cp.handle || cp.url}`);
    }
  }

  return lines.join("\n");
}

export function ResumeOptimizer({ resumeData }: ResumeOptimizerProps) {
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resumeText = resumeData ? buildResumeText(resumeData) : "";

  const canRun = Boolean(resumeText.trim() || targetRole.trim() || jobDescription.trim());

  async function handleOptimize() {
    if (!canRun) return;

    const inputParts = [targetRole.trim() ? `Target role: ${targetRole.trim()}` : "", jobDescription.trim()]
      .filter(Boolean)
      .join("\n\n");
    const input = inputParts || "No target role or job description provided — optimize for general best practices.";

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await callAi("optimize-resume", input, resumeText);
      if (res.success) {
        setResult(res.output);
      } else {
        setError(res.error || "Failed to optimize resume");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Target Role
          </span>
        </label>
        <input
          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. Full-Stack Developer"
        />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M16 13H8M16 17H8M10 9H8"/>
            </svg>
            Job Description <span className="text-gray-400 font-normal">(optional but recommended)</span>
          </span>
        </label>
        <textarea
          className="w-full h-24 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300 resize-y placeholder:text-gray-300"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here so the resume can be targeted to it..."
        />
      </div>

      <button
        onClick={handleOptimize}
        disabled={loading || !canRun}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl text-small font-semibold transition-all duration-200",
          "bg-accent-600 text-white hover:bg-accent-700",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Optimizing your resume...
          </span>
        ) : (
          "Optimize My Resume"
        )}
      </button>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-accent-200 bg-gradient-to-br from-accent-50/80 to-white overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 dark:from-accent-500/10 dark:to-gray-900 dark:border-accent-500/25">
          <div className="flex items-center justify-between px-4 py-3 border-b border-accent-100 bg-accent-50/50">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent-600">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="text-[12px] font-semibold text-accent-800">Optimized Resume + Report</span>
            </div>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-gray-400">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>Rewrites your whole resume for the target role and returns a Resume Optimization Report. Uses only the information in your resume — nothing is fabricated.</span>
      </div>
    </div>
  );
}
