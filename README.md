# AI Resume Builder & Analyzer

Build, analyze, and optimize resumes with AI assistance.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (Email + Google OAuth) |
| AI | Google Gemini API (Free Tier) |
| Export | Client-side PDF generation |

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── (auth)/
│   │   ├── sign-up/page.tsx
│   │   └── login/page.tsx
│   ├── dashboard/page.tsx        # My Resumes
│   ├── builder/[resumeId]/page.tsx
│   ├── preview/[resumeId]/page.tsx
│   ├── templates/page.tsx
│   └── api/
│       ├── ai/route.ts           # Gemini proxy
│       ├── auth/route.ts
│       ├── resumes/route.ts
│       ├── resumes/[id]/route.ts
│       ├── export/[resumeId]/route.ts
│       ├── github/connect/route.ts
│       └── linkedin/connect/route.ts
│
├── components/
│   ├── ui/                       # Button, Input, Spinner
│   └── layout/                   # Navbar, Footer
│
├── features/
│   ├── auth/                     # [Radheshyam] Sign up, login, OAuth
│   ├── resume-builder/           # [Khushi] Builder form, sections, templates
│   ├── ai-assistant/             # [Ankit] AI panel, summary, bullets, grammar
│   ├── export/                   # [Ankit] PDF export
│   ├── ats/                      # Phase 2
│   ├── github/                   # Phase 2
│   ├── job-tracker/              # Phase 3
│   ├── analytics/                # Phase 3
│   ├── subscription/             # Phase 3
│   └── admin/                    # Phase 3
│
├── services/
│   └── ai/                       # Gemini client, prompts, types
│
├── lib/
│   ├── supabase/                 # Client, server, middleware
│   ├── rate-limit.ts
│   └── utils.ts
│
├── types/
│   ├── resume.ts                 # ResumeData & section types
│   ├── user.ts
│   ├── ai.ts
│   └── api.ts
│
└── middleware.ts
```

## File Purposes

### Types (`src/types/`)
Shared data contracts every engineer builds against.

| File | Purpose |
|------|---------|
| `resume.ts` | `ResumeData` and all nested section types (Education, Experience, Project, Skills, etc.) |
| `user.ts` | User profile and career goal types |
| `ai.ts` | AI request/action types and response shapes |
| `api.ts` | Standard API response wrappers |

### Services (`src/services/`)
Backend logic isolated from routes.

| File | Purpose |
|------|---------|
| `ai/client.ts` | Single Gemini API wrapper. All AI calls go through this file. Contains anti-fabrication prompts. |
| `ai/prompts.ts` | System prompts for each AI action |
| `ai/types.ts` | AiService interface for provider swapping |

### Lib (`src/lib/`)
Shared utilities and third-party configs.

| File | Purpose |
|------|---------|
| `supabase/client.ts` | Browser Supabase client |
| `supabase/server.ts` | Server Supabase client |
| `supabase/middleware.ts` | Session refresh middleware |
| `rate-limit.ts` | In-memory rate limiter per IP/user |
| `utils.ts` | cn(), formatDate(), generateId() |

### Feature Modules (`src/features/`)

| Module | Owner | Contents |
|--------|-------|----------|
| `auth/` | Radheshyam | SignUpForm, LoginForm, OAuthButtons, useAuth |
| `resume-builder/` | Khushi | BuilderForm, section components, 4 templates |
| `ai-assistant/` | Ankit | AiAssistantPanel, SummaryGenerator, BulletEnhancer, GrammarChecker |
| `export/` | Ankit | ExportButton, pdfGenerator |
| `ats/` | Phase 2 | ATS scoring, JD matching |
| `github/` | Phase 2 | GitHub OAuth, repo import |
| `admin/` | Phase 3 | User/template/prompt management |

### API Routes (`src/app/api/`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ai` | POST | Gemini proxy (rate-limited, 20 req/min) |
| `/api/auth` | POST | Login, signup, logout |
| `/api/resumes` | GET, POST | List / create resumes |
| `/api/resumes/[id]` | GET, PUT, DELETE | Single resume CRUD |
| `/api/export/[resumeId]` | GET | Generate export file |
| `/api/github/connect` | GET | GitHub OAuth |
| `/api/linkedin/connect` | GET | LinkedIn OAuth (login only) |

## Getting Started

```bash
npm install
cp .env.example .env.local   # Fill in your keys
npm run dev
```

## Requirements

- Node.js 18+
- Supabase account (free tier)
- Google Gemini API key (free tier)
- GitHub OAuth app
- Google OAuth client
