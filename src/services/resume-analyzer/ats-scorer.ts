export type ResumeCategory = "student" | "fresher" | "experienced" | "internship";

export interface AtsSubscores {
  keywordRelevance: number;
  formatting: number;
  readability: number;
  sections: number;
  contactInfo: number;
  educationRelevance: number;
  experienceDepth: number;
  projectQuality: number;
}

interface AtsScoreInput {
  text: string;
  category?: ResumeCategory;
  jobDescription?: string;
  targetRole?: string;
  targetIndustry?: string;
}

const KEYWORD_CATEGORIES: Record<string, string[]> = {
  "action-verbs": [
    "achieved", "implemented", "developed", "managed", "created",
    "designed", "led", "improved", "delivered", "optimized",
    "established", "coordinated", "generated", "conducted", "built",
    "launched", "increased", "reduced", "negotiated", "mentored",
    "spearheaded", "orchestrated", "engineered", "architected", "pioneered",
  ],
  "metrics": [
    "percent", "percentage", "increase", "decrease", "revenue",
    "cost", "budget", "million", "thousand", "growth",
    "efficiency", "roi", "kpi", "saved", "generated",
    "improved by", "reduced by", "increased by",
  ],
  "tech-skills": [
    "javascript", "typescript", "python", "java", "react",
    "node", "sql", "aws", "docker", "kubernetes",
    "git", "api", "agile", "scrum", "machine learning",
  ],
  "soft-skills": [
    "leadership", "communication", "teamwork", "problem.solving",
    "critical.thinking", "collaboration", "mentoring", "analytical",
    "adaptability", "time management",
  ],
};

function countKeywordMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\./g, "\\s*");
    return new RegExp(escaped, "i").test(lower);
  }).length;
}

