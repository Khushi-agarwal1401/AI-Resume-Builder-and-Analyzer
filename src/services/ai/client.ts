import { AiRequest, AiResponse } from "@/types/ai";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const PROMPTS: Record<string, string> = {
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
};

function buildPrompt(request: AiRequest): string {
  const { action, input, context } = request;
  const template = PROMPTS[action];
  if (!template) return `Process this:\n\nInput: ${input}\n\nContext: ${context}`;
  return template.replace(/\{input\}/g, input).replace(/\{context\}/g, context);
}

export async function callGemini(request: AiRequest): Promise<AiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { success: false, output: "", error: "GEMINI_API_KEY not configured" };
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(request) }] }],
      }),
    });

    if (!response.ok) {
      const statusMessages: Record<number, string> = {
        400: "The AI request was malformed. Please try again or contact support.",
        401: "AI service authentication failed. The API key may be invalid or expired.",
        403: "AI service quota exceeded or access denied. The free tier daily limit (1,500 requests) may have been reached.",
        429: "AI service rate limit reached. Please wait a moment and try again.",
        500: "The AI service encountered an internal error. Please try again later.",
        503: "AI service is temporarily unavailable. Please try again in a few minutes.",
      };
      const userMessage =
        statusMessages[response.status] ||
        `AI service responded with status ${response.status}. Please try again.`;
      return { success: false, output: "", error: userMessage };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return { success: true, output: text };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
