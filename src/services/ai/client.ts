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
  "recruiter-email": `Write a concise, professional outreach email to the recruiter or hiring manager for the job described below. Use only facts from the resume. Never invent experience, skills, or metrics. Structure: friendly greeting, who you are and the role you're applying for, 2-3 sentences connecting your most relevant experience to the role's requirements, a call to action to schedule a conversation, and a professional sign-off with the candidate's name and contact details from the resume. Keep it under 200 words.\n\nResume: {context}\n\nJob description: {input}`,
  "linkedin-message": `Write a short, professional LinkedIn InMail or connection-request message to the recruiter or hiring manager for the job described below. Use only facts from the resume. Never invent experience, skills, or metrics. Keep it to 3-4 sentences: greet, mention the role you're applying for, one line tying your background to the role, and a polite call to action. No emojis, no links, under 120 words.\n\nResume: {context}\n\nJob description: {input}`,
  "interview-questions": `Based on the job description and the candidate's resume below, generate a focused list of likely interview questions the candidate should prepare for. Return 10 questions: 3-4 technical/skill-based tied to the role's requirements, 3 behavioral (STAR-format), 2-3 role-specific scenario questions, and 1-2 questions about the candidate's specific experience from the resume. Number them and group them under headings. Use only the skills and experience present in the resume.\n\nResume: {context}\n\nJob description: {input}`,
  "ats-score": `Analyze this resume and return a JSON object with exactly these fields: overall (0-100), skillsMatch (0-40), formatting (0-30), keywords (0-30), suggestions (array of strings). Score based on common ATS best practices. Label concept as "Estimated Compatibility Score" not "ATS Score".\n\nResume: {context}\n\nJob description: {input}`,
  "analyze-jd": `Compare this resume against the job description. Identify missing keywords, missing skills, and missing tools. Return a JSON object with: matchPercentage (0-100), missingKeywords (string[]), missingSkills (string[]), missingTools (string[]).\n\nResume summary: {context}\n\nJob description: {input}`,
  "company-variant": `Rewrite this resume content to emphasize qualities relevant to a {input} company culture. Do not add fabricated metrics, experience, or skills.\n\nResume: {context}`,
  "role-variant": `Rewrite this resume content to emphasize skills relevant to a {input} role. Do not add fabricated metrics, experience, or skills.\n\nResume: {context}`,
  "suggest-projects": `You are a technical recruiter helping a candidate choose which GitHub repositories to showcase on their resume for a specific job. Rank the candidate's repositories by how relevant each one is to the job posting, and also suggest which repositories the candidate should ADD to the resume to increase their chances (projects that fill skill gaps even if not the strongest match). Respond ONLY with a JSON object, no markdown, in exactly this shape:\n{\n  \"rankings\": [{\"repo\": \"exact repo name from the list\", \"score\": 0-100, \"reason\": \"one sentence why it fits this job\"}],\n  \"suggestedAdditions\": [{\"repo\": \"exact repo name from the list\", \"reason\": \"one sentence why adding this boosts the application\"}]\n}\nRank from the provided repository list ONLY — never invent repos. Order rankings by score descending (best first).\n\nJob posting: {input}\n\nCandidate's repositories (name | description | language):\n{context}`,
  "recommend-template": `You are a resume design expert helping a candidate choose the SINGLE best resume template for a specific job. Weigh ATS compatibility, seniority of the role, industry norms, and the candidate's projects/skills. Respond ONLY with a JSON object, no markdown, in exactly this shape:\n{\n  \"templateId\": \"exact template key from the provided list\",\n  \"score\": 0-100,\n  \"reason\": \"one sentence why this template fits this candidate and job\",\n  \"bullets\": [\"2-4 short concrete reasons\"]\n}\nChoose templateId ONLY from the provided template list — never invent a key. Prefer ATS-friendly layouts for corporate/enterprise roles, bold layouts for creative roles, student-first layouts for internships and entry roles, and executive layouts for senior roles.\n\nJob posting: {input}\n\nAvailable templates (key | name | ATS score | layout | best for | tags):\n{context}`,
  "ats-deep-analyze": `You are an enterprise-grade ATS Resume Analyzer trained to simulate modern Applicant Tracking Systems such as Greenhouse, Lever, Workday, Taleo, Ashby, iCIMS, SmartRecruiters, and BambooHR. Provide the closest possible simulation of how a real ATS and an experienced recruiter would evaluate a resume. Do NOT simply count keywords — analyze semantic relevance, contextual skills, experience quality, keyword placement, ATS formatting, and recruiter readability.\n\nInstructions:\n- If a Job Description exists: perform an exact ATS comparison (critical/important/optional keywords, found vs missing vs synonyms).\n- If only a Job Title exists: generate an industry-standard hiring profile using current expectations.\n- If neither exists: evaluate the resume on its own — section headings, keyword coverage for the implied role, formatting, bullets, achievements, grammar, and recruiter appeal.\n\nAlso assess: ATS parsing simulation (name, email, phone, LinkedIn, portfolio, summary, skills, experience, projects, education, certifications; flag tables/columns/icons/text boxes/unusual fonts as parse risks), keyword density (flag stuffing), recruiter readability, bullet quality (action verbs, metrics, STAR, rewrite weak bullets), experience match, project analysis, skills gaps, formatting, weak action verbs (helped, worked on, responsible for), achievement score (metrics/percentages/revenue/time saved), repetition of buzzwords, grammar/spelling/tense, and business-English quality.\n\nRespond ONLY with a JSON object, no markdown, in exactly this shape:\n{\n  \"atsScore\": 0-100,\n  \"recruiterScore\": 0-100,\n  \"hiringProbability\": 0-100,\n  \"parserConfidence\": 0-100,\n  \"keywordMatch\": 0-100,\n  \"semanticMatch\": 0-100,\n  \"missingKeywords\": [\"...\"],\n  \"missingSkills\": [\"...\"],\n  \"keywordDensity\": \"e.g. React repeated 17 times — recommended 6-8\",\n  \"grammarScore\": 0-100,\n  \"formattingIssues\": [\"...\"],\n  \"weakBullets\": [{\"original\": \"...\", \"rewrite\": \"...\"}],\n  \"topImprovements\": [{\"text\": \"...\", \"impact\": \"+5 ATS\"}],\n  \"verdict\": \"one-two sentences\"\n}\nBe specific and concrete. Never invent resume content the candidate did not include.\n\nResume:\n{context}\n\nJob title: {input}\nJob description follows after the resume if provided.`,
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(request) }] }],
        }),
        signal: controller.signal,
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
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        success: false,
        output: "",
        error: "The AI request timed out after 25 seconds. Please try a shorter prompt or try again later.",
      };
    }
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
