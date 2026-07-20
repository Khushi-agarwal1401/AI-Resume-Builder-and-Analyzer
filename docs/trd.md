
AI Resume Builder
Technical Requirements Document
1. Architecture Overview
This system is specified as a monolith-first architecture: one backend service, one database, one frontend web app, and one mobile app sharing the same API. This is a direct consequence of the team constraint (3 full-stack generalists) established in the PRD — a microservices architecture would require dedicated infrastructure ownership this team does not have, and would slow down a 3-person team rather than speed it up.
Architecture principle: Every architecture decision below is made against the constraint of 3 full-stack generalist engineers and no dedicated DevOps/SRE role. Where a "more correct" enterprise pattern exists but requires operational overhead this team can't sustain, the simpler option is chosen and the tradeoff is stated explicitly, not hidden.


High-Level Diagram (described)
Web app (React) and Mobile app (React Native) both call the same REST API
Single backend service (Node.js/Express) handles auth, resume data, AI orchestration, and integration calls (GitHub API, Gemini API)
Single primary database (PostgreSQL) for structured data (users, resumes, job tracker entries)
Object storage (S3-compatible) for exported PDF/DOCX files
Background job queue for async tasks: GitHub repo polling, resume export generation, AI batch suggestions
2. Frontend Stack
Layer
Choice
Reason
Web framework
React (Next.js)
Large hiring pool, works for 3 generalists without a steep learning curve; Next.js gives server-side rendering for the Landing Page (SEO matters for organic signups) without a separate SSR setup
Mobile
React Native
Shares component logic and business logic with the web React codebase — critical for a 3-person team that cannot maintain 2 separate native codebases (Swift + Kotlin) in parallel
Styling
Tailwind CSS
Fast to build with, no separate design system to maintain, consistent across web and mobile via NativeWind
State management
React Query + lightweight global store (Zustand)
Resume Builder is form-heavy with frequent server sync (autosave) — React Query handles server-state caching; avoids Redux boilerplate a 3-person team doesn't have time to maintain
PDF/DOCX rendering (client preview)
react-pdf for preview; server-side generation for final export
Live preview needs to be fast and client-side; final export must be pixel-consistent across formats, which is safer done once on the server

3. Backend Stack
Layer
Choice
Reason
Runtime/Framework
Node.js + Express (or Fastify)
Same language as frontend (JavaScript/TypeScript) — a 3-person full-stack team should not context-switch between languages; reduces the total surface area of skills needed
Language
TypeScript (both frontend and backend)
Shared types between frontend and backend catch data-shape bugs at compile time — important given the Resume Builder has ~10 nested data sections (experience, education, skills, projects, etc.) that must stay consistent
API style
REST (not GraphQL)
REST is simpler to reason about, document, and debug for a small team; GraphQL's benefits (flexible querying) matter more at larger scale with many client teams, which this isn't
Background jobs
BullMQ (Redis-backed queue)
Needed for: async PDF generation, GitHub webhook polling, AI request queuing (to control Gemini API cost/rate limits)
File generation (PDF/DOCX)
Server-side, using the same docx/PDF libraries approach as this document's own generation pipeline
Keeps exports consistent and testable outside the client

4. Database
Component
Choice
Reason
Primary database
PostgreSQL
Resume data is relational (user → resumes → experience/education/skills/projects, each with clear foreign keys) — a relational database fits this better than a document store; strong ecosystem support, free-tier friendly on most hosts
Resume content storage
Structured tables, not one big JSON blob
Storing each resume section as normalized rows (not a single JSON column) lets the AI Assistant Panel and ATS scoring operate on individual fields directly, and makes future analytics (Section 19 of PRD) straightforward
File storage
S3-compatible object storage (e.g., Cloudflare R2 or AWS S3)
Exported PDF/DOCX/TXT files don't belong in the relational database — object storage is cheaper and standard practice
Caching/Queue
Redis
Backs the BullMQ job queue and caches expensive computations (e.g., ATS score recalculation) so they aren't rerun on every page load

