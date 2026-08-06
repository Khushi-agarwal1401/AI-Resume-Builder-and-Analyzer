import {
  TEMPLATE_ATS_SCORE,
  TEMPLATE_INTERVIEW_SUCCESS,
  TEMPLATE_PAGES,
  TEMPLATE_POPULARITY,
  TEMPLATE_RATING,
  TEMPLATE_TAGS,
} from "./template-discovery";
import { TEMPLATE_NAMES, TEMPLATE_VARIANTS } from "./template-constants";
import { getFamilyForTemplate, isCanonicalTemplate } from "./template-families";

/**
 * AI-style template recommendation engine (Epic 5).
 *
 * A deterministic, explainable scorer that maps Job Role + Experience +
 * Industry to the best template, along with a human-readable reason,
 * ATS score, expected recruiter appeal, and "recommended because" bullets.
 * Pure and unit-testable — no network calls, works for anonymous visitors.
 */

export type ExperienceLevel = "student" | "entry" | "mid" | "senior";

export const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "student", label: "Student / Fresher" },
  { value: "entry", label: "Entry (0–2 yrs)" },
  { value: "mid", label: "Mid (3–6 yrs)" },
  { value: "senior", label: "Senior / Executive (7+ yrs)" },
];

export interface RecommendationInput {
  role: string;
  experience: ExperienceLevel;
  industry: string;
}

export interface TemplateRecommendation {
  key: string;
  name: string;
  reason: string;
  atsScore: number;
  recruiterAppeal: string;
  bullets: string[];
  /** Curated layout family this design belongs to. */
  family: string;
  /** Human-readable family name. */
  familyName: string;
  /** Family category (academic/technical/designer aware). */
  category: string;
}

/** Role keyword → template + score boost (first match wins per rule). */
const ROLE_RULES: { pattern: RegExp; key: string; points: number }[] = [
  { pattern: /\b(software engineer|developer|programmer|backend|frontend|full[- ]stack|devops|engineer|sre|architect|data scientist)\b/i, key: "modern", points: 22 },
  { pattern: /\b(software|engineer|developer|data)\b/i, key: "ats-professional", points: 10 },
  { pattern: /\b(product manager|product designer|project manager|program manager)\b/i, key: "modern-card", points: 18 },
  { pattern: /\b(designer|design|creative|artist|ux|ui|graphic|visual)\b/i, key: "creative", points: 24 },
  { pattern: /\b(minimal|clean|simple)\b/i, key: "minimal", points: 10 },
  { pattern: /\b(ceo|cto|cfo|coo|cmo|director|vp|vice president|executive|president|founder|chief|head of)\b/i, key: "executive", points: 24 },
  { pattern: /\b(ceo|cto|director|vp|executive|founder|chief|head of)\b/i, key: "executive-sidebar", points: 14 },
  { pattern: /\b(student|intern|graduate|fresher|entry[- ]level|junior)\b/i, key: "student", points: 20 },
  { pattern: /\b(finance|bank|consultant|consulting|investment|analyst|accountant|audit)\b/i, key: "executive", points: 16 },
  { pattern: /\b(marketing|sales|recruiter|hr|media|content|social)\b/i, key: "modern", points: 10 },
  { pattern: /\b(teacher|professor|educator|academic|researcher)\b/i, key: "student", points: 12 },
];

/** Industry keyword → template + score boost. */
const INDUSTRY_RULES: { pattern: RegExp; key: string; points: number }[] = [
  { pattern: /\b(technology|software|tech|saas|startup|it services|internet)\b/i, key: "modern", points: 18 },
  { pattern: /\b(technology|software|tech|saas|startup)\b/i, key: "modern-card", points: 12 },
  { pattern: /\b(design|creative|media|marketing|advertising|fashion|entertainment|art)\b/i, key: "creative", points: 20 },
  { pattern: /\b(finance|banking|consulting|investment|insurance|accounting|real estate|legal|law)\b/i, key: "executive", points: 20 },
  { pattern: /\b(education|academic|university|school|training)\b/i, key: "student", points: 18 },
  { pattern: /\b(healthcare|health|hospital|medical|pharma|nursing)\b/i, key: "ats-professional", points: 14 },
  { pattern: /\b(government|public sector|nonprofit|ngo)\b/i, key: "ats-professional", points: 10 },
];

/** Experience level → template + score boost (flat, not keyword-based). */
const EXPERIENCE_BOOSTS: Record<ExperienceLevel, Record<string, number>> = {
  student: { student: 26, "ats-professional": 8 },
  entry: { student: 10, "ats-professional": 14, modern: 4 },
  mid: { modern: 12, "ats-professional": 8, "modern-card": 6 },
  senior: { executive: 22, "executive-sidebar": 18, modern: 2 },
};

/** Base quality floor added to every template (popularity, rating, ATS, interviews). */
function baseScore(key: string): number {
  return (
    (TEMPLATE_POPULARITY[key] ?? 0) / 20 +
    (TEMPLATE_RATING[key] ?? 0) * 2 +
    (TEMPLATE_ATS_SCORE[key] ?? 0) / 25 +
    (TEMPLATE_INTERVIEW_SUCCESS[key] ?? 0) / 15
  );
}