function calculateReadability(text: string): { score: number; fleschKincaid: number; avgSentenceLength: number } {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
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

  const totalSentences = sentences.length || 1;
  const totalWords = words.length || 1;
  const avgSentenceLength = totalWords / totalSentences;
  const fleschKincaid = 206.835 - 1.015 * avgSentenceLength - 84.6 * (syllables / totalWords);

  let score = 70;
  if (avgSentenceLength > 25) score -= 15;
  else if (avgSentenceLength > 20) score -= 5;
  else if (avgSentenceLength > 15) score += 5;
  else if (avgSentenceLength > 10) score += 10;
  if (fleschKincaid > 60) score += 10;
  if (fleschKincaid < 30) score -= 10;

  return {
    score: Math.max(0, Math.min(100, score)),
    fleschKincaid: Math.round(fleschKincaid * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
  };
}

function calculateFormattingScore(text: string): number {
  let score = 70;
  const lines = text.split("\n").filter(Boolean);
  const totalLines = lines.length;

  const hasBullets = text.includes("•") || text.includes("- ") || text.includes("* ");
  if (hasBullets) score += 10;

  const hasNumbers = /\d+%|\$\d+|\d+x|\d+[+\s]/.test(text);
  if (hasNumbers) score += 5;

  const sectionCount = (text.match(/^[A-Z][A-Z\s/]{3,50}$/gm) || []).length;
  if (sectionCount >= 5) score += 8;
  else if (sectionCount >= 4) score += 5;
  else if (sectionCount >= 3) score += 2;

  if (totalLines > 80 && totalLines < 150) score += 10;
  else if (totalLines < 40) score -= 10;
  else if (totalLines > 200) score -= 5;

  const bulletLines = (text.match(/^[-•*]\s/gm) || []).length;
  const bulletRatio = totalLines > 0 ? bulletLines / totalLines : 0;
  if (bulletRatio > 0.3) score += 5;
  if (bulletRatio > 0.5) score += 3;
  if (bulletRatio > 0.6) score += 2;

  const consistentFormat = /^[-•*]\s.+\n(?:[-•*]\s.+\n)+/m.test(text);
  if (consistentFormat) score += 5;

  const hasDates = /\b(19|20)\d{2}\s*[-–to]+\s*(19|20)\d{2}|present\b/i.test(text);
  if (hasDates) score += 5;

  return Math.max(0, Math.min(100, score));
}

function calculateEducationScore(text: string, category: ResumeCategory): number {
  const hasEducation = /education|academic|qualifications|university|college|institute/i.test(text);
  if (!hasEducation) return category === "student" ? 0 : 30;

  let score = 50;

  const hasDegree = /bachelor|master|phd|b\.\w+|m\.\w+|bachelor's|master's/i.test(text);
  if (hasDegree) score += 20;

  const hasGpa = /\b(gpa|cgpa)\b/i.test(text) || /\d\.\d\s*(gpa|out of)/i.test(text);
  if (hasGpa) score += 15;

  const hasRelevance = /relevant coursework|coursework in|specialization|major|minor|concentration/i.test(text);
  if (hasRelevance) score += 15;

  const hasHonors = /honors|dean's list|scholarship|magna|cum laude|distinction/i.test(text);
  if (hasHonors) score += 10;

  if (category === "student") {
    score += 10; // Education is more critical for students
  }

  return Math.min(100, score);
}

function calculateExperienceDepth(text: string, category: ResumeCategory): number {
  const hasExperience = /experience|employment|work history/i.test(text);
  if (!hasExperience) {
    if (category === "student" || category === "internship") return 40;
    return 0;
  }

  let score = 40;

  const roleCount = (text.match(/^(?:[-•*]\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[-–—]|^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/gm) || []).length;
  if (roleCount >= 3) score += 20;
  else if (roleCount >= 2) score += 10;
  else score += 5;

  const bulletPoints = (text.match(/^[-•*]\s/gm) || []).length;
  if (bulletPoints >= 15) score += 15;
  else if (bulletPoints >= 10) score += 10;
  else if (bulletPoints >= 5) score += 5;

  const hasYears = /\b(\d+)\+?\s*(years?|yrs?)\s*(of\s*)?experience\b/i.test(text);
  if (hasYears) {
    const yearMatch = text.match(/\b(\d+)\+?\s*(years?|yrs?)/i);
    if (yearMatch) {
      const years = parseInt(yearMatch[1], 10);
      if (years >= 5) score += 15;
      else if (years >= 3) score += 10;
      else if (years >= 1) score += 5;
    }
  }

  const hasAchievements = /achieved|increased|decreased|reduced|improved|delivered|launched/i.test(text);
  if (hasAchievements) score += 10;

  if (category === "experienced") {
    if (roleCount >= 3) score += 5; // Bonus for multiple roles
  }

  return Math.min(100, score);
}

function calculateProjectQuality(text: string, category: ResumeCategory): number {
  let score = 50;
  const hasProjects = /projects?|portfolio|github/i.test(text);
  if (!hasProjects) {
    if (category === "fresher" || category === "student") return 10;
    return 30;
  }

  const projectCount = (text.match(/^(?:[-•*]\s+)?([A-Z][A-Za-z0-9\s]+?)\s*[-–—]|^([A-Z][A-Za-z0-9\s]+?)$/gm) || []).length;
  if (projectCount >= 3) score += 20;
  else if (projectCount >= 2) score += 10;
  else score += 5;

  const hasTechStack = /technolog|tech stack|built with|using|developed with|created with/i.test(text);
  if (hasTechStack) score += 15;

  const hasLinks = /github\.com|gitlab\.com|herokuapp|vercel|netlify|\.io\b/i.test(text);
  if (hasLinks) score += 10;

  const hasDescription = /feature|functionality|allows|enables|provides|implements|solves/i.test(text);
  if (hasDescription) score += 10;

  const hasMetrics = /\d+%|\d+\s+users|\d+\s+stars|\d+\s+downloads/i.test(text);
  if (hasMetrics) score += 10;

  if (category === "fresher" || category === "student") {
    if (projectCount >= 3) score += 10;
  }

  return Math.min(100, score);
}

function calculateSectionScore(text: string): { score: number; present: string[]; missing: string[] } {
  const sections = [
    { label: "summary", patterns: [/summary/i, /objective/i, /profile/i] },
    { label: "experience", patterns: [/experience/i, /employment/i, /work history/i] },
    { label: "education", patterns: [/education/i, /academic/i, /qualifications/i] },
    { label: "skills", patterns: [/skills/i, /competencies/i, /technologies/i] },
    { label: "projects", patterns: [/projects?/i, /portfolio/i] },
    { label: "certifications", patterns: [/certifications?/i, /licenses?/i, /credentials?/i] },
  ];

  const found: string[] = [];
  const notFound: string[] = [];

  for (const section of sections) {
    const exists = section.patterns.some((p) => p.test(text));
    if (exists) found.push(section.label);
    else notFound.push(section.label);
  }

  const score = Math.round((found.length / sections.length) * 100);
  return { score, present: found, missing: notFound };
}

function calculateContactScore(text: string): number {
  let score = 0;
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  const hasLinkedIn = /linkedin\.com/.test(text);
  const hasGithub = /github\.com/.test(text);
  const hasPortfolio = /portfolio|\.io\b/.test(text);

  if (hasEmail) score += 25;
  if (hasPhone) score += 20;
  if (hasLinkedIn) score += 20;
  if (hasGithub) score += 20;
  if (hasPortfolio) score += 15;

  return Math.min(100, score);
}

function calculateKeywordScore(text: string, jdText?: string): { score: number; details: Record<string, number> } {
  const lower = text.toLowerCase();
  const details: Record<string, number> = {};

  let totalPossible = 0;
  let totalFound = 0;

  for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
    const found = countKeywordMatches(lower, keywords);
    totalFound += found;
    totalPossible += keywords.length;
    details[category] = found;
  }

  // If a job description is provided, also match against it
  if (jdText) {
    const jdLower = jdText.toLowerCase();
    const jdWords = jdLower
      .replace(/[^a-z0-9\s+#.-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !["the", "and", "for", "are", "but", "not", "you", "all", "can", "has", "had", "our", "its", "was", "per", "via", "etc"].includes(w));

    const uniqueJdWords = [...new Set(jdWords)];
    let jdMatches = 0;
    for (const word of uniqueJdWords) {
      if (lower.includes(word)) jdMatches++;
    }

    details["jd-match"] = Math.round((jdMatches / uniqueJdWords.length) * 100);
    totalFound += jdMatches;
    totalPossible += uniqueJdWords.length;
  }

  const score = totalPossible > 0 ? Math.round((totalFound / totalPossible) * 100) : 0;
  return { score, details };
}

export function calculateAtsScore(input: AtsScoreInput | string): {
  overall: number;
  subscores: AtsSubscores;
  keywordDetails: Record<string, number>;
  readabilityDetails: { fleschKincaid: number; avgSentenceLength: number };
  sectionDetails: { present: string[]; missing: string[] };
  suggestions: string[];
  category: ResumeCategory;
  grade: string;
} {
  let text: string;
  let category: ResumeCategory = "experienced";
  let jobDescription: string | undefined;

  if (typeof input === "string") {
    text = input;
  } else {
    text = input.text;
    category = input.category || "experienced";
    jobDescription = input.jobDescription;
  }

  if (!text || text.trim().length === 0) {
    return {
      overall: 0,
      subscores: {
        keywordRelevance: 0, formatting: 0, readability: 0,
        sections: 0, contactInfo: 0, educationRelevance: 0,
        experienceDepth: 0, projectQuality: 0,
      },
      keywordDetails: {},
      readabilityDetails: { fleschKincaid: 0, avgSentenceLength: 0 },
      sectionDetails: { present: [], missing: [] },
      suggestions: ["No resume content provided for analysis."],
      category,
      grade: "F",
    };
  }

  const keywordResult = calculateKeywordScore(text, jobDescription);
  const readabilityResult = calculateReadability(text);
  const sectionResult = calculateSectionScore(text);
  const contactScore = calculateContactScore(text);
  const formattingScore = calculateFormattingScore(text);
  const educationScore = calculateEducationScore(text, category);
  const experienceDepth = calculateExperienceDepth(text, category);
  const projectQuality = calculateProjectQuality(text, category);

  // Category-specific weighting
  let weightKeyword = 0.25;
  let weightReadability = 0.15;
  const weightFormatting = 0.15;
  let weightSections = 0.10;
  const weightContact = 0.10;
  let weightEducation = 0.05;
  let weightExperience = 0.10;
  let weightProject = 0.10;

  switch (category) {
    case "student":
      weightEducation = 0.20;
      weightProject = 0.15;
      weightExperience = 0.05;
      weightKeyword = 0.20;
      weightSections = 0.10;
      break;
    case "fresher":
      weightEducation = 0.15;
      weightProject = 0.20;
      weightExperience = 0.05;
      weightKeyword = 0.20;
      weightReadability = 0.10;
      break;
    case "internship":
      weightEducation = 0.15;
      weightProject = 0.15;
      weightExperience = 0.05;
      weightKeyword = 0.20;
      weightSections = 0.10;
      break;
    case "experienced":
      weightExperience = 0.20;
      weightProject = 0.05;
      weightEducation = 0.05;
      weightKeyword = 0.25;
      weightReadability = 0.15;
      break;
  }

  const subscores: AtsSubscores = {
    keywordRelevance: keywordResult.score,
    readability: readabilityResult.score,
    formatting: formattingScore,
    sections: sectionResult.score,
    contactInfo: contactScore,
    educationRelevance: educationScore,
    experienceDepth,
    projectQuality,
  };

  const overall = Math.round(
    subscores.keywordRelevance * weightKeyword +
    subscores.readability * weightReadability +
    subscores.formatting * weightFormatting +
    subscores.sections * weightSections +
    subscores.contactInfo * weightContact +
    subscores.educationRelevance * weightEducation +
    subscores.experienceDepth * weightExperience +
    subscores.projectQuality * weightProject
  );

  let grade = "F";
  if (overall >= 90) grade = "A+";
  else if (overall >= 85) grade = "A";
  else if (overall >= 80) grade = "A-";
  else if (overall >= 75) grade = "B+";
  else if (overall >= 70) grade = "B";
  else if (overall >= 65) grade = "B-";
  else if (overall >= 60) grade = "C+";
  else if (overall >= 50) grade = "C";
  else if (overall >= 40) grade = "D";

  const suggestions: string[] = [];

  // Category-specific suggestions
  if (category === "student" || category === "internship") {
    if (educationScore < 60) {
      suggestions.push("Add your GPA, relevant coursework, and academic achievements to strengthen your educational profile.");
    }
    if (projectQuality < 50) {
      suggestions.push("Highlight academic projects, hackathon participation, and relevant coursework to demonstrate practical skills.");
    }
    if (sectionResult.missing.includes("projects")) {
      suggestions.push("Add a Projects section showcasing your academic or personal projects with technologies used.");
    }
  }

  if (category === "fresher") {
    if (projectQuality < 60) {
      suggestions.push("Showcase 3+ projects with clear descriptions, technologies used, and measurable outcomes.");
    }
    if (sectionResult.missing.includes("projects")) {
      suggestions.push("Add a strong Projects section — for early-career roles, projects often carry more weight than experience.");
    }
    if (contactScore < 60) {
      suggestions.push("Ensure your GitHub and LinkedIn profiles are up to date and linked on your resume.");
    }
  }

  if (category === "experienced") {
    if (experienceDepth < 50) {
      suggestions.push("Detail your career progression with specific roles, responsibilities, and years of experience.");
    }
    if (keywordResult.details["metrics"] < 3) {
      suggestions.push("Quantify your impact with specific metrics — revenue growth, cost reduction, team size, etc.");
    }
    if (keywordResult.details["action-verbs"] < 5) {
      suggestions.push("Use strong leadership action verbs: led, managed, directed, established, mentored.");
    }
  }

  // General suggestions (keep from original but updated)
  if (keywordResult.details["action-verbs"] < 3) {
    suggestions.push("Add more strong action verbs (achieved, implemented, developed) to describe your experience.");
  }
  if (keywordResult.details["metrics"] < 2) {
    suggestions.push("Include quantifiable achievements with metrics to demonstrate measurable impact.");
  }
  if (subscores.keywordRelevance < 50) {
    suggestions.push("Incorporate more industry-relevant keywords from job descriptions into your resume.");
  }
  if (readabilityResult.avgSentenceLength > 25) {
    suggestions.push("Shorten your sentences for better readability — aim for 15-20 words per sentence.");
  }
  if (readabilityResult.fleschKincaid < 40) {
    suggestions.push("Use simpler language to improve readability score. Avoid jargon where possible.");
  }
  if (subscores.sections < 70) {
    sectionResult.missing.forEach((s) => {
      suggestions.push(`Add a "${s}" section — it helps ATS systems categorize your resume properly.`);
    });
  }
  if (contactScore < 80) {
    if (!text.includes("linkedin.com")) suggestions.push("Add your LinkedIn profile URL to improve recruiter reach.");
    if (!text.includes("github.com")) suggestions.push("Consider adding a GitHub or portfolio link if relevant.");
  }
  if (formattingScore < 60) {
    suggestions.push("Use bullet points consistently for your experience and achievements.");
  }
  if (experienceDepth > 60 && subscores.keywordRelevance < 60) {
    suggestions.push("Your experience is strong — match it with targeted keywords from job descriptions.");
  }

  return {
    overall: Math.min(100, overall),
    subscores,
    keywordDetails: keywordResult.details,
    readabilityDetails: {
      fleschKincaid: readabilityResult.fleschKincaid,
      avgSentenceLength: readabilityResult.avgSentenceLength,
    },
    sectionDetails: { present: sectionResult.present, missing: sectionResult.missing },
    suggestions,
    category,
    grade,
  };
}
