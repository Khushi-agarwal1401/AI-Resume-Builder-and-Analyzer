
AI Resume Builder
Product Requirements Document
Web + Mobile Application
Critical Feasibility Notice — Read Before Build Planning
LinkedIn Data Import Constraint
LinkedIn does not provide a public API for importing profile experience, education, skills, certificates, posts, or recommendations. This access was shut down to third-party developers in 2015. Only two paths exist:
1. Basic OAuth login (name, email, photo only) — available today, no profile data.
2. LinkedIn Talent Solutions Partner Program — requires a formal partnership application, enterprise-level commercial agreement, and is not guaranteed for a new entrant.
Scraping LinkedIn profile data without authorization violates LinkedIn's Terms of Service and has been the subject of active litigation (e.g., LinkedIn v. hiQ Labs). This document specifies the LinkedIn features exactly as requested by stakeholders, but every feature dependent on deep profile import (Section 5) carries this unresolved legal/technical risk and should not be committed to an engineering timeline until a partnership path is confirmed.


1. App Overview
AI Resume Builder is a web and mobile application that helps job seekers create, optimize, and manage resumes using AI assistance, GitHub integration, LinkedIn-based sign-in, ATS (Applicant Tracking System) scoring, job description matching, and job application tracking.
The product combines resume creation, AI content improvement, technical portfolio import (GitHub), ATS optimization feedback, and job search tracking into a single platform, targeting three distinct user segments simultaneously: students, freshers (recent graduates with 0-2 years experience), and experienced professionals.
Platforms
Web application (primary)
Mobile application (iOS and Android) with a reduced-navigation companion experience
Product Category
Career tools / HR-tech, competing in the AI resume builder space alongside Teal, Kickresume, Rezi, Enhancv, and Jobscan.
2. Target Users
Segment A: Students
Currently enrolled in college/university, no full-time work experience
Primary content sources: coursework, academic projects, personal GitHub projects, internships
Core need: turning limited experience into a credible resume
Segment B: Freshers
0-2 years of post-graduation experience
Primary content sources: first job, internships, personal/open-source projects
Core need: bridging student-level content with entry-level job market expectations
Segment C: Experienced Professionals
2+ years of work experience across one or more employers
Primary content sources: work history, quantifiable achievements, leadership scope
Core need: positioning achievements with metrics, targeting specific companies/roles, career narrative consistency
Note on Segment Prioritization
Serving three segments with materially different content models (no experience vs. some experience vs. extensive experience) with a single engineering team increases design and QA surface area substantially. Each segment requires different default flows, different AI prompt tuning, and different template defaults. This is recorded as a scope decision, not resolved here.

3. Problem Statement
Job seekers across experience levels struggle to produce resumes that are simultaneously well-written, ATS-compatible, and tailored to specific roles and companies. Existing tools address parts of this problem in isolation:
Competitor
Primary Strength
Gap
Jobscan
ATS keyword match scoring
Weak resume authoring/design experience
Teal
Job tracker + resume builder combo
Limited AI content quality; generic templates
Rezi
AI-native bullet point rewriting
Limited technical portfolio (GitHub) integration
Kickresume
Template design quality
Weaker ATS optimization depth
Enhancv
Visual design and storytelling
Less focus on technical/developer profiles


