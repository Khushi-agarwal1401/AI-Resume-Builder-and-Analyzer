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
  | "role-variant"
  | "suggest-projects"
  | "recommend-template"
  | "ats-deep-analyze"
  | "recruiter-email"
  | "linkedin-message"
  | "interview-questions"
  | "github-repo-suggest"
  | "resume-import-upload"
  | "extract-pdf-text";

export interface AiRequest {
  action: AiAction;
  input: string;
  context: string;
  fileData?: {
    mimeType: string;
    data: string; // Base64 string
  };
}

export interface AiResponse {
  success: boolean;
  output: string;
  error?: string;
  /** Anti-fabrication warnings attached by the API guard (surfaced as toasts). */
  warnings?: string[];
}
export interface AnalysisResult {
  matchPercentage: number;
  overallMatch: number;
  overallAssessment?: string | null;
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
  strengths?: string[];
  weaknesses?: string[];
  actionableSuggestions?: string[];
  rewrittenBullets?: string[];
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
