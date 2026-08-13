"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  ChevronRight,
  Sparkles,
  Zap,
  History,
  Play,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const defaultPrompts: PromptEntry[] = [
  { key: "generate-summary", label: "Summary Generation", template: "Write a powerful 3-4 sentence professional summary for the candidate described below.\n\nThe summary must quickly communicate:\n1. Who the candidate is and their target role\n2. Their strongest technical capabilities\n3. Relevant experience or project experience\n4. The business or engineering value they deliver\n5. Why they deserve consideration\n\nAdapt emphasis to the candidate's level (prefer the declared experience level in the context, e.g. \"Experience level: Fresher\"; otherwise infer it from years of experience and the other details):\n- Experienced candidates: emphasize years and type of experience, scope of ownership, technical expertise, and measurable business impact.\n- Freshers/students: emphasize relevant education, internships, high-quality projects, technical capabilities, problem-solving ability, practical implementation, and certifications or relevant coursework.\n\nRules:\n- Use ONLY facts provided. Never invent experience, skills, titles, companies, dates, or metrics.\n- Never use generic filler phrases (\"hardworking individual\", \"highly motivated\", \"team player\", \"passionate professional\", \"seeking a challenging opportunity\") unless a specific fact in the input directly supports them.\n- Be specific and concrete — name the target role, key skills, and real outcomes instead of vague praise.\n- Output only the summary, 3-4 sentences, formatted as a single paragraph ready to paste into a resume.\n\nContext: {context}\n\nUser input: {input}", versions: [] },
  { key: "optimize-resume", label: "Resume Optimizer", template: "You are a world-class recruiter, ATS optimization specialist, and expert resume writer with deep knowledge of hiring practices, applicant tracking systems, technical recruiting, and modern resume standards.\n\nYour job is to create or optimize a premium, modern, ATS-friendly, one-page resume that is specifically targeted to the candidate's desired job role.\n\nYour primary objective: maximize the candidate's chances of passing ATS screening and getting shortlisted for interviews while keeping the resume truthful, concise, professional, and human-readable.\n\n## 1. Analyze the Candidate\nCarefully analyze all information provided about the candidate (target role, job description, education, work experience, internships, projects, certifications, technical and soft skills, coursework, achievements, leadership, open-source contributions, tools, awards, extracurriculars). Identify the candidate's strongest evidence of capability and prioritize what is most relevant to the target role.\n- Never invent experience, metrics, technologies, employers, achievements, responsibilities, or qualifications.\n- If measurable results are not provided, improve the wording without fabricating numbers.\n\n## 2. Target the Resume to the Job Role\nAnalyze the target job description and identify: required and preferred skills, technical keywords, tools, languages, frameworks, platforms, industry terminology, domain knowledge, responsibilities, soft skills, relevant certifications, and frequently repeated keywords. Naturally incorporate the most relevant keywords. Prioritize relevance over keyword frequency. Do not keyword-stuff. The final resume must sound like it was written by an experienced professional, not generated for an ATS.\n\n## 3. Resume Structure\nCreate a clean one-page resume using this structure when applicable:\n1. Name and contact information\n2. Professional Summary\n3. Technical Skills\n4. Work Experience / Internships\n5. Projects\n6. Education\n7. Certifications\n8. Relevant Coursework / Achievements — only when valuable\nDo not include unnecessary sections just to fill space. Prioritize the sections that provide the strongest evidence for the target role.\n\n## 4. Professional Summary\nWrite a powerful 3-4 line professional summary that quickly communicates: who the candidate is, target role, strongest technical capabilities, relevant experience or project experience, business or engineering value, and why the candidate deserves consideration.\n- Experienced candidates: emphasize years/type of experience, scope of ownership, technical expertise, and business impact.\n- Freshers: emphasize relevant education, internships, high-quality projects, technical capabilities, problem-solving ability, practical implementation, and certifications or relevant coursework.\n- Never use generic phrases (\"hardworking individual\", \"highly motivated\", \"team player\", \"passionate professional\", \"seeking a challenging opportunity\") unless supported by meaningful evidence.\n\n## 5. Work Experience\nRewrite each experience entry into strong, achievement-focused bullets following: Action + What was done + How it was done + Result/Impact. Use strong action verbs (Built, Developed, Designed, Engineered, Automated, Optimized, Implemented, Improved, Reduced, Increased, Migrated, Integrated, Led, Delivered, Streamlined, Refactored, Deployed, Architected). Avoid weak phrases (responsible for, worked on, helped with, involved in, did, assisted with, learned, participated in). Highlight measurable evidence when provided (performance, cost, revenue, conversions, time saved, error reduction, user growth, scale, response time, test coverage, deployment frequency, automation percentage, users, transactions, scope). Never fabricate metrics. If no metric exists, demonstrate impact through scope, complexity, ownership, technical decisions, or business relevance. Keep each entry's original job title from the resume; never rename roles to match the target role or job description.\n\n## 6. Fresher Mode\nIf the candidate has no full-time professional experience, do not make the resume look weak. Strategically emphasize internships, technical projects, freelance work, open-source contributions, academic projects, certifications, coursework, hackathons, leadership, and relevant achievements. Treat projects as evidence of real-world capability. For each strong project communicate: Problem → Solution → Technology → Implementation → Result (e.g. \"Built [solution] using [technologies] to solve [problem], implementing [important technical functionality] and achieving [measurable or demonstrable result].\"). Do not falsely label academic projects as professional employment.\n\n## 7. Project Optimization\nDo not simply list project features. Rewrite projects to demonstrate technical complexity, engineering decisions, architecture, problem solving, scale, performance, security, testing, deployment, user impact, and business relevance. Prioritize projects directly relevant to the target job. For software engineering roles highlight languages, frameworks, databases, APIs, cloud platforms, authentication, CI/CD, testing, system design, deployment, performance optimization, and version control. Only mention technologies the candidate actually used.\n\n## 8. Skills Section\nCreate a targeted skills section based on the candidate's actual capabilities and the target job description. Group skills logically (e.g. Languages; Frontend; Backend; Databases; Cloud & DevOps; Tools). Only include skills the candidate can reasonably discuss in an interview. Do not add keywords simply because they appear in the job description.\n\n## 9. ATS Optimization\nOptimize for ATS while preserving human readability: standard section headings, simple formatting, conventional job titles, relevant keywords included naturally, industry-standard terminology, no keyword stuffing, no unnecessary graphics, no tables for critical information, no text embedded inside images, no excessive icons or decorative elements, consistent formatting, and clear dates and job titles.\n\n## 10. Achievement Prioritization\nFor every piece of candidate information ask: Is it relevant to the target role? Does it demonstrate competence? Does it differentiate the candidate? Does it provide evidence of impact? Does it contain a valuable ATS keyword? Is it stronger than another piece of information competing for the same space? Remove low-value content when necessary. A one-page resume prioritizes quality and relevance over completeness.\n\n## 11. Truthfulness Rules\nNever invent metrics, employers, responsibilities, technologies, certifications, awards, job titles, project results, or experience; never exaggerate experience; never claim expertise the candidate does not demonstrate. Keep the candidate's actual job titles exactly as they appear in the resume — never adopt the target role's title for the candidate (a \"Senior Frontend Developer\" stays \"Senior Frontend Developer\" even when applying for a \"Senior Full Stack Engineer\" role). The professional summary may name the target role, but must not claim the candidate already holds that title. If information is missing, write the strongest truthful version possible. If a bullet would become significantly stronger with a missing metric, mark it internally as requiring additional information rather than making up a number.\n\n## 12. Resume Writing Style\nUse language that is concise, specific, professional, achievement-oriented, technical where relevant, easy to scan, and confident without exaggeration. Avoid long paragraphs, generic corporate language, repetition, first-person pronouns, unnecessary adjectives, empty claims, buzzword-heavy sentences, and overly complex vocabulary. Every line should earn its space on the page.\n\n## 13. Role-Specific Optimization\nAdjust the resume according to the target role. For example: Software Engineer — prioritize programming, algorithms, APIs, databases, system design, testing, cloud, deployment, performance. Frontend Developer — prioritize React/Angular/Vue, JavaScript/TypeScript, UI development, accessibility, responsive design, performance, state management, testing. Backend Developer — prioritize APIs, databases, distributed systems, authentication, scalability, performance, cloud, testing, backend frameworks. Data Analyst — prioritize SQL, Python, Excel, Power BI/Tableau, data visualization, statistics, data cleaning, business insights. Data Scientist — prioritize Python, SQL, statistics, machine learning, data analysis, feature engineering, model evaluation, ML frameworks. Apply the same principle to other roles: identify what recruiters for that role actually evaluate and prioritize evidence accordingly.\n\n## 14. Final Quality Check\nBefore producing the final resume, perform an internal review:\n- ATS: are important job-description keywords naturally included? Are standard section headings used? Is the resume easy to parse?\n- Recruiter: can the candidate's value be understood within 10 seconds? Is the target role obvious? Are the strongest achievements easy to find?\n- Content: are bullets achievement-focused? Are weak phrases removed? Are technical skills relevant? Are projects described with meaningful technical depth? Are there unnecessary sections?\n- Truthfulness: did you avoid inventing information? Are all claims supported by candidate-provided information?\n- Formatting: is the resume concise enough for one page? Are bullets short and scannable? Is information prioritized correctly?\n\n## 15. Output\nReturn the final resume in a clean, professional, ATS-friendly format. Do not include explanations inside the resume. After the resume, provide a short Resume Optimization Report containing:\n- ATS Match: estimated keyword alignment, important keywords included, important keywords missing.\n- Recruiter Strength: strongest selling points, biggest weaknesses, sections that need more evidence.\n- Recommended Improvements: list the 3-5 highest-impact changes the candidate should make to improve interview chances.\nIf the candidate has missing information that would materially strengthen the resume, explicitly identify what information is needed.\nThe final result should make the candidate look credible, capable, relevant, and interview-worthy without exaggerating their background.\n\nCandidate's resume:\n{context}\n\nTarget role / job description:\n{input}", versions: [] },
  { key: "enhance-bullet", label: "Bullet Enhancer", template: "Improve this resume bullet point using strong action verbs. Add metrics only if explicitly provided by the user. Never fabricate numbers.\n\nOriginal: {input}\n\nContext: {context}", versions: [] },
  { key: "cover-letter", label: "Cover Letter", template: "You are a world-class recruiter, hiring manager, and expert cover letter writer.\n\nYour job is to create a highly targeted, professional cover letter that makes a strong case for why the candidate is a good fit for the specific role and company. The cover letter should feel human, specific, confident, and relevant — never generic, exaggerated, or AI-generated.\n\nPrimary objective: show the recruiter, in a concise and convincing way, why this candidate's background, skills, projects, experience, and motivation make them worth interviewing.\n\n## 1. Analyze the Inputs\nUse all relevant information provided: target job title, company name, job description, resume, education, work experience, internships, projects, technical skills, certifications, achievements, coursework, open-source contributions, career goals, and specific motivation for applying. Prioritize information that directly connects the candidate to the job.\n- Never invent experience, achievements, metrics, technologies, company facts, responsibilities, certifications, job titles, personal connections, or reasons for applying.\n- Describe the candidate using their actual job titles and background from the resume — never present the target job title as the candidate's current title (a \"Senior Frontend Developer\" applying for a \"Senior Full Stack Engineer\" role is still described by their real frontend experience and title).\n- If information is missing, write around it rather than making something up.\n\n## 2. Job Description Analysis\nAnalyze the job description and identify core responsibilities, required and preferred skills, important tools and technologies, industry/domain knowledge, soft skills, problems the company expects the candidate to solve, repeated keywords, and qualities likely to matter to the hiring manager. Connect the candidate's actual experience to those requirements. Do not simply copy the job description — demonstrate fit, not keyword stuffing.\n\n## 3. Opening Paragraph\nImmediately establish: the role being applied for, the candidate's relevant background, and the strongest reason they are a credible candidate. Avoid generic openings like \"I am writing to express my interest in...\". Start with a direct, relevant statement customized to the candidate.\n\n## 4. Value Proposition\nThe main body should answer: Why should this company interview this candidate? Connect the candidate's strongest evidence to the employer's needs using: Candidate capability → Evidence → Relevance to role. Do not merely list skills — explain how the candidate has used them.\n\n## 5. Experience-Based Candidates\nFor candidates with professional experience, emphasize relevant achievements, ownership, technical expertise, business impact, problem solving, scale, leadership, and relevant domain experience. Focus on the most relevant 2-3 examples instead of repeating the entire resume. Do not turn the cover letter into a second resume.\n\n## 6. Fresher Mode\nIf the candidate has no full-time experience, do not apologize for being a fresher. Position the candidate around a strong technical foundation, relevant education, internships, projects, practical implementation, certifications, problem solving, learning ability demonstrated through actual work, and relevant achievements. Present projects as evidence of capability (e.g. \"Through my work on [Project], I developed [technical capability] by [implementation], giving me practical experience relevant to [job responsibility].\"). Never claim academic projects are equivalent to professional employment.\n\n## 7. Company Connection\nWhen company information is provided, explain why the candidate is interested in the company using specific, credible reasons: product, technology, industry, engineering challenges, mission, business model, market, or role responsibilities. Avoid generic statements (\"Your company is a leading organization.\", \"I admire your innovative culture.\", \"I have always dreamed of working for your company.\"). Do not invent personal admiration or knowledge of the company. If no meaningful company information is available, keep the company-specific section concise rather than fabricating a connection.\n\n## 8. Technical Roles\nFor technical positions, naturally mention the most relevant technologies from the candidate's actual background (e.g. React, TypeScript, JavaScript, Node.js, Python, Java, SQL, PostgreSQL, MongoDB, AWS, Docker, REST APIs, Git, CI/CD — only technologies the candidate has actually used). Connect technologies to outcomes rather than creating a keyword list.\n\n## 9. Cover Letter Structure\nUse this structure:\n- Opening: directly establish the candidate's fit for the role.\n- Relevant Evidence: present 1-2 of the candidate's strongest experiences, projects, or achievements.\n- Company/Role Connection: explain why the candidate's capabilities are relevant to the company's needs.\n- Closing: express interest in discussing the opportunity and end professionally.\nKeep the letter concise: target approximately 250-400 words unless the user specifies another length (Tone and Length preferences are provided in the input). Prefer 3-5 short paragraphs.\n\n## 10. Writing Style\nBe professional, clear, specific, confident, natural, concise, human, and role-focused. Avoid generic corporate language, excessive enthusiasm, empty claims, repeating the resume, overusing adjectives, long paragraphs, buzzwords, fake familiarity with the company, first-person repetition, and unnecessary personal stories. Do not repeatedly start sentences with \"I...\" — vary sentence structure naturally.\n\n## 11. Recruiter Perspective\nBefore finalizing, ask: Does the opening make the recruiter want to keep reading? Is the candidate's value obvious? Does the letter clearly connect the candidate to the job? Does it contain concrete evidence? Does it explain why this role/company makes sense? Is anything generic enough that it could be sent to another company unchanged? Does it repeat the resume unnecessarily? Are all claims truthful? Is it concise? Does the closing give the recruiter a reason to consider an interview? If the letter could be sent to 50 companies without changing much, rewrite it.\n\n## 12. ATS and Keyword Alignment\nCover letters may be processed by ATS systems, so naturally incorporate relevant terminology from the job description: job title, core technical skills, relevant tools, industry terminology, and key responsibilities. Do not sacrifice readability for keyword density — the letter should read naturally to a human recruiter.\n\n## 13. Personalization Rules\nIf available, use: hiring manager name, company name, exact job title, specific product/team, job description, the candidate's relevant project or achievement, and reason for interest. If the hiring manager's name is unknown, use \"Dear Hiring Manager,\" — never guess a name. If the company name is unavailable, do not invent one.\n\n## 14. Fresher Cover Letter Strategy\nFor fresh graduates, answer: \"Why should we interview someone who does not yet have full-time experience?\" Build the answer around evidence: relevant technical projects, internships, strong coursework, certifications, open-source contributions, hackathons, practical applications, and problem-solving ability. Never write \"Although I am only a fresher...\" or frame the candidate around what they lack — demonstrate what they can already do.\n\n## 15. Final Output\nGenerate the final cover letter only after analyzing the candidate's profile and job description. Use this format, replacing the bracketed fields with real values from the candidate (and the current date for [Date]):\n\n[Candidate Name]\n[Email] | [Phone] | [LinkedIn] | [Portfolio]\n\n[Date]\n\nDear Hiring Manager,\n\n[Opening paragraph]\n\n[Relevant evidence paragraph]\n\n[Company/role connection paragraph]\n\n[Closing paragraph]\n\nSincerely,\n[Candidate Name]\n\nAfter the cover letter, provide a short Cover Letter Analysis containing:\n- Personalization Score: rate from 1-10.\n- Job Fit: explain the strongest connection between the candidate and the role.\n- Strongest Evidence: identify the 1-2 strongest points used in the letter.\n- Missing Information: list any missing information that would make the letter substantially stronger.\n- Recruiter Risk: identify anything in the candidate's profile that may weaken the application and explain how the application should address it.\n\n## 16. Critical Rule\nThe cover letter must complement the resume, not duplicate it. The resume answers \"What has this candidate done?\" The cover letter answers \"Why does what this candidate has done make them a strong fit for this particular opportunity?\" Make every paragraph contribute to that answer.\n\nCandidate's resume:\n{context}\n\nJob details (company, tone, length preferences, and job description):\n{input}", versions: [] },
  { key: "recruiter-email", label: "Recruiter Email", template: "You are a world-class recruiter, hiring manager, and expert in professional outreach communication.\n\nYour job is to write a concise, highly targeted outreach email that makes a recruiter or hiring manager want to respond — professional, specific, confident, and human. Never generic, exaggerated, or AI-generated.\n\nPrimary objective: in under 200 words, show the recipient why the candidate is worth a conversation for the specific role and company.\n\n## 1. Analyze the Inputs\nUse all relevant information provided: target role, company name, job description, resume, experience, internships, projects, skills, certifications, achievements, and contact details. Prioritize information that directly connects the candidate to the job.\n- Never invent experience, achievements, metrics, technologies, company facts, responsibilities, certifications, job titles, personal connections, or reasons for applying.\n- Describe the candidate using their actual background from the resume — never present the target job title as their current title.\n- If information is missing, write around it rather than making something up.\n\n## 2. Job Description Analysis\nIdentify core responsibilities, required and preferred skills, key tools, industry terminology, and problems the company expects the candidate to solve. Connect the candidate's actual experience to those requirements. Demonstrate fit — do not copy the job description or keyword-stuff.\n\n## 3. Greeting and Personalization\n- If a hiring manager or recruiter name is provided, address them by name. Otherwise use \"Dear Hiring Manager,\" — never guess a name.\n- Reference the company and the exact role being applied for so the email clearly targets this opportunity and could not be sent to another company unchanged.\n\n## 4. Value Proposition\nThe email should answer: Why should this company interview this candidate? Use: Candidate capability → Evidence → Relevance to the role. Do not merely list skills — explain how the candidate has used them and what they achieved. Focus on the 2-3 most relevant strengths instead of repeating the whole resume.\n\n## 5. Experience vs. Fresher Candidates\n- Experienced candidates: emphasize relevant achievements, ownership, technical expertise, business impact, problem solving, and scale.\n- Freshers: position around a strong technical foundation, relevant education, internships, projects, certifications, and problem-solving ability demonstrated through actual work. Never apologize for being a fresher or frame the candidate around what they lack.\n\n## 6. Call to Action\nEnd with a single, specific, low-friction call to action: request a short conversation or a convenient time to discuss the role. Make it easy to say yes. Do not demand anything.\n\n## 7. Sign-off\nClose professionally with the candidate's name and contact details from the resume (email and phone when present).\n\n## 8. Writing Style\nBe professional, clear, specific, confident, concise, and human. Avoid generic corporate language, buzzwords, empty claims, excessive enthusiasm, long sentences, and fake familiarity with the company. Do not repeatedly start sentences with \"I...\" — vary the structure. The email must read like it was written by the candidate, not generated.\n\n## 9. Recruiter Perspective Check\nBefore finalizing, ask: Would a recruiter read this in 15 seconds and know why the candidate fits? Does it contain concrete evidence? Is anything generic enough to be sent to 50 companies unchanged? Are all claims truthful? Is there a clear, easy call to action? If the email could apply to any company, rewrite it.\n\n## 10. Output\nWrite the final email in this format — output ONLY the email, no explanations:\n\nSubject: [Concise subject line naming the role and the candidate's value]\n\nDear [Name or Hiring Manager],\n\n[1-2 sentence opener: who the candidate is and the role/company]\n\n[2-3 sentences connecting the strongest evidence to the role]\n\n[1 sentence call to action]\n\nSincerely,\n[Candidate Name]\n[Email] | [Phone]\n\nKeep the email body under 200 words.\n\nCandidate's resume:\n{context}\n\nJob details (company and job description):\n{input}", versions: [] },
  { key: "linkedin-message", label: "LinkedIn Message", template: "You are a world-class recruiter, hiring manager, and expert in professional networking communication.\n\nYour job is to write a short, high-response LinkedIn message (connection request or InMail) that makes a recruiter or hiring manager want to reply — concise, specific, confident, and human. Never generic, pushy, or AI-generated.\n\nPrimary objective: in 3-4 sentences (under 120 words), introduce the candidate, connect their background to the role, and ask a simple question that invites a reply.\n\n## 1. Analyze the Inputs\nUse only the information provided: target role, company, job description, resume, experience, projects, skills, and certifications.\n- Never invent experience, achievements, metrics, technologies, company facts, personal connections, or reasons for reaching out.\n- If information is missing, write around it rather than making something up.\n\n## 2. Personalization\n- Address the recipient by name only if one is provided. Otherwise open with a polite, generic greeting — never guess a name.\n- Reference the company and the specific role so the message clearly targets this opportunity. Avoid anything that could be sent unchanged to 50 companies.\n\n## 3. Message Structure (3-4 sentences)\n1. Greeting and who the candidate is (name plus a one-line identity).\n2. The role/company being applied for and the single strongest connection between the candidate's background and the role (capability → evidence → relevance).\n3. A brief, specific point tied to the role.\n4. A short, low-friction call to action — a question or a request for a quick conversation.\n\n## 4. Experience vs. Fresher Candidates\n- Experienced candidates: cite their most relevant achievement or scope of work.\n- Freshers: cite a relevant project, internship, or certification as evidence of capability. Never apologize for being a fresher.\n\n## 5. Style and Constraints\n- Professional, warm, and concise. Vary sentence structure — do not start every sentence with \"I...\".\n- No emojis, no links, no attachments, no buzzwords, and no generic phrases (\"I am highly motivated...\", \"I would love to connect and learn from you\").\n- Keep it to 3-4 sentences and under 120 words.\n\n## 6. Recruiter Perspective Check\nWould a recruiter reply to this in under 30 seconds? Is the value obvious? Is the ask easy to say yes to? Are all claims truthful? If it could be sent to any company unchanged, rewrite it.\n\n## 7. Output\nOutput ONLY the message — no explanations, no subject line:\n\nHi [Name or \"there\"],\n\n[3-4 sentences as specified above]\n\n[Candidate Name]\n\nCandidate's resume:\n{context}\n\nJob details (company and job description):\n{input}", versions: [] },
  { key: "interview-questions", label: "Interview Questions", template: "Based on the job description and the candidate's resume below, generate a focused list of likely interview questions the candidate should prepare for. Return 10 questions: 3-4 technical/skill-based tied to the role's requirements, 3 behavioral (STAR-format), 2-3 role-specific scenario questions, and 1-2 questions about the candidate's specific experience from the resume. Number them and group them under headings. Use only the skills and experience present in the resume.\n\nResume: {context}\n\nJob description: {input}", versions: [] },
  { key: "ats-score", label: "ATS Score", template: "Analyze this resume and return a JSON object with overall (0-100), skillsMatch (0-40), formatting (0-30), keywords (0-30), suggestions (array of strings). Label concept as \"Estimated Compatibility Score\" not \"ATS Score\".", versions: [] },
  { key: "analyze-jd", label: "JD Analysis", template: "Compare this resume against the job description. Identify missing keywords, missing skills, and missing tools.", versions: [] },
  { key: "check-grammar", label: "Grammar Check", template: "Fix grammar and spelling in this text. Do not rewrite content or add information.\n\nText: {input}", versions: [] },
  { key: "company-variant", label: "Company Variant", template: "Rewrite this resume content to emphasize qualities relevant to a {input} company culture. Do not add fabricated metrics, experience, or skills.\n\nResume: {context}", versions: [] },
  { key: "role-variant", label: "Role Variant", template: "Rewrite this resume content to emphasize skills relevant to a {input} role. Do not add fabricated metrics, experience, or skills.\n\nResume: {context}", versions: [] },
  { key: "suggest-achievements", label: "Achievement Suggestions", template: "Suggest 2-3 quantifiable achievements based on this experience. Only use metrics the user has provided.\n\nExperience: {input}\n\nContext: {context}", versions: [] },
  { key: "add-keywords", label: "Keyword Suggestions", template: "Identify missing keywords from this job description and suggest which to add to the resume.\n\nResume section: {input}\n\nJob description: {context}", versions: [] },
  { key: "rewrite-section", label: "Section Rewriter", template: "Rewrite this resume section to be more impactful. Use action verbs. Do not add fabricated metrics.\n\nSection: {input}\n\nContext: {context}", versions: [] },
];

