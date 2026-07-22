import { calculateAtsScore, type ResumeCategory } from "./ats-scorer";
import { checkGrammar, calculateGrammarScore } from "./grammar-checker";
import { detectMissingSections } from "./parser";

export interface ResumeStrengthReport {
  overall: number;
  breakdown: {
    atsCompatibility: number;
    grammar: number;
    sections: number;
    contentQuality: number;
    formattingLength: number;
  };
  grade: string;
  analysis: {
    wordCount: number;
    bulletCount: number;
    hasMetrics: boolean;
    hasActionVerbs: boolean;
    hasSummary: boolean;
    hasContactInfo: boolean;
    missingSections: string[];
    grammarIssues: number;
    category?: ResumeCategory;
  };
  recommendations: string[];
}

function countBullets(text: string): number {
  const bulletMatches = text.match(/^[-•*]\s/gm);
  return bulletMatches ? bulletMatches.length : 0;
}

function hasMetrics(text: string): boolean {
  return /\d+%|\$\d+|\d+x|\d+\s+(percent|users|clients|customers|revenue|growth|increase|reduction)/i.test(text);
}

function hasActionVerbs(text: string): boolean {
  const verbs = ["achieved", "implemented", "developed", "managed", "created", "designed", "led", "improved", "delivered", "optimized", "established", "built", "launched", "increased", "reduced", "negotiated", "spearheaded", "orchestrated"];
  const lower = text.toLowerCase();
  return verbs.some((v) => new RegExp(`\\b${v}\\b`, "i").test(lower));
}

export function generateStrengthReport(text: string, category?: ResumeCategory): ResumeStrengthReport {
  if (!text || text.trim().length === 0) {
    return {
      overall: 0,
      breakdown: { atsCompatibility: 0, grammar: 0, sections: 0, contentQuality: 0, formattingLength: 0 },
      grade: "F",
      analysis: { wordCount: 0, bulletCount: 0, hasMetrics: false, hasActionVerbs: false, hasSummary: false, hasContactInfo: false, missingSections: [], grammarIssues: 0, category },
      recommendations: ["No resume content provided for analysis."],
    };
  }

  const atsResult = calculateAtsScore({ text, category });
  const grammarIssues = checkGrammar(text);
  const grammarScore = calculateGrammarScore(grammarIssues);
  const { present, missing } = detectMissingSections(text);
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const bulletCount = countBullets(text);
  const metrics = hasMetrics(text);
  const actionVerbs = hasActionVerbs(text);
  const hasSummary = present.includes("summary");
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);

  const contentQualityScore = (metrics ? 25 : 0) + (actionVerbs ? 25 : 0) + (bulletCount > 5 ? 25 : 0) + (hasSummary ? 25 : 0);

  const formattingLengthScore = (() => {
    let score = 70;
    if (wordCount >= 300 && wordCount <= 800) score += 15;
    else if (wordCount < 200) score -= 15;
    else if (wordCount > 1000) score -= 10;
    if (bulletCount >= 10) score += 15;
    else if (bulletCount >= 5) score += 5;
    else score -= 5;
    return Math.max(0, Math.min(100, score));
  })();

  const sectionScore = (() => {
    const required = ["experience", "education", "skills"];
    const found = required.filter((r) => present.includes(r)).length;
    return Math.round((found / required.length) * 100);
  })();

  const overall = Math.round(
    atsResult.overall * 0.35 +
    grammarScore * 0.20 +
    sectionScore * 0.15 +
    contentQualityScore * 0.20 +
    formattingLengthScore * 0.10
  );

  const recommendations: string[] = [];

  // Category-specific recommendations
  if (category === "student" || category === "internship") {
    if (!hasSummary) recommendations.push("Add a career objective or summary highlighting your academic background and career aspirations.");
    if (wordCount < 200) recommendations.push("Expand your resume with relevant coursework, projects, and extracurricular activities.");
    recommendations.push("Highlight relevant coursework, GPA, and academic projects to demonstrate your qualifications.");
  } else if (category === "fresher") {
    if (!hasSummary) recommendations.push("Add a professional summary highlighting your internship experience and key skills.");
    if (wordCount < 250) recommendations.push("Include more details about your internships, projects, and technical skills.");
    if (bulletCount < 5) recommendations.push("Use bullet points to detail your internship accomplishments and project outcomes.");
  } else if (category === "experienced") {
    if (!hasSummary) recommendations.push("Add a powerful executive summary highlighting your years of experience and key achievements.");
    if (!metrics) recommendations.push("Quantify your leadership impact with specific metrics — team size, budget, revenue growth.");
    if (wordCount > 900) recommendations.push("Focus on impact-driven bullet points — quality over quantity for senior roles.");
  }

  // General recommendations
  if (!hasSummary) recommendations.push("Add a professional summary or objective to give recruiters a quick overview of your profile.");
  if (!metrics) recommendations.push("Quantify your achievements with specific numbers, percentages, or dollar amounts.");
  if (!actionVerbs) recommendations.push("Use strong action verbs (achieved, implemented, developed) to start your bullet points.");
  if (wordCount < 250) recommendations.push("Your resume is too short. Aim for 400-600 words for most roles.");
  if (wordCount > 900) recommendations.push("Your resume is too long. Aim for 400-600 words — one page for early career, two max for senior.");
  if (bulletCount < 5) recommendations.push("Use bullet points to organize your achievements — they're more scannable than paragraphs.");
  if (!hasEmail) recommendations.push("Include your email address — it's the most basic contact information.");
  if (atsResult.sectionDetails.missing.includes("skills")) recommendations.push("Add a dedicated Skills section to help ATS systems match your qualifications.");
  if (grammarIssues.length > 0) recommendations.push("Fix grammar and style issues to present a polished, professional image.");
  if (bulletCount > 0 && bulletCount < 5) recommendations.push("Add more bullet points under each role. Aim for 3-5 per position.");

  recommendations.push(...atsResult.suggestions.slice(0, 2));

  return {
    overall,
    breakdown: {
      atsCompatibility: atsResult.overall,
      grammar: grammarScore,
      sections: sectionScore,
      contentQuality: contentQualityScore,
      formattingLength: formattingLengthScore,
    },
    grade: atsResult.grade,
    analysis: {
      wordCount,
      bulletCount,
      hasMetrics: metrics,
      hasActionVerbs: actionVerbs,
      hasSummary,
      hasContactInfo: hasEmail,
      missingSections: missing,
      grammarIssues: grammarIssues.length,
      category,
    },
    recommendations,
  };
}
