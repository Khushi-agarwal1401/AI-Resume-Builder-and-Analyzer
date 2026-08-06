import { calculateAtsScore, type ResumeCategory } from "./ats-scorer";
import { checkGrammar, calculateGrammarScore } from "./grammar-checker";
import { extractSections, extractEmail, extractPhone } from "./parser";

/**
 * Deep, enterprise-style ATS analysis (deterministic — no AI needed).
 *
 * Works with OR without a job description:
 * - With a JD  → exact keyword comparison (with synonym normalization).
 * - Without a JD → scans the resume's own headings and an in-demand keyword
 *   list, so the user still gets a meaningful ATS score + improvements.
 *
 * Pure and unit-testable.
 */

export interface DeepAtsOptions {
  text: string;
  category?: ResumeCategory;
  jobTitle?: string;
  jobDescription?: string;
}

export interface WeakBullet {
  bullet: string;
  reason: string;
  rewrite: string;
}

export interface DeepAtsReport {
  atsScore: number;
  grade: string;
  subscores: ReturnType<typeof calculateAtsScore>["subscores"];
  parserConfidence: number;
  detected: string[];
  missing: string[];
  parserRiskFlags: string[];
  keywordScan: "job-description" | "resume-headings";
  foundKeywords: string[];
  missingKeywords: string[];
  keywordDensity: { term: string; count: number; flagged: boolean; recommended: string }[];
  densityScore: number;
  bullets: { total: number; strong: number; weak: WeakBullet[] };
  formattingIssues: string[];
  repetition: { term: string; count: number; suggestion: string }[];
  grammarScore: number;
  grammarIssues: ReturnType<typeof checkGrammar>;
  englishScore: number;
  fleschKincaid: number;
  avgSentenceLength: number;
  recruiterScore: number;
  interviewChance: "YES" | "MAYBE" | "NO";
  hiringProbability: number;
  topImprovements: { text: string; impact: string; points: number }[];
  verdict: string;
  disclaimer: string;
}

// ── Shared lexicons ─────────────────────────────────────────────────────────

const ACTION_VERBS = [
  "achieved", "implemented", "developed", "managed", "created", "designed",
  "led", "improved", "delivered", "optimized", "established", "coordinated",
  "generated", "conducted", "built", "launched", "increased", "reduced",
  "negotiated", "mentored", "spearheaded", "orchestrated", "engineered",
  "architected", "pioneered", "automated", "migrated", "streamlined", "owned",
  "drove", "shipped", "executed", "resolved", "analyzed", "built",
];

const WEAK_VERBS = ["helped", "worked on", "responsible for", "handled", "assisted with", "participated in", "involved in"];

const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "has", "had",
  "our", "its", "was", "per", "via", "etc", "with", "that", "this", "from",
  "your", "will", "have", "been", "they", "them", "their", "who", "what",
  "when", "where", "which", "while", "into", "over", "under", "also", "more",
  "most", "than", "then", "such", "should", "could", "would", "may", "must",
  "about", "above", "after", "again", "among", "any", "because", "before",
  "being", "both", "does", "doing", "during", "each", "few", "further", "here",
  "how", "just", "like", "make", "own", "only", "same", "some", "still",
  "too", "up", "use", "used", "very", "was", "well", "were", "work", "job",
  "role", "team", "years", "year", "experience", "working", "looking", "apply",
  "applicant", "candidate", "position", "company", "requirements", "responsibilities",
  "plus", "ability", "able", "knowledge", "understanding", "within", "across",
  "including", "including", "such", "etc", "may", "might", "must", "strong",
  "skills", "skill", "relevant", "preferred", "minimum", "nice", "good", "great",
  "need", "needed", "full", "bonus", "join", "please", "required", "help",
  "helping", "will", "highly", "familiar", "proven", "ability", "willing",
  "strongly", "written", "verbal", "written", "communication", "develop",
  "development", "design", "designing", "build", "building", "support",
  "supporting", "maintain", "maintaining", "using", "used", "provide",
  "provided", "learn", "learning", "work", "working", "lead", "leading",
]);

