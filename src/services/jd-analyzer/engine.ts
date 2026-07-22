import type { ResumeCategory } from "../resume-analyzer/ats-scorer";

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
  "software-engineer": [
    "software engineer", "sde", "full stack", "backend", "frontend",
    "api", "system design", "microservices", "scalability",
    "data structures", "algorithms",
  ],
  "frontend": [
    "react", "angular", "vue", "html", "css", "ui/ux",
    "responsive design", "web performance", "cross-browser",
    "accessibility", "component library",
  ],
  "backend": [
    "api", "database", "microservices", "rest", "graphql",
    "server", "middleware", "authentication", "caching",
    "message queue",
  ],
  "data-analyst": [
    "sql", "excel", "tableau", "power bi", "statistics",
    "data visualization", "reporting", "dashboard",
    "a/b testing", "hypothesis testing",
  ],
  "product-manager": [
    "roadmap", "strategy", "stakeholder", "user research",
    "a/b testing", "metrics", "kpi", "agile", "sprint",
    "backlog", "user stories",
  ],
  "marketing": [
    "campaign", "roi", "growth", "seo", "sem", "content",
    "social media", "analytics", "conversion", "funnel", "brand",
  ],
  "data-scientist": [
    "machine learning", "deep learning", "nlp", "statistics",
    "python", "tensorflow", "pytorch", "data pipeline",
    "eda", "modeling", "a/b testing", "hypothesis testing",
  ],
  "design": [
    "figma", "sketch", "adobe xd", "photoshop", "illustrator",
    "user research", "wireframe", "prototype", "design system",
    "ui/ux", "visual design", "interaction",
  ],
  "devops": [
    "docker", "kubernetes", "ci/cd", "jenkins", "terraform",
    "ansible", "aws", "azure", "gcp", "monitoring",
    "infrastructure", "automation", "deployment",
  ],
};

