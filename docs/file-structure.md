# Project File Structure — AI Resume Builder

```
ai-resume-builder/
├── .env.local                          # Env vars (Supabase URL, Gemini key, OAuth keys)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
│
├── public/
│   ├── logo.svg
│   └── templates/                      # Template thumbnail images
│
└── src/
    ├── app/                            # Next.js App Router
    │   ├── layout.tsx                  # Root layout (Navbar, Footer, Providers)
    │   ├── page.tsx                    # Landing Page
    │   │
    │   ├── (auth)/                     # Auth route group
    │   │   ├── sign-up/page.tsx
    │   │   ├── login/page.tsx
    │   │   └── callback/
    │   │       └── route.ts            # OAuth callbacks (Google, GitHub, LinkedIn)
    │   │
    │   ├── dashboard/
    │   │   └── page.tsx                # My Resumes dashboard
    │   │
    │   ├── builder/
    │   │   └── [resumeId]/
    │   │       └── page.tsx            # Resume Builder page
    │   │
    │   ├── preview/
    │   │   └── [resumeId]/
    │   │       └── page.tsx            # Resume Preview & Export page
    │   │
    │   ├── templates/
    │   │   └── page.tsx                # Resume Templates gallery
    │   │
    │   └── api/                        # All API routes
    │       ├── auth/
    │       │   └── route.ts            # Auth endpoints
    │       │
    │       ├── resumes/
    │       │   ├── route.ts            # CRUD: list / create resumes
    │       │   └── [id]/
    │       │       └── route.ts        # CRUD: get / update / delete single resume
    │       │
    │       ├── sections/
    │       │   └── [resumeId]/
    │       │       └── route.ts        # CRUD for individual sections
    │       │
    │       ├── ai/
    │       │   ├── summarize/route.ts
    │       │   ├── enhance-bullet/route.ts
    │       │   ├── grammar/route.ts
    │       │   └── suggest-achievements/route.ts
    │       │
    │       ├── export/
    │       │   └── [resumeId]/
    │       │       └── route.ts        # Trigger server-side export job
    │       │
    │       ├── github/
    │       │   ├── connect/route.ts    # GitHub OAuth
    │       │   └── repos/route.ts      # Fetch user repos
    │       │
    │       └── linkedin/
    │           └── connect/route.ts    # LinkedIn OAuth (login only)
    │
    ├── components/                     # Shared UI components
    │   ├── ui/                         # Base UI primitives
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Spinner.tsx
    │   │   └── Tooltip.tsx
    │   │
    │   ├── layout/
    │   │   ├── Navbar.tsx
    │   │   ├── Footer.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── DashboardLayout.tsx
    │   │
    │   ├── landing/
    │   │   ├── HeroSection.tsx
    │   │   ├── FeaturesSection.tsx
    │   │   ├── TemplateShowcase.tsx
    │   │   ├── PricingSection.tsx
    │   │   └── Testimonials.tsx
    │   │
    │   └── resume/                     # Resume-specific components
    │       ├── ResumeCard.tsx          # Dashboard card
    │       └── ResumeShareDialog.tsx
    │
    ├── features/                       # Feature modules (each engineer owns their slice)
    │   │
    │   ├── auth/                       # Radheshyam — Auth & User Management
    │   │   ├── components/
    │   │   │   ├── SignUpForm.tsx
    │   │   │   ├── LoginForm.tsx
    │   │   │   ├── OAuthButtons.tsx
    │   │   │   └── UserTypeSelector.tsx
    │   │   ├── api/
    │   │   │   └── auth.ts            # Auth API client calls
    │   │   └── hooks/
    │   │       └── useAuth.ts
    │   │
    │   ├── resume-builder/             # Khushi — Resume Builder & Templates (UI focus)
    │   │   ├── components/
    │   │   │   ├── BuilderForm.tsx     # Main form container
    │   │   │   ├── sections/
    │   │   │   │   ├── PersonalInfoSection.tsx
    │   │   │   │   ├── EducationSection.tsx
    │   │   │   │   ├── ExperienceSection.tsx
    │   │   │   │   ├── ProjectSection.tsx
    │   │   │   │   ├── SkillsSection.tsx
    │   │   │   │   ├── CertificationSection.tsx
    │   │   │   │   ├── AchievementSection.tsx
    │   │   │   │   └── LanguageSection.tsx
    │   │   │   ├── SectionHeader.tsx   # Reorder / edit / delete controls
    │   │   │   └── SectionList.tsx     # Drag-and-drop section list
    │   │   ├── templates/
    │   │   │   ├── TemplateRenderer.tsx # Picks template by type
    │   │   │   ├── AtsProfessional.tsx
    │   │   │   ├── Modern.tsx
    │   │   │   ├── Student.tsx
    │   │   │   └── Minimal.tsx
    │   │   └── hooks/
    │   │       ├── useResumeForm.ts
    │   │       └── useSectionReorder.ts
    │   │
    │   ├── ai-assistant/               # Ankit — AI Features & Export
    │   │   ├── components/
    │   │   │   ├── AiAssistantPanel.tsx
    │   │   │   ├── SummaryGenerator.tsx
    │   │   │   ├── BulletEnhancer.tsx
    │   │   │   ├── GrammarChecker.tsx
    │   │   │   └── AchievementSuggestor.tsx
    │   │   ├── api/
    │   │   │   └── ai.ts              # AI API client calls
    │   │   └── hooks/
    │   │       └── useAiAssistant.ts
    │   │
    │   ├── export/                     # Ankit — Export
    │   │   ├── components/
    │   │   │   ├── ExportButton.tsx
    │   │   │   └── FormatPicker.tsx
    │   │   └── utils/
    │   │       └── pdfGenerator.ts
    │   │
    │   ├── ats/                        # Phase 2 — ATS & JD Matching
    │   │   ├── components/
    │   │   │   ├── AtsScoreCard.tsx
    │   │   │   ├── AtsBreakdown.tsx
    │   │   │   ├── JdInput.tsx
    │   │   │   └── KeywordGapList.tsx
    │   │   └── hooks/
    │   │       └── useAtsScore.ts
    │   │
    │   ├── github/                     # Phase 2 — GitHub Integration
    │   │   ├── components/
    │   │   │   ├── GithubConnect.tsx
    │   │   │   ├── RepoList.tsx
    │   │   │   └── RepoCard.tsx
    │   │   └── hooks/
    │   │       └── useGithub.ts
    │   │
    │   ├── job-tracker/                # Phase 3
    │   │   ├── components/
    │   │   │   ├── JobList.tsx
    │   │   │   ├── JobForm.tsx
    │   │   │   └── StatusBadge.tsx
    │   │   └── hooks/
    │   │       └── useJobTracker.ts
    │   │
    │   ├── analytics/                  # Phase 3
    │   │   ├── components/
    │   │   │   ├── AtsTrendChart.tsx
    │   │   │   └── StatsCard.tsx
    │   │   └── hooks/
    │   │       └── useAnalytics.ts
    │   │
    │   ├── subscription/               # Phase 3
    │   │   ├── components/
    │   │   │   ├── PricingPlans.tsx
    │   │   │   └── PlanFeatureList.tsx
    │   │   └── hooks/
    │   │       └── useSubscription.ts
    │   │
    │   └── admin/                      # Phase 3 — Radheshyam
    │       ├── components/
    │       │   ├── UserTable.tsx
    │       │   ├── TemplateManager.tsx
    │       │   └── PromptEditor.tsx
    │       └── hooks/
    │           └── useAdmin.ts
    │
    ├── services/                       # Backend service layer
    │   ├── ai/
    │   │   ├── client.ts              # Gemini API client (single entry point)
    │   │   ├── prompts.ts             # All AI prompts in one place
    │   │   └── types.ts               # AI request/response types
    │   ├── resume/
    │   │   ├── service.ts             # Resume business logic
    │   │   └── validation.ts          # Resume form validation
    │   ├── export/
    │   │   ├── pdf.ts                 # Server-side PDF generation
    │   │   └── docx.ts                # Server-side DOCX generation
    │   ├── github/
    │   │   └── service.ts             # GitHub API integration
    │   └── linkedin/
    │       └── service.ts             # LinkedIn OAuth service
    │
    ├── lib/                            # Utilities & config
    │   ├── supabase/
    │   │   ├── client.ts              # Browser Supabase client
    │   │   ├── server.ts              # Server Supabase client
    │   │   ├── middleware.ts           # Auth middleware
    │   │   └── types.ts               # DB row types
    │   ├── rate-limit.ts              # Rate limiting utility
    │   └── utils.ts                   # Shared helpers
    │
    ├── types/                          # Shared TypeScript types
    │   ├── resume.ts                  # ResumeData, Section types
    │   ├── user.ts                    # User, Profile types
    │   ├── ai.ts                      # AI request/response types
    │   └── api.ts                     # API response wrappers
    │
    └── middleware.ts                   # Next.js middleware (auth redirect, rate limit)
```

## Owner Mapping

```
Radheshyam ──> features/auth/     features/admin/     lib/supabase/
Khushi     ──> features/resume-builder/   (templates inside)
Ankit      ──> features/ai-assistant/     features/export/     services/ai/
```

## First Thing to Do

**Ankit, create `src/types/resume.ts` today and share with the team:**
```typescript
interface ResumeData {
  id: string;
  userId: string;
  title: string;
  template: 'ats-professional' | 'modern' | 'student' | 'minimal';
  personalInfo: PersonalInfo;
  summary: string;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skills;
  certifications: Certification[];
  achievements: Achievement[];
  languages: Language[];
  createdAt: string;
  updatedAt: string;
}
// ... define all nested types
```

Everyone builds against this — no integration surprises.
