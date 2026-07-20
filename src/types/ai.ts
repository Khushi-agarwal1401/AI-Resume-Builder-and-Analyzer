type AiAction =
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

interface AiRequest {
  action: AiAction;
  input: string;
  context: string;
}

interface AiResponse {
  success: boolean;
  output: string;
  error?: string;
}

export type { AiAction, AiRequest, AiResponse };
