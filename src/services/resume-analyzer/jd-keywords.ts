/**
 * Jobscan/Teal-style weighted keyword engine.
 *
 * Real ATS checkers don't count words equally. They extract the skills, tools,
 * certifications, and roles a job description actually asks for, weight each
 * one (hard skills & tools weigh more than generic filler, terms repeated in
 * the JD weigh more, title terms weigh most), then compute a weighted match
 * percentage against the resume with synonym/alias normalization.
 *
 * Pure and unit-testable — no AI required.
 */

export type KeywordCategory =
  | "hard-skills"
  | "tools"
  | "soft-skills"
  | "certifications"
  | "roles"
  | "general";

export const KEYWORD_CATEGORY_ORDER: KeywordCategory[] = [
  "hard-skills",
  "tools",
  "soft-skills",
  "certifications",
  "roles",
  "general",
];

export const KEYWORD_CATEGORY_LABELS: Record<KeywordCategory, string> = {
  "hard-skills": "Hard Skills",
  tools: "Tools & Platforms",
  "soft-skills": "Soft Skills",
  certifications: "Certifications",
  roles: "Role / Title",
  general: "Job Context",
};

export interface JdKeyword {
  term: string;
  category: KeywordCategory;
  countInJd: number;
  weight: number;
}

export interface JdKeywordMatch extends JdKeyword {
  matched: boolean;
}

export interface KeywordMatchBreakdown {
  matched: { category: KeywordCategory; terms: string[]; weight: number }[];
  missing: { category: KeywordCategory; terms: string[]; weight: number }[];
  matchedWeight: number;
  totalWeight: number;
}

// ── Knowledge base: canonical term → category ───────────────────────────────

const SKILL_KB: Record<string, KeywordCategory> = {
  // Programming languages & hard technical skills
  javascript: "hard-skills",
  typescript: "hard-skills",
  python: "hard-skills",
  java: "hard-skills",
  golang: "hard-skills",
  go: "hard-skills",
  rust: "hard-skills",
  c: "hard-skills",
  "c++": "hard-skills",
  "c#": "hard-skills",
  ".net": "hard-skills",
  ruby: "hard-skills",
  php: "hard-skills",
  swift: "hard-skills",
  kotlin: "hard-skills",
  scala: "hard-skills",
  r: "hard-skills",
  matlab: "hard-skills",
  react: "hard-skills",
  "react native": "hard-skills",
  reactjs: "hard-skills",
  vue: "hard-skills",
  angular: "hard-skills",
  "next.js": "hard-skills",
  nextjs: "hard-skills",
  svelte: "hard-skills",
  "node.js": "hard-skills",
  nodejs: "hard-skills",
  express: "hard-skills",
  django: "hard-skills",
  flask: "hard-skills",
  spring: "hard-skills",
  rails: "hard-skills",
  graphql: "hard-skills",
  sql: "hard-skills",
  mysql: "hard-skills",
  postgresql: "hard-skills",
  mongodb: "hard-skills",
  redis: "hard-skills",
  elasticsearch: "hard-skills",
  html: "hard-skills",
  css: "hard-skills",
  tailwind: "hard-skills",
  tailwindcss: "hard-skills",
  frontend: "hard-skills",
  backend: "hard-skills",
  cicd: "tools",
  "rest api": "hard-skills",
  "system design": "hard-skills",
  microservices: "hard-skills",
  "machine learning": "hard-skills",
  "deep learning": "hard-skills",
  tensorflow: "hard-skills",
  pytorch: "hard-skills",
  nlp: "hard-skills",
  "computer vision": "hard-skills",
  "data science": "hard-skills",
  "data engineering": "hard-skills",
  "data analysis": "hard-skills",
  statistics: "hard-skills",
  pandas: "hard-skills",
  numpy: "hard-skills",
  "unit testing": "hard-skills",
  testing: "hard-skills",
  automation: "hard-skills",
  "test automation": "hard-skills",
  "ci/cd": "tools",
  cypress: "tools",
  selenium: "tools",
  jest: "tools",
  "data structures": "hard-skills",
  algorithms: "hard-skills",
  networking: "hard-skills",
  linux: "tools",

  // Tools & platforms
  docker: "tools",
  kubernetes: "tools",
  k8s: "tools",
  aws: "tools",
  azure: "tools",
  gcp: "tools",
  terraform: "tools",
  ansible: "tools",
  git: "tools",
  github: "tools",
  gitlab: "tools",
  jenkins: "tools",
  circleci: "tools",
  kafka: "tools",
  airflow: "tools",
  spark: "tools",
  hadoop: "tools",
  nginx: "tools",
  webpack: "tools",
  figma: "tools",
  jira: "tools",
  confluence: "tools",
  slack: "tools",
  excel: "tools",
  tableau: "tools",
  "power bi": "tools",
  looker: "tools",
  snowflake: "tools",
  "bigquery": "tools",

  // Soft skills
  leadership: "soft-skills",
  communication: "soft-skills",
  teamwork: "soft-skills",
  collaboration: "soft-skills",
  mentoring: "soft-skills",
  "problem-solving": "soft-skills",
  "critical thinking": "soft-skills",
  "time management": "soft-skills",
  adaptability: "soft-skills",
  ownership: "soft-skills",
  agile: "soft-skills",
  scrum: "soft-skills",
  "stakeholder management": "soft-skills",
  presentation: "soft-skills",
  "cross-functional": "soft-skills",

  // Certifications
  "aws certified": "certifications",
  "google cloud certified": "certifications",
  "azure certified": "certifications",
  cissp: "certifications",
  pmp: "certifications",
  "scrum master": "certifications",
  ccna: "certifications",
  comptia: "certifications",
  "aws solutions architect": "certifications",
};

