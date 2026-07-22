export type AiAction =
  | "generate-summary"
  | "enhance-bullet"
  | "check-grammar"
  | "suggest-achievements"
  | "add-keywords"
  | "rewrite-section"
  | "cover-letter"
  | "ats-score"
  | "analyze-jd"
  | "company-variant"
  | "role-variant";

export interface AiRequest {
  action: AiAction;
  input: string;
  context: string;
}

export interface AiResponse {
  success: boolean;
  output: string;
  error?: string;
}
export interface AnalysisResult {
  matchPercentage: number;
  overallMatch: number;
  totalJdKeywords: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedSkills: string[];
  missingSkills: string[];
  missingTools: string[];
  otherMissing: string[];
  experienceGap: string | null;
  requiredYears: number | null;
  hasRelevantExperience: boolean;
  relevantRoles: string[];
  extractedKeywords: string[];
  aiSuggestions: string[];
}

export interface AnalysisHistory {
  id: string;
  user_id: string;
  resume_id: string | null;
  jd_snippet: string;
  match_percentage: number;
  result: Record<string, unknown>;
  created_at: string;
}
