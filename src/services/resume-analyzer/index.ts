import { parseResumeFile, extractSections, extractEmail, extractPhone, extractLinks } from "./parser";
import { calculateAtsScore } from "./ats-scorer";
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

export async function analyzeResumeText(text: string): Promise<AnalysisReport> {
  const sections = extractSections(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const links = extractLinks(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const atsScore = calculateAtsScore(text);
  const grammarIssues = checkGrammar(text);
  const strengthReport = generateStrengthReport(text);

  return {
    parsed: { text, wordCount, email, phone, links, sections },
    ats: atsScore,
    grammar: grammarIssues,
    strength: strengthReport,
  };
}

export async function analyzeResumeFile(buffer: Buffer, filename: string): Promise<AnalysisReport> {
  const { text, error } = await parseResumeFile(buffer, filename);
  if (error || !text) {
    throw new Error(error || "Failed to parse file");
  }
  return analyzeResumeText(text);
}

export { parseResumeFile };
export { calculateAtsScore };
export { checkGrammar };
export { generateStrengthReport };
export { detectMissingSections } from "./parser";
