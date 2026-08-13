export const AI_ACTIONS = [
  "generate-summary",
  "enhance-bullet",
  "check-grammar",
  "suggest-achievements",
  "add-keywords",
  "rewrite-section",
  "cover-letter",
  "ats-score",
  "analyze-jd",
  "company-variant",
  "role-variant",
  "suggest-projects",
  "recommend-template",
  "ats-deep-analyze",
  "profile-improvement",
  "github-repo-suggest",
  "recruiter-email",
  "linkedin-message",
  "interview-questions",
  "resume-import-upload",
  "extract-pdf-text",
  "optimize-resume",
  "targeted-skills",
] as const;

export type AiAction = (typeof AI_ACTIONS)[number];

export function isAiAction(action: string): action is AiAction {
  return (AI_ACTIONS as readonly string[]).includes(action);
}