/** Canonical term → aliases/synonyms (incl. acronyms and common variants). */
const ALIASES: Record<string, string[]> = {
  js: ["javascript"],
  ts: ["typescript"],
  node: ["node.js", "nodejs", "node js"],
  react: ["reactjs", "react.js"],
  "next.js": ["nextjs", "next js"],
  vue: ["vuejs", "vue.js"],
  "ci/cd": ["cicd", "continuous integration", "continuous delivery", "continuous deployment"],
  "rest api": ["restful", "rest apis", "rest"],
  "machine learning": ["ml", "deep learning"],
  "data science": ["datascience", "data scientist"],
  "data engineering": ["data pipelines", "data engineer"],
  "data analysis": ["data analytics", "analytics"],
  testing: ["test", "qa", "quality assurance", "automated testing"],
  automation: ["automated", "automating"],
  cloud: ["aws", "azure", "gcp", "google cloud", "amazon web services"],
  frontend: ["front-end", "front end", "ui development", "ui"],
  backend: ["back-end", "back end", "server-side", "server side"],
  api: ["apis", "rest api", "web service", "web services"],
  db: ["database", "databases", "sql"],
  docker: ["containerization", "containers", "container"],
  kubernetes: ["k8s", "kube"],
  leadership: ["leading", "team lead", "led teams", "people management"],
  communication: ["communicating", "stakeholders", "presentations"],
  "problem-solving": ["problem solving", "troubleshooting", "debugging"],
  "project management": ["project manager", "pmp", "scrum master"],
  "ui/ux": ["ui design", "ux design", "user experience", "user interface"],
};

const CATEGORY_WEIGHT: Record<KeywordCategory, number> = {
  "hard-skills": 1.0,
  tools: 1.0,
  certifications: 1.0,
  roles: 0.8,
  "soft-skills": 0.7,
  general: 0.4,
};

/** Reverse map: alias → canonical term (e.g. "ml" → "machine learning"). */
const ALIAS_TO_CANONICAL: Record<string, string> = {};
for (const [canonical, aliases] of Object.entries(ALIASES)) {
  for (const a of aliases) ALIAS_TO_CANONICAL[a.toLowerCase()] = canonical;
}

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
  "including", "such", "might", "strong", "skills", "skill", "relevant",
  "preferred", "minimum", "nice", "good", "great", "need", "needed",
  "bonus", "join", "please", "required", "help", "helping", "hiring",
  "highly", "familiar", "proven", "willing", "strongly", "written", "verbal",
  "communication", "develop", "development", "design", "designing", "build",
  "building", "support", "supporting", "maintain", "maintaining", "using",
  "provide", "provided", "learn", "learning", "lead", "leading", "qualifications",
  "responsibilities", "summary", "description", "about", "successful", "opportunity",
]);

const ROLE_SUFFIXES = new Set([
  "engineer", "developer", "designer", "manager", "analyst", "architect",
  "scientist", "consultant", "director", "specialist", "lead", "researcher",
  "administrator", "coordinator", "officer", "intern",
]);

