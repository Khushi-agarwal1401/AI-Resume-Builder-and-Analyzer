/**
 * Deterministic resume parser — extracts structured resume data from raw text
 * using rules and heuristics ONLY (no AI, no API keys, fully offline).
 *
 * Used as an automatic fallback whenever Gemini is unavailable (missing key,
 * quota exhausted, network error) so the resume-import flow still works and
 * fetches all the data it can. Quality is intentionally best-effort: it
 * handles the standard section layout (Experience / Education / Skills /
 * Projects / ...) that most resumes follow.
 *
 * The output shape mirrors what the AI `resume-import-upload` prompt returns,
 * so callers can route AI or deterministic output through the same sanitizer.
 */
import { extractSections, extractEmail, extractPhone, extractLinks } from "./parser";

// ── Types ──────────────────────────────────────────────────────────────────

export type DeterministicTargetLevel = "student" | "student_internship" | "fresher" | "experienced";

export interface DeterministicResume {
  targetLevel: DeterministicTargetLevel;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    portfolio: string;
    photo: string;
  };
  summary: string;
  experience: {
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    responsibilities: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    cgpa: string;
  }[];
  skills: { technical: string[]; soft: string[]; tools: string[]; frameworks: string[] };
  projects: { name: string; description: string; technologies: string[]; liveUrl: string; githubUrl: string }[];
  certifications: { name: string; issuer: string; date: string }[];
  achievements: { title: string; description: string; date: string }[];
  languages: { name: string; proficiency: string }[];
}

// ── Lexicons ───────────────────────────────────────────────────────────────

const SOFT_SKILLS = new Set([
  "communication", "leadership", "teamwork", "collaboration", "problem-solving",
  "problem solving", "time management", "critical thinking", "creativity",
  "adaptability", "flexibility", "organization", "attention to detail",
  "multitasking", "decision making", "negotiation", "presentation",
  "public speaking", "mentoring", "team player", "self-motivated",
  "agile", "scrum", "kanban",
]);

const TOOLS = new Set([
  "git", "github", "gitlab", "bitbucket", "docker", "kubernetes", "jenkins",
  "aws", "azure", "gcp", "google cloud", "firebase", "vercel", "netlify",
  "jira", "confluence", "figma", "sketch", "photoshop", "illustrator",
  "excel", "powerpoint", "word", "postman", "linux", "unix", "bash",
  "terraform", "ansible", "nginx", "redis", "kafka", "rabbitmq", "tableau",
  "power bi", "splunk", "datadog", "sentry", "vscode", "intellij", "eclipse",
  "webpack", "vite", "npm", "yarn", "pnpm", "gradle", "maven", "babel",
  "eslint", "prettier", "ci/cd", "ci cd", "docker compose", "jenkins pipeline",
]);

const FRAMEWORKS = new Set([
  "react", "reactjs", "react.js", "react native", "next.js", "nextjs", "next js",
  "angular", "vue", "vue.js", "svelte", "solidjs", "ember", "jquery",
  "node", "node.js", "nodejs", "express", "express.js", "fastify", "nestjs",
  "django", "flask", "fastapi", "spring", "spring boot", "rails", "laravel",
  "dotnet", ".net", "asp.net", "tailwind", "tailwindcss", "bootstrap", "material ui",
  "mui", "chakra ui", "shadcn", "redux", "zustand", "graphql", "apollo",
  "pandas", "numpy", "tensorflow", "pytorch", "keras", "scikit-learn",
  "hadoop", "spark", "flink", "pyspark", "opencv", "selenium", "cypress",
  "jest", "mocha", "chai", "vitest", "playwright", "puppeteer", "storybook",
]);