No single incumbent combines GitHub-based technical portfolio import, AI content optimization, ATS scoring, and job-tracking in one workflow. This document specifies a product intended to combine all of these into one platform.
4. Goals & Non-Goals
Goals
Enable users across all experience levels to build a complete, ATS-optimized resume
Provide AI-assisted content generation and rewriting for all resume sections
Integrate GitHub data to auto-populate technical projects and skills
Provide job description matching and keyword gap analysis
Provide job application tracking alongside the resume workflow
Support company-type and role-type tailored resume variants
Non-Goals (for this document's scope)
This document does not resolve the LinkedIn deep-import legal/technical constraint (see Section 1 notice) — it specifies the feature as requested while flagging the dependency
This document does not include a phased release plan, per stakeholder direction — all 22 modules are specified as a single scope
This document does not include engineering time estimates or team allocation
5. Core Features & Full Module Specification
The following 22 modules represent the complete specified scope, covering web and mobile UI structure.
5.1 Landing Page
Logo and primary navigation
Hero section with value proposition
Primary CTAs: Create Resume, Import LinkedIn, Import GitHub
ATS resume showcase (example outputs)
Resume template preview carousel
Features section, success stories/testimonials, pricing summary, footer
5.2 Sign Up Page
Email signup
Google login
LinkedIn connection (OAuth login only — name/email/photo; see Section 1 notice)
GitHub connection (full OAuth with repo read access)
Continue button with progressive account creation
5.3 User Type Selection
Branches into Student or Experienced flow immediately after signup:
Student Path
College name
Degree
Graduation year
Skills
Experienced Path
Current role
Years of experience
Industry
Current company
5.4 Career Goal Page
Desired role
Desired company
Desired industry
Salary range
Work type preference: Remote / Hybrid / Onsite
5.5 LinkedIn Integration Page
Feasibility flag: Import Profile, Import Experience, Import Education, Import Skills, Import Certificates, Import Posts, and Import Recommendations all require LinkedIn data access this product does not currently have. Specified below as requested; see Section 1.

Connect LinkedIn (OAuth)
Import Profile — blocked pending partnership access
Import Experience — blocked pending partnership access
Import Education — blocked pending partnership access
Import Skills — blocked pending partnership access
Import Certificates — blocked pending partnership access
Import Posts — blocked pending partnership access
Import Recommendations — blocked pending partnership access
AI suggestions for profile improvement
Manual add: new certificate, new achievement, new LinkedIn post (user-entered, workaround for the above)
5.6 GitHub Integration Page
Connect GitHub (OAuth, public repo read scope)
Repository list with stars count, fork count, languages used
AI suggestions for which repos to feature
Add project to resume / add open-source contribution / add trending repository
5.7 Resume Dashboard
My Resumes (list/manage multiple resume versions)
ATS score display
Resume views and download counters
Interview prediction indicator
Feasibility flag: "Interview Prediction" requires a trained model on real interview-outcome data, which this product does not have at launch. Without proprietary labeled outcome data (resume → interview/no interview), this metric cannot be a genuine prediction and risks being perceived as fabricated if shipped as-is. Needs a defined data source before build.

Create New Resume entry point
5.8 Resume Builder
Core sections editable by the user:
Personal Information
Name, email, phone, LinkedIn, GitHub, portfolio URL
Summary
AI Generate Summary
Rewrite Summary
ATS Optimize Summary
Experience
Company, role, duration, responsibilities, achievements
Education
College, degree, CGPA, graduation year
Skills
Technical skills, soft skills, tools, frameworks
Projects
Personal projects, GitHub projects, company projects
Certifications
LinkedIn certificates, Coursera, Udemy, AWS, Google
Achievements
Awards, competitions, hackathons
Languages
English, Hindi, other languages
5.9 AI Assistant Panel
Improve bullet points
Add missing keywords
Add metrics
Add action verbs
Remove weak content
Feasibility flag: The example "Built API → Developed REST API serving 50K users" implies the AI invents a specific metric (50K users) not provided by the user. If shipped literally, this generates unverified/false claims on a user's resume — a real resume-fraud and liability risk. The AI must only add metrics the user supplies or explicitly flags as estimated; it must not fabricate numbers.

5.10 ATS Optimization Page
Overall ATS score
Skills score, formatting score, keywords score
Suggestions: add missing skills, improve summary, add metrics, fix formatting
Feasibility flag: Real ATS platforms (Workday, Taleo, Greenhouse) do not publish their scoring logic. Any "ATS score" this product shows is a proprietary heuristic approximation, not a measurement of an actual ATS system. This must be disclosed to users (e.g., "estimated compatibility score") to avoid misleading claims.

5.11 Job Description Analyzer
Input: paste job description text, or job URL
Output: keyword match %, missing keywords, missing skills, missing tools
One-click: add keywords, update resume
5.12 Company-Specific Resume
Startup profile: multi-tasking skills, ownership, fast growth
MNC profile: teamwork, process, communication
FAANG / product company profile: impact metrics, scalability, leadership
AI action: generate company-specific resume variant
Design flag: Fixed company-type templates risk producing formulaic, easily-recognized generic output. Hiring managers who review high volumes of resumes can often identify templated AI content. Recommend the underlying AI prompts vary phrasing meaningfully per user rather than applying a fixed keyword substitution per category.

5.13 Role-Based Resume
Software Engineer: DSA, projects, APIs, system design
Frontend Developer: React, UI/UX, performance
Backend Developer: APIs, databases, architecture
Data Analyst: SQL, Power BI, Excel
Product Manager: roadmaps, metrics, strategy
Marketing: campaigns, ROI, growth
5.14 Resume Templates Page
Categories: ATS Professional, Modern, Minimal, Executive, Student, Creative
Live preview, one-click apply, theme change
5.15 Resume Preview Page
Actions: preview PDF, print, share, download
Export formats: PDF, DOCX, TXT
5.16 Cover Letter Builder
Generate using: resume, job description, company name
Output: ATS-friendly cover letter
5.17 Resume Update Center
Auto-detection from LinkedIn: new job, new certificate, new post — dependent on Section 5.5 access constraint
Auto-detection from GitHub: new project, new contribution, new repository — feasible via GitHub API
Notification prompt: "New project detected. Add to resume?" with Add / Ignore actions
5.18 Job Tracker
Applied jobs list: company, role, date, status
Status states: Applied, Interview, Rejected, Offer
5.19 Analytics Page
ATS score trend over time
Resume views, recruiter views
Interview rate — dependent on resolving the Interview Prediction data-source gap noted in 5.7
5.20 Subscription Page
Free plan: 1 resume, basic ATS
Pro plan: unlimited resumes, LinkedIn sync, GitHub sync, ATS optimization, company-specific resume
Note: 
"LinkedIn sync" as a paid feature should not be sold commercially until the access constraint in Section 1 is resolved, to avoid charging users for a feature that cannot be delivered as described.

5.21 Settings Page
Profile settings, personal details
Integrations: LinkedIn, GitHub
Notifications: resume updates, job alerts
5.22 Admin Panel
User management: users, active users
Resume analytics, ATS reports
Template management: add/edit templates
AI prompt management: resume prompts, ATS prompts
Mobile App Navigation
Bottom menu: Home, Resume, AI Assistant, Jobs, Profile
Floating action button: Create Resume
Recommended Layout (Web)
Left sidebar: Dashboard, Resume Builder, ATS Score, Job Match, Templates, Analytics
Center area: Resume form
Right panel: Live resume preview, AI suggestions, ATS score
6. User Stories
Student
As a student with no work experience, I want to import my GitHub projects so that I have credible content to put on a resume.
As a student, I want the AI to turn my academic project descriptions into resume bullet points so that they sound professional.
Fresher
As a fresher, I want to paste a job description and see which keywords I'm missing so that I can tailor my resume before applying.
As a fresher, I want a resume template built for entry-level roles so that I don't look underqualified or overqualified.
Experienced Professional
As an experienced professional, I want the AI to help me quantify my achievements so that my impact is clear to a hiring manager.
As an experienced professional, I want a company-specific resume variant so that I can tailor my resume differently for a startup versus a large enterprise application.
Cross-Segment
As a user, I want to track which companies I've applied to and their status so that I don't lose track of my job search.
As a user, I want to see an ATS compatibility estimate so that I understand whether my resume format will be read correctly by automated systems.
As a user, I want to generate a cover letter from my resume and a job description so that I don't have to write one from scratch.
7. MVP Scope Statement
Per stakeholder direction, this document specifies full scope (all 22 modules) with no phased MVP and no timeline.
This section records that decision rather than proposing a phased alternative. All modules in Section 5 are considered in-scope for a single release. Engineering teams should be aware that the absence of phasing means sequencing and prioritization will occur informally during implementation rather than being defined here.

8. Success Metrics
Category
Metric
Notes
Activation
% of signups completing a full resume
Core funnel health
Engagement
Resumes created per active user / month


AI Quality
% of AI suggestions accepted vs. rejected
Signal for prompt quality
ATS Feature
% of users who run ATS optimization at least once


Retention
% of users returning within 30 days
Resume tools are naturally low-frequency; watch this closely
Monetization
Free-to-Pro conversion rate


Outcome (self-reported)
% of users reporting an interview via Job Tracker
Not a verified metric — self-reported only

9. Risks, Assumptions & Open Questions
Risks
LinkedIn deep-import features (Section 5.5) may be legally and technically unbuildable without a partnership agreement — highest severity risk in this document
"Interview Prediction" and "ATS Score" features risk misleading users if not clearly disclosed as estimates/heuristics rather than verified measurements
AI-generated metrics (e.g., fabricated user counts in bullet points) create resume-fraud liability if not constrained to user-supplied data
Company-specific resume templates risk producing generic, formulaic output recognizable to experienced hiring managers
Serving three user segments (student/fresher/experienced) with one build increases design, content-model, and QA complexity substantially
Full 22-module scope with no phasing increases the risk of prolonged time-to-market and diffused engineering focus
Assumptions
GitHub OAuth integration is assumed technically and legally feasible as specified
Users will accept an AI-estimated ATS score as directionally useful even though it does not reflect real ATS vendor scoring logic, provided this is disclosed
Open Questions
Has a LinkedIn Talent Solutions partnership application been submitted or considered?
What data source will train or inform the Interview Prediction feature?
What is the actual engineering team size and timeline this scope will be built against?
Has competitive/legal review confirmed no IP conflicts with named competitor products (template designs, scoring methodology naming, etc.)?
10. Subscription & Monetization Model
Plan
Included Features
Free
1 resume, basic ATS score
Pro
Unlimited resumes, GitHub sync, ATS optimization, company-specific resume variants. LinkedIn sync listed as Pro benefit — hold from commercial release until Section 1 constraint is resolved.

11. Non-Functional Requirements
Data privacy: resume content includes PII (name, email, phone, work history) — requires compliant storage and user data deletion capability
Export fidelity: PDF/DOCX exports must preserve ATS-parseable formatting (avoid tables/columns that break parsing in real ATS systems)
GitHub API rate limits must be handled gracefully for users with large numbers of repositories
Admin panel access must be role-restricted and separated from general user authentication


12. Phased Delivery Plan & Engineering Task Breakdown
Note on this section: Section 7 recorded a stakeholder decision to specify full scope with no phasing. This section provides a phased delivery plan as a separate, additional planning artifact for execution purposes. Both are retained in this document — Section 7 reflects the original scope decision; this section reflects the follow-up request to sequence that scope for 3 engineers. If these two directions conflict during planning, the sequencing in this section should govern day-to-day engineering work.


Team composition: 3 full-stack generalist engineers. Task assignment below is by feature-vertical ownership (each engineer owns a slice end-to-end: UI, API, data model) rather than by layer (frontend/backend split), since layer-splitting three generalists creates unnecessary handoff overhead and single points of failure.
Phase 1 — Core Resume Engine (Foundation)
Goal: a user can sign up, build a complete resume manually and with AI help, and export it. No integrations yet, no job-matching yet. This phase must ship before anything else is usable.
Engineer
Owns
Modules Covered
Radheshyam
Auth, onboarding, account structure
2 (Sign Up), 3 (User Type Selection), 4 (Career Goal Page), 21 (Settings — profile only)
Khushi
Resume data model + builder UI
8 (Resume Builder — all sections), 7 (Resume Dashboard — basic, no ATS/prediction yet)
Ankit
AI content + export pipeline
9 (AI Assistant Panel — bullet improvement, keyword add, action verbs; metrics only from user-supplied data per Section 5.9 flag), 14 (Templates), 15 (Preview/Export PDF/DOCX)


Phase 1 exit criteria: a student, fresher, or experienced user can complete signup, fill out every Resume Builder section, get AI bullet-point help, apply a template, and export a working PDF.
Phase 2 — Integrations, ATS, and Targeting
Goal: connect external data sources and add the scoring/matching features that differentiate this product from a plain resume editor.
Engineer
Owns
Modules Covered
Ankit
GitHub integration (fully buildable) + Cover Letter
6 (GitHub Integration Page), 16 (Cover Letter Builder)
Khushi
ATS scoring + Job Description Analyzer
10 (ATS Optimization — build as disclosed estimate, not real ATS measurement per Section 5.10 flag), 11 (Job Description Analyzer)
Radheshyam
LinkedIn OAuth (login only) + Company/Role variants
5 (LinkedIn Integration — OAuth + manual add only; deep import blocked per Section 1), 12 (Company-Specific Resume), 13 (Role-Based Resume)


Dependency block: Engineer 3's LinkedIn deep-import tasks in this phase cannot proceed beyond OAuth login and manual entry unless a LinkedIn partnership agreement is secured before Phase 2 begins. This should be resolved as a business development task in parallel with Phase 1, not left as an engineering blocker discovered mid-Phase 2.


Phase 2 exit criteria: a user can import GitHub projects, generate a cover letter, get an ATS estimate, paste a job description for keyword matching, and generate a company- or role-tailored resume variant.
Phase 3 — Retention, Tracking, and Admin
Goal: features that keep users returning after their first resume is done, plus internal tooling.
Engineer
Owns
Modules Covered
Ankit
Job Tracker + Notifications
18 (Job Tracker), 21 (Settings — notifications), 17 (Resume Update Center — GitHub auto-detection only; LinkedIn auto-detection blocked per Section 1)
Khushi
Analytics + Subscription/Billing
19 (Analytics Page), 20 (Subscription Page) — hold LinkedIn Sync out of paid tier until Section 1 is resolved, per Section 5.20 flag
Radheshyam
Admin Panel
22 (Admin Panel — user management, resume analytics, template management, AI prompt management)


Flag carried forward: "Interview Prediction" (Section 5.7) and "Interview Rate" (Section 5.19) both depend on labeled outcome data this product will not have by Phase 3 unless a data collection mechanism (e.g., self-reported outcomes via Job Tracker) is built early enough to accumulate a usable sample. Recommend treating both as self-reported/estimated, not predictive, until real data volume exists.


Phase 3 exit criteria: users can track job applications end-to-end, view usage analytics, subscribe to a paid plan, and internal staff can manage users/templates/AI prompts through the admin panel.
Cross-Phase Notes
Each engineer carries their vertical across all 3 phases —  Ankit does auth → GitHub/cover letter → job tracker, and so on. This preserves context and avoids re-onboarding to unfamiliar code each phase.
Landing Page (Module 1) is a shared, lightweight task — recommend splitting it across all 3  in Phase 1 as a half-day task each (hero, features/pricing, template showcase), since it has no complex logic and doesn't fit one owner cleanly.
Mobile navigation shell should be built once basic Phase 1 web flows are stable — treat as an Engineer 2 task at the start of Phase 2, reusing the Resume Builder data model.
This 3-phase structure sequences the same full scope from Section 5 — nothing is descoped, only ordered. If the team needs to cut scope to hit a real deadline, Phase 3 (Job Tracker, Analytics, Admin Panel) is the safest place to cut first, since none of it blocks a user from creating and exporting a working resume.

—