// ── Small matchers ──────────────────────────────────────────────────────────

function termInText(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const start = /^[a-z0-9]/.test(term) ? "\\b" : "";
  const end = /[a-z0-9]$/.test(term) ? "\\b" : "";
  return new RegExp(start + escaped + end, "i").test(text);
}

function countMatches(text: string, term: string): number {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = text.toLowerCase().match(new RegExp(`\\b${escaped}`, "gi"));
  return matches ? matches.length : 0;
}

/** True if the text contains the term or any of its known aliases. */
export function matchesKeyword(text: string, term: string): boolean {
  const lower = text.toLowerCase();
  const t = term.toLowerCase();
  if (termInText(lower, t)) return true;
  for (const alias of ALIASES[t] || []) {
    if (termInText(lower, alias.toLowerCase())) return true;
  }
  const canonical = ALIAS_TO_CANONICAL[t];
  if (canonical && termInText(lower, canonical)) return true;
  return false;
}

function jdTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9#+/.\-\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-z0-9#+/]+|[^a-z0-9#+/]+$/g, ""))
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

/** Extract role/title phrases (up to 4 words) that end in a role keyword. */
function extractRolePhrases(text: string): string[] {
  const tokens = jdTokens(text);
  const phrases = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    const suffix = tokens[i];
    if (!ROLE_SUFFIXES.has(suffix)) continue;
    const window = tokens.slice(Math.max(0, i - 3), i + 1);
    // Drop leading filler words so we get "senior full stack engineer", not
    // "hiring senior full stack engineer".
    while (window.length > 1 && STOPWORDS.has(window[0])) window.shift();
    const full = window.join(" ");
    phrases.add(full);
    // Keep the bare role word ("engineer") as a fallback match signal.
    phrases.add(suffix);
  }
  return [...phrases];
}

const CERT_PATTERNS: { term: string; regex: RegExp }[] = [
  { term: "aws certified", regex: /\baws\s+certified\b/i },
  { term: "google cloud certified", regex: /\bgoogle\s+cloud\s+certified\b/i },
  { term: "azure certified", regex: /\bazure\s+certified\b/i },
  { term: "scrum master", regex: /\bscrum\s+master\b/i },
  { term: "cissp", regex: /\bcissp\b/i },
  { term: "pmp", regex: /\bpmp\b/i },
  { term: "ccna", regex: /\bccna\b/i },
  { term: "comptia", regex: /\bcomptia\b/i },
  { term: "aws solutions architect", regex: /\baws\s+solutions\s+architect\b/i },
];

function extractCertPhrases(text: string): string[] {
  const found: string[] = [];
  for (const c of CERT_PATTERNS) {
    if (c.regex.test(text)) found.push(c.term);
  }
  return found;
}

// ── Main extraction ─────────────────────────────────────────────────────────

function addKeyword(
  map: Map<string, JdKeyword>,
  term: string,
  category: KeywordCategory,
  source: string,
  titleSource: string
) {
  const key = term.toLowerCase();
  const existing = map.get(key);
  if (existing) return;
  const countInJd = Math.max(1, countMatches(source, key));
  let weight = CATEGORY_WEIGHT[category] * (1 + Math.min(countInJd - 1, 3) * 0.15);
  if (titleSource && termInText(titleSource, key)) weight *= 1.5;
  map.set(key, { term: key, category, countInJd, weight: Math.round(weight * 100) / 100 });
}

/**
 * Extract weighted keywords from a job description (and optional title).
 * Known skills/tools/soft skills come from the knowledge base; roles and
 * certifications are detected structurally; a few frequently-repeated general
 * terms are included at low weight so the JD's own context still counts.
 */