// Category-specific recommended skills
const CATEGORY_SKILLS: Record<ResumeCategory, string[]> = {
  student: [
    "gpa", "coursework", "academic", "project", "research",
    "presentation", "teamwork", "communication", "time management",
    "leadership", "extracurricular", "volunteer", "hackathon",
  ],
  fresher: [
    "internship", "project", "portfolio", "github", "open source",
    "certification", "bootcamp", "freelance", "workshop",
    "communication", "teamwork", "problem solving", "learning",
  ],
  experienced: [
    "leadership", "strategy", "architecture", "scaling", "mentoring",
    "stakeholder", "management", "budget", "roadmap", "team lead",
    "technical lead", "architect", "principal", "director",
  ],
  internship: [
    "learning", "fast learner", "adaptable", "eager", "enthusiastic",
    "teamwork", "communication", "basic knowledge", "foundation",
    "coursework", "academic", "project", "research assistant",
  ],
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
    .filter(
      (w) =>
        w.length > 2 &&
        !["the", "and", "for", "are", "but", "not", "you", "all", "can", "has", "had", "our", "its", "was", "per", "via", "etc"].includes(w)
    );

  const freq = new Map<string, number>();
  for (const w of roleWords) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  for (const [w, c] of freq) {
    if (c >= 3 && w.length > 3) found.add(w);
  }

  return [...found];
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

export function extractCategoryFromJD(text: string): ResumeCategory {
  const lower = text.toLowerCase();

  const isStudent =
    (/\b(intern|internship)\b/i.test(lower) && /\b(student|undergraduate|graduate|college|university)\b/i.test(lower)) ||
    /\b(freshman|sophomore|junior|senior)\b/i.test(lower);

  const isInternship = /\binternship\b/i.test(lower) && /\b(learn|training|mentor|guidance)\b/i.test(lower);

  const isFresher =
    /\b(fresher|entry.level|junior|0.*year|new grad|graduate|recent graduate)\b/i.test(lower) ||
    /0\s*[-–to]*\s*2\s+years/i.test(lower);

  const isExperienced =
    /\b(senior|lead|principal|staff|architect|manager|director|head|vp)\b/i.test(lower) ||
    /5\s*\+?\s*years|7\s*\+?\s*years|10\s*\+?\s*years/i.test(lower);

  if (isInternship) return "internship";
  if (isStudent && isFresher) return "fresher";
  if (isStudent) return "student";
  if (isFresher) return "fresher";
  if (isExperienced) return "experienced";

  return "experienced";
}

export function matchResumeKeywords(
  resumeSkills: string[],
  jdKeywords: string[],
  category?: ResumeCategory
): {
  matched: string[];
  missing: string[];
  matchPercentage: number;
  categorySpecificMatch: number;
  categorySuggestions: string[];
} {
  const resumeNormalized = resumeSkills.map((s) => s.toLowerCase().trim());
  const jdNormalized = jdKeywords.map((s) => s.toLowerCase().trim());

  const matched = jdNormalized.filter((kw) =>
    resumeNormalized.some((rs) => rs.includes(kw) || kw.includes(rs))
  );
  const missing = jdNormalized.filter((kw) => !matched.includes(kw));
  const percentage =
    jdNormalized.length > 0 ? Math.round((matched.length / jdNormalized.length) * 100) : 0;

  // Category-specific analysis
  let categorySpecificMatch = percentage;
  const categorySuggestions: string[] = [];

  if (category) {
    const catSkills = CATEGORY_SKILLS[category];
    if (catSkills) {
      const catMatched = catSkills.filter((s) => resumeNormalized.some((rs) => rs.includes(s)));
      categorySpecificMatch = Math.round((catMatched.length / catSkills.length) * 100);

      // Generate category-specific suggestions
      if (category === "student" || category === "internship") {
        if (!resumeNormalized.some((r) => r.includes("gpa") || r.includes("coursework"))) {
          categorySuggestions.push("Include your GPA and relevant coursework to strengthen your application.");
        }
        if (!resumeNormalized.some((r) => r.includes("project"))) {
          categorySuggestions.push("Add academic projects that demonstrate practical application of skills.");
        }
      }

      if (category === "fresher") {
        if (!resumeNormalized.some((r) => r.includes("project") || r.includes("portfolio") || r.includes("github"))) {
          categorySuggestions.push("Showcase projects or portfolio to demonstrate practical experience.");
        }
        if (!resumeNormalized.some((r) => r.includes("internship"))) {
          categorySuggestions.push("Consider adding internships, even short-term, to build your experience section.");
        }
      }

      if (category === "experienced") {
        const hasLeadership = resumeNormalized.some(
          (r) => r.includes("lead") || r.includes("manage") || r.includes("mentor") || r.includes("strategy")
        );
        if (!hasLeadership) {
          categorySuggestions.push("Highlight leadership and mentoring experience — critical for senior roles.");
        }
        if (matched.length < jdNormalized.length * 0.6) {
          categorySuggestions.push("Your skills don't closely match this role. Consider upskilling in key areas.");
        }
      }
    }
  }

  return {
    matched: [...new Set(matched)],
    missing: [...new Set(missing)],
    matchPercentage: percentage,
    categorySpecificMatch,
    categorySuggestions,
  };
}

export function analyzeSkillGaps(
  resumeSkills: string[],
  jdKeywords: string[],
  category?: ResumeCategory
): {
  matchedSkills: string[];
  missingSkills: string[];
  missingTools: string[];
  otherMissing: string[];
  categorySpecific: string[];
  recommendations: string[];
} {
  const skillSet = new Set(COMMON_SKILLS);
  const resumeNorm = resumeSkills.map((s) => s.toLowerCase().trim());

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const missingTools: string[] = [];
  const otherMissing: string[] = [];
  const recommendations: string[] = [];

  for (const kw of jdKeywords) {
    const lower = kw.toLowerCase();
    const isMatched = resumeNorm.some((rs) => rs.includes(lower) || lower.includes(rs));

    if (isMatched) {
      matchedSkills.push(kw);
    } else if (skillSet.has(lower)) {
      missingSkills.push(kw);
    } else if (
      [
        "docker", "kubernetes", "git", "jenkins", "terraform",
        "ansible", "webpack", "vite", "babel", "eslint",
        "jest", "cypress", "playwright", "tableau", "power bi",
        "excel", "figma", "sketch", "jira", "confluence",
        "airflow", "spark", "kafka", "rabbitmq", "looker",
      ].includes(lower)
    ) {
      missingTools.push(kw);
    } else {
      otherMissing.push(kw);
    }
  }

  // Category-specific skill recommendations
  let categorySpecific: string[] = [];
  if (category) {
    const catSkills = CATEGORY_SKILLS[category];
    categorySpecific = catSkills.filter((s) => !resumeNorm.some((r) => r.includes(s)));
    if (categorySpecific.length > 0) {
      recommendations.push(
        `Add these ${category}-specific keywords: ${categorySpecific.slice(0, 4).join(", ")}`
      );
    }
  }

  if (missingSkills.length > 2) {
    recommendations.push(
      `You're missing ${missingSkills.length} key skills. Consider learning: ${missingSkills.slice(0, 3).join(", ")}`
    );
  }
  if (missingTools.length > 1) {
    recommendations.push(
      `Gain experience with: ${missingTools.slice(0, 3).join(", ")}`
    );
  }

  return {
    matchedSkills: [...new Set(matchedSkills)],
    missingSkills: [...new Set(missingSkills)],
    missingTools: [...new Set(missingTools)],
    otherMissing: [...new Set(otherMissing)],
    categorySpecific: [...new Set(categorySpecific)],
    recommendations,
  };
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
  const gap =
    req.years && yearsOfExp < req.years
      ? `Job requires ${req.years}+ years, resume shows ${yearsOfExp} years`
      : null;

  return {
    requiredYears: req.years,
    hasRelevantExperience: hasRelevant || roleTypes.length === 0,
    relevantRoles: roleTypes,
    gap,
  };
}

export function analyzeJD(
  jdText: string
): {
  keywords: string[];
  experience: { years: number | null; text: string };
  roles: string[];
  category: ResumeCategory;
  categoryLabel: string;
} {
  const keywords = extractKeywords(jdText);
  const experience = extractExperienceRequirements(jdText);
  const roles = extractRoleType(jdText);
  const category = extractCategoryFromJD(jdText);

  const categoryLabels: Record<ResumeCategory, string> = {
    student: "Student / Entry Level",
    fresher: "Fresher / Early Career",
    experienced: "Experienced / Senior",
    internship: "Internship",
  };

  return {
    keywords,
    experience,
    roles,
    category,
    categoryLabel: categoryLabels[category],
  };
}

export { CATEGORY_SKILLS };
