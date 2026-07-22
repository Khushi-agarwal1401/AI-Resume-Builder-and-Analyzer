import { parseResumeFile, extractSections, extractEmail, extractPhone, extractLinks } from "./parser";
import { calculateAtsScore, type ResumeCategory } from "./ats-scorer";
import { checkGrammar } from "./grammar-checker";
import { generateStrengthReport } from "./strength";

export interface AnalysisReport {
  parsed: {
    text: string;
    wordCount: number;
    email: string | null;
    phone: string | null;
    links: string[];
    sections: Record<string, string>;
  };
  ats: ReturnType<typeof calculateAtsScore>;
  grammar: ReturnType<typeof checkGrammar>;
  strength: ReturnType<typeof generateStrengthReport>;
}

export async function analyzeResumeText(text: string, category?: ResumeCategory): Promise<AnalysisReport> {
  const sections = extractSections(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const links = extractLinks(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const atsScore = calculateAtsScore({ text, category });
  const grammarIssues = checkGrammar(text);
  const strengthReport = generateStrengthReport(text, category);

  return {
    parsed: { text, wordCount, email, phone, links, sections },
    ats: atsScore,
    grammar: grammarIssues,
    strength: strengthReport,
  };
}

export async function analyzeResumeFile(buffer: Buffer, filename: string, category?: ResumeCategory): Promise<AnalysisReport> {
  const { text, error } = await parseResumeFile(buffer, filename);
  if (error || !text) {
    throw new Error(error || "Failed to parse file");
  }
  return analyzeResumeText(text, category);
}

export { parseResumeFile } from "./parser";
export { calculateAtsScore } from "./ats-scorer";
export { checkGrammar } from "./grammar-checker";
export { generateStrengthReport } from "./strength";
export { detectMissingSections } from "./parser";
export type { ResumeCategory } from "./ats-scorer";
