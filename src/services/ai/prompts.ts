import { createServerSupabaseClient } from "@/lib/supabase/server";

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const promptCache = new Map<string, CacheEntry>();

/**
 * Hardcoded default prompts — used as the fallback when no active row exists
 * in the `prompts` table (and by admin UI when the table is empty).
 */
export const DEFAULT_PROMPTS: Record<string, string> = {
  "generate-summary": `Write a professional resume summary (3-4 sentences) based on this information. Only use facts provided. Do not invent metrics or experience.\n\nContext: {context}\n\nUser input: {input}`,
  "enhance-bullet": `Improve this resume bullet point using strong action verbs. Add metrics only if explicitly provided by the user. Never fabricate numbers.\n\nOriginal: {input}\n\nContext: {context}`,
  "check-grammar": `Fix grammar and spelling in this text. Do not rewrite content or add information.\n\nText: {input}`,
  "suggest-achievements": `Suggest 2-3 quantifiable achievements based on this experience. Only use metrics the user has provided.\n\nExperience: {input}\n\nContext: {context}`,
  "add-keywords": `Identify missing keywords from this job description and suggest which to add to the resume.\n\nResume section: {input}\n\nJob description: {context}`,
  "rewrite-section": `Rewrite this resume section to be more impactful. Use action verbs. Do not add fabricated metrics.\n\nSection: {input}\n\nContext: {context}`,
  "cover-letter": `Write a professional cover letter based on the resume below. Use only facts from the resume. Never invent experience, skills, or metrics. Address it to the hiring manager. Keep it to 3-4 paragraphs.\n\nResume: {context}\n\nJob description: {input}`,
  "ats-score": `Analyze this resume and return a JSON object with exactly these fields: overall (0-100), skillsMatch (0-40), formatting (0-30), keywords (0-30), suggestions (array of strings). Score based on common ATS best practices. Label concept as "Estimated Compatibility Score" not "ATS Score".\n\nResume: {context}\n\nJob description: {input}`,
  "analyze-jd": `Compare this resume against the job description. Identify missing keywords, missing skills, and missing tools. Return a JSON object with: matchPercentage (0-100), missingKeywords (string[]), missingSkills (string[]), missingTools (string[]).\n\nResume summary: {context}\n\nJob description: {input}`,
  "company-variant": `Rewrite this resume content to emphasize qualities relevant to a {input} company culture. Do not add fabricated metrics, experience, or skills.\n\nResume: {context}`,
  "role-variant": `Rewrite this resume content to emphasize skills relevant to a {input} role. Do not add fabricated metrics, experience, or skills.\n\nResume: {context}`,
  "profile-improvement": `You are a career coach. Based on the user's profile and resume data, suggest 4-6 specific, actionable improvements to their resume summary, skills, and achievements. Each suggestion must be applicable and insertable — do not fabricate metrics or experience the user doesn't have. Number each suggestion on its own line.\n\nProfile: {context}\n\nInput: {input}`,
  "github-repo-suggest": `You are a hiring manager who reviews resumes for the target role described in the context. From the candidate's GitHub repositories listed in the input, recommend 3-5 that best showcase relevant skills for that role. For each, provide the repo name (exactly as given) and a one-line reason tied to the target role. Respond ONLY with a JSON array, no markdown, in exactly this shape: [{"name": "repo-name", "reason": "one-line reason"}]. Use the repository names exactly as they appear in the input; never invent repositories.\n\nTarget role: {context}\n\nRepositories (JSON): {input}`,
  "linkedin-import-paste": `Extract structured resume data from a LinkedIn profile pasted by the user (their own profile — pasted text or profile PDF export). Respond ONLY with a JSON object, no markdown, in exactly this shape:\n{\n  "experience": [{"company": "", "role": "", "duration": "", "description": ""}],\n  "education": [{"school": "", "degree": "", "field": "", "graduationYear": ""}],\n  "skills": [],\n  "certifications": [{"name": "", "issuer": "", "date": ""}],\n  "achievements": [{"title": "", "description": ""}]\n}\nRules: Use ONLY information present in the pasted text. Never invent companies, roles, dates, or metrics. Skip empty sections. If the text contains no usable profile data, respond with all empty arrays. The description for each experience should be a faithful short summary of what the text says, not embellished.\n\nProfile text: {input}`,
  "resume-import-upload": `Extract structured resume data from the resume text pasted below. Respond ONLY with a JSON object, no markdown, in exactly this shape:\n{\n  "targetLevel": "student" | "student_internship" | "fresher" | "experienced",\n  "personalInfo": { "fullName": "", "email": "", "phone": "", "linkedin": "", "github": "", "portfolio": "" },\n  "summary": "",\n  "experience": [{"company": "", "role": "", "location": "", "startDate": "", "endDate": "", "current": false, "responsibilities": []}],\n  "education": [{"institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "cgpa": ""}],\n  "skills": { "technical": [], "soft": [], "tools": [], "frameworks": [] },\n  "projects": [{"name": "", "description": "", "technologies": [], "liveUrl": "", "githubUrl": ""}],\n  "certifications": [{"name": "", "issuer": "", "date": ""}],\n  "achievements": [{"title": "", "description": "", "date": ""}],\n  "languages": [{"name": "", "proficiency": ""}]\n}\nRules: Use ONLY information present in the resume text. Never invent companies, roles, dates, metrics, or skills. Skip fields that are not present. "current": true only when the role's end date is the present (e.g. "Present", "Current", no end date). For experience responsibilities, split the job's bullet points into an array of strings.\n\nResume text: {input}`,
};

function getCached(action: string): string | undefined {
  const entry = promptCache.get(action);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    promptCache.delete(action);
    return undefined;
  }
  return entry.value;
}

function setCached(action: string, value: string) {
  promptCache.set(action, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Resolve the prompt template for an AI action.
 * Priority: cached DB value → active DB row → hardcoded default.
 * DB is only hit on cache miss (max once per action per 60s).
 */
export async function getPrompt(action: string): Promise<string> {
  const cached = getCached(action);
  if (cached !== undefined) return cached;

  const fallback =
    DEFAULT_PROMPTS[action] || `Process this:\n\nInput: {input}\n\nContext: {context}`;

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("prompts")
      .select("template")
      .eq("key", action)
      .single();

    const template = (data?.template as string)?.trim();
    const resolved = template && template.length > 0 ? template : fallback;
    setCached(action, resolved);
    return resolved;
  } catch {
    return fallback;
  }
}

/** Invalidate the cache after an admin publish/unpublish. */
export function invalidatePrompt(action?: string) {
  if (action) {
    promptCache.delete(action);
  } else {
    promptCache.clear();
  }
}