/** Canonical term → aliases (incl. common acronyms / synonyms) for semantic matching. */
const KEYWORD_ALIASES: Record<string, string[]> = {
  ai: ["artificial intelligence"],
  ml: ["machine learning"],
  js: ["javascript", "ecmascript"],
  node: ["nodejs", "node.js"],
  react: ["reactjs", "react.js"],
  rest: ["restful", "rest api", "restful api"],
  "ci/cd": ["continuous integration", "continuous delivery", "cicd"],
  cloud: ["aws", "azure", "gcp", "google cloud"],
  frontend: ["front-end", "front end", "ui development", "web ui"],
  backend: ["back-end", "back end", "server-side", "server side"],
  api: ["apis", "rest api"],
  db: ["database", "databases"],
  "docker": ["containerization", "containers"],
  "mlops": ["machine learning ops"],
  "next.js": ["nextjs", "next js"],
  "tailwind": ["tailwindcss", "tailwind css"],
  "data science": ["data science", "datascience"],
  "data engineering": ["data pipelines"],
  "testing": ["test", "qa", "quality assurance", "automated tests"],
  "leadership": ["leading", "managed teams", "team lead"],
  "communication": ["communicating", "presentations", "stakeholders"],
  "problem-solving": ["problem solving", "troubleshooting", "debugging"],
  "project management": ["project manager", "scrum master", "pmp"],
  "cloud computing": ["cloud"],
};

/** In-demand keywords used when no job description is provided (resume-headings scan). */
const IN_DEMAND_KEYWORDS = [
  "javascript", "typescript", "react", "node.js", "python", "java", "go", "golang",
  "sql", "docker", "kubernetes", "aws", "git", "ci/cd", "rest api", "graphql",
  "machine learning", "agile", "scrum", "leadership", "communication",
  "problem-solving", "project management", "data analysis", "testing", "html",
  "css", "next.js", "postgresql", "mongodb", "redis", "linux", "tensorflow",
  "pytorch", "unit testing", "microservices", "kafka", "terraform",
];

const BUZZWORDS: { term: string; suggestion: string }[] = [
  { term: "team player", suggestion: "show collaboration with a concrete example (e.g. \"partnered with 4 engineers to ship…\")" },
  { term: "hardworking", suggestion: "replace with a measurable trait (e.g. \"delivered 2x sprint velocity\")" },
  { term: "responsible for", suggestion: "use \"managed\", \"owned\", or \"led\"" },
  { term: "excellent communication", suggestion: "show it (e.g. \"presented weekly demos to 30 stakeholders\")" },
  { term: "problem solver", suggestion: "replace with \"resolved X by Y\", including the outcome" },
  { term: "fast-paced", suggestion: "replace with \"shipped under tight deadlines\" plus evidence" },
  { term: "self-motivated", suggestion: "replace with \"initiated …\" and the result" },
  { term: "passionate", suggestion: "replace with a concrete action or achievement" },
  { term: "detail-oriented", suggestion: "replace with evidence (e.g. \"caught 15 data anomalies\")" },
];

// ── Small helpers ───────────────────────────────────────────────────────────

function countMatches(text: string, term: string): number {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = text.toLowerCase().match(new RegExp(`\\b${escaped}`, "gi"));
  return matches ? matches.length : 0;
}

/** Word-boundary-aware term matcher ("react" must not match "reactor"). */
function termInText(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const start = /^[a-z0-9]/.test(term) ? "\\b" : "";
  const end = /[a-z0-9]$/.test(term) ? "\\b" : "";
  return new RegExp(start + escaped + end, "i").test(text);
}

/** True if the resume text contains the term OR any of its known synonyms. */
function matchesTerm(text: string, term: string): boolean {
  const lower = text.toLowerCase();
  if (termInText(lower, term.toLowerCase())) return true;
  for (const alias of KEYWORD_ALIASES[term.toLowerCase()] || []) {
    if (termInText(lower, alias.toLowerCase())) return true;
  }
  return false;
}

function tokenizeKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9#./+-\s]/g, " ")
    .split(/\s+/)
    // Strip punctuation glued to word ends ("experience." → "experience") but
    // keep inner separators like "node.js", "ci/cd", "c++".
    .map((w) => w.replace(/^[^a-z0-9#+/]+|[^a-z0-9#+/]+$/g, ""))
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
  return [...new Set(words)];
}

function extractBullets(text: string): string[] {
  const lines = text.split("\n");
  const bullets: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const m = trimmed.match(/^[-•*▪◦›]\s+(.+)$/);
    if (m && m[1].trim().length > 2) bullets.push(m[1].trim());
  }
  return bullets;
}

function computeReadability(text: string): { fleschKincaid: number; avgSentenceLength: number } {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter(Boolean);
  const totalWords = words.length || 1;
  const avgSentenceLength = totalWords / (sentences.length || 1);
  const syllables = words.reduce((sum, w) => {
    const s = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
    if (!s) return sum;
    let count = 0;
    let prevVowel = false;
    for (const ch of s) {
      if ("aeiou".includes(ch)) {
        if (!prevVowel) count++;
        prevVowel = true;
      } else {
        prevVowel = false;
      }
    }
    if (s.endsWith("e")) count--;
    if (count === 0) count = 1;
    return sum + count;
  }, 0);
  const fleschKincaid = 206.835 - 1.015 * avgSentenceLength - 84.6 * (syllables / totalWords);
  return {
    fleschKincaid: Math.round(fleschKincaid * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
  };
}

function englishScoreFrom(readability: { fleschKincaid: number; avgSentenceLength: number }): number {
  let score = 85;
  if (readability.avgSentenceLength > 25) score -= 15;
  else if (readability.avgSentenceLength > 20) score -= 8;
  else if (readability.avgSentenceLength > 15) score += 5;
  else if (readability.avgSentenceLength >= 10) score += 10;
  else score += 15;
  if (readability.fleschKincaid < 30) score -= 10;
  if (readability.fleschKincaid > 60) score += 10;
  return Math.max(0, Math.min(100, score));
}

function pickVerb(bullet: string): string {
  const lower = bullet.toLowerCase();
  if (/api|service|backend|server/.test(lower)) return "Built";
  if (/data|analy|model|ml/.test(lower)) return "Analyzed";
  if (/design|ui|frontend|interface/.test(lower)) return "Designed";
  if (/test|qa|quality/.test(lower)) return "Automated";
  if (/team|cross|mentor|lead|manag/.test(lower)) return "Led";
  if (/system|infra|deploy|cloud|migrat/.test(lower)) return "Migrated";
  return "Implemented";
}

function rewriteWeakBullet(bullet: string): { reason: string; rewrite: string } {
  const hasVerb = ACTION_VERBS.some((v) => new RegExp(`\\b${v}`, "i").test(bullet));
  const hasMetric = /\d|%|\$|million|thousand|users|percent|revenue|saved|reduced|increased/i.test(bullet);
  const verb = pickVerb(bullet);
  const lowered = bullet.charAt(0).toLowerCase() + bullet.slice(1).replace(/[.,;:!?]+$/, "");

  if (!hasVerb && !hasMetric) {
    return {
      reason: "No action verb and no measurable outcome — recruiters can't see your impact.",
      rewrite: `${verb} ${lowered} (+ measurable outcome, e.g. \"…, cutting load time by 38%\")`,
    };
  }
  if (!hasVerb) {
    return {
      reason: "Missing a strong action verb.",
      rewrite: `${verb} ${lowered}`,
    };
  }
  return {
    reason: "Add a quantified outcome to show measurable impact.",
    rewrite: `${bullet.replace(/[.,;:!?]+$/, "")} — add a metric (e.g. \"…, serving 300K users\")`,
  };
}

// ── Main entry ──────────────────────────────────────────────────────────────

export function analyzeDeepAts(options: DeepAtsOptions): DeepAtsReport {
  const text = options.text.trim();
  if (!text) {
    throw new Error("Resume text is required");
  }
  const category = options.category || "experienced";
  const jobTitle = (options.jobTitle || "").trim();
  const jobDescription = (options.jobDescription || "").trim();

  const ats = calculateAtsScore({ text, category, jobDescription: jobDescription || undefined });
  const grammarIssues = checkGrammar(text);
  const grammarScore = calculateGrammarScore(grammarIssues);
  const sections = extractSections(text);
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const readability = computeReadability(text);

  // ── Parser confidence ──
  const detected: string[] = [];
  const missing: string[] = [];

  const hasEmail = Boolean(extractEmail(text));
  const hasPhone = Boolean(extractPhone(text));
  const hasLinkedIn = /linkedin\.com/i.test(text);
  const hasGithub = /github\.com|gitlab\.com/i.test(text);
  const hasPortfolio = /portfolio|\b\.io\b|vercel\.app|netlify\.app/i.test(text);
  const nameMatch = text.match(/^([A-Z][a-zA-Z' .-]{2,40})$/m);
  const hasName = Boolean(nameMatch) && (nameMatch![1].trim().split(/\s+/).length >= 2);
  const hasSummary = Boolean(sections.summary);
  const hasExperience = Boolean(sections.experience);
  const hasEducation = Boolean(sections.education);
  const hasSkills = Boolean(sections.skills);
  const hasProjects = Boolean(sections.projects);
  const hasCertifications = Boolean(sections.certifications);

  if (hasName) detected.push("Name");
  else missing.push("Name");
  if (hasEmail) detected.push("Email");
  else missing.push("Email");
  if (hasPhone) detected.push("Phone");
  else missing.push("Phone");
  if (hasLinkedIn) detected.push("LinkedIn");
  else missing.push("LinkedIn");
  if (hasGithub) detected.push("GitHub");
  if (hasPortfolio) detected.push("Portfolio");
  if (hasSummary) detected.push("Summary");
  if (hasSkills) detected.push("Skills");
  if (hasExperience) detected.push("Experience");
  if (hasEducation) detected.push("Education");
  if (hasProjects) detected.push("Projects");
  if (hasCertifications) detected.push("Certifications");

  let parserConfidence = 30;
  parserConfidence += hasName ? 8 : 0;
  parserConfidence += hasEmail ? 10 : 0;
  parserConfidence += hasPhone ? 8 : 0;
  parserConfidence += hasLinkedIn ? 6 : 0;
  parserConfidence += hasGithub ? 6 : 0;
  parserConfidence += hasPortfolio ? 4 : 0;
  parserConfidence += hasSummary ? 10 : 0;
  parserConfidence += hasSkills ? 10 : 0;
  parserConfidence += hasExperience ? 12 : 0;
  parserConfidence += hasEducation ? 10 : 0;
  parserConfidence += hasProjects ? 8 : 0;
  parserConfidence += hasCertifications ? 5 : 0;
  parserConfidence = Math.min(100, parserConfidence);

  // Parse-risk flags
  const parserRiskFlags: string[] = [];
  const columnSeparators = (text.match(/\|/g) || []).length;
  if (columnSeparators > 10) {
    parserRiskFlags.push("Heavy table/column separators detected — multi-column layouts can garble ATS parsing.");
    parserConfidence -= 8;
  }
  const iconChars = (text.match(/[●◆▶★✦♛▲■□◦▪➔→↓]/g) || []).length;
  if (iconChars > 3) {
    parserRiskFlags.push("Icons/graphics characters detected — replace with plain text for reliable parsing.");
    parserConfidence -= 6;
  }
  if (/(?:font-family:|font-size:|color:)/i.test(text)) {
    parserRiskFlags.push("Inline style hints detected — unusual fonts/styles can confuse parsers.");
    parserConfidence -= 4;
  }
  parserConfidence = Math.max(0, Math.min(100, parserConfidence));

  // ── Keyword scan ──
  const hasJd = Boolean(jobDescription) || Boolean(jobTitle);
  const keywordScan: DeepAtsReport["keywordScan"] = hasJd ? "job-description" : "resume-headings";

  const foundKeywords: string[] = [];
  let missingKeywords: string[] = [];

  if (hasJd) {
    const jdWords = tokenizeKeywords(jobDescription || jobTitle);
    for (const kw of jdWords) {
      if (matchesTerm(text, kw)) foundKeywords.push(kw);
      else missingKeywords.push(kw);
    }
  } else {
    for (const kw of IN_DEMAND_KEYWORDS) {
      if (matchesTerm(text, kw)) foundKeywords.push(kw);
    }
    // Missing = the most in-demand keywords the resume does not mention.
    missingKeywords = IN_DEMAND_KEYWORDS.filter((kw) => !matchesTerm(text, kw)).slice(0, 12);
  }

  // ── Keyword density ──
  const densityTerms = new Set<string>();
  if (hasJd) {
    for (const kw of [...foundKeywords, ...missingKeywords]) if (kw.length >= 4) densityTerms.add(kw);
  } else {
    for (const kw of IN_DEMAND_KEYWORDS) densityTerms.add(kw);
  }
  const keywordDensity: DeepAtsReport["keywordDensity"] = [];
  let densityPenalty = 0;
  for (const term of densityTerms) {
    const count = countMatches(text, term);
    if (count === 0) continue;
    const isBuzz = BUZZWORDS.some((b) => b.term.includes(term.toLowerCase())) || term.length < 5;
    const recommended = isBuzz ? "1–2 mentions" : "6–8 mentions";
    const threshold = isBuzz ? 2 : 8;
    const flagged = count > threshold;
    if (flagged) densityPenalty += Math.min(25, (count - threshold) * 4);
    keywordDensity.push({ term, count, flagged, recommended });
  }
  keywordDensity.sort((a, b) => b.count - a.count);
  const densityScore = Math.max(0, Math.min(100, 100 - densityPenalty));

  // ── Bullet quality ──
  const bullets = extractBullets(text);
  const weakBullets: WeakBullet[] = [];
  let strongCount = 0;
  for (const bullet of bullets) {
    const weakVerb = WEAK_VERBS.some((v) => new RegExp(`\\b${v}`, "i").test(bullet));
    const hasVerb = ACTION_VERBS.some((v) => new RegExp(`\\b${v}`, "i").test(bullet));
    const hasMetric = /\d|%|\$|million|thousand|users|percent|revenue|saved|reduced|increased/i.test(bullet);
    if (weakVerb || !hasVerb || (!hasMetric && bullet.split(/\s+/).length < 6)) {
      const { reason, rewrite } = rewriteWeakBullet(bullet);
      weakBullets.push({ bullet, reason, rewrite });
    } else {
      strongCount++;
    }
  }
  const strongRatio = bullets.length > 0 ? strongCount / bullets.length : 0;

  // ── Formatting issues ──
  const formattingIssues: string[] = [];
  if (bullets.length === 0) formattingIssues.push("No bullet points detected — ATS and recruiters prefer scannable bullets over paragraphs.");
  if (Object.keys(sections).filter((k) => sections[k]).length < 3) formattingIssues.push("Few recognizable section headings — use standard headings (Experience, Education, Skills, Projects).");
  if (!/\b(19|20)\d{2}/.test(text)) formattingIssues.push("No dates found — include years for every role, project, and degree.");
  if (wordCount < 250) formattingIssues.push(`Resume is short (${wordCount} words) — aim for 400–600 words for most roles.`);
  if (wordCount > 900) formattingIssues.push(`Resume is long (${wordCount} words) — trim to one page (early career) or two pages (senior).`);
  if (!hasEmail) formattingIssues.push("Missing email — the single most basic contact field.");
  if (!hasPhone) formattingIssues.push("Missing phone number.");
  if (!hasLinkedIn) formattingIssues.push("Missing LinkedIn URL.");
  if (iconChars > 3) formattingIssues.push("Icons/symbols may not parse — use plain text.");
  formattingIssues.push(...parserRiskFlags);

  // ── Repetition / buzzwords ──
  const repetition: DeepAtsReport["repetition"] = [];
  for (const buzz of BUZZWORDS) {
    const count = countMatches(lower, buzz.term);
    if (count > 0) repetition.push({ term: buzz.term, count, suggestion: buzz.suggestion });
  }
  for (const d of keywordDensity) {
    if (d.flagged) {
      repetition.push({
        term: d.term,
        count: d.count,
        suggestion: `Repeated ${d.count} times — keep it to ${d.recommended}.`,
      });
    }
  }

  // ── Recruiter + hiring ──
  // The strong-bullet ratio carries the most weight: a short, vague resume may
  // read easily, but a recruiter can't see impact — so substance dominates.
  const englishScore = englishScoreFrom(readability);
  const recruiterScore = Math.round(
    ats.subscores.experienceDepth * 0.25 +
    ats.subscores.projectQuality * 0.15 +
    ats.subscores.readability * 0.1 +
    englishScore * 0.05 +
    grammarScore * 0.1 +
    strongRatio * 100 * 0.3 +
    ats.overall * 0.05
  );
  const interviewChance: DeepAtsReport["interviewChance"] =
    recruiterScore >= 75 ? "YES" : recruiterScore >= 55 ? "MAYBE" : "NO";
  const hiringProbability = Math.round(ats.overall * 0.5 + recruiterScore * 0.5);

  // ── Top improvements (deterministic, ranked by estimated points) ──
  const improvements: DeepAtsReport["topImprovements"] = [];
  if (missingKeywords.length > 0) {
    improvements.push({
      text: `Add missing keywords: ${missingKeywords.slice(0, 5).join(", ")}${missingKeywords.length > 5 ? "…" : ""}`,
      impact: "+5 ATS",
      points: 5,
    });
  }
  if (strongRatio < 0.6 && bullets.length > 0) {
    improvements.push({
      text: `Quantify ${bullets.length - strongCount} of your ${bullets.length} bullets with metrics (% , $, users) and strong action verbs.`,
      impact: "+7 Recruiter",
      points: 7,
    });
  }
  if (!hasMetricsInText(text)) {
    improvements.push({
      text: "Add measurable achievements — percentages, revenue, time saved, or performance gains.",
      impact: "+6 Recruiter",
      points: 6,
    });
  }
  if (formattingIssues.some((i) => i.includes("bullet"))) {
    improvements.push({ text: "Convert experience paragraphs into bullet points.", impact: "+4 ATS", points: 4 });
  }
  if (!hasLinkedIn) improvements.push({ text: "Add your LinkedIn profile URL.", impact: "+4 ATS", points: 4 });
  if (!hasPhone) improvements.push({ text: "Add your phone number.", impact: "+3 ATS", points: 3 });
  if (Object.keys(sections).filter((k) => sections[k]).length < 3) {
    improvements.push({ text: "Add standard section headings (Experience, Education, Skills, Projects).", impact: "+4 ATS", points: 4 });
  }
  if (repetition.some((r) => r.count > 3)) {
    improvements.push({ text: "Trim repeated buzzwords/technologies — aim for natural, varied phrasing.", impact: "+3 ATS", points: 3 });
  }
  if (grammarIssues.length > 0) {
    improvements.push({ text: `Fix ${grammarIssues.length} grammar/style issue${grammarIssues.length === 1 ? "" : "s"}.`, impact: "+3 Overall", points: 3 });
  }
  if (wordCount < 250 || wordCount > 900) {
    improvements.push({ text: wordCount < 250 ? "Expand the resume to 400–600 words." : "Trim the resume to 400–600 words.", impact: "+4 Overall", points: 4 });
  }
  improvements.sort((a, b) => b.points - a.points);

  const verdict = buildVerdict(ats.overall, recruiterScore, interviewChance);

  return {
    atsScore: ats.overall,
    grade: ats.grade,
    subscores: ats.subscores,
    parserConfidence,
    detected,
    missing,
    parserRiskFlags,
    keywordScan,
    foundKeywords,
    missingKeywords,
    keywordDensity,
    densityScore,
    bullets: { total: bullets.length, strong: strongCount, weak: weakBullets.slice(0, 8) },
    formattingIssues,
    repetition: repetition.slice(0, 8),
    grammarScore,
    grammarIssues,
    englishScore,
    fleschKincaid: readability.fleschKincaid,
    avgSentenceLength: readability.avgSentenceLength,
    recruiterScore,
    interviewChance,
    hiringProbability,
    topImprovements: improvements.slice(0, 20),
    verdict,
    disclaimer:
      "This analysis simulates the behavior of modern ATS platforms and recruiter best practices. Actual ATS scoring varies by employer, configuration, and hiring workflow. The score is an estimate designed to maximize resume compatibility and interview potential.",
  };
}

function hasMetricsInText(text: string): boolean {
  return /\d+%|\$\d+|\d+x|\d+\s+(users|clients|customers|percent|revenue|growth|increase|reduction|downloads|requests|transactions)/i.test(text);
}

function buildVerdict(atsScore: number, recruiterScore: number, interviewChance: DeepAtsReport["interviewChance"]): string {
  const overall = Math.round(atsScore * 0.5 + recruiterScore * 0.5);
  if (overall >= 80) {
    return "Excellent — this resume is highly ATS-compatible and recruiter-friendly. It should reach the interview stage for most applications.";
  }
  if (overall >= 65) {
    return "Good — a solid resume with a few targeted improvements that could noticeably increase your interview rate.";
  }
  if (overall >= 45) {
    return "Average — the resume would likely clear basic ATS filters, but weak bullets, missing keywords, or formatting gaps may hold it back.";
  }
  return interviewChance === "NO"
    ? "Weak — in its current state this resume may be filtered out before a recruiter sees it. Prioritize the top improvements below."
    : "Below average — address the top improvements below to avoid being filtered by ATS software.";
}
