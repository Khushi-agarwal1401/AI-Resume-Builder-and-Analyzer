import { createServerClient } from "@/lib/db/server";

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
  "generate-summary": `Write a powerful 3-4 sentence professional summary for the candidate described below.

The summary must quickly communicate:
1. Who the candidate is and their target role
2. Their strongest technical capabilities
3. Relevant experience or project experience
4. The business or engineering value they deliver
5. Why they deserve consideration

Adapt emphasis to the candidate's level (prefer the declared experience level in the context, e.g. "Experience level: Fresher"; otherwise infer it from years of experience and the other details):
- Experienced candidates: emphasize years and type of experience, scope of ownership, technical expertise, and measurable business impact.
- Freshers/students: emphasize relevant education, internships, high-quality projects, technical capabilities, problem-solving ability, practical implementation, and certifications or relevant coursework.

Rules:
- Use ONLY facts provided. Never invent experience, skills, titles, companies, dates, or metrics.
- Never use generic filler phrases ("hardworking individual", "highly motivated", "team player", "passionate professional", "seeking a challenging opportunity") unless a specific fact in the input directly supports them.
- Be specific and concrete — name the target role, key skills, and real outcomes instead of vague praise.
- Output only the summary, 3-4 sentences, formatted as a single paragraph ready to paste into a resume.

Context: {context}

User input: {input}`,
  "optimize-resume": `You are a world-class recruiter, ATS optimization specialist, and expert resume writer with deep knowledge of hiring practices, applicant tracking systems, technical recruiting, and modern resume standards.

Your job is to create or optimize a premium, modern, ATS-friendly, one-page resume that is specifically targeted to the candidate's desired job role.

Your primary objective: maximize the candidate's chances of passing ATS screening and getting shortlisted for interviews while keeping the resume truthful, concise, professional, and human-readable.

## 1. Analyze the Candidate
Carefully analyze all information provided about the candidate (target role, job description, education, work experience, internships, projects, certifications, technical and soft skills, coursework, achievements, leadership, open-source contributions, tools, awards, extracurriculars). Identify the candidate's strongest evidence of capability and prioritize what is most relevant to the target role.
- Never invent experience, metrics, technologies, employers, achievements, responsibilities, or qualifications.
- If measurable results are not provided, improve the wording without fabricating numbers.

## 2. Target the Resume to the Job Role
Analyze the target job description and identify: required and preferred skills, technical keywords, tools, languages, frameworks, platforms, industry terminology, domain knowledge, responsibilities, soft skills, relevant certifications, and frequently repeated keywords. Naturally incorporate the most relevant keywords. Prioritize relevance over keyword frequency. Do not keyword-stuff. The final resume must sound like it was written by an experienced professional, not generated for an ATS.

## 3. Resume Structure
Create a clean one-page resume using this structure when applicable:
1. Name and contact information
2. Professional Summary
3. Technical Skills
4. Work Experience / Internships
5. Projects
6. Education
7. Certifications
8. Relevant Coursework / Achievements — only when valuable
Do not include unnecessary sections just to fill space. Prioritize the sections that provide the strongest evidence for the target role.

## 4. Professional Summary
Write a powerful 3-4 line professional summary that quickly communicates: who the candidate is, target role, strongest technical capabilities, relevant experience or project experience, business or engineering value, and why the candidate deserves consideration.
- Experienced candidates: emphasize years/type of experience, scope of ownership, technical expertise, and business impact.
- Freshers: emphasize relevant education, internships, high-quality projects, technical capabilities, problem-solving ability, practical implementation, and certifications or relevant coursework.
- Never use generic phrases ("hardworking individual", "highly motivated", "team player", "passionate professional", "seeking a challenging opportunity") unless supported by meaningful evidence.

## 5. Work Experience
Rewrite each experience entry into strong, achievement-focused bullets following: Action + What was done + How it was done + Result/Impact. Use strong action verbs (Built, Developed, Designed, Engineered, Automated, Optimized, Implemented, Improved, Reduced, Increased, Migrated, Integrated, Led, Delivered, Streamlined, Refactored, Deployed, Architected). Avoid weak phrases (responsible for, worked on, helped with, involved in, did, assisted with, learned, participated in). Highlight measurable evidence when provided (performance, cost, revenue, conversions, time saved, error reduction, user growth, scale, response time, test coverage, deployment frequency, automation percentage, users, transactions, scope). Never fabricate metrics. If no metric exists, demonstrate impact through scope, complexity, ownership, technical decisions, or business relevance.

## 6. Fresher Mode
If the candidate has no full-time professional experience, do not make the resume look weak. Strategically emphasize internships, technical projects, freelance work, open-source contributions, academic projects, certifications, coursework, hackathons, leadership, and relevant achievements. Treat projects as evidence of real-world capability. For each strong project communicate: Problem → Solution → Technology → Implementation → Result (e.g. "Built [solution] using [technologies] to solve [problem], implementing [important technical functionality] and achieving [measurable or demonstrable result]."). Do not falsely label academic projects as professional employment.

## 7. Project Optimization
Do not simply list project features. Rewrite projects to demonstrate technical complexity, engineering decisions, architecture, problem solving, scale, performance, security, testing, deployment, user impact, and business relevance. Prioritize projects directly relevant to the target job. For software engineering roles highlight languages, frameworks, databases, APIs, cloud platforms, authentication, CI/CD, testing, system design, deployment, performance optimization, and version control. Only mention technologies the candidate actually used.

## 8. Skills Section
Create a targeted skills section based on the candidate's actual capabilities and the target job description. Group skills logically (e.g. Languages; Frontend; Backend; Databases; Cloud & DevOps; Tools). Only include skills the candidate can reasonably discuss in an interview. Do not add keywords simply because they appear in the job description.

## 9. ATS Optimization
Optimize for ATS while preserving human readability: standard section headings, simple formatting, conventional job titles, relevant keywords included naturally, industry-standard terminology, no keyword stuffing, no unnecessary graphics, no tables for critical information, no text embedded inside images, no excessive icons or decorative elements, consistent formatting, and clear dates and job titles.

## 10. Achievement Prioritization
For every piece of candidate information ask: Is it relevant to the target role? Does it demonstrate competence? Does it differentiate the candidate? Does it provide evidence of impact? Does it contain a valuable ATS keyword? Is it stronger than another piece of information competing for the same space? Remove low-value content when necessary. A one-page resume prioritizes quality and relevance over completeness.

## 11. Truthfulness Rules
Never invent metrics, employers, responsibilities, technologies, certifications, awards, job titles, project results, or experience; never exaggerate experience; never claim expertise the candidate does not demonstrate. If information is missing, write the strongest truthful version possible. If a bullet would become significantly stronger with a missing metric, mark it internally as requiring additional information rather than making up a number.

## 12. Resume Writing Style
Use language that is concise, specific, professional, achievement-oriented, technical where relevant, easy to scan, and confident without exaggeration. Avoid long paragraphs, generic corporate language, repetition, first-person pronouns, unnecessary adjectives, empty claims, buzzword-heavy sentences, and overly complex vocabulary. Every line should earn its space on the page.

## 13. Role-Specific Optimization
Adjust the resume according to the target role. For example: Software Engineer — prioritize programming, algorithms, APIs, databases, system design, testing, cloud, deployment, performance. Frontend Developer — prioritize React/Angular/Vue, JavaScript/TypeScript, UI development, accessibility, responsive design, performance, state management, testing. Backend Developer — prioritize APIs, databases, distributed systems, authentication, scalability, performance, cloud, testing, backend frameworks. Data Analyst — prioritize SQL, Python, Excel, Power BI/Tableau, data visualization, statistics, data cleaning, business insights. Data Scientist — prioritize Python, SQL, statistics, machine learning, data analysis, feature engineering, model evaluation, ML frameworks. Apply the same principle to other roles: identify what recruiters for that role actually evaluate and prioritize evidence accordingly.

## 14. Final Quality Check
Before producing the final resume, perform an internal review:
- ATS: are important job-description keywords naturally included? Are standard section headings used? Is the resume easy to parse?
- Recruiter: can the candidate's value be understood within 10 seconds? Is the target role obvious? Are the strongest achievements easy to find?
- Content: are bullets achievement-focused? Are weak phrases removed? Are technical skills relevant? Are projects described with meaningful technical depth? Are there unnecessary sections?
- Truthfulness: did you avoid inventing information? Are all claims supported by candidate-provided information?
- Formatting: is the resume concise enough for one page? Are bullets short and scannable? Is information prioritized correctly?

## 15. Output
Return the final resume in a clean, professional, ATS-friendly format. Do not include explanations inside the resume. After the resume, provide a short Resume Optimization Report containing:
- ATS Match: estimated keyword alignment, important keywords included, important keywords missing.
- Recruiter Strength: strongest selling points, biggest weaknesses, sections that need more evidence.
- Recommended Improvements: list the 3-5 highest-impact changes the candidate should make to improve interview chances.
If the candidate has missing information that would materially strengthen the resume, explicitly identify what information is needed.
The final result should make the candidate look credible, capable, relevant, and interview-worthy without exaggerating their background.

Candidate's resume:
{context}

Target role / job description:
{input}`,
  "enhance-bullet": `Improve this resume bullet point using strong action verbs. Add metrics only if explicitly provided by the user. Never fabricate numbers.\n\nOriginal: {input}\n\nContext: {context}`,
  "check-grammar": `Fix grammar and spelling in this text. Do not rewrite content or add information.\n\nText: {input}`,
  "suggest-achievements": `Suggest 2-3 quantifiable achievements based on this experience. Only use metrics the user has provided.\n\nExperience: {input}\n\nContext: {context}`,
  "add-keywords": `Identify missing keywords from this job description and suggest which to add to the resume.\n\nResume section: {input}\n\nJob description: {context}`,
  "rewrite-section": `Rewrite this resume section to be more impactful. Use action verbs. Do not add fabricated metrics.\n\nSection: {input}\n\nContext: {context}`,
  "cover-letter": `Write a compelling, professional cover letter for the job below, based ONLY on the candidate's resume. Rules:\n1. Use only facts from the resume — never invent experience, skills, titles, companies, dates, or metrics.\n2. Open with a strong hook naming the specific role and company (use the company from the input when provided).\n3. In the body, mirror 3-5 key requirements or keywords from the job description and tie each to concrete resume evidence (skills, projects, or achievements with real metrics when present).\n4. Show enthusiasm and fit instead of re-listing the whole resume.\n5. Structure: professional salutation → opening hook → 2-3 body paragraphs → a confident call to action → formal sign-off (e.g. \"Sincerely,\") with the candidate's full name from the resume.\n6. Address the hiring manager as \"Dear Hiring Manager\" unless a specific name is provided — never invent one.\n7. Respect the tone and length preferences specified in the input (tones: Professional / Enthusiastic / Concise / Formal; lengths: Short ~200 words / Standard ~350 words / Detailed ~500 words).\n\nResume: {context}\n\nJob details (may include company, tone, and length preferences): {input}`,
  "recruiter-email": `Write a concise, professional outreach email to the recruiter or hiring manager for the job described below. Use only facts from the resume. Never invent experience, skills, or metrics. Structure: friendly greeting, who you are and the role you're applying for, 2-3 sentences connecting your most relevant experience to the role's requirements, a call to action to schedule a conversation, and a professional sign-off with the candidate's name and contact details from the resume. Keep it under 200 words.\n\nResume: {context}\n\nJob description: {input}`,
  "linkedin-message": `Write a short, professional LinkedIn InMail or connection-request message to the recruiter or hiring manager for the job described below. Use only facts from the resume. Never invent experience, skills, or metrics. Keep it to 3-4 sentences: greet, mention the role you're applying for, one line tying your background to the role, and a polite call to action. No emojis, no links, under 120 words.\n\nResume: {context}\n\nJob description: {input}`,
  "interview-questions": `Based on the job description and the candidate's resume below, generate a focused list of likely interview questions the candidate should prepare for. Return 10 questions: 3-4 technical/skill-based tied to the role's requirements, 3 behavioral (STAR-format), 2-3 role-specific scenario questions, and 1-2 questions about the candidate's specific experience from the resume. Number them and group them under headings. Use only the skills and experience present in the resume.\n\nResume: {context}\n\nJob description: {input}`,
  "ats-score": `Analyze this resume and return a JSON object with exactly these fields: overall (0-100), skillsMatch (0-40), formatting (0-30), keywords (0-30), suggestions (array of strings). Score based on common ATS best practices. Label concept as "Estimated Compatibility Score" not "ATS Score".\n\nResume: {context}\n\nJob description: {input}`,
  "analyze-jd": `You are an expert ATS (Applicant Tracking System) analyzer and career coach. Analyze how well this candidate's resume matches the job description.

Provide a thorough, actionable analysis. Return a JSON object with exactly these fields:
{
  "matchPercentage": <0-100 overall match score>,
  "overallAssessment": "<2-3 sentence summary of fit>",
  "matchedKeywords": ["<keywords from JD found in resume>"],
  "missingKeywords": ["<important keywords from JD missing in resume>"],
  "missingSkills": ["<technical skills the JD requires but resume lacks>"],
  "missingTools": ["<tools/platforms the JD mentions but resume lacks>"],
  "experienceGap": "<analysis of experience level mismatch, or null if well-matched>",
  "strengths": ["<3-5 specific things the resume does well for this role>"],
  "weaknesses": ["<3-5 specific gaps or weaknesses for this role>"],
  "actionableSuggestions": [
    "<specific, concrete suggestion 1 — e.g. 'Add a project using Docker and Kubernetes to match the DevOps requirements'>",
    "<specific, concrete suggestion 2>",
    "<specific, concrete suggestion 3>"
  ],
  "rewrittenBullets": [
    "<if any existing bullet points could be strengthened for this JD, provide the improved version>"
  ]
}

Rules:
- Score realistically: 40-60 = partial match, 70+ = strong match, 90+ = excellent match
- suggestions must be specific and actionable (not generic advice like 'improve your resume')
- Never fabricate skills or experience the candidate doesn't have
- Consider both hard skills (technical) and soft skills (leadership, communication)
- If the JD mentions specific years of experience, compare against the resume

Resume: {context}

Job description: {input}`,
  "company-variant": `Rewrite this resume content to emphasize qualities relevant to a {input} company culture. Do not add fabricated metrics, experience, or skills.\n\nResume: {context}`,
  "role-variant": `Rewrite this resume content to emphasize skills relevant to a {input} role. Do not add fabricated metrics, experience, or skills.\n\nResume: {context}`,
  "profile-improvement": `You are a career coach. Based on the user's profile and resume data, suggest 4-6 specific, actionable improvements to their resume summary, skills, and achievements. Each suggestion must be applicable and insertable — do not fabricate metrics or experience the user doesn't have. Number each suggestion on its own line.\n\nProfile: {context}\n\nInput: {input}`,
  "github-repo-suggest": `You are a hiring manager who reviews resumes for the target role described in the context. From the candidate's GitHub repositories listed in the input, recommend 3-5 that best showcase relevant skills for that role. For each, provide the repo name (exactly as given) and a one-line reason tied to the target role. Respond ONLY with a JSON array, no markdown, in exactly this shape: [{"name": "repo-name", "reason": "one-line reason"}]. Use the repository names exactly as they appear in the input; never invent repositories.\n\nTarget role: {context}\n\nRepositories (JSON): {input}`,
  "resume-import-upload": `Extract structured resume data from the resume text pasted below. Respond ONLY with a JSON object, no markdown, in exactly this shape:\n{\n  "targetLevel": "student" | "student_internship" | "fresher" | "experienced",\n  "personalInfo": { "fullName": "", "email": "", "phone": "", "linkedin": "", "github": "", "portfolio": "" },\n  "summary": "",\n  "experience": [{"company": "", "role": "", "location": "", "startDate": "", "endDate": "", "current": false, "responsibilities": []}],\n  "education": [{"institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "cgpa": ""}],\n  "skills": { "technical": [], "soft": [], "tools": [], "frameworks": [] },\n  "projects": [{"name": "", "description": "", "technologies": [], "liveUrl": "", "githubUrl": ""}],\n  "certifications": [{"name": "", "issuer": "", "date": ""}],\n  "achievements": [{"title": "", "description": "", "date": ""}],\n  "languages": [{"name": "", "proficiency": ""}]\n}\nRules: Use ONLY information present in the resume text. Never invent companies, roles, dates, metrics, or skills. Skip fields that are not present. "current": true only when the role's end date is the present (e.g. "Present", "Current", no end date). For experience responsibilities, split the job's bullet points into an array of strings.\n\nResume text: {input}`,
  "extract-pdf-text": `Extract all text from this document accurately, preserving the logical reading order, headings, and lists as much as possible. Do not summarize; transcribe the text exactly as it appears.`,
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
    const db = await createServerClient();
    const { data } = await db
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
