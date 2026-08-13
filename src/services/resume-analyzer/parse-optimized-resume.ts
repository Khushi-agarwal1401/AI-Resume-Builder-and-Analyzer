/**
 * Deterministic parser for the ats-keyword-optimization AI output format.
 *
 * The optimizer prompt returns a full resume as plain text with light markdown:
 *
 *   # NAME
 *   Location | Email | Phone | LinkedIn
 *
 *   ## PROFESSIONAL SUMMARY
 *   <paragraph>
 *
 *   ## TECHNICAL SKILLS
 *   * **Languages:** JavaScript, TypeScript, Python
 *   * **Frameworks & Libraries:** React, Node.js, Express
 *   * **Cloud & DevOps:** AWS, Docker, Git, CI/CD
 *
 *   ## PROFESSIONAL EXPERIENCE
 *   **Acme Corp** | Software Engineer | 2022 – Present
 *   * Architected REST APIs supporting 10k daily users
 *   * Led migration of legacy frontend to React
 *
 *   ## EDUCATION
 *   **State University** — B.S. Computer Science
 *
 * The generic `parseResumeText` heuristic parser is tuned for the builder's
 * plain-text export (Role at Company / label: value), so it swaps company/role
 * and leaks `**` and label prefixes. This parser understands the AI format
 * specifically. Fully offline — no AI, no API keys.
 */
// Known section headings in the optimizer output, in the order the model
// tends to emit them. Lines that match these are treated as headings only when
// they sit on their own line preceded by a blank line — so a short summary
// sentence containing the word "summary" is never mistaken for a heading.
const HEADINGS: { key: keyof ParsedOptimizedResume; re: RegExp }[] = [
  { key: "summary", re: /^(?:professional\s+)?(?:summary|objective|profile)\b/i },
  { key: "skills", re: /^(?:technical\s+)?skills\b|^core\s+competencies\b|^technologies\b/i },
  { key: "experience", re: /^(?:professional\s+)?(?:work\s+)?(?:experience|employment|history)\b/i },
  { key: "projects", re: /^(?:personal\s+|academic\s+|key\s+)?projects?\b/i },
  { key: "education", re: /^education\b|^academic\b/i },
];

export interface ParsedOptimizedResume {
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
}

/** Remove markdown the models add, keeping bullet markers so lists still split. */
export function normalizeAiMarkdown(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*#{1,6}\s+/, "").replace(/\*\*/g, "").replace(/\* /g, "• ").trimEnd())
    .join("\n");
}

const isBullet = (line: string) => /^[-•*▪◦›>]\s+/.test(line);
const stripBullet = (line: string) => line.replace(/^[-•*▪◦›>]\s+/, "").trim();

const MONTH = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const YEAR = "\\d{4}";
// Year, optionally with a month: "2021", "2021-01", "Jan 2021". The optional
// month is greedy so "2021-01 - Present" parses 2021-01 as one token and the
// dash before "Present" as the separator ("2021-2023" still splits correctly
// because the separator must be followed by a full date token).
const DATE_TOKEN = `(?:${MONTH}\\.?\\s*)?${YEAR}(?:-\\d{2})?`;
const DATE_SPAN = new RegExp(
  `\\b(${DATE_TOKEN})\\s*[-–—]\\s*(Present|Current|${DATE_TOKEN})\\b`,
  "i"
);

function extractDates(header: string): { startDate: string; endDate: string; current: boolean } {
  const m = header.match(DATE_SPAN);
  if (!m) return { startDate: "", endDate: "", current: false };
  const end = m[2];
  return {
    startDate: m[1].trim(),
    endDate: /present|current/i.test(end) ? "" : end.trim(),
    current: /present|current/i.test(end),
  };
}

