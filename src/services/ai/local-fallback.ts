import type { AiRequest } from "@/types/ai";
import { extractKeywords } from "@/services/jd-analyzer/engine";
import { calculateAtsScore } from "@/services/resume-analyzer/ats-scorer";
import { checkGrammar } from "@/services/resume-analyzer/grammar-checker";
import { parseResumeText } from "@/services/resume-analyzer/deterministic-import";

/**
 * Offline fallback note — appended to human-readable outputs so users know the
 * response was built locally from their own data (no AI involved) instead of
 * silently degrading.
 */
export const LOCAL_FALLBACK_NOTICE =
  "\n\n— Generated locally from your data (AI service temporarily unavailable).";

/** Pull "Label: value" lines out of plain-text context (SummaryGenerator format). */
function lineValue(text: string, label: string): string {
  const match = text.match(new RegExp(`^${label}\\s*:\\s*([^\\n]+)`, "im"));
  return match?.[1]?.trim() ?? "";
}

function roleFromInput(input: string): string {
  return (
    input.match(/^(?:Target role|Role|Position|Job title)\s*:\s*([^\n]+)/im)?.[1]?.trim() ??
    input.split("\n")[0]?.trim() ??
    ""
  );
}

function companyFromInput(input: string): string {
  return input.match(/^Company\s*:\s*([^\n]+)/im)?.[1]?.trim() ?? "";
}

