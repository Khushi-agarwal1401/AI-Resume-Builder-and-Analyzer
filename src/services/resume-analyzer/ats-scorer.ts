export interface AtsSubscores {
  keywordRelevance: number;
  formatting: number;
  readability: number;
  sections: number;
  contactInfo: number;
}

const KEYWORD_CATEGORIES: Record<string, string[]> = {
  "action-verbs": ["achieved", "implemented", "developed", "managed", "created", "designed", "led", "improved", "delivered", "optimized", "established", "coordinated", "generated", "conducted", "built", "launched", "increased", "reduced", "negotiated", "mentored"],
  "metrics": ["percent", "percentage", "increase", "decrease", "revenue", "cost", "budget", "million", "thousand", "growth", "efficiency", "roi", "kpi", "saved", "generated"],
  "tech-skills": ["javascript", "typescript", "python", "java", "react", "node", "sql", "aws", "docker", "kubernetes", "git", "api", "agile", "scrum"],
  "soft-skills": ["leadership", "communication", "teamwork", "problem.solving", "critical.thinking", "collaboration", "mentoring", "analytical"],
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

  return { score: Math.max(0, Math.min(100, score)), fleschKincaid: Math.round(fleschKincaid * 10) / 10, avgSentenceLength: Math.round(avgSentenceLength * 10) / 10 };
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
  if (sectionCount >= 4) score += 5;
  else if (sectionCount >= 3) score += 2;

  if (totalLines > 80 && totalLines < 150) score += 10;
  else if (totalLines < 40) score -= 10;
  else if (totalLines > 200) score -= 5;

  const bulletLines = (text.match(/^[-•*]\s/gm) || []).length;
  const bulletRatio = totalLines > 0 ? bulletLines / totalLines : 0;
  if (bulletRatio > 0.3) score += 5;
  if (bulletRatio > 0.5) score += 3;

  return Math.max(0, Math.min(100, score));
}

function calculateSectionScore(text: string): { score: number; present: string[]; missing: string[] } {
  const sections = [
    { label: "summary", patterns: [/summary/i, /objective/i, /profile/i] },
    { label: "experience", patterns: [/experience/i, /employment/i, /work history/i] },
    { label: "education", patterns: [/education/i, /academic/i, /qualifications/i] },
    { label: "skills", patterns: [/skills/i, /competencies/i, /technologies/i] },
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

  if (hasEmail) score += 30;
  if (hasPhone) score += 20;
  if (hasLinkedIn) score += 25;
  if (hasGithub) score += 25;

  return Math.min(100, score);
}

function calculateKeywordScore(text: string): { score: number; details: Record<string, number> } {
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

  const score = totalPossible > 0 ? Math.round((totalFound / totalPossible) * 100) : 0;
  return { score, details };
}

export function calculateAtsScore(text: string): {
  overall: number;
  subscores: AtsSubscores;
  keywordDetails: Record<string, number>;
  readabilityDetails: { fleschKincaid: number; avgSentenceLength: number };
  sectionDetails: { present: string[]; missing: string[] };
  suggestions: string[];
} {
  const keywordResult = calculateKeywordScore(text);
  const readabilityResult = calculateReadability(text);
  const sectionResult = calculateSectionScore(text);
  const contactScore = calculateContactScore(text);
  const formattingScore = calculateFormattingScore(text);

  const subscores: AtsSubscores = {
    keywordRelevance: keywordResult.score,
    readability: readabilityResult.score,
    formatting: formattingScore,
    sections: sectionResult.score,
    contactInfo: contactScore,
  };

  const overall = Math.round(
    subscores.keywordRelevance * 0.30 +
    subscores.readability * 0.20 +
    subscores.formatting * 0.20 +
    subscores.sections * 0.15 +
    subscores.contactInfo * 0.15
  );

  const suggestions: string[] = [];

  if (keywordResult.details["action-verbs"] < 3) {
    suggestions.push("Add more strong action verbs (e.g., achieved, implemented, developed) to describe your experience.");
  }
  if (keywordResult.details["metrics"] < 2) {
    suggestions.push("Include quantifiable achievements with metrics (numbers, percentages, revenue, etc.).");
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
  if (subscores.sections < 100) {
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

  return {
    overall: Math.min(100, overall),
    subscores,
    keywordDetails: keywordResult.details,
    readabilityDetails: { fleschKincaid: readabilityResult.fleschKincaid, avgSentenceLength: readabilityResult.avgSentenceLength },
    sectionDetails: { present: sectionResult.present, missing: sectionResult.missing },
    suggestions,
  };
}