5. Authentication & Authorization
Component
Choice
Reason
Primary auth
Email/password + Google OAuth
Matches PRD Section 2 (Sign Up Page) requirement directly
LinkedIn auth
OAuth login only (name/email/photo)
This is the maximum LinkedIn access legally available without a Talent Solutions partnership — see PRD Section 1 constraint. Do not build anything expecting profile data from this login.
GitHub auth
OAuth with public repo read scope
Required for PRD Section 6 (GitHub Integration) — fully feasible, standard GitHub OAuth app
Session handling
JWT access token (short-lived) + refresh token (httpOnly cookie)
Standard, secure pattern; avoids storing long-lived tokens in browser localStorage where they're vulnerable to XSS
Authorization model
Role-based: user vs. admin
Only two roles needed per PRD scope (Section 22 Admin Panel is the only elevated-privilege surface) — no need for a complex permissions system

6. Third-Party APIs & Integrations
GitHub API
Use GitHub REST API v3 (or GraphQL v4 for efficient repo+language+stats fetching in one call)
Scopes needed: read:user, public_repo (read-only)
Rate limits: 5,000 requests/hour per authenticated user — sufficient for this use case, but cache repo data (don't refetch on every dashboard load)
LinkedIn API
Constraint carried from PRD Section 1: Only "Sign In with LinkedIn" (OpenID Connect) is available without a partnership deal. This returns name, email, and profile photo only — no experience, education, skills, certificates, posts, or recommendations. Do not scope engineering time toward a deeper integration until a LinkedIn Talent Solutions partnership is confirmed by the business side.


Job Description Analyzer (PRD Section 11)
Input: raw pasted text, or a URL — if URL, fetch and extract text server-side (a simple HTML-to-text extraction; do not attempt to scrape job boards that explicitly disallow it in their terms of service)
Keyword extraction can run through the same Gemini API call as other AI features — no separate NLP service needed at this scale
7. AI Layer — Model Provider Decision
Decision: Google Gemini API (per stakeholder direction)
Justification beyond the direct instruction: Gemini's API pricing is materially lower per-token than GPT-4-class or Claude-class models at the Flash tier, which matters for a bootstrapped 3-engineer product where every AI Assistant Panel suggestion, ATS score calculation, and cover letter generation is a paid API call. For short, structured tasks like bullet-point rewriting and keyword extraction, a smaller/cheaper model tier is usually sufficient — this doesn't need the most capable model available, it needs the most cost-efficient one that reliably follows formatting instructions.


AI Feature to Model-Call Mapping
PRD Feature
AI Task
Design Constraint
9. AI Assistant Panel
Bullet rewriting, action verbs, keyword insertion
Must only insert metrics/numbers the user explicitly supplied. The prompt must instruct the model not to invent statistics (e.g., user counts, percentages) — this is a direct fix for the fabrication risk flagged in PRD Section 5.9
10. ATS Optimization
Scoring against a rubric (keywords, formatting, structure)
This is a heuristic score, not a real ATS vendor score. The API response and UI copy must say "estimated compatibility score," not "ATS score," per PRD Section 5.10 flag
11. Job Description Analyzer
Keyword/skill extraction and gap comparison
Deterministic-leaning task; validate model output against a simple keyword-matching fallback so results are reproducible, not purely generative
16. Cover Letter Builder
Draft generation from resume + job description
Lower risk — no fabricated-metric concern since it's prose, but should still avoid inventing specific claims not present in the resume


All AI calls should go through a single internal AI service module (not scattered across the codebase) so the model provider can be swapped later without touching every feature
Log AI inputs/outputs (with PII handling per Section 9) to allow debugging of bad suggestions and to build the dataset needed for the Interview Prediction feature flagged as unbuildable in PRD Section 5.7 — this is the realistic path to eventually making that feature real

8. Deployment Plan
Cloud provider: no strong preference given, so this is chosen for lowest operational overhead for a 3-person team, not for enterprise scale the product doesn't have yet.
Component
Choice
Reason
Frontend hosting
Vercel
Zero-config Next.js deployment, free tier covers early-stage traffic, no server management needed
Backend hosting
Railway or Render
Both offer simple container deployment without needing a dedicated DevOps engineer to manage Kubernetes or raw EC2 — appropriate for 3 generalists
Database hosting
Managed Postgres (Railway/Render/Supabase)
Managed backups and scaling without someone on the team owning database administration full-time
File storage
Cloudflare R2
S3-compatible API, no egress fees (unlike AWS S3), meaningfully cheaper for a product that generates and serves many PDF exports
Mobile app distribution
Expo (for React Native) + standard App Store/Play Store pipelines
Expo simplifies build/release for a small team without native mobile specialists
CI/CD
GitHub Actions
Free for reasonable usage, integrates directly with the repo, no separate CI tool to maintain


Explicit tradeoff: 
This stack (Vercel + Railway/Render + managed Postgres) is chosen for speed of setup and low maintenance burden, not for cost-at-scale. If the product reaches meaningful paid-user volume, expect to revisit backend hosting (likely toward AWS/GCP direct compute) for cost control. This is a reasonable and common first-stage choice, not a permanent architecture.

9. Security Requirements
All resume data includes PII (name, email, phone, work history, education) — encrypt at rest (standard with managed Postgres providers) and in transit (TLS everywhere, no exceptions)
Passwords: bcrypt or argon2 hashing, never stored in plaintext, never logged
OAuth tokens (Google, LinkedIn, GitHub): store encrypted, never expose to the frontend directly
Rate-limit all AI endpoints server-side to prevent cost-abuse (a malicious or buggy client hammering the AI Assistant Panel could generate a large, unexpected Gemini API bill)
Admin Panel (PRD Section 22) must be on a separate authenticated route with role verification server-side on every request — never trust a frontend-only role check
Users must be able to export and delete their own data (GDPR/data-portability best practice, and directly relevant since this product stores full resumes and job application history)
Sanitize any user-pasted job description text before rendering or storing, to prevent stored XSS in the Job Description Analyzer
Do not log full AI prompts/responses containing PII in plaintext in any third-party logging service without a data processing agreement in place

10. Technical Decisions Log
Decision
Reason
Tradeoff Accepted
Monolith over microservices
3-person team can't operate distributed services
Harder to scale individual components independently later — acceptable at this stage
REST over GraphQL
Simpler for small team to build/debug/document
Slightly less flexible querying for complex nested resume data — mitigated by well-designed REST endpoints per resource
PostgreSQL over MongoDB
Resume data is inherently relational
Slightly more upfront schema design work — pays off in data integrity and easier analytics later
React Native over separate native apps
1 codebase instead of 2, matches 3-generalist team
Some native performance/feature ceilings — acceptable for a forms-and-documents app, not a graphics-heavy app
Gemini API over Claude/OpenAI
Lower per-token cost at comparable quality for structured, short-form tasks
May need re-evaluation if output quality on nuanced rewriting proves insufficient — architecture keeps AI calls isolated in one module specifically so this can change later
Vercel + Railway/Render over raw AWS/GCP
No dedicated DevOps role on the team
Higher relative cost per unit of scale later; deliberately deferred until the product has paying users to justify the migration effort
ATS score labeled as "estimated"
Real ATS vendor scoring logic is not public and cannot be replicated honestly
Slightly less marketable copy than competitors who use "ATS Score" unqualified — accepted in exchange for not misleading users


11. Known Technical Risks Carried from the PRD
These risks were identified at the PRD stage and remain unresolved at the architecture stage. This document does not solve them — it notes where the architecture must accommodate them once resolved.


LinkedIn deep-import: architecture assumes OAuth-login-only. If a partnership is secured later, expect a new integration module and possibly new data model tables (posts, recommendations) not currently scoped.
Interview Prediction: not built in this architecture. The AI logging approach in Section 7 is a first step toward eventually having real data, but no prediction model exists yet — do not represent this as functional until real outcome data has been collected and validated.
AI-fabricated metrics: mitigated via prompt design (Section 7), but prompt-level constraints are not a hard guarantee — recommend a lightweight validation pass that flags AI-inserted numbers not traceable to user input, for human review before export.
ATS score disclosure: the UI/UX team must ensure the frontend copy matches the "estimated score" framing decided here — a backend disclaimer with misleading frontend marketing copy defeats the purpose.

— End of Document —