function nameFromContext(context: string): string {
  try {
    const parsed = JSON.parse(context);
    const name = parsed?.personalInfo?.fullName;
    if (typeof name === "string" && name.trim()) return name.trim();
  } catch {
    /* not JSON — fall through */
  }
  const firstLine = context.split("\n")[0] ?? "";
  return firstLine.match(/^([A-Z][a-zA-Z.' -]{2,})/)?.[1]?.trim() ?? "";
}

/** Flat list of skills mentioned in the context (JSON resume or plain text). */
function collectSkills(context: string): string[] {
  const out: string[] = [];
  try {
    const parsed = JSON.parse(context);
    const s = parsed?.skills;
    if (s) {
      for (const group of ["technical", "frameworks", "tools"]) {
        if (Array.isArray(s[group])) out.push(...s[group].map(String));
      }
    }
  } catch {
    for (const label of ["Languages", "Frameworks", "Tools", "Soft skills"]) {
      const v = lineValue(context, label);
      if (v) out.push(...v.split(/[,;]/).map((x) => x.trim()).filter(Boolean));
    }
  }
  return [...new Set(out)];
}

function localSummary(context: string): string {
  const role = lineValue(context, "Current/desired role") || lineValue(context, "Target role");
  const years = lineValue(context, "Years of experience");
  const skills = lineValue(context, "Key skills");
  const industry = lineValue(context, "Industry");
  const level = lineValue(context, "Experience level").toLowerCase();
  const isEntry = /student|intern|fresher/.test(level);

  const parts: string[] = [];
  if (role) {
    parts.push(
      isEntry
        ? `${role} with a solid technical foundation${years ? ` and ${years} of hands-on experience` : ""}.`
        : `${role}${years ? ` with ${years} of experience` : ""}.`
    );
  } else if (years) {
    parts.push(`Professional with ${years} of experience.`);
  }
  if (skills) parts.push(`Core skills include ${skills}.`);
  if (industry) parts.push(`Background spans the ${industry} sector.`);
  if (parts.length === 0) {
    return (
      context.trim() || "Add your role, skills, and experience details to generate a tailored summary."
    ) + LOCAL_FALLBACK_NOTICE;
  }
  return parts.join(" ") + LOCAL_FALLBACK_NOTICE;
}

function localTargetedSkills(context: string): string {
  const groups: string[] = [];
  const patterns: Array<[RegExp, string]> = [
    [/^Languages?:\s*(.+)$/im, "Languages"],
    [/^Frameworks?:\s*(.+)$/im, "Frameworks & Libraries"],
    [/^Databases?:\s*(.+)$/im, "Databases"],
    [/^Tools?:\s*(.+)$/im, "Tools"],
    [/^Soft skills?:\s*(.+)$/im, "Soft Skills"],
  ];
  for (const [re, label] of patterns) {
    const m = context.match(re);
    if (m?.[1]?.trim()) groups.push(`${label}: ${m[1].trim()}`);
  }
  if (groups.length === 0) {
    try {
      const s = JSON.parse(context)?.skills;
      if (s) {
        if (s.technical?.length) groups.push(`Languages: ${s.technical.join(", ")}`);
        if (s.frameworks?.length) groups.push(`Frameworks & Libraries: ${s.frameworks.join(", ")}`);
        if (s.tools?.length) groups.push(`Tools: ${s.tools.join(", ")}`);
        if (s.soft?.length) groups.push(`Soft Skills: ${s.soft.join(", ")}`);
      }
    } catch {
      /* not JSON */
    }
  }
  if (groups.length === 0) {
    return "No skills found in the resume. Add skills to your resume first." + LOCAL_FALLBACK_NOTICE;
  }
  return groups.join("\n") + LOCAL_FALLBACK_NOTICE;
}

function localAddKeywords(input: string): string {
  const keywords = [...new Set(extractKeywords(input))].slice(0, 25);
  if (keywords.length === 0) return "No keywords could be extracted from the job description." + LOCAL_FALLBACK_NOTICE;
  return `Based on the job description, consider including these keywords in your resume:\n${keywords
    .map((k) => `- ${k}`)
    .join("\n")}${LOCAL_FALLBACK_NOTICE}`;
}

function localCheckGrammar(input: string): string {
  const issues = checkGrammar(input);
  if (issues.length === 0) return "No grammar or style issues detected in the provided text." + LOCAL_FALLBACK_NOTICE;
  return `Grammar & style suggestions:\n${issues
    .map((i) => `- "${i.text}" → ${i.suggestion}`)
    .join("\n")}${LOCAL_FALLBACK_NOTICE}`;
}

function localAtsScore(context: string, input: string): string {
  const score = calculateAtsScore({ text: context || input, category: "experienced" });
  return JSON.stringify({
    overall: score.overall,
    skillsMatch: score.subscores.keywordRelevance,
    formatting: score.subscores.formatting,
    keywords: Math.round((score.subscores.keywordRelevance + score.subscores.readability) / 2),
    suggestions: [...score.suggestions.slice(0, 5), "Generated locally — AI scoring unavailable."],
  });
}

function localCoverLetter(context: string, input: string): string {
  const name = nameFromContext(context) || "The Candidate";
  const role = roleFromInput(input);
  const company = companyFromInput(input);
  const skills = collectSkills(context).slice(0, 6);
  const target = role ? `the ${role} role` : "this role";
  const at = company ? ` at ${company}` : "";
  const skillLine = skills.length
    ? ` My hands-on experience with ${skills.join(", ")} maps directly to what this position requires.`
    : "";

  return [
    name,
    "",
    "Dear Hiring Manager,",
    "",
    `I am applying for ${target}${at}. My background has prepared me to contribute from day one, and I am confident I can add value to the team.${skillLine}`,
    "",
    "I would welcome the opportunity to discuss how my experience fits your team's needs. Thank you for your time and consideration.",
    "",
    "Sincerely,",
    name,
  ].join("\n") + LOCAL_FALLBACK_NOTICE;
}

function localRecruiterEmail(context: string, input: string): string {
  const name = nameFromContext(context) || "The Candidate";
  const role = roleFromInput(input);
  const company = companyFromInput(input);
  const skills = collectSkills(context).slice(0, 6);
  const target = role ? `the ${role} role` : "the open role";
  const at = company ? ` at ${company}` : "";
  const skillLine = skills.length ? ` I bring hands-on experience with ${skills.join(", ")}.` : "";

  return [
    `Subject: Application for ${role || "Open Role"}${company ? ` - ${company}` : ""}`,
    "",
    "Dear Hiring Manager,",
    "",
    `I'm applying for ${target}${at}.${skillLine} I've delivered real projects and am ready to contribute from day one.`,
    "",
    "Could we schedule a short call to discuss the opportunity? I'm available at your convenience.",
    "",
    "Sincerely,",
    name,
  ].join("\n") + LOCAL_FALLBACK_NOTICE;
}

function localLinkedInMessage(context: string, input: string): string {
  const name = nameFromContext(context) || "The Candidate";
  const role = roleFromInput(input);
  const company = companyFromInput(input);
  const skills = collectSkills(context).slice(0, 4);
  const target = role ? `the ${role} role` : "an open role";
  const at = company ? ` at ${company}` : "";
  const skillLine = skills.length ? ` I have hands-on experience with ${skills.join(", ")}.` : "";

  return [
    "Hi there,",
    "",
    `I'm ${name}, applying for ${target}${at}.${skillLine} I'd love to ask a quick question about the team — would you be open to a short chat?`,
    "",
    name,
  ].join("\n") + LOCAL_FALLBACK_NOTICE;
}

function localInterviewQuestions(input: string): string {
  const keywords = extractKeywords(input).slice(0, 8);
  const questions = [
    "1. Walk me through your most relevant project and what you owned end-to-end.",
    "2. Tell me about a technical challenge you solved and how you approached it.",
    "3. How do you prioritize when requirements change mid-project?",
  ];
  keywords.forEach((k, i) => questions.push(`${i + 4}. Describe your hands-on experience with ${k}.`));
  questions.push(`${keywords.length + 4}. Why are you interested in this role and company?`);
  return questions.join("\n") + LOCAL_FALLBACK_NOTICE;
}

function localOptimizeResume(context: string): string {
  if (!context.trim()) return "No resume data provided to optimize." + LOCAL_FALLBACK_NOTICE;
  return context.trim() + LOCAL_FALLBACK_NOTICE;
}

/**
 * Deterministic, data-driven response for when every AI provider is unavailable.
 * Returns null for actions we can't meaningfully handle locally — those keep
 * their existing error path (and any route-level deterministic fallback).
 */
export function generateLocalFallback(request: AiRequest): string | null {
  const { action, input, context } = request;
  switch (action) {
    case "generate-summary":
      return localSummary(context);
    case "targeted-skills":
      return localTargetedSkills(context);
    case "check-grammar":
      return localCheckGrammar(input);
    case "add-keywords":
      return localAddKeywords(input);
    case "enhance-bullet":
    case "rewrite-section":
    case "extract-pdf-text":
      return (input || context || "No content provided.") + LOCAL_FALLBACK_NOTICE;
    case "ats-score":
      return localAtsScore(context, input);
    case "resume-import-upload":
      return JSON.stringify(parseResumeText(input));
    case "cover-letter":
      return localCoverLetter(context, input);
    case "recruiter-email":
      return localRecruiterEmail(context, input);
    case "linkedin-message":
      return localLinkedInMessage(context, input);
    case "interview-questions":
      return localInterviewQuestions(input);
    case "optimize-resume":
      return localOptimizeResume(context);
    default:
      return null;
  }
}