const DEGREE_KEYWORDS = [
  /b\.?\s?tech/i, /b\.?\s?e\b/i, /b\.?\s?sc/i, /bachelor(?:'s| of)?/i,
  /m\.?\s?tech/i, /m\.?\s?sc/i, /m\.?\s?e\b/i, /m\.?\s?ba/i, /master(?:'s| of)?/i,
  /ph\.?\s?d/i, /doctorate/i, /diploma/i, /associate/i, /b\.?\s?a\b/i,
  /m\.?\s?com/i, /b\.?\s?com/i, /bca\b/i, /mca\b/i, /b\.?\s?f\b/i, /m\.?\s?f\b/i,
];

const INSTITUTION_KEYWORDS = [
  /university/i, /college/i, /institute/i, /institution/i, /school/i,
  /academy/i, /iit\b/i, /nit\b/i, /iim\b/i, /bits\b/i, /harvard/i, /stanford/i,
  /mit\b/i, /oxford/i, /cambridge/i,
];

// ── Small helpers ──────────────────────────────────────────────────────────

const MONTHS = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
// Groups: 1=start month, 2=start year, 3=end month, 4=end year/present/current/now
const DATE_PATTERN = new RegExp(
  `(?:(${MONTHS})\\.?\\s*)?((?:19|20)\\d{2})\\s*(?:-|–|—|to|/)\\s*(?:(${MONTHS})\\.?\\s*)?((?:19|20)\\d{2}|present|current|now)`,
  "i"
);
const YEAR_ONLY = /\b(?:19|20)\d{2}\b/;

function parseDates(line: string): { startDate: string; endDate: string; current: boolean } {
  const m = line.match(DATE_PATTERN);
  if (m) {
    const end = m[4] || "";
    return {
      startDate: (m[1] ? m[1].trim() + " " : "") + m[2],
      endDate: (m[3] ? m[3].trim() + " " : "") + (/^(?:19|20)\d{2}$/.test(end) ? end : ""),
      current: /present|current|now/i.test(end),
    };
  }
  const years = line.match(YEAR_ONLY);
  return { startDate: years ? years[0] : "", endDate: "", current: false };
}

/** Remove a date span (e.g. "Jan 2020 - Present", "(2017 - 2019)") from a line. */
function stripDates(line: string): string {
  return line.replace(DATE_PATTERN, " ").replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
}

function isBulletLine(line: string): boolean {
  return /^[-•*▪◦›>]\s+/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^[-•*▪◦›>]\s+/, "").trim();
}

function splitBlocks(section: string): string[][] {
  return section
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0);
}

