const COMMON_SKILLS = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php",
  "react", "angular", "vue", "next.js", "node.js", "express", "django", "flask", "spring",
  "sql", "postgresql", "mysql", "mongodb", "redis", "graphql", "rest", "grpc",
  "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible", "jenkins",
  "git", "github", "gitlab", "ci/cd", "agile", "scrum", "jira", "confluence",
  "html", "css", "sass", "tailwind", "bootstrap", "material-ui", "chakra-ui",
  "redux", "zustand", "react-query", "jest", "cypress", "playwright",
  "storybook", "webpack", "vite", "babel", "eslint", "prettier",
  "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch",
  "data science", "data analysis", "data engineering", "etl", "tableau", "power bi",
  "excel", "google sheets", "looker", "airflow", "spark", "kafka", "rabbitmq",
  "figma", "sketch", "adobe xd", "photoshop", "illustrator",
  "leadership", "communication", "teamwork", "problem solving", "critical thinking",
  "product management", "project management", "stakeholder management", "roadmap",
  "a/b testing", "analytics", "metrics", "kpi", "okr", "growth",
];

const EXPERIENCE_INDICATORS = [
  /(\d+)\+?\s*years?\s*(of\s*)?experience/i,
  /experience\s*(of\s*)?(\d+)\+?\s*years?/i,
  /(\d+)\+?\s*yrs?\s*(of\s*)?exp/i,
];

const ROLE_KEYWORDS: Record<string, string[]> = {
  "software-engineer": ["software engineer", "sde", "full stack", "backend", "frontend", "api", "system design", "microservices", "scalability", "data structures", "algorithms"],
  "frontend": ["react", "angular", "vue", "html", "css", "ui/ux", "responsive design", "web performance", "cross-browser", "accessibility", "component library"],
  "backend": ["api", "database", "microservices", "rest", "graphql", "server", "middleware", "authentication", "caching", "message queue"],
  "data-analyst": ["sql", "excel", "tableau", "power bi", "statistics", "data visualization", "reporting", "dashboard", "a/b testing", "hypothesis testing"],
  "product-manager": ["roadmap", "strategy", "stakeholder", "user research", "a/b testing", "metrics", "kpi", "agile", "sprint", "backlog", "user stories"],
  "marketing": ["campaign", "roi", "growth", "seo", "sem", "content", "social media", "analytics", "conversion", "funnel", "brand"],
};

export function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const skill of COMMON_SKILLS) {
    if (lower.includes(skill)) {
      found.add(skill);
    }
  }

  const roleWords = lower
    .replace(/[^a-z0-9\s-+#/]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "for", "are", "but", "not", "you", "all", "can", "has", "had", "our", "its", "was", "per", "via", "etc"].includes(w));

  const common: string[] = [];
  const freq = new Map<string, number>();
  for (const w of roleWords) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  for (const [w, c] of freq) {
    if (c >= 3 && w.length > 3) common.push(w);
  }

  return [...new Set([...found, ...common])];
}

export function extractExperienceRequirements(text: string): { years: number | null; text: string } {
  for (const pattern of EXPERIENCE_INDICATORS) {
    const match = text.match(pattern);
    if (match) {
      const num = parseInt(match[1] || match[2], 10);
      if (!isNaN(num)) return { years: num, text: match[0] };
    }
  }
  return { years: null, text: "" };
}

export function extractRoleType(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    const count = keywords.filter((k) => lower.includes(k)).length;
    if (count >= 2) matched.push(role);
  }
  return matched;
}

export function matchResumeKeywords(resumeSkills: string[], jdKeywords: string[]): {
  matched: string[];
  missing: string[];
  matchPercentage: number;
} {
  const resumeNormalized = resumeSkills.map((s) => s.toLowerCase().trim());
  const jdNormalized = jdKeywords.map((s) => s.toLowerCase().trim());

  const matched = jdNormalized.filter((kw) =>
    resumeNormalized.some((rs) => rs.includes(kw) || kw.includes(rs))
  );
  const missing = jdNormalized.filter((kw) => !matched.includes(kw));
  const percentage = jdNormalized.length > 0
    ? Math.round((matched.length / jdNormalized.length) * 100)
    : 0;

  return { matched: [...new Set(matched)], missing: [...new Set(missing)], matchPercentage: percentage };
}

export function analyzeSkillGaps(resumeSkills: string[], jdKeywords: string[]): {
  matchedSkills: string[];
  missingSkills: string[];
  missingTools: string[];
  otherMissing: string[];
} {
  const skillSet = new Set(COMMON_SKILLS);
  const resumeNorm = resumeSkills.map((s) => s.toLowerCase().trim());

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const missingTools: string[] = [];
  const otherMissing: string[] = [];

  for (const kw of jdKeywords) {
    const lower = kw.toLowerCase();
    const isMatched = resumeNorm.some((rs) => rs.includes(lower) || lower.includes(rs));

    if (isMatched) {
      matchedSkills.push(kw);
    } else if (skillSet.has(lower)) {
      missingSkills.push(kw);
    } else if (["docker", "kubernetes", "git", "jenkins", "terraform", "ansible", "webpack", "vite", "babel", "eslint", "jest", "cypress", "playwright", "tableau", "power bi", "excel", "figma", "sketch", "jira", "confluence", "airflow", "spark", "kafka", "rabbitmq", "looker"].includes(lower)) {
      missingTools.push(kw);
    } else {
      otherMissing.push(kw);
    }
  }

  return { matchedSkills: [...new Set(matchedSkills)], missingSkills: [...new Set(missingSkills)], missingTools: [...new Set(missingTools)], otherMissing: [...new Set(otherMissing)] };
}

export function analyzeExperienceGap(
  resumeExperience: { role: string; years?: number }[],
  jdText: string
): {
  requiredYears: number | null;
  hasRelevantExperience: boolean;
  relevantRoles: string[];
  gap: string | null;
} {
  const req = extractExperienceRequirements(jdText);
  const roleTypes = extractRoleType(jdText);

  const hasRelevant = resumeExperience.some((exp) =>
    roleTypes.some((rt) => exp.role.toLowerCase().includes(rt.replace("-", " ")))
  );

  const yearsOfExp = resumeExperience.reduce((sum, exp) => sum + (exp.years || 0), 0);
  const gap = req.years && yearsOfExp < req.years
    ? `Job requires ${req.years}+ years, resume shows ${yearsOfExp} years`
    : null;

  return {
    requiredYears: req.years,
    hasRelevantExperience: hasRelevant || roleTypes.length === 0,
    relevantRoles: roleTypes,
    gap,
  };
}