export function extractJdKeywords(jobTitle: string, jobDescription: string): JdKeyword[] {
  const source = `${jobTitle}\n${jobDescription}`.toLowerCase();
  const titleSource = (jobTitle || "").toLowerCase();
  if (!source.trim()) return [];

  const map = new Map<string, JdKeyword>();

  // 1. Known skills / tools / soft skills present in the JD (term or alias).
  for (const term of Object.keys(SKILL_KB)) {
    const present =
      termInText(source, term) ||
      (ALIASES[term] || []).some((a) => termInText(source, a));
    if (present) addKeyword(map, term, SKILL_KB[term], source, titleSource);
  }
  // Alias-only hits: a real skill expressed as an alias ("React.js" → react,
  // "NodeJS" → node.js). Only adds terms that resolve to a real skill so we
  // don't surface redundant alias keys like "ts", "node", or "cloud".
  for (const [canonical, aliases] of Object.entries(ALIASES)) {
    if (!SKILL_KB[canonical]) continue;
    if (map.has(canonical.toLowerCase())) continue;
    const hit = aliases.find((a) => termInText(source, a));
    if (hit) addKeyword(map, canonical, SKILL_KB[canonical], source, titleSource);
  }

  // 2. Roles / titles.
  for (const phrase of extractRolePhrases(source)) {
    addKeyword(map, phrase, "roles", source, titleSource);
  }

  // 3. Certifications.
  for (const cert of extractCertPhrases(source)) {
    addKeyword(map, cert, "certifications", source, titleSource);
  }

  // 4. Frequently-repeated general terms (>= 2 mentions) for JD context.
  const freq = new Map<string, number>();
  for (const t of jdTokens(source)) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  for (const [word, count] of freq) {
    if (count < 2 || word.length < 5) continue;
    if (map.has(word)) continue;
    if (Object.keys(SKILL_KB).some((k) => k.includes(word) || word.includes(k))) continue;
    addKeyword(map, word, "general", source, titleSource);
  }

  const keywords = [...map.values()];
  keywords.sort((a, b) => b.weight - a.weight);
  return keywords.slice(0, 60);
}

// ── Matching ────────────────────────────────────────────────────────────────

/** Match each JD keyword against the resume text (alias-aware). */
export function matchJdKeywords(resumeText: string, keywords: JdKeyword[]): JdKeywordMatch[] {
  return keywords.map((k) => ({ ...k, matched: matchesKeyword(resumeText, k.term) }));
}

/** Weighted match % — the headline number Jobscan-style checkers show. */
export function computeJdMatch(matches: JdKeywordMatch[]): {
  score: number;
  matchedWeight: number;
  totalWeight: number;
  matchedCount: number;
  totalCount: number;
} {
  const matchedWeight = matches.reduce((s, m) => (m.matched ? s + m.weight : s), 0);
  const totalWeight = matches.reduce((s, m) => s + m.weight, 0);
  const matchedCount = matches.filter((m) => m.matched).length;
  return {
    score: totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0,
    matchedWeight: Math.round(matchedWeight * 100) / 100,
    totalWeight: Math.round(totalWeight * 100) / 100,
    matchedCount,
    totalCount: matches.length,
  };
}

/** Group matched/missing keywords by category for the report UI. */
export function buildKeywordMatchBreakdown(matches: JdKeywordMatch[]): KeywordMatchBreakdown {
  const matched: KeywordMatchBreakdown["matched"] = [];
  const missing: KeywordMatchBreakdown["missing"] = [];

  for (const category of KEYWORD_CATEGORY_ORDER) {
    const inCat = matches.filter((m) => m.category === category);
    if (inCat.length === 0) continue;
    const matchedTerms = inCat.filter((m) => m.matched);
    const missingTerms = inCat.filter((m) => !m.matched);
    if (matchedTerms.length > 0) {
      matched.push({
        category,
        terms: matchedTerms.map((m) => m.term),
        weight: Math.round(matchedTerms.reduce((s, m) => s + m.weight, 0) * 100) / 100,
      });
    }
    if (missingTerms.length > 0) {
      missing.push({
        category,
        terms: missingTerms.map((m) => m.term),
        weight: Math.round(missingTerms.reduce((s, m) => s + m.weight, 0) * 100) / 100,
      });
    }
  }

  const stats = computeJdMatch(matches);
  return {
    matched,
    missing,
    matchedWeight: stats.matchedWeight,
    totalWeight: stats.totalWeight,
  };
}

/** Whether the resume references the target job title (or its role word). */
export function matchesJobTitle(resumeText: string, jobTitle: string): boolean {
  const title = jobTitle.trim().toLowerCase();
  if (!title) return false;
  const resume = resumeText.toLowerCase();

  if (termInText(resume, title)) return true;

  const tokens = title
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  if (tokens.length === 0) return false;

  const hitCount = tokens.filter((t) => termInText(resume, t)).length;
  if (hitCount / tokens.length >= 0.5) return true;

  // Fall back to the role keyword only (e.g. "engineer", "designer").
  const role = tokens[tokens.length - 1];
  return ROLE_SUFFIXES.has(role) && termInText(resume, role);
}