/** One-line reason template per template key. */
const REASON_PHRASE: Record<string, string> = {
  modern: "a clean, balanced single-column layout that works for most industries",
  "ats-professional": "a structured single-column layout that ATS parsers handle reliably",
  student: "an education-first layout built for students and recent graduates",
  minimal: "a minimalist design with generous whitespace for a clean, uncluttered look",
  executive: "a serif-based, senior-friendly layout with an elegant navy accent",
  creative: "a bold, visually-driven layout with a sidebar that stands out",
  "executive-sidebar": "a two-column leadership layout with a dark sidebar",
  "modern-card": "a modern card-style layout with rounded sections and accent chips",
};

/** Expected recruiter appeal derived from ATS score. */
function recruiterAppeal(key: string): string {
  const ats = TEMPLATE_ATS_SCORE[key] ?? 0;
  if (ats >= 95) return "Excellent — highly standardized, recruiter-friendly";
  if (ats >= 88) return "Strong — clean layout recruiters can scan in seconds";
  if (ats >= 82) return "Good — visually distinctive while staying scannable";
  return "Fair — prioritized for its visual design over ATS parsing";
}

/** Build the "Recommended because" bullets (Task 5.2). */
function buildBullets(key: string, role: string, industry: string): string[] {
  const tags = TEMPLATE_TAGS[key] ?? [];
  const bullets: string[] = [];

  if (tags.includes("ats-friendly")) bullets.push("ATS Friendly");
  if (tags.includes("professional")) bullets.push("Professional");
  if (tags.includes("student")) bullets.push("Student Friendly");
  if (tags.includes("modern")) bullets.push("Modern Design");
  if (tags.includes("minimal")) bullets.push("Minimal Design");
  if (tags.includes("creative")) bullets.push("Creative Design");
  if (tags.includes("executive")) bullets.push("Executive Presence");

  const pages = TEMPLATE_PAGES[key] ?? "";
  if (pages.toLowerCase().includes("one page")) bullets.push("One Page");

  const roleLabel = role.trim();
  if (roleLabel) {
    // Title-case lowercase words only, so acronyms stay intact (UX, iOS, …)
    const roleNoun = roleLabel
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => (w === w.toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(" ");
    bullets.push(`Popular for ${roleNoun}`);
  }

  const industryLabel = industry.trim();
  if (industryLabel) {
    bullets.push(`Great for ${industryLabel.charAt(0).toUpperCase() + industryLabel.slice(1).toLowerCase()}`);
  }

  // Keep the most useful 5 bullets (industry/role last, they're the longest)
  return bullets.slice(0, 5);
}

/**
 * Score every template against the input and return the best match with a
 * human-readable explanation. Deterministic: same input → same output.
 */
export function recommendTemplate(input: RecommendationInput): TemplateRecommendation {
  const role = input.role.trim().toLowerCase();
  const industry = input.industry.trim().toLowerCase();

  const scores: Record<string, number> = {};
  for (const key of TEMPLATE_VARIANTS) {
    scores[key] = baseScore(key);
  }

  for (const rule of ROLE_RULES) {
    if (role && rule.pattern.test(role)) scores[rule.key] += rule.points;
  }
  for (const rule of INDUSTRY_RULES) {
    if (industry && rule.pattern.test(industry)) scores[rule.key] += rule.points;
  }
  const experienceBoost = EXPERIENCE_BOOSTS[input.experience];
  for (const [key, points] of Object.entries(experienceBoost)) {
    scores[key] += points;
  }

  // Highest score wins; ties broken by popularity
  const bestKey = [...TEMPLATE_VARIANTS].sort((a, b) => {
    const diff = (scores[b] ?? 0) - (scores[a] ?? 0);
    return diff !== 0 ? diff : (TEMPLATE_POPULARITY[b] ?? 0) - (TEMPLATE_POPULARITY[a] ?? 0);
  })[0];

  // Prefer the family's canonical (hero) representative so recommendations
  // always point at a curated design, never a duplicate color variant.
  const family = getFamilyForTemplate(bestKey);
  const effectiveKey = !isCanonicalTemplate(bestKey) ? family.canonicalId : bestKey;

  const roleText = role ? ` your ${input.role.trim()} role` : "";
  const industryText = industry ? ` in ${input.industry.trim()}` : "";
  const matchPhrase =
    roleText || industryText
      ? `Best match for${roleText}${industryText}.`
      : "A great all-round choice for most professional profiles.";
  const reason = `${TEMPLATE_NAMES[effectiveKey]} — ${REASON_PHRASE[effectiveKey]}. ${matchPhrase}`;

  return {
    key: effectiveKey,
    name: TEMPLATE_NAMES[effectiveKey],
    reason,
    atsScore: TEMPLATE_ATS_SCORE[effectiveKey] ?? 0,
    recruiterAppeal: recruiterAppeal(effectiveKey),
    bullets: buildBullets(effectiveKey, input.role, input.industry),
    family: family.id,
    familyName: family.name,
    category: family.category,
  };
}