interface PromptEntry {
  key: string;
  label: string;
  template: string;
  versions?: { template: string; savedAt: string }[];
}

export default function AdminPromptsPage() {
  const { user, loading: authLoading } = useAuth();
  const [prompts, setPrompts] = useState<PromptEntry[]>(defaultPrompts);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [publishedText, setPublishedText] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setVerifying(false); return; }

    async function verifyAndFetch() {
      try {
        // Verify admin via the stats endpoint (which uses server-side isAdmin)
        const res = await fetch("/api/admin/stats");
        if (!res.ok) { setVerifying(false); return; }
        const json = await res.json();
        if (json.success) {
          setAdminVerified(true);
          // Fetch prompts from API
          const promptsRes = await fetch("/api/admin/prompts");
          const promptsJson = await promptsRes.json();
          if (promptsJson.success && promptsJson.data?.length > 0) {
            setPrompts(promptsJson.data.map((p: Record<string, unknown>) => ({
              key: p.key as string,
              label: p.label as string,
              template: p.template as string,
              versions: [],
            })));
          }
        }
      } catch {} finally {
        setVerifying(false);
      }
    }
    verifyAndFetch();
  }, [user, authLoading]);

  function handleSelect(key: string) {
    const prompt = prompts.find((p) => p.key === key);
    if (!prompt) return;
    setSelectedKey(key);
    setEditText(prompt.template);
    setPublishedText(prompt.template);
    setTestInput("");
    setTestOutput("");
    setMessage("");
    setShowHistory(false);
  }

  function handleSaveDraft() {
    if (!selectedKey) return;
    setPrompts((prev) =>
      prev.map((p) =>
        p.key === selectedKey
          ? { ...p, versions: [...(p.versions || []), { template: p.template, savedAt: new Date().toISOString() }], template: editText }
          : p
      )
    );
    setPublishedText(publishedText);
    setMessage("Draft saved. Changes are not live until you publish.");
    setMessageType("success");
  }

  async function handlePublish() {
    if (!selectedKey) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: selectedKey, template: editText }),
      });
      const json = await res.json();
      if (json.success) {
        setPublishedText(editText);
        setMessage("Prompt published and is now live in the AI service.");
        setMessageType("success");
        setPrompts((prev) =>
          prev.map((p) => p.key === selectedKey ? { ...p, template: editText } : p)
        );
      } else {
        setMessage(json.error || "Failed to publish");
        setMessageType("error");
      }
    } catch {
      setMessage("Something went wrong");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestRun() {
    if (!selectedKey || !testInput) return;
    setTestLoading(true);
    setTestOutput("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: selectedKey,
          input: testInput,
          context: "This is a sandbox test. The prompt above is the draft version.",
        }),
      });
      const json = await res.json();
      setTestOutput(json.output || json.error || "No output generated");
    } catch {
      setTestOutput("Test run failed - API error");
    } finally {
      setTestLoading(false);
    }
  }

  function handleRollback(version: { template: string; savedAt: string }) {
    if (!selectedKey) return;
    setEditText(version.template);
    setMessage(`Rolled back to version from ${new Date(version.savedAt).toLocaleString()}. Save draft to keep.`);
    setMessageType("success");
  }

  if (authLoading || verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-50 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles size={22} className="text-accent-600" />
          </div>
          <Spinner />
        </div>
      </div>
    );
  }

  if (!adminVerified) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex pt-[72px]">
        <ErrorBoundary>
          <AdminSidebar />
        </ErrorBoundary>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-8">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
              <Zap size={28} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-sm text-gray-500 mb-6">You do not have admin access to manage AI prompts.</p>
            <a href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 text-white text-sm font-semibold hover:bg-accent-700 transition-all shadow-lg shadow-accent-500/20">
              Go to Dashboard <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const selectedPrompt = prompts.find((p) => p.key === selectedKey);
  const hasUnsavedChanges = selectedPrompt && editText !== publishedText;

  return (
    <div className="min-h-screen bg-gray-50/50 flex pt-[72px]">
      <ErrorBoundary>
        <AdminSidebar />
      </ErrorBoundary>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-sm">
                <BrainCircuit size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AI Prompt Management</h1>
            </div>
            <p className="text-sm text-gray-500 ml-11">
              View, edit, and test AI system prompts. Draft changes in the sandbox before publishing.
            </p>
          </div>

          {/* Prompt selection grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
            {prompts.map((p) => (
              <button
                key={p.key}
                onClick={() => handleSelect(p.key)}
                className={cn(
                  "text-left bg-white rounded-xl border p-4 transition-all duration-200 hover:shadow-md group",
                  selectedKey === p.key
                    ? "border-accent-400 ring-2 ring-accent-500/15 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-accent-700 transition-colors">{p.label}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{p.template.substring(0, 60)}...</p>
                {p.versions && p.versions.length > 0 && (
                  <span className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <History size={10} />
                    {p.versions.length} saved version{p.versions.length !== 1 ? "s" : ""}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Editor panel */}
          {selectedKey && (
            <div className="space-y-6">
              {/* Prompt editor */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{selectedPrompt?.label}</h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">Key: {selectedKey}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasUnsavedChanges && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle size={10} />
                          Unsaved
                        </span>
                      )}
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
                      >
                        <History size={12} />
                        History ({selectedPrompt?.versions?.length || 0})
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <textarea
                    className="w-full h-48 rounded-xl border border-gray-200 px-4 py-3 text-sm font-mono text-gray-800 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all resize-y leading-relaxed"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />

                  {showHistory && selectedPrompt?.versions && selectedPrompt.versions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-700 mb-3">Version History</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedPrompt.versions.map((v, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-gray-500 block truncate">
                                {new Date(v.savedAt).toLocaleString()} - {v.template.substring(0, 50)}...
                              </span>
                            </div>
                            <button
                              onClick={() => handleRollback(v)}
                              className="text-xs font-medium text-accent-600 hover:text-accent-700 shrink-0 ml-3"
                            >
                              Rollback
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-5">
                    <Button variant="secondary" onClick={handleSaveDraft} className="flex items-center gap-1.5">
                      <Save size={14} />
                      Save Draft
                    </Button>
                    <Button variant="primary" onClick={handlePublish} disabled={saving} className="flex items-center gap-1.5">
                      {saving ? <Spinner /> : hasUnsavedChanges ? <><Send size={14} /> Publish</> : <><CheckCircle2 size={14} /> Published</>}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sandbox Test */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <Play size={14} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Sandbox Test Run</h3>
                      <p className="text-xs text-gray-400">Test the current draft prompt before publishing.</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">Test Input</label>
                    <textarea
                      className="w-full h-24 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/10 transition-all resize-y"
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Enter test input to send to the AI service..."
                    />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleTestRun}
                    disabled={testLoading || !testInput}
                    className="flex items-center gap-1.5"
                  >
                    {testLoading ? <Spinner /> : <><Play size={14} /> Run Test</>}
                  </Button>
                  {testOutput && (
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">Output</h4>
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{testOutput}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={cn(
                  "flex items-center gap-2 px-5 py-4 rounded-xl text-sm border",
                  messageType === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-700"
                )}>
                  {messageType === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
