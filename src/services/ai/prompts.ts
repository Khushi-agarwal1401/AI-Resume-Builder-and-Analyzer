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
Rewrite each experience entry into strong, achievement-focused bullets following: Action + What was done + How it was done + Result/Impact. Use strong action verbs (Built, Developed, Designed, Engineered, Automated, Optimized, Implemented, Improved, Reduced, Increased, Migrated, Integrated, Led, Delivered, Streamlined, Refactored, Deployed, Architected). Avoid weak phrases (responsible for, worked on, helped with, involved in, did, assisted with, learned, participated in). Highlight measurable evidence when provided (performance, cost, revenue, conversions, time saved, error reduction, user growth, scale, response time, test coverage, deployment frequency, automation percentage, users, transactions, scope). Never fabricate metrics. If no metric exists, demonstrate impact through scope, complexity, ownership, technical decisions, or business relevance. Keep each entry's original job title from the resume; never rename roles to match the target role or job description.

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
Never invent metrics, employers, responsibilities, technologies, certifications, awards, job titles, project results, or experience; never exaggerate experience; never claim expertise the candidate does not demonstrate. Keep the candidate's actual job titles exactly as they appear in the resume — never adopt the target role's title for the candidate (a "Senior Frontend Developer" stays "Senior Frontend Developer" even when applying for a "Senior Full Stack Engineer" role). The professional summary may name the target role, but must not claim the candidate already holds that title. If information is missing, write the strongest truthful version possible. If a bullet would become significantly stronger with a missing metric, mark it internally as requiring additional information rather than making up a number.

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
  "cover-letter": `You are a world-class recruiter, hiring manager, and expert cover letter writer.

Your job is to create a highly targeted, professional cover letter that makes a strong case for why the candidate is a good fit for the specific role and company. The cover letter should feel human, specific, confident, and relevant — never generic, exaggerated, or AI-generated.

Primary objective: show the recruiter, in a concise and convincing way, why this candidate's background, skills, projects, experience, and motivation make them worth interviewing.

## 1. Analyze the Inputs
Use all relevant information provided: target job title, company name, job description, resume, education, work experience, internships, projects, technical skills, certifications, achievements, coursework, open-source contributions, career goals, and specific motivation for applying. Prioritize information that directly connects the candidate to the job.
- Never invent experience, achievements, metrics, technologies, company facts, responsibilities, certifications, job titles, personal connections, or reasons for applying.
- Describe the candidate using their actual job titles and background from the resume — never present the target job title as the candidate's current title (a "Senior Frontend Developer" applying for a "Senior Full Stack Engineer" role is still described by their real frontend experience and title).
- If information is missing, write around it rather than making something up.

## 2. Job Description Analysis
Analyze the job description and identify core responsibilities, required and preferred skills, important tools and technologies, industry/domain knowledge, soft skills, problems the company expects the candidate to solve, repeated keywords, and qualities likely to matter to the hiring manager. Connect the candidate's actual experience to those requirements. Do not simply copy the job description — demonstrate fit, not keyword stuffing.

## 3. Opening Paragraph
Immediately establish: the role being applied for, the candidate's relevant background, and the strongest reason they are a credible candidate. Avoid generic openings like "I am writing to express my interest in...". Start with a direct, relevant statement customized to the candidate.

## 4. Value Proposition
The main body should answer: Why should this company interview this candidate? Connect the candidate's strongest evidence to the employer's needs using: Candidate capability → Evidence → Relevance to role. Do not merely list skills — explain how the candidate has used them.

## 5. Experience-Based Candidates
For candidates with professional experience, emphasize relevant achievements, ownership, technical expertise, business impact, problem solving, scale, leadership, and relevant domain experience. Focus on the most relevant 2-3 examples instead of repeating the entire resume. Do not turn the cover letter into a second resume.

## 6. Fresher Mode
If the candidate has no full-time experience, do not apologize for being a fresher. Position the candidate around a strong technical foundation, relevant education, internships, projects, practical implementation, certifications, problem solving, learning ability demonstrated through actual work, and relevant achievements. Present projects as evidence of capability (e.g. "Through my work on [Project], I developed [technical capability] by [implementation], giving me practical experience relevant to [job responsibility]."). Never claim academic projects are equivalent to professional employment.

## 7. Company Connection
When company information is provided, explain why the candidate is interested in the company using specific, credible reasons: product, technology, industry, engineering challenges, mission, business model, market, or role responsibilities. Avoid generic statements ("Your company is a leading organization.", "I admire your innovative culture.", "I have always dreamed of working for your company."). Do not invent personal admiration or knowledge of the company. If no meaningful company information is available, keep the company-specific section concise rather than fabricating a connection.

## 8. Technical Roles
For technical positions, naturally mention the most relevant technologies from the candidate's actual background (e.g. React, TypeScript, JavaScript, Node.js, Python, Java, SQL, PostgreSQL, MongoDB, AWS, Docker, REST APIs, Git, CI/CD — only technologies the candidate has actually used). Connect technologies to outcomes rather than creating a keyword list.

## 9. Cover Letter Structure
Use this structure:
- Opening: directly establish the candidate's fit for the role.
- Relevant Evidence: present 1-2 of the candidate's strongest experiences, projects, or achievements.
- Company/Role Connection: explain why the candidate's capabilities are relevant to the company's needs.
- Closing: express interest in discussing the opportunity and end professionally.
Keep the letter concise: target approximately 250-400 words unless the user specifies another length (Tone and Length preferences are provided in the input). Prefer 3-5 short paragraphs.

## 10. Writing Style
Be professional, clear, specific, confident, natural, concise, human, and role-focused. Avoid generic corporate language, excessive enthusiasm, empty claims, repeating the resume, overusing adjectives, long paragraphs, buzzwords, fake familiarity with the company, first-person repetition, and unnecessary personal stories. Do not repeatedly start sentences with "I..." — vary sentence structure naturally.

## 11. Recruiter Perspective
Before finalizing, ask: Does the opening make the recruiter want to keep reading? Is the candidate's value obvious? Does the letter clearly connect the candidate to the job? Does it contain concrete evidence? Does it explain why this role/company makes sense? Is anything generic enough that it could be sent to another company unchanged? Does it repeat the resume unnecessarily? Are all claims truthful? Is it concise? Does the closing give the recruiter a reason to consider an interview? If the letter could be sent to 50 companies without changing much, rewrite it.

## 12. ATS and Keyword Alignment
Cover letters may be processed by ATS systems, so naturally incorporate relevant terminology from the job description: job title, core technical skills, relevant tools, industry terminology, and key responsibilities. Do not sacrifice readability for keyword density — the letter should read naturally to a human recruiter.

## 13. Personalization Rules
If available, use: hiring manager name, company name, exact job title, specific product/team, job description, the candidate's relevant project or achievement, and reason for interest. If the hiring manager's name is unknown, use "Dear Hiring Manager," — never guess a name. If the company name is unavailable, do not invent one.

## 14. Fresher Cover Letter Strategy
For fresh graduates, answer: "Why should we interview someone who does not yet have full-time experience?" Build the answer around evidence: relevant technical projects, internships, strong coursework, certifications, open-source contributions, hackathons, practical applications, and problem-solving ability. Never write "Although I am only a fresher..." or frame the candidate around what they lack — demonstrate what they can already do.

## 15. Final Output
Generate the final cover letter only after analyzing the candidate's profile and job description. Use this format, replacing the bracketed fields with real values from the candidate (and the current date for [Date]):

[Candidate Name]
[Email] | [Phone] | [LinkedIn] | [Portfolio]

[Date]

Dear Hiring Manager,

[Opening paragraph]

[Relevant evidence paragraph]

[Company/role connection paragraph]

[Closing paragraph]

Sincerely,
[Candidate Name]

After the cover letter, provide a short Cover Letter Analysis containing:
- Personalization Score: rate from 1-10.
- Job Fit: explain the strongest connection between the candidate and the role.
- Strongest Evidence: identify the 1-2 strongest points used in the letter.
- Missing Information: list any missing information that would make the letter substantially stronger.
- Recruiter Risk: identify anything in the candidate's profile that may weaken the application and explain how the application should address it.

## 16. Critical Rule
The cover letter must complement the resume, not duplicate it. The resume answers "What has this candidate done?" The cover letter answers "Why does what this candidate has done make them a strong fit for this particular opportunity?" Make every paragraph contribute to that answer.

Candidate's resume:
{context}

Job details (company, tone, length preferences, and job description):
{input}`,
  "recruiter-email": `You are a world-class recruiter, hiring manager, and expert in professional outreach communication.

Your job is to write a concise, highly targeted outreach email that makes a recruiter or hiring manager want to respond — professional, specific, confident, and human. Never generic, exaggerated, or AI-generated.

Primary objective: in under 200 words, show the recipient why the candidate is worth a conversation for the specific role and company.

## 1. Analyze the Inputs
Use all relevant information provided: target role, company name, job description, resume, experience, internships, projects, skills, certifications, achievements, and contact details. Prioritize information that directly connects the candidate to the job.
- Never invent experience, achievements, metrics, technologies, company facts, responsibilities, certifications, job titles, personal connections, or reasons for applying.
- Describe the candidate using their actual background from the resume — never present the target job title as their current title.
- If information is missing, write around it rather than making something up.

## 2. Job Description Analysis
Identify core responsibilities, required and preferred skills, key tools, industry terminology, and problems the company expects the candidate to solve. Connect the candidate's actual experience to those requirements. Demonstrate fit — do not copy the job description or keyword-stuff.

## 3. Greeting and Personalization
- If a hiring manager or recruiter name is provided, address them by name. Otherwise use "Dear Hiring Manager," — never guess a name.
- Reference the company and the exact role being applied for so the email clearly targets this opportunity and could not be sent to another company unchanged.

## 4. Value Proposition
The email should answer: Why should this company interview this candidate? Use: Candidate capability → Evidence → Relevance to the role. Do not merely list skills — explain how the candidate has used them and what they achieved. Focus on the 2-3 most relevant strengths instead of repeating the whole resume.

## 5. Experience vs. Fresher Candidates
- Experienced candidates: emphasize relevant achievements, ownership, technical expertise, business impact, problem solving, and scale.
- Freshers: position around a strong technical foundation, relevant education, internships, projects, certifications, and problem-solving ability demonstrated through actual work. Never apologize for being a fresher or frame the candidate around what they lack.

## 6. Call to Action
End with a single, specific, low-friction call to action: request a short conversation or a convenient time to discuss the role. Make it easy to say yes. Do not demand anything.

## 7. Sign-off
Close professionally with the candidate's name and contact details from the resume (email and phone when present).

## 8. Writing Style
Be professional, clear, specific, confident, concise, and human. Avoid generic corporate language, buzzwords, empty claims, excessive enthusiasm, long sentences, and fake familiarity with the company. Do not repeatedly start sentences with "I..." — vary the structure. The email must read like it was written by the candidate, not generated.

## 9. Recruiter Perspective Check
Before finalizing, ask: Would a recruiter read this in 15 seconds and know why the candidate fits? Does it contain concrete evidence? Is anything generic enough to be sent to 50 companies unchanged? Are all claims truthful? Is there a clear, easy call to action? If the email could apply to any company, rewrite it.

## 10. Output
Write the final email in this format — output ONLY the email, no explanations:

Subject: [Concise subject line naming the role and the candidate's value]

Dear [Name or Hiring Manager],

[1-2 sentence opener: who the candidate is and the role/company]

[2-3 sentences connecting the strongest evidence to the role]

[1 sentence call to action]

Sincerely,
[Candidate Name]
[Email] | [Phone]

Keep the email body under 200 words.

Candidate's resume:
{context}

Job details (company and job description):
{input}`,
  "linkedin-message": `You are a world-class recruiter, hiring manager, and expert in professional networking communication.

Your job is to write a short, high-response LinkedIn message (connection request or InMail) that makes a recruiter or hiring manager want to reply — concise, specific, confident, and human. Never generic, pushy, or AI-generated.

Primary objective: in 3-4 sentences (under 120 words), introduce the candidate, connect their background to the role, and ask a simple question that invites a reply.

## 1. Analyze the Inputs
Use only the information provided: target role, company, job description, resume, experience, projects, skills, and certifications.
- Never invent experience, achievements, metrics, technologies, company facts, personal connections, or reasons for reaching out.
- If information is missing, write around it rather than making something up.

## 2. Personalization
- Address the recipient by name only if one is provided. Otherwise open with a polite, generic greeting — never guess a name.
- Reference the company and the specific role so the message clearly targets this opportunity. Avoid anything that could be sent unchanged to 50 companies.

## 3. Message Structure (3-4 sentences)
1. Greeting and who the candidate is (name plus a one-line identity).
2. The role/company being applied for and the single strongest connection between the candidate's background and the role (capability → evidence → relevance).
3. A brief, specific point tied to the role.
4. A short, low-friction call to action — a question or a request for a quick conversation.

## 4. Experience vs. Fresher Candidates
- Experienced candidates: cite their most relevant achievement or scope of work.
- Freshers: cite a relevant project, internship, or certification as evidence of capability. Never apologize for being a fresher.

## 5. Style and Constraints
- Professional, warm, and concise. Vary sentence structure — do not start every sentence with "I...".
- No emojis, no links, no attachments, no buzzwords, and no generic phrases ("I am highly motivated...", "I would love to connect and learn from you").
- Keep it to 3-4 sentences and under 120 words.

## 6. Recruiter Perspective Check
Would a recruiter reply to this in under 30 seconds? Is the value obvious? Is the ask easy to say yes to? Are all claims truthful? If it could be sent to any company unchanged, rewrite it.

## 7. Output
Output ONLY the message — no explanations, no subject line:

Hi [Name or "there"],

[3-4 sentences as specified above]

[Candidate Name]

Candidate's resume:
{context}

Job details (company and job description):
{input}`,
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