/** "Senior Engineer at Acme | NYC" → role/company/location heuristics. */
function splitRoleCompany(header: string): { role: string; company: string; location: string } {
  let role = header;
  let company = "";
  let location = "";

  // "Role at Company"
  const atMatch = header.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    role = atMatch[1].trim();
    company = atMatch[2].trim();
  } else if (header.includes("|")) {
    const parts = header.split("|").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      role = parts[0];
      company = parts[1];
    }
  } else if (/[—–]/.test(header) || /\s-\s/.test(header)) {
    // Split only when there's whitespace around the separator, so hyphenated
    // roles like "Full-Stack Developer" are never split apart.
    const parts = header.split(/\s+[—–-]\s+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      role = parts[0];
      company = parts[1];
    }
  }

  // Location often trails after a comma on the role/company line.
  const locMatch = role.match(/^(.*?),\s*([A-Za-z][A-Za-z .'-]*)$/);
  if (locMatch) {
    role = locMatch[1].trim();
    location = locMatch[2].trim();
  }
  if (!location) {
    const compLoc = company.match(/^(.*?),\s*([A-Za-z][A-Za-z .'-]*)$/);
    if (compLoc) {
      company = compLoc[1].trim();
      location = compLoc[2].trim();
    }
  }
  return { role: role.trim(), company: company.trim(), location };
}

function categorizeSkill(raw: string): "technical" | "soft" | "tools" | "frameworks" {
  const s = raw.toLowerCase().trim();
  if (SOFT_SKILLS.has(s)) return "soft";
  if (FRAMEWORKS.has(s)) return "frameworks";
  if (TOOLS.has(s)) return "tools";
  return "technical";
}

function splitSkillList(section: string): string[] {
  return section
    .split(/[\n,;•|/]+/)
    .map((s) => s.trim().replace(/^[-•*▪◦›]\s*/, ""))
    .filter((s) => s.length >= 2 && s.length <= 40)
    .filter((s, i, arr) => arr.indexOf(s) === i);
}

// ── Section parsers ────────────────────────────────────────────────────────

function parseExperience(section: string): DeterministicResume["experience"] {
  const entries: DeterministicResume["experience"] = [];
  const blocks = splitBlocks(section);

  for (const lines of blocks) {
    const bullets = lines.filter(isBulletLine).map(stripBullet);
    const headers = lines.filter((l) => !isBulletLine(l));
    if (headers.length === 0 && bullets.length === 0) continue;

    // Dates may sit on their own line OR inline "Role at Company (2017 - 2019)"
    // — strip them out and keep the rest as the role/company header.
    let startDate = "";
    let endDate = "";
    let current = false;
    const headerParts: string[] = [];
    for (const h of headers) {
      const dates = parseDates(h);
      if (dates.startDate) startDate = dates.startDate;
      if (dates.endDate) endDate = dates.endDate;
      if (dates.current) current = true;
      const cleaned = stripDates(h);
      if (cleaned) headerParts.push(cleaned);
    }

    if (headerParts.length === 0 && bullets.length === 0) continue;

    const joined = headerParts.join(" · ");
    const { role, company, location } = splitRoleCompany(joined);

    if (!role && !company && bullets.length === 0) continue;
    entries.push({ company, role, location, startDate, endDate, current, responsibilities: bullets });
  }
  return entries;
}

function parseEducation(section: string): DeterministicResume["education"] {
  const entries: DeterministicResume["education"] = [];
  const blocks = splitBlocks(section);

  for (const lines of blocks) {
    if (lines.length === 0) continue;

    let startDate = "";
    let endDate = "";
    let cgpa = "";
    const textParts: string[] = [];
    for (const l of lines) {
      const dates = parseDates(l);
      if (dates.startDate) startDate = dates.startDate;
      if (dates.endDate) endDate = dates.endDate;
      const cgpaMatch = l.match(/\b(?:cgpa|gpa|percentage|score)\s*[:：]?\s*([\d.]+(?:%|\s*\/\s*10)?)/i);
      if (cgpaMatch) cgpa = cgpaMatch[1].trim();
      const cleaned = stripDates(l);
      if (cleaned) textParts.push(cleaned);
    }

    const degreeLine = textParts.find((l) => DEGREE_KEYWORDS.some((k) => k.test(l))) || "";
    const institutionLine = textParts.find((l) => INSTITUTION_KEYWORDS.some((k) => k.test(l))) || "";
    if (!institutionLine && !degreeLine) continue;

    entries.push({ institution: institutionLine, degree: degreeLine, field: "", startDate, endDate, cgpa });
  }
  return entries;
}

function parseSkills(section: string): DeterministicResume["skills"] {
  const skills: DeterministicResume["skills"] = { technical: [], soft: [], tools: [], frameworks: [] };
  for (const raw of splitSkillList(section)) {
    const bucket = categorizeSkill(raw);
    skills[bucket].push(raw);
  }
  return skills;
}

function parseProjects(section: string): DeterministicResume["projects"] {
  const projects: DeterministicResume["projects"] = [];
  const blocks = splitBlocks(section);

  for (const lines of blocks) {
    if (lines.length === 0) continue;
    const bullets = lines.filter(isBulletLine).map(stripBullet);
    const headers = lines.filter((l) => !isBulletLine(l));
    const name = headers[0] || "";
    if (!name) continue;

    // Technologies are often in a "Technologies: ..." line or trailing brackets.
    let technologies: string[] = [];
    const techIdx = lines.findIndex((l) => /technolog|tech stack|built with|stack/i.test(l));
    if (techIdx !== -1) {
      technologies = lines[techIdx].split(/[:：]/).slice(1).join(":").split(/[\n,;•|]+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.length <= 40);
    }
    const bracketMatch = name.match(/\(([^)]+)\)$/);
    if (technologies.length === 0 && bracketMatch) {
      technologies = bracketMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
    }

    // Description = non-name, non-tech header lines plus any bullets.
    const description = headers
      .slice(1)
      .filter((l) => !/technolog|tech stack|built with|stack/i.test(l))
      .concat(bullets)
      .join(" ");

    projects.push({
      name: name.replace(/\s*\([^)]*\)\s*$/, "").trim(),
      description,
      technologies,
      liveUrl: "",
      githubUrl: "",
    });
  }
  return projects;
}

function parseCertifications(section: string): DeterministicResume["certifications"] {
  const certs: DeterministicResume["certifications"] = [];
  for (const line of section.split("\n")) {
    const l = line.trim();
    if (!l || (isBulletLine(l) && stripBullet(l).length === 0)) continue;
    const text = stripBullet(l);
    if (text.length < 2) continue;

    const parts = text.split(/\s*(?:-|–|—|\||·)\s*/).map((p) => p.trim()).filter(Boolean);
    const dateMatch = text.match(/\b(?:19|20)\d{2}\b/);
    const name = (parts[0] || text).replace(/\b(?:19|20)\d{2}\b/, "").trim();
    if (!name) continue;
    certs.push({
      name,
      issuer: parts[1] && !/\b(?:19|20)\d{2}\b/.test(parts[1]) ? parts[1] : "",
      date: dateMatch ? dateMatch[0] : "",
    });
  }
  return certs.filter((c, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === c.name.toLowerCase()) === i);
}

function parseAchievements(section: string): DeterministicResume["achievements"] {
  const achievements: DeterministicResume["achievements"] = [];
  for (const line of section.split("\n")) {
    const text = stripBullet(line.trim());
    if (text.length < 3) continue;
    const dateMatch = text.match(/\b(?:19|20)\d{2}\b/);
    const title = text.replace(/\b(?:19|20)\d{2}\b/, "").trim();
    if (!title) continue;
    achievements.push({ title, description: "", date: dateMatch ? dateMatch[0] : "" });
  }
  return achievements.slice(0, 20);
}

function parseLanguages(section: string): DeterministicResume["languages"] {
  const languages: DeterministicResume["languages"] = [];
  for (const raw of section.split(/[\n,;•|]+/)) {
    const s = raw.trim();
    if (s.length < 2) continue;
    const m = s.match(/^(.+?)\s*[:：-]\s*(.+)$/);
    const name = (m ? m[1] : s).trim();
    if (!name) continue;
    languages.push({ name, proficiency: m ? m[2].trim() : "" });
  }
  return languages.filter((l, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === l.name.toLowerCase()) === i);
}

function parseFullName(text: string, sections: Record<string, string>): string {
  // Look in the contact section first, then the raw head of the document.
  const candidates: string[] = [];
  if (sections.contact) candidates.push(sections.contact);
  // The header block before the first recognized section heading.
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstHeaderIdx = lines.findIndex((l) => /^(summary|education|experience|skills|projects|contact|objective|profile|work)/i.test(l) && l.length < 60);
  candidates.push(lines.slice(0, firstHeaderIdx === -1 ? 6 : Math.min(firstHeaderIdx, 6)).join("\n"));

  for (const candidate of candidates) {
    for (const line of candidate.split("\n")) {
      const l = line.trim();
      if (!l || /\d|@/.test(l) || l.length > 50) continue;
      const words = l.split(/\s+/);
      if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Z][a-zA-Z.'-]*$/.test(w))) {
        return l;
      }
    }
  }
  return "";
}

function detectTargetLevel(text: string, summary: string): DeterministicTargetLevel {
  const lower = `${text}\n${summary}`.toLowerCase();
  // Word-boundary matches so "internal", "internet", and "international" never
  // trigger the internship bucket. An experienced candidate whose history
  // includes an early internship must be classified by their real experience.
  const hasProfessionalExperience = /\byears?(?:\s+of)?\s+(?:professional\s+)?(?:work\s+)?experience\b/.test(lower);
  const hasInternship = /\bintern(?:s|ship|ships|ing)?\b|\btrainee\b/.test(lower);
  const hasStudentSignals = /\bstudent\b|undergrad|\bgraduate\b|class of|\bschool\b|\bcollege\b|\buniversity\b/.test(lower);
  const isEntryLevel = /\bfresher\b|entry[ -]level|new graduate|recent graduate/.test(lower);

  // Real professional experience wins over a passing internship mention.
  if (hasProfessionalExperience && !isEntryLevel) return "experienced";
  if (hasInternship) return "student_internship";
  if (hasStudentSignals && !isEntryLevel) return "student";
  if (isEntryLevel) return "fresher";
  return "experienced";
}

// ── Main entry ─────────────────────────────────────────────────────────────

export function parseResumeText(text: string): DeterministicResume {
  const sections = extractSections(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const links = extractLinks(text);

  // Some resumes write profile URLs without the scheme ("linkedin.com/in/jane").
  for (const bare of text.match(/\b(?:linkedin|github|gitlab)\.com\/[^\s|,;]+/gi) || []) {
    links.push(bare.startsWith("http") ? bare : `https://${bare}`);
  }

  const linkedin = links.find((l) => /linkedin\.com/i.test(l)) || "";
  const github = links.find((l) => /github\.com|gitlab\.com/i.test(l)) || "";
  const portfolio = links.find((l) => !/linkedin\.com|github\.com|gitlab\.com/i.test(l)) || "";

  const summary = (sections.summary || "").replace(/\s+/g, " ").trim();
  const experience = parseExperience(sections.experience || "");
  const education = parseEducation(sections.education || "");
  const skills = parseSkills(sections.skills || "");
  const projects = parseProjects(sections.projects || "");
  const certifications = parseCertifications(sections.certifications || "");
  const achievements = parseAchievements(sections.achievements || "");
  const languages = parseLanguages(sections.languages || "");

  return {
    targetLevel: detectTargetLevel(text, summary),
    personalInfo: {
      fullName: parseFullName(text, sections),
      email: email || "",
      phone: phone || "",
      linkedin,
      github,
      portfolio,
      photo: "",
    },
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    achievements,
    languages,
  };
}