/** "Acme Corp | Software Engineer | 2022 – Present" → company/role/dates. */
function parseExperienceHeader(header: string): {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
} {
  const { startDate, endDate, current } = extractDates(header);
  const noDates = header
    .replace(DATE_SPAN, " ")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Prefer "Company | Role" (the optimizer prompt's format), but also accept
  // "Role at Company" and "Company — Role" variants.
  let company = "";
  let role = "";
  let location = "";
  const parts = noDates.split("|").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    company = parts[0];
    role = parts.slice(1).join(" | ");
  } else if (/^(.+?)\s+at\s+(.+)$/i.test(noDates)) {
    const at = noDates.match(/^(.+?)\s+at\s+(.+)$/i)!;
    role = at[1].trim();
    company = at[2].trim();
  } else if (/[—–]/.test(noDates)) {
    const dash = noDates.split(/[—–]/).map((p) => p.trim()).filter(Boolean);
    if (dash.length >= 2) {
      company = dash[0];
      role = dash.slice(1).join(" — ");
    }
  } else {
    role = noDates;
  }

  // Location often trails after a comma on the company or role.
  for (const [idx, field] of [company, role].entries()) {
    const locMatch = field.match(/^(.*?),\s*([A-Za-z][A-Za-z .'-]*)$/);
    if (locMatch) {
      if (idx === 0) {
        company = locMatch[1].trim();
      } else {
        role = locMatch[1].trim();
      }
      location = locMatch[2].trim();
      break;
    }
  }

  return { company: company.trim(), role: role.trim(), location, startDate, endDate, current };
}

const DEGREE_KEYWORDS = [
  /\b(?:bachelor|b\.?s\.?|b\.?tech|b\.?e\.?|b\.?a\.?|master|m\.?s\.?|m\.?tech|m\.?b\.?a\.?|m\.?a\.?|ph\.?d|doctorate|associate|diploma|b\.?com|m\.?com)\b/i,
  /\b(?:b\.sc|m\.sc)\b/i,
];

function parseEducation(section: string): ParsedOptimizedResume["education"] {
  const out: ParsedOptimizedResume["education"] = [];
  const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);
  let current: ParsedOptimizedResume["education"][number] | null = null;

  for (const raw of lines) {
    const line = stripBullet(raw);
    const { startDate, endDate } = extractDates(line);
    const noDates = line.replace(DATE_SPAN, " ").replace(/\s+/g, " ").trim();

    if (DEGREE_KEYWORDS.some((k) => k.test(noDates))) {
      if (current && current.degree) {
        out.push(current);
        current = { institution: "", degree: noDates, field: "", startDate, endDate, cgpa: "" };
      } else if (current) {
        // Institution seen first, degree second — merge into one entry.
        current.degree = noDates;
        if (startDate) current.startDate = startDate;
        if (endDate) current.endDate = endDate;
      } else {
        current = { institution: "", degree: noDates, field: "", startDate, endDate, cgpa: "" };
      }
    } else if (current) {
      current.institution = noDates;
    } else {
      current = { institution: noDates, degree: "", field: "", startDate, endDate, cgpa: "" };
    }
  }
  if (current) out.push(current);
  return out;
}

const SKILL_LABELS: { label: string; bucket: "technical" | "soft" | "tools" | "frameworks" }[] = [
  { label: "languages", bucket: "technical" },
  { label: "programming", bucket: "technical" },
  { label: "databases", bucket: "technical" },
  { label: "frameworks", bucket: "frameworks" },
  { label: "libraries", bucket: "frameworks" },
  { label: "cloud", bucket: "tools" },
  { label: "devops", bucket: "tools" },
  { label: "ci/cd", bucket: "tools" },
  { label: "tools", bucket: "tools" },
  { label: "testing", bucket: "tools" },
  { label: "soft skills", bucket: "soft" },
  { label: "soft", bucket: "soft" },
  { label: "interpersonal", bucket: "soft" },
];

function parseSkills(section: string): ParsedOptimizedResume["skills"] {
  const skills: ParsedOptimizedResume["skills"] = { technical: [], soft: [], tools: [], frameworks: [] };
  const push = (bucket: keyof ParsedOptimizedResume["skills"], raw: string) => {
    for (const item of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
      if (item.length < 2 || item.length > 60) continue;
      if (!skills[bucket].includes(item)) skills[bucket].push(item);
    }
  };

  for (const raw of section.split("\n")) {
    const line = stripBullet(raw).trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    const label = (colon === -1 ? "" : line.slice(0, colon)).toLowerCase();
    const items = colon === -1 ? line : line.slice(colon + 1);

    const match = SKILL_LABELS.find((s) => label.includes(s.label));
    if (match) {
      push(match.bucket, items);
    } else if (!label && items) {
      // Ungrouped line — categorize each item by its own name.
      push("technical", items);
    }
  }
  return skills;
}

function parseProjects(section: string): ParsedOptimizedResume["projects"] {
  const out: ParsedOptimizedResume["projects"] = [];
  const blocks = section
    .split(/\n\s*\n/)
    .map((b) => b.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((b) => b.length > 0);

  for (const lines of blocks) {
    const name = stripBullet(lines[0]);
    if (!name) continue;
    const descLines = lines.slice(1).map(stripBullet).filter(Boolean);
    out.push({
      name,
      description: descLines.join(" "),
      technologies: [],
      liveUrl: "",
      githubUrl: "",
    });
  }
  return out;
}

/**
 * Parse the AI optimizer's resume output into structured sections. Falls back
 * gracefully: sections the model didn't include come back empty, and the
 * caller decides whether to apply them.
 */
/**
 * Split normalized text into sections by known headings. A line is a heading
 * only when it is short, has no trailing sentence punctuation, and is preceded
 * by a blank line (or starts the document) — the AI's markdown output always
 * separates sections with blank lines, which avoids misreading short summary
 * sentences like "Short summary here." as headings.
 */
function splitSections(normalized: string): Partial<Record<keyof ParsedOptimizedResume, string>> {
  const lines = normalized.split("\n");
  const positions: { idx: number; key: keyof ParsedOptimizedResume }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length >= 60) continue;
    if (/[.!?:]$/.test(line)) continue; // sentence, not a heading
    const heading = HEADINGS.find((h) => h.re.test(line));
    if (!heading) continue;
    const prev = i === 0 ? "" : lines[i - 1].trim();
    if (prev !== "") continue; // must follow a blank line
    positions.push({ idx: i, key: heading.key });
  }

  const sections: Partial<Record<keyof ParsedOptimizedResume, string>> = {};
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].idx + 1;
    const end = positions[i + 1] ? positions[i + 1].idx : lines.length;
    sections[positions[i].key] = lines.slice(start, end).join("\n").trim();
  }
  return sections;
}

export function parseOptimizedResume(text: string): ParsedOptimizedResume {
  const normalized = normalizeAiMarkdown(text);
  const sections = splitSections(normalized);

  const summary = (sections.summary || "").replace(/\s+/g, " ").trim();
  const experience: ParsedOptimizedResume["experience"] = [];
  const expSection = (sections.experience || "").trim();
  if (expSection) {
    for (const block of expSection.split(/\n\s*\n/)) {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;
      const headerLine = lines.find((l) => !isBullet(l));
      const bullets = lines.filter(isBullet).map(stripBullet).filter(Boolean);
      if (!headerLine) continue;
      const header = parseExperienceHeader(headerLine);
      if (!header.company && !header.role) continue;
      experience.push({ ...header, responsibilities: bullets });
    }
  }

  return {
    summary,
    experience,
    education: parseEducation(sections.education || ""),
    skills: parseSkills(sections.skills || ""),
    projects: parseProjects(sections.projects || ""),
  };
}
