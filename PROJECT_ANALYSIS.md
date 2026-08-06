# AI Resume Builder & Analyzer — Complete Technical Analysis

> A staff-engineer onboarding analysis of the repository `Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer`.
> Written for a senior engineer who has never seen this project. All file references are relative to the repo root.
> Analysis date: August 2026 · Branch analyzed: `feat/production-hardening` (≈ `main` + dark mode + API hardening).

---

## 1. Executive Summary

| Attribute | Value |
|---|---|
| **Project name** | AI Resume Builder & Analyzer |
| **Purpose** | AI-assisted resume creation, ATS analysis, job-description matching, tailoring, and multi-format export |
| **Business problem** | Candidates waste hours building resumes that fail ATS filters and don't match target roles. The app compresses this into: build → analyze → tailor → export |
| **Target users** | Students, freshers, early-career professionals, working engineers; secondary: universities, placement cells, career coaches (admin panel) |
| **Maturity** | **MVP approaching production.** Fully functional core (builder, analysis, AI, export, payments, admin). No e2e tests, some stale docs, no load testing |
| **Architecture** | Next.js 15 App Router (React 19, TypeScript strict) + Supabase (PostgreSQL, RLS) + NextAuth v4 (JWT) + Gemini 2.0 Flash + Stripe. Feature-folder frontend, service-layer backend, thin API routes |
| **Scale** | 51 API route files, 33 pages, 34 test files, 28 DB migrations, 22 tables |

**High-level workflow**

```
Sign up (OAuth or email) → Onboarding (user type + career goals)
  → Build resume (13-15 sections, 8 templates, AI assistant, autosave)
  → Analyze (deterministic ATS engine + optional Gemini enrichment)
  → Match against JD (keyword/skill-gap/experience analysis)
  → Tailor (Application Kit: resume, cover letter, recruiter email,
            LinkedIn message, interview questions)
  → Export (PDF / DOCX / TXT / HTML) → Track applications → GitHub/LinkedIn sync
```

The application is **auth-first**: nearly every page and API route sits behind NextAuth. Data is **user-scoped by Supabase Row-Level Security** (RLS). The "AI" is a **hybrid**: a large deterministic rule-based analysis engine (runs offline, no cost) with optional Gemini enrichment layered on top.

---

## 2. Tech Stack

### Frontend
| Tech | Why |
|---|---|
| **Next.js 15 (App Router)** | Server components + API routes in one codebase; `output: "standalone"` for container deploy |
| **React 19 + TypeScript (strict)** | Strict typing everywhere; `@/*` path alias → `src/` |
| **Tailwind CSS 3.4** | Utility styling; **dark mode via CSS-variable palette** (`darkMode: "class"`, gray-50→950 mapped to `rgb(var(--gray-N))` so ~2,000 classes flip automatically) |
| **Framer Motion / GSAP / react-three-fiber** | Landing-page animations & 3D hero (presentational only) |
| **lucide-react + react-icons** | Icons |
| **sonner** | Toast notifications |
| **clsx + tailwind-merge** | `cn()` class merging |

### Backend / Data / Infra
| Tech | Why |
|---|---|
| **Next.js API routes** (51 files) | REST-style handlers, `force-dynamic` |
| **Supabase (PostgreSQL + Auth + RLS)** | Managed Postgres; RLS is the authorization backbone; 28 migrations |
| **NextAuth v4 (JWT sessions)** | OAuth (Google/GitHub/LinkedIn) + credentials; JWT strategy (30d max age, 7d rolling) |
| **Google Gemini 2.0 Flash** | All AI generation (`services/ai/client.ts`, 25s timeout, free-tier friendly) |
| **Stripe** | Subscriptions (checkout sessions, webhooks, customer portal); Pro $12/mo or $90/yr |
| **ioredis (Redis)** | Rate limiting; **in-memory sliding-window fallback** when Redis is down |
| **Resend** | Notification emails (opt-in channels) |
| **Sentry (@sentry/nextjs)** | Error + performance monitoring (client, server, edge) |
| **Node crypto (AES-256-GCM)** | Application-layer encryption of GitHub OAuth tokens (`lib/encryption.ts`) |
| **Docker / docker-compose / Vercel** | Container build (multi-stage standalone) + cron support |
| **GitHub Actions** | CI (lint, typecheck, test, build on Node matrix), docker build, PR quality |

### Document parsing / generation
| Tech | Why |
|---|---|
| **pdf-parse** | Extract text from uploaded PDFs |
| **mammoth** | Extract text from uploaded DOCX |
| **@react-pdf/renderer** | Pixel-perfect PDF export of the resume templates |
| **docx + jszip** | Word `.docx` export |
| **zod** | Request/body validation on every route (`validateOrError`) |

### Testing
| Tech | Why |
|---|---|
| **Vitest** | 34 test files (unit + API-route tests), node environment, `@` alias |

---

## 3. Folder Structure

```
├── src/
│   ├── middleware.ts            # NextAuth route protection (withAuth)
│   ├── instrumentation.ts       # Sentry init (server + edge via runtime split)
│   ├── app/                     # App Router: pages + API routes
│   │   ├── page.tsx             # Landing page
│   │   ├── (auth)/login, sign-up
│   │   ├── (onboarding)/onboarding/{user-type,career-goal}
│   │   ├── builder/[resumeId]/  # Resume editor (+ builder-context.tsx, layout)
│   │   ├── dashboard/           # Resume dashboard + widgets
│   │   ├── templates/ pricing/ jobs/ analytics/ settings/ updates/ ats-check/
│   │   ├── tools/{cover-letter, job-match, application-kit}
│   │   ├── resume/[resumeId]/{analysis, ats-score, variants/{role,company}}
│   │   ├── integrations/{github, linkedin}
│   │   ├── admin/               # Dashboard, users, prompts, templates, audit
│   │   ├── share/[token]/ preview/[resumeId]/
│   │   └── api/                 # 51 route.ts files (see §9)
│   ├── features/                # Feature modules (self-contained)
│   │   ├── auth/                # forms, OAuth buttons, useAuth hook
│   │   ├── resume-builder/      # config, components, hooks, 8 templates
│   │   ├── ai-assistant/        # AI panel, context, per-tool components
│   │   ├── subscription/        # Upgrade dialog, guard, useSubscription
│   │   ├── dashboard/           # cards, search context, recommendations
│   │   ├── export/              # ExportDialog/Button
│   │   ├── theme/               # ThemeProvider + ThemeToggle
│   │   └── onboarding/
│   ├── components/              # Shared UI (ui/, layout/, landing/, 3d/)
│   ├── lib/                     # Auth, supabase clients, stripe, rate-limit,
│   │   │                        # encryption, validation, api helpers, admin
│   ├── services/                # Business logic (thin routes call these)
│   │   ├── resume/              # CRUD, mapper, completion, bullet-matcher
│   │   ├── resume-analyzer/     # parser, ats-scorer, deep-ats, grammar, strength
│   │   ├── jd-analyzer/         # JD keyword/skill-gap engine
│   │   ├── ai/                  # Gemini client, prompts, injection guards
│   │   ├── export/              # pdf/docx/html/txt generators
│   │   ├── github/ sync.ts      # repo polling
│   │   ├── applications/ notifications/ resume-updates/ templates/ projects/
│   └── types/                   # resume.ts, ai.ts, user.ts, api.ts
├── supabase/migrations/         # 28 numbered SQL migrations (RLS everywhere)
├── .github/workflows/           # ci.yml, pr-quality.yml, docker.yml
├── Dockerfile / docker-compose.yml / vercel.json / next.config.mjs
├── .env.example / .nvmrc / vitest.config.ts / tailwind.config.js
```

**Architectural rules (deduced from code):**
- **Service layer**: routes authenticate → validate → call `src/services/*` → return JSON. Services never read HTTP.
- **Feature modules** own their UI + hooks + api clients; `src/components/` is cross-feature UI.
- **Supabase client split**: `lib/supabase/client.ts` (browser, anon key), `server.ts` (SSR cookie-scoped), `admin.ts` (service-role, RLS bypass — server only).
- **Pure logic is extracted for testability**: `bullet-matcher.ts`, `completion.ts`, `deep-ats.ts`, `ats-scorer.ts`, `template-recommendation.ts`, `projects/suggest.ts` are framework-free.

---

## 4. Application Architecture

**Style:** Server-rendered Next.js App Router with API routes; feature-based monolith; Postgres as the single source of truth; server-side RLS for data isolation.

**Layer separation**

```
UI (app/ + features/)  →  API Routes (app/api/**)  →  Services (src/services/**)  →  Supabase/Postgres
        │                        │                          │
        │                        │── lib/validation (zod)   │── lib/supabase/{server,admin}
        │                        │── lib/rate-limit         │── lib/encryption
        │                        │── lib/api (envelope)     │── lib/subscription
        └── lib/supabase/client (direct reads where needed)  └── external: Gemini, Stripe, GitHub, Resend
```

**Request flow (typical authenticated POST)**

1. `src/middleware.ts` (NextAuth `withAuth`) checks the JWT cookie for non-public paths.
2. Route handler: `getServerSession(authOptions)` → 401 if absent.
3. Rate limit (`checkRateLimit`, Redis→memory fallback).
4. Plan-gated usage check (`getUserPlanLimits` + `checkUsageLimit` — e.g. `maxAiActions`, `maxAtsChecks`).
5. Zod validation (`validateOrError`).
6. Service call (business logic, DB access).
7. Response via unified envelope `{ success: true, data }` / `{ success: false, error }` (helpers in `lib/api.ts`).

**Error handling flow**
- Unexpected errors → `withErrorHandling` wrapper → `logError()` (console + Sentry) → safe 500 (`safeErrorMessage` never leaks raw messages in production).
- Validation errors → 400 with `details[]`.
- No global error boundary on the API layer; routes that don't use the wrapper have per-route try/catch (some duplicate `error.message` — see §16).

**Configuration management**
- **Env vars** validated at startup by `lib/env-validator.ts` (critical vars throw — Supabase URL/keys, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`, `ADMIN_EMAILS`).
- Docker passes env through `docker-compose.yml`; `next.config.mjs` adds security headers + image domains.
- `SKIP_ENV_VALIDATION` build arg exists in the Dockerfile.

**Notable patterns**
- **Dual-session model**: NextAuth JWT (`next-auth.session-token`) for app auth; Supabase cookie session used server-side for DB queries. The two are reconciled in the NextAuth `jwt` callback (creates/looks up the Supabase `profiles` row, stores `token.id` = profile UUID).
- **Cron**: `/api/cron/github-poll` invoked by Vercel cron (see `vercel.json`); shares the same `syncGitHubForUser` service as the manual poll.

---

## 5. Frontend Analysis

- **Framework/routing**: Next.js App Router; route groups `(auth)`, `(onboarding)`; dynamic routes `builder/[resumeId]/[sectionId]`, `share/[token]`.
- **Layouts**: root `layout.tsx` (Navbar + ThemeProvider + Providers + sonner Toaster); `DashboardLayout` (sidebar + mobile nav); `admin/layout.tsx`; `builder/[resumeId]/layout.tsx` (builder chrome + theme toggle).
- **Global state**: React Context only — `SessionProvider` (NextAuth), `DashboardSearchProvider` (global search), `AiAssistantContext` + `AiHistoryContext` (AI panel state/history), `BuilderContext` (resume data + debounced autosave data). **No Redux/Zustand**.
- **Local state**: hooks per feature — `useResumeForm`, `useHistory`, `useKeyboardShortcuts`, `useTemplateFavorites`, `useInView`, `useAiAssistant`, `useAuth`, `useSubscription`, `useTheme`.
- **Data fetching**: `fetch` to API routes (e.g. `useSubscription` polls `/api/stripe/checkout`); **no react-query/SWR**; the builder autosaves via debounced PUT.
- **Forms/validation**: controlled components + zod schemas shared with the server (`lib/validation.ts`).
- **Reusable UI**: `components/ui/` (Button, Input, Spinner, Card variants, ConfirmDialog, ErrorBoundary) + section-card components.
- **Performance**: `useMemo`/`useCallback` throughout, lazy-loaded 3D scenes, `next/image`, skeleton/empty states, debounced saves, paginated lists (applications, audit log), resume preview rendered client-side with pagination (`PaginatedResumePreview`).
- **Dark mode**: `ThemeProvider` (localStorage + `prefers-color-scheme`, no-flash inline script in `<head>`) toggling `.dark` on `<html>`; the gray palette is CSS variables so all gray classes invert; `.resume-paper` re-injects the light palette so the document always prints correctly.

**Component hierarchy (builder)**

```
builder/[resumeId]/layout (fetch resume → BuilderContext.Provider)
└── page: BuilderForm
    ├── TopToolbar (template, undo/redo, export, theme toggle)
    ├── SectionNavList + SectionReorderDialog
    └── [sectionId] page: section editors (Experience/Skills/…) + RightPreviewPanel
        ├── TemplateRenderer → Modern / AtsProfessional / Student / Minimal /
        │                       Executive / Creative / ExecutiveSidebar / ModernCard
        └── AiAssistantPanel (per-section AI tools, history drawer)
```

---

## 6. Backend Analysis

- **Entry points**: `src/middleware.ts` (edge auth gate) + App Router handlers; `src/instrumentation.ts` boots Sentry per runtime.
- **"Controllers"** = API route files: auth, validation, rate-limiting, plan gates, then delegate.
- **Services** (the real business logic):
  - `services/resume/service.ts` — resume CRUD + `updateSections` (delete-then-insert per section) + `duplicateResume`.
  - `services/resume/mapper.ts` — snake_case rows → `ResumeData` (used by the builder); `service.ts` has an older inline mapper (see §16 duplication note).
  - `services/resume-analyzer/*` — deterministic parser/scorer/grammar/deep-ATS pipeline (see §12).
  - `services/jd-analyzer/engine.ts` — keyword extraction, role detection, skill-gap, experience-gap, category detection.
  - `services/ai/*` — Gemini client, DB-overridable prompt registry with 60s cache, injection guards.
  - `services/github/sync.ts` — poll repos → `resume_updates` rows → notifications + opt-in emails.
  - `services/applications`, `resume-updates`, `templates`, `notifications`, `projects/suggest`.
- **Middleware**: NextAuth edge middleware; `lib/supabase/middleware.ts` (`updateSession`) exists but is **not referenced** anywhere — vestigial.
- **Auth/authorization**: `getServerSession` on every route; admin routes additionally call `isAdmin(userId, email)` (env list + hardcoded list + `profiles.role = 'admin'`), and mutations are recorded via `logAdminAction` → `admin_audit_log`.
- **Background jobs**: only the Vercel cron (`/api/cron/github-poll`); no worker/queue system. Webhooks are handled inline.

---

## 7. Database Analysis

**Type:** PostgreSQL via Supabase. **22 tables**, RLS enabled on every user-data table, all FK-referenced to `profiles(id) ON DELETE CASCADE`. Migrations are plain SQL in `supabase/migrations/` (28 files, applied in numeric order — **not** managed by a migration runner).

### Tables (with key columns)

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | User profile + onboarding + role + **encrypted** github_token | id(PK,=auth.uid), email, full_name, user_type, career fields, role, is_active, github_connected, github_token, last_seen_at |
| `resumes` | Resume header | id, user_id, title, template, target_level, personal_info(jsonb), summary, coursework, interests, accent_color, font_family, section_order, custom_sections, ats_score, ats_breakdown, share_token (unique idx), view_count, download_count |
| `education / experience / projects / skills / certifications / achievements / languages / coding_profiles / leadership / open_source / publications / volunteer / activities` | Section rows | id, resume_id(FK cascade), content cols, sort_order |
| `job_analyses` | JD match history | user_id, resume_id, jd_snippet, match_percentage, result(jsonb) |
| `ats_analyses` | Deep-ATS history | user_id, resume_id, resume_title, score, breakdown(jsonb) |
| `applications` | Job tracker | user_id, company, role, status('applied'\|'interview'\|'rejected'\|'offer'), outcome_type, interview_round, date_applied |
| `resume_updates` | GitHub-detected repos | user_id, repo_name, repo_description/url/language, repo_stars/forks, status('pending'\|'added'\|'ignored') |
| `templates` | Global catalog (admin-managed) | name, category, component_key (unique), is_active, sort_order |
| `subscriptions` | Stripe mirror | user_id(unique), plan_id→subscription_plans, stripe_customer/subscription_id, status, periods, cancel_at_period_end |
| `subscription_plans` | Plan catalog (seeded free/pro) | id(PK text), price_monthly/yearly, stripe_price_ids, features(jsonb) |
| `usage_counts` | Monthly metered limits | user_id, metric, count, reset_at (unique user_id+metric) |
| `prompts` | Admin-overridable AI prompts | key(PK), label, template |
| `settings` | Notification prefs | user_id(unique), email_notifications, resume_updates, job_alerts, dark_mode |
| `admin_audit_log` | Admin mutation trail | admin_id, action, target_type/id, changes(jsonb) |
| `notifications` | In-app notification center | user_id, type, title, message, link, read |
| `webhook_events` | Stripe idempotency ledger | event_id(unique) |

### Indexes
`idx_applications_user_id`, `idx_applications_user_status`, `idx_notifications_user_created`, `idx_resume_updates_status`, `idx_resume_updates_user_id`, unique `resumes_share_token_idx`, unique `user_id` on subscriptions/settings, unique `(user_id, metric)` on usage_counts, plus auth/admin perf indexes (migration 00015).

### RPC / triggers
- Trigger `handle_new_user` (auto-creates a `profiles` row + default settings on auth signup).
- RPCs: `public.delete_user_account(user_id)` (cascading GDPR delete), `public.is_admin()`.

### ER diagram (simplified)

```
profiles 1──* resumes 1──* {education, experience, projects, skills, …}  (all cascade)
profiles 1──1 subscriptions n──1 subscription_plans
profiles 1──* usage_counts │ profiles 1──1 settings │ profiles 1──* notifications
profiles 1──* applications │ profiles 1──* job_analyses │ profiles 1──* ats_analyses
profiles 1──* resume_updates │ profiles 1──* admin_audit_log │ templates (global)
```

### RLS posture
Every user-data table: `USING (user_id = auth.uid())` on SELECT/INSERT/UPDATE/DELETE. `templates`: public read, admin-write. `prompts`: admin-only. **No permissive policies** — the service-role client (webhooks, cron, public share lookup) bypasses RLS deliberately.

---

## 8. Authentication & Authorization

**Flow (credentials):**
1. `POST /api/auth` → zod-validated signup → Supabase `signUp` → 201. Rate-limited per email (5/min).
2. Login (credentials) → NextAuth `authorize` → `supabase.auth.signInWithPassword` + `is_active` check → JWT.
3. OAuth (Google/GitHub/LinkedIn) → NextAuth callback → `jwt` callback looks up/creates the `profiles` row via **service-role client** (and sets `token.isNewUser` for post-login onboarding redirect).
4. Middleware gates all non-public routes with the JWT.

**Sessions:** JWT strategy — 30-day max age, 7-day rolling `updateAge`, `__Secure-` prefixed cookies in prod (httpOnly, sameSite=lax, secure).

**Roles:**
- `user` (default) vs `admin` — admin determined by **any** of: `ADMIN_EMAILS` env, hardcoded `DEFAULT_ADMIN_EMAILS` (`lib/admin-emails.ts`), or `profiles.role = 'admin'`.
- Admin checks are server-side (`isAdmin()`) on every admin route + admin layout; client-side redirects use the hardcoded list only.

**Permission checks:** RLS is the data-level enforcement; route-level checks are `session.user.id` ownership filters (`eq("user_id", userId)` everywhere) + plan gates (premium template switch → 403 `upgradeRequired`).

**Security mechanisms:** JWT signing secret, httpOnly cookies, `is_active` deactivation respected at login, rate limiting on login/signup/AI/save/import, AES-256-GCM encryption for GitHub tokens (with `ENCRYPTION_KEY_PREVIOUS` rotation support), strict CSP + security headers in `next.config.mjs`, CSRF handled by NextAuth, SSRF guard on JD-URL fetching (`lib/fetch-url.ts` blocks private IPs/redirects).

---

## 9. API Documentation

All routes live under `src/app/api/**/route.ts`. Every authenticated route uses `getServerSession(authOptions)`; the response envelope is `{ success: true, data }` or `{ success: false, error }`. Routes marked `dynamic` export `force-dynamic`.

### Auth
| Method | URL | Purpose | Auth | Tables | Service |
|---|---|---|---|---|---|
| POST | `/api/auth` | Sign up (email+password+fullName) | — | `auth.users`, `profiles` (via trigger) | Supabase auth |
| PUT | `/api/auth` | Update profile/password | ✅ | `profiles` | Supabase auth |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers (OAuth + credentials + callbacks) | — | `profiles`, `auth.users` | `lib/auth.ts` |

### Resumes
| Method | URL | Purpose | Auth | Tables | Service |
|---|---|---|---|---|---|
| GET | `/api/resumes` | List user's resumes (id,title,template,ats_score,updated) | ✅ | `resumes` | `resume/service.getResumes` |
| POST | `/api/resumes` | Create resume (template gate: premium tier requires Pro) | ✅ | `resumes` | `resume/service.createResume` |
| GET | `/api/resumes/[id]` | Full resume + 12 child sections (single batched query) | ✅ | `resumes`, all sections | `getResume` |
| PUT/PATCH | `/api/resumes/[id]` | Update resume / sections (`sectionType`+`data`, or `sections{}`); builder autosave (300 writes/min/user); premium-template gate | ✅ | `resumes`, sections | `updateResume`/`updateSections` |
| DELETE | `/api/resumes/[id]` | Delete resume (cascades) | ✅ | `resumes` | `deleteResume` |
| POST | `/api/resumes/[id]/duplicate` | Deep copy incl. sections | ✅ | `resumes`, sections | `duplicateResume` |
| POST | `/api/resumes/[id]/add-keywords` | Add missing-JD keywords to skills | ✅ | `skills` | service |
| POST | `/api/resumes/[id]/apply-bullets` | Apply AI bullet rewrites (exact→fuzzy matcher, dedupe) | ✅ | `experience` | `bullet-matcher.applyBulletRewrites` |
| POST | `/api/resumes/[id]/apply-grammar` | Apply safe grammar/style fixes | ✅ | sections | service |
| POST | `/api/resumes/[id]/share` / GET | Create/public fetch of share token | mixed | `resumes` | service (admin client for public GET) |
| POST | `/api/resumes/import` | Upload PDF/DOCX/TXT → AI parse → create resume | ✅ | `resumes`, sections | `resume-analyzer` + Gemini (`resume-import-upload` prompt) |

### Analysis & ATS
| Method | URL | Purpose | Auth | Tables | Service |
|---|---|---|---|---|---|
| POST | `/api/resume-analyze` | File/text analysis (parser+ATS+grammar+strength) | ✅ | — (stateless) | `resume-analyzer/index` |
| POST | `/api/ats-analyze` | Deep ATS report: deterministic `analyzeDeepAts` + optional Gemini enrichment; persists history + `resumes.ats_score` | ✅ (plan-gated: `ats_checks`) | `ats_analyses`, `resumes` | `deep-ats` + `ai/client` |
| GET | `/api/ats-analyses` | ATS history | ✅ | `ats_analyses` | service |
| GET | `/api/ats-score/[resumeId]` | Stored score + breakdown | ✅ | `resumes` | service |
| POST | `/api/analyze-jd` | JD match (keywords, gaps, %, category) | ✅ (plan-gated: `jd_analyses`) | `job_analyses` | `jd-analyzer/engine` |
| GET | `/api/analyze-jd` | JD analysis history (`?resumeId=`) | ✅ | `job_analyses` | service |
| GET | `/api/search` | Global dashboard search | ✅ | `resumes` | service |

### AI
| Method | URL | Purpose | Auth | Tables | Service |
|---|---|---|---|---|---|
| POST | `/api/ai` | Gemini proxy for 17 actions (rate-limited 20/min/IP; plan-gated `ai_actions`) | ✅ | `usage_counts` | `ai/client.callGemini` |
| POST | `/api/projects/suggest` | Rank GitHub repos vs JD (AI + deterministic fallback) | ✅ | `resume_updates`, `projects` | `projects/suggest` |
| POST | `/api/templates/recommend` | AI/rule-based template recommendation | ✅ | — | `template-recommendation` |

### Applications (job tracker)
| Method | URL | Purpose | Auth | Tables | Service |
|---|---|---|---|---|---|
| GET | `/api/applications` | Paginated list + status filter | ✅ | `applications` | `applications/service` |
| POST | `/api/applications` | Create | ✅ | `applications` | same |
| GET/PUT/DELETE | `/api/applications/[id]` | Read/update (incl. outcome)/delete | ✅ | `applications` | same |

### GitHub integration
| Method | URL | Purpose | Auth | Tables | Service |
|---|---|---|---|---|---|
| GET | `/api/github/connect` | OAuth redirect (state cookie) | ✅ | `profiles` | OAuth exchange + `encryption.encrypt` |
| GET | `/api/github/callback` | OAuth callback → store encrypted token | — | `profiles` | same |
| GET | `/api/github/poll` | Manual repo sync | ✅ | `resume_updates`, `notifications` | `github/sync` |
| GET | `/api/github/trending` | Trending repos (safe error handling) | ✅ | — | GitHub API |
| GET | `/api/github/contributions` | Contribution stats | ✅ | — | GitHub API |
| POST | `/api/github/import-username` | Import by username | ✅ | `resume_updates` | `createBatchUpdates` |
| GET | `/api/github/suggest` | Repos to add to resume (AI + fallback) | ✅ | `resume_updates`, `projects` | `projects/suggest` |

### LinkedIn integration
| Method | URL | Purpose | Auth | Tables | Service |
|---|---|---|---|---|---|
| GET | `/api/linkedin/connect` + `/callback` | OAuth flow | mixed | `profiles` | OAuth |
| POST | `/api/linkedin/import-paste` | Pasted profile → structured JSON (Gemini) | ✅ | — | `ai/client` |
| GET | `/api/linkedin/imports` | Import history | ✅ | `resumes` | service |
| POST | `/api/linkedin/manual-add` | Add certificate/achievement manually | ✅ | sections | service |

### Stripe / payments
| Method | URL | Purpose | Auth | Tables | Service |
|---|---|---|---|---|---|
| GET | `/api/stripe/checkout` | Current subscription status | ✅ | `subscriptions` | `lib/subscription` |
| POST | `/api/stripe/checkout` | Create checkout session (metadata userId) | ✅ | `subscriptions`, `profiles` | Stripe SDK |
| GET | `/api/stripe/portal` | Billing portal URL | ✅ | `subscriptions` | Stripe SDK |
| POST | `/api/stripe/webhook` | Signature-verified events; **idempotent** (memory set + `webhook_events` unique ledger, delete-on-failure so retries reprocess); unknown price → safe `free` + Sentry alert | — | `subscriptions`, `webhook_events` | service-role client |

### Export / data
| Method | URL | Purpose | Auth | Tables | Service |
|---|---|---|---|---|---|
| GET | `/api/export/[resumeId]?format=pdf\|docx\|txt\|html` | Multi-format export (filename sanitized) | ✅ | `resumes` | `export/*` generators |
| GET | `/api/data-export` | Download all user data (GDPR) | ✅ | all user tables | service |
| GET | `/api/notifications` | List + unread count + mark read | ✅ | `notifications` | `notifications/service` |
| GET/PUT | `/api/resume-updates`, PUT `[id]` | List / set added·ignored / add repo to resume | ✅ | `resume_updates`, `projects` | `resume-updates/service` |
| GET/PUT | `/api/settings` | Notification prefs | ✅ | `settings` | service |

### Admin (all require `isAdmin`)
| Method | URL | Purpose | Tables |
|---|---|---|---|
| GET/POST | `/api/admin/users`, GET/PUT/DELETE `[id]` | List (with subs)/promote/toggle `is_active` | `profiles`, `subscriptions`, `admin_audit_log` |
| GET | `/api/admin/stats` | Signups, activity, quick stats | `profiles`, `applications`, `ats_analyses` |
| GET/POST/PUT | `/api/admin/prompts` | Edit AI prompts (cache invalidation) | `prompts` |
| GET/POST/PUT/DELETE | `/api/admin/templates` | Catalog CRUD | `templates` |
| GET | `/api/admin/audit` | Paginated audit log | `admin_audit_log` |

### Infra
| Method | URL | Purpose | Notes |
|---|---|---|---|
| GET | `/api/health` | Liveness + DB ping | `Cache-Control: no-store` |
| GET | `/api/templates` | Public template catalog | **cached** `public, s-maxage=300, stale-while-revalidate=300` + CORS allowlist |
| GET | `/api/cron/github-poll` | Vercel cron (06:00 UTC) — polls all connected users | service-role client |

---

## 10. Feature Breakdown

### 10.1 Resume Builder (core)
- **Frontend**: `app/builder/[resumeId]/` (layout, page, `[sectionId]/page.tsx`), `features/resume-builder/` (BuilderForm, 15+ section editors, TopToolbar, SectionReorderDialog, template previews).
- **Backend**: `api/resumes`, `api/resumes/[id]` (+duplicate/import/apply-*), `services/resume/*`.
- **DB**: `resumes` + 12 section tables + `usage_counts` (no — builder itself is unlimited; plan gates templates).
- **Logic**: `RESUME_TYPES` section config per `targetLevel` (student/fresher/student_internship/experienced); `getOrderedSections` merges custom `sectionOrder` + user-created `customSections`; `computeResumeCompletion` weights required vs optional sections; debounced autosave PUT (300/min cap).
- **Dependencies**: 8 templates (`features/resume-builder/templates/`), theme tokens, AI assistant.

### 10.2 AI Assistant (in-builder)
- **Frontend**: `features/ai-assistant/` — AiAssistantPanel, BulletEnhancer, SummaryGenerator/Improver, GrammarChecker, AchievementSuggestor, MetricsAdder, ActionVerbs, SectionRewriter, AtsOptimizer, WeakContentDetector, AiHistoryView.
- **Backend**: `POST /api/ai`, `services/ai/*` (17 actions).
- **Logic**: per-action prompts with `{input}`/`{context}` slots; DB-overridable via `prompts` table (60s cache); injection sanitization + numeric-claims validation (`guard.ts`); **deterministic fallbacks** (WeakContentDetector, ActionVerbs) when AI fails.
- **DB**: `prompts`, `usage_counts`.

### 10.3 ATS Check / Deep Analysis
- **Frontend**: `app/ats-check/page.tsx` (1254 lines: tabs overview/keywords/bullets/grammar/formatting/improvements, one-click apply-all improvements, manual checklist).
- **Backend**: `POST /api/ats-analyze` (deep-ATS + AI enrichment), `GET /api/ats-score/[resumeId]`, `GET /api/ats-analyses`.
- **Logic**: `analyzeDeepAts` (deterministic: parser confidence, keyword scan with synonym aliases, density, bullet quality with rewrites, formatting, repetition, recruiter score, ranked top improvements) → optional Gemini `ats-deep-analyze` merge (clamped numeric fields, weak-bullet filter against actual text).
- **DB**: `ats_analyses`, `resumes.ats_score` (dashboard cards), `usage_counts`.

### 10.4 JD Match
- **Frontend**: `app/tools/job-match/page.tsx`, `app/resume/[resumeId]/analysis/page.tsx`.
- **Backend**: `POST /api/analyze-jd` (JSON or FormData, incl. JD URL via SSRF-guarded `fetch-url.ts`), `GET /api/analyze-jd`.
- **Logic**: `jd-analyzer/engine.ts` — 120+ common-skill lexicon, role-type detection (9 roles), experience-year extraction, category inference, matched/missing/skills/tools, category-specific suggestions.
- **DB**: `job_analyses`.

### 10.5 Application Kit (one-click application workflow)
- **Frontend**: `app/tools/application-kit/page.tsx` (489 lines) — paste a JD, generate customized resume, cover letter, recruiter email, LinkedIn message, interview questions, skill gaps.
- **Backend**: 3 new AI actions (`recruiter-email`, `linkedin-message`, `interview-questions`) via `POST /api/ai`; admin-editable prompts.
- **DB**: `usage_counts` (AI actions), `prompts`.

### 10.6 Export
- **Frontend**: `features/export/` (ExportDialog with format picker, ExportButton).
- **Backend**: `GET /api/export/[resumeId]?format=...`; `services/export/` — PDF (`@react-pdf/renderer` on shared template components), DOCX (`docx`), TXT (ATS plain text), HTML (self-contained styled page); registry in `formats.ts`.

### 10.7 GitHub integration
- **Frontend**: `app/integrations/github/page.tsx`, `app/updates/page.tsx`.
- **Backend**: connect/callback (encrypted token), poll (manual + cron), trending/contributions, import-username, suggest.
- **Logic**: `services/github/sync.ts` — poll `/user/repos`, insert new repos to `resume_updates`, refresh stars/forks, notify + email; `addUpdateToResume` inserts a real `projects` row.
- **DB**: `profiles.github_token` (encrypted), `resume_updates`, `notifications`, `projects`.

### 10.8 LinkedIn integration
- Paste-import (Gemini structured extraction) + OAuth connect + manual add; **partial** (import paste is the most complete path).

### 10.9 Subscription & plans
- **Frontend**: `pricing/page.tsx`, `features/subscription/` (UpgradeDialog, SubscriptionGuard, useSubscription).
- **Backend**: Stripe checkout/portal/webhook; `lib/subscription.ts` computes effective limits (only `active`/`trialing` grant Pro).
- **DB**: `subscriptions`, `subscription_plans`, `usage_counts` (monthly reset).

### 10.10 Admin panel
- **Frontend**: `app/admin/` (dashboard, users, prompts, templates, audit).
- **Backend**: `/api/admin/*` (all `isAdmin`-gated + audit-logged).

### 10.11 Notifications & settings
- In-app notification center (bell + dropdown), opt-in email channels via Resend honoring `settings` toggles.

### 10.12 Share & analytics
- Public share via unguessable `share_token` (`/share/[token]`, view-count incremented); dashboard analytics + admin stats.

---

## 11. Data Flow (traced request)

**Example: ATS-check a stored resume → see score on dashboard.**

```
UI: /ats-check (fetch POST /api/ats-analyze, FormData resumeId+jobDescription)
 │
 ▼
middleware.ts  withAuth → JWT valid → pass
 │
 ▼
POST /api/ats-analyze
 ├─ getServerSession → userId
 ├─ getUserPlanLimits → free: maxAtsChecks=3 → checkUsageLimit(ats_checks) OK
 ├─ getResume(resumeId, userId)  → Supabase RLS-scoped single batched query
 │     (resumes + 12 sections, ORDER BY sort_order)
 ├─ analyzeDeepAts({text, category, jobTitle, jobDescription})  (pure, deterministic)
 ├─ callGemini({action:'ats-deep-analyze'})  → parse JSON → clamp → merge (best-effort)
 ├─ insert ats_analyses row  +  UPDATE resumes SET ats_score, ats_breakdown
 ├─ incrementUsage(ats_checks)
 └─ { success, data: DeepAtsReport, ai:{status} }
 │
 ▼
UI renders tabbed report; dashboard card reads resumes.ats_score (GET /api/resumes)
```

**DB layer**: every query is `createServerSupabaseClient()` (RLS applies → only own rows) **except**: webhooks, cron, public `/share` fetches, and the NextAuth jwt-callback profile lookup, which use the **service-role** client (`lib/supabase/admin.ts`).

---

## 12. AI Integration

| Aspect | Detail |
|---|---|
| **Provider** | Google Gemini (REST `generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`) |
| **Model** | `gemini-2.0-flash` (single model everywhere) |
| **Prompt architecture** | Per-action templates with `{input}`/`{context}` slots (`services/ai/prompts.ts`); **DB-overridable** via `prompts` table (cache 60s, invalidate on admin publish) |
| **Streaming** | ❌ None — one-shot `generateContent` with 25s AbortController timeout |
| **Memory** | ❌ Stateless; per-call context only (`AiHistoryContext` is client-side display history, not model memory) |
| **Embeddings / vector DB / RAG** | ❌ None — keyword/synonym matching is rule-based (`KEYWORD_ALIASES` in deep-ats) |
| **Tool/function calling** | ❌ None — strict JSON-shape prompts + client-side extraction/validation (`extractJson`, field clamping) |
| **Token management** | Input caps: 12k chars input / 30k context (`guard.capContent`); JD slice 3k, resume slice 8k in ats-analyze |
| **Guards** | `sanitizeUserContent` strips injection patterns; `validateNumericClaims` flags untraceable metrics; prompts ban fabricated numbers; AI weak-bullets verified against actual resume text |
| **Deterministic fallbacks** | deep-ATS, jd-analyzer, project suggestions, template recommendation, WeakContentDetector — all work with Gemini down |
| **Cost posture** | AI calls are plan-limited (free 20/mo) + rate-limited (20/min/IP); most analysis is free deterministic code |

---

## 13. External Services

| Service | Use | Config | Failure behavior |
|---|---|---|---|
| **Supabase** | Postgres + Auth (OAuth users reconciled via service role) | URL + anon + service-role keys | Errors surfaced as 500s; RLS is DB-side |
| **Google Gemini** | All AI generation | `GEMINI_API_KEY` | Mapped status messages (400/401/403/429/500/503); deterministic fallbacks |
| **Stripe** | Subscriptions: checkout, portal, webhooks, customers | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs | Webhook unknown price → default `free` + alert; no Stripe → free plan only |
| **GitHub API** | Repo sync, trending, contributions, OAuth | OAuth client id/secret; user token (AES-256-GCM encrypted) | Safe error messages; sync no-ops on failure |
| **LinkedIn API** | OAuth + (paste import uses Gemini, not API) | client id/secret | Import best-effort |
| **Redis** | Rate limiting | `REDIS_URL`/HOST/PORT | In-memory sliding-window fallback (fail-closed, still restrictive) |
| **Resend** | Opt-in notification emails | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Silently skipped when unconfigured; never throws |
| **Sentry** | Errors + performance (server/edge/client) | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG/PROJECT/AUTH_TOKEN` | Import-guarded try/catch everywhere (`logError`) |
| **Google Fonts** | Inter/JetBrains Mono (CSP allowlist) | — | — |
| **Vercel** | Hosting + cron (`/api/cron/github-poll` @ 06:00) | `vercel.json` | — |

---

## 14. Security Review

**Strengths (verified in code):**
- RLS on all 22 tables with ownership policies; service-role only in server-only contexts.
- CSP with tight `default-src 'self'` + HSTS/XFO/nosniff/Referrer-Policy/Permissions-Policy headers (`next.config.mjs`).
- Rate limiting: login (5/min/email), AI (20/min/IP), builder save (300/min/user), resume import, signup.
- Input validation: zod on every write route; output sanitization: `escapeHtml` in HTML export, email HTML, `sanitizeFilename` for Content-Disposition.
- Secrets: env-var only; `ENCRYPTION_KEY` (32-byte hex) validated; GitHub tokens encrypted at rest with key-rotation support.
- SSRF guard on user-supplied JD URLs: DNS resolution + private-IP block (IPv4/IPv6 incl. `::ffff:` mapped), 3-redirect cap, 2MB cap, 8s timeout.
- Admin mutations audit-logged; `is_active=false` blocks login; error messages sanitized (`safeErrorMessage`; recent commits removed raw `error.message` leaks from auth/admin/GitHub routes).
- Session cookies: httpOnly + secure + sameSite=lax + `__Secure-` prefix in prod; 30-day JWT with rolling refresh.

**Weak points / risks:**
1. **OAuth → Supabase reconciliation uses the service-role key** in the NextAuth `jwt` callback (`lib/auth.ts`) — this path is exercised on every OAuth login; it is server-only, but it's the highest-value surface to review. If `profiles` email matching is ever ambiguous (duplicate emails), behavior is deterministic but must be tested.
2. **No CSRF protection beyond NextAuth defaults** on the credential-less API POSTs (sameSite=lax mitigates; custom API routes don't verify CSRF tokens — acceptable for same-origin SPA + lax cookies, but worth documenting).
3. **Rate limiting is per-IP (AI) / per-user (save)** — no per-account global throttle on resume creation/export; abuse is bounded by plan limits instead.
4. **`dangerouslySetInnerHTML`** for the theme no-flash script (`layout.tsx`) — a static constant, low risk, but flagged by CSP tooling (script-src includes `'unsafe-inline'`).
5. **Hardcoded admin emails** in `lib/admin-emails.ts` (rotating a compromised list requires a deploy).
6. **File uploads** are parsed server-side with pdf-parse/mammoth — large/zip-bomb docs are bounded by route-level checks but there's no explicit per-user upload quota beyond request size limits.
7. `fetch-url.ts` blocks private IPs at DNS level — good; note it resolves once per redirect hop (correct) and rejects `.internal`/`.local`/`.lan`.

---

## 15. Performance Review

**Caching:**
- Public: `/api/templates` `public, s-maxage=300, swr=300`; `/api/health` `no-store`.
- In-app: prompt registry 60s TTL; resume list fetched fresh (no SWR client cache).
- **Gap:** no Redis cache for hot queries (profiles, templates) beyond rate limits; no ISR on marketing pages.

**DB queries:**
- `getResume` uses a **single batched query** (12 related tables, ordered) — avoids N+1. ✅
- Resume list is a single indexed-by-`updated_at` query. Applications/audit are paginated. ✅
- `updateSections` is **delete-then-insert per section** — a full-resume save fires 12 sequential deletes+inserts (fine at this scale, but the heaviest write path).

**N+1:** None found in hot paths (batch selects used); GitHub sync loops are per-repo but bounded (50 repos).

**Bundle / rendering:**
- Heavy deps (three.js, GSAP, react-pdf) are on marketing/builder pages only; 3D scenes are client-lazy; PDF render is server-side.
- `ats-check/page.tsx` (1,254 lines) and dashboard are the largest clients — no code-splitting of the report tabs (all in one bundle).
- Dark mode uses CSS variables → no re-render cost; palette inversion avoids per-file rewrites.

**API bottlenecks:**
- Gemini calls block the request (25s timeout) — AI actions are inherently slow; no queuing/streaming.
- `/api/ats-analyze` runs the full deterministic engine + AI in one request (acceptable; sub-second deterministic + ~2-5s AI).
- Stripe webhook uses service-role client; idempotency ledger adds one insert per event (indexed unique).

---

## 16. Code Quality Review

**Strong:**
- Consistent feature/service/lib layout; strict TS with shared types (`types/resume.ts`, `types/ai.ts`).
- Small, single-purpose pure functions extracted for tests (bullet-matcher, completion, deep-ats, template-recommendation, project suggest).
- Unified response envelope + `withErrorHandling` (recent hardening).
- Meaningful commit history (conventional commits; 22-commit phase-based PRs).
- Inline docs explain *why* (K-14/RLS comments, webhook idempotency rationale).

**Debt / weaknesses:**
1. **Duplicate mappers**: `services/resume/service.ts` has an inline `mapRowToResumeData` that is superseded by `services/resume/mapper.ts` (which handles `section_order`, `custom_sections`, `accent_color`). The old one is still used by `getResume` — divergence risk. (`git diff` earlier showed both exist; the newer mapper is used by the builder path.)
2. **README drift**: claims "no test suite" (there are 34 vitest files), "4 templates" (8), LinkedIn "placeholder" (OAuth + paste import exist), PDF "placeholder" (real).
3. **Mixed error handling**: some routes use `withErrorHandling`; others keep per-route try/catch returning generic 404/500 (e.g. `resumes/[id]` returns 404 for internal errors). Inconsistent but safe.
4. **Large files**: `ats-check/page.tsx` (1,254 lines), `htmlRenderer.ts` (string-based template renderers with a TODO to migrate to `renderToStaticMarkup`), `deep-ats.ts` (600+ lines) — candidates for splitting.
5. **Unused/vestigial code**: `lib/supabase/middleware.ts` (`updateSession`) not referenced; README documents old paths (`api/auth.ts` under features/auth no longer exists as documented); `services/ai/types.ts` is empty; `strength.ts` superseded by `deep-ats.ts` for the main flow.
6. **Build errors on `main`**: pre-existing type errors in a handful of files (e.g. `MobileBuilderOverlays.tsx`, `github/connect`, `github/suggest`, landing page) — `tsc --noEmit` is not fully green; CI uses eslint/typecheck so this should be reconciled.
7. **`updateSections` delete-then-insert** loses row IDs (DB metadata regenerated) — acceptable, but any code holding old section IDs after save breaks (the builder re-fetches).

**SOLID/Clean-Architecture verdict:** Good separation (services = single responsibility); the dual-mapper + big-page drift is the main maintainability concern. No DI framework (not needed at this scale).

---

## 17. Current Development Status

**Completed (production-quality):** builder (13-15 sections, 8 templates, autosave, reorder, custom sections), AI assistant (17 actions), deterministic ATS + deep ATS + AI enrichment, JD matching, Application Kit, multi-format export (PDF/DOCX/TXT/HTML), GitHub sync + cron, job tracker, notifications + Resend email, subscriptions (Stripe), admin panel (users/stats/prompts/templates/audit), share links, data export, dark mode, API hardening, security headers, Docker + CI.

**Incomplete / partial:**
- LinkedIn OAuth import is partial (paste-import complete; deep profile sync not).
- No e2e tests; no load tests; `tsc` not fully green on `main`.
- Analytics page is basic; jobs page is a thin wrapper (uses GitHub trending).
- Onboarding is 2-step only; no multi-language.

**TODOs / markers found:** `htmlRenderer.ts` TODO (migrate to renderToStaticMarkup), README roadmap phases, `scripts/` (fix_resumes_console.py, rls-audit.sql, fix_env_validation.py, fix_auth_rate_limit.py — ad-hoc maintenance scripts).

**Dead code:** `lib/supabase/middleware.ts`, empty `services/ai/types.ts`, `strength.ts` (legacy report), 3D scenes (`Hero3DScene`, `Sync3DScene`) present but unused on the landing page.

**Experimental:** dark-mode CSS-variable inversion (feature-flagged only by presence of `.dark`), Application Kit (new, no analytics yet).

---

## 18. Build & Deployment

**Env vars:** 30+ — see `.env.example` (Supabase, Gemini, OAuth ×3, NextAuth, ENCRYPTION_KEY, Stripe, Redis, Sentry, ADMIN_EMAILS, ALLOWED_ORIGINS). Critical ones are startup-validated.

**Build:**
```bash
pnpm install
export SKIP_ENV_VALIDATION=false  # CI sets false
pnpm build   # next build --standalone; postbuild copies static+public into standalone
```

**Docker:** multi-stage `node:22-alpine` (builder → runner as non-root `nextjs`), `NEXT_PUBLIC_*` build args, `PORT=3000`, `CMD node server.js`. `docker-compose.yml` wires the full env surface.

**CI/CD (`.github/workflows/`):**
- `ci.yml` — Lint, TypeCheck, Test & Build on a Node version matrix (pnpm).
- `pr-quality.yml` — PR quality gates.
- `docker.yml` — Docker image build.

**Deploy targets:** Vercel (recommended; `vercel.json` defines the daily cron) or any Node 20+ host / Docker.

**Cloud infra:** Supabase (DB/auth), Vercel (hosting), Stripe, Gemini, Redis (optional, rate limiting), Resend, Sentry — all external/managed; no self-hosted infra.

---

## 19. Dependency Graph (module level)

```
app/* pages ──► features/* ──► components/* (shared UI)
                  │
app/api/* routes ─► lib/ (auth, validation, rate-limit, api envelope, supabase clients)
                  │        └── supabase/server|admin|client
                  ▼
             services/*
               ├─ resume/            (CRUD, mapper, completion, bullet-matcher)
               ├─ resume-analyzer/   (parser → ats-scorer/deep-ats/grammar/strength)
               ├─ jd-analyzer/       (depends on ats-scorer types only)
               ├─ ai/                (client ← prompts ← guard; prompts ← supabase)
               ├─ export/            (pdf ← @react-pdf; docx ← docx; txt; html)
               ├─ github/sync        (→ notifications → email; encryption)
               ├─ applications/ resume-updates/ templates/ notifications/ projects/
               └─ (all → lib/supabase/*)

external: Gemini (ai/client) · Stripe (webhook/checkout) · GitHub API (github/*) ·
          Resend (notifications/email) · Redis (rate-limit) · Sentry (lib/api, instrumentation)
```

Key coupling notes: `services/resume/mapper.ts` imports from `features/resume-builder/config/resume-types.ts` (completion), so the feature layer is a dependency of the service layer for the completion widget — a minor inversion; `lib/subscription` imports `lib/stripe` for plan limits.

---

## 20. Improvement Suggestions

**Architecture**
- Consolidate the two resume mappers into `mapper.ts` everywhere.
- Split `ats-check/page.tsx` and `htmlRenderer.ts`; migrate HTML renderers to `renderToStaticMarkup` (acknowledged TODO).
- Add a typed DB layer (generate Supabase `Database` types from migrations) to replace `Record<string, unknown>` casts — the single biggest type-safety win.
- Standardize all routes on `withErrorHandling` + `ok()/fail()` (remove remaining per-route try/catch).

**Performance**
- Client-side SWR/react-query for dashboard/profile reads; ISR or static for marketing pages.
- Parallelize `updateSections` deletes+inserts or move to a single `upsert` with `ON CONFLICT`.
- Lazy-load the ATS report tabs; memoize the deep-ATS engine result.

**Security**
- Make `tsc --noEmit` green in CI (pre-existing failures) and add `npm audit`/`pnpm audit`.
- Add per-account rate limits on create/export; optional CSRF token on mutating API routes.
- Move `ADMIN_EMAILS` fully to env (keep hardcoded list only for bootstrapping, remove from client bundle if possible — note the client redirect list is deliberate).
- Rotate credentials if any were ever committed (README warns about git-history secrets).

**Scalability / product**
- Move prompt/analysis results to Redis for multi-instance caching; add background job for GitHub polling fan-out (currently one cron hits all users sequentially).
- e2e tests (Playwright) for signup→build→analyze→export; API contract tests.
- Add usage analytics + funnel instrumentation (Sentry is wired; product analytics is not).

**Future roadmap** (from README + code): kanban job tracker, interview-question predictions (partially shipped in Application Kit), multi-language resumes, coach/team collaboration, public API.

---

## 21. Important Files (top 60)

**Config / infra**
1. `package.json` — deps, scripts (dev/build/test/lint).
2. `next.config.mjs` — standalone output, security headers/CSP, image domains.
3. `tailwind.config.js` — design tokens + CSS-variable gray palette (dark mode).
4. `src/middleware.ts` — NextAuth route protection.
5. `src/instrumentation.ts` + `sentry.{server,edge}.config.ts` + `instrumentation-client.ts` — Sentry init.
6. `Dockerfile` / `docker-compose.yml` / `vercel.json` / `.env.example` / `vitest.config.ts`.
7. `.github/workflows/{ci,pr-quality,docker}.yml`.

**Auth / core libs**
8. `src/lib/auth.ts` — NextAuth options (providers, jwt/session callbacks, cookie hardening, OAuth↔profiles reconciliation).
9. `src/lib/supabase/{client,server,admin,middleware}.ts` — three clients + vestigial middleware.
10. `src/lib/api.ts` — ok/fail/applyCors/publicCacheHeaders/safeErrorMessage/logError/withErrorHandling.
11. `src/lib/validation.ts` — all zod schemas + `validateOrError`.
12. `src/lib/rate-limit.ts` — Redis + in-memory sliding window.
13. `src/lib/encryption.ts` — AES-256-GCM with key rotation.
14. `src/lib/subscription.ts` + `src/lib/stripe.ts` — plan limits, usage counters, Stripe client.
15. `src/lib/admin.ts` + `admin-emails.ts` — admin checks + audit logging.
16. `src/lib/fetch-url.ts` — SSRF-guarded JD fetching.
17. `src/lib/github.ts` — encrypted token access + authenticated GitHub fetch.
18. `src/lib/env-validator.ts` — startup env checks.

**Types**
19. `src/types/resume.ts` — the full `ResumeData` model (17+ section shapes).
20. `src/types/ai.ts` — `AiAction` union (17 actions), request/response, analysis types.
21. `src/types/{user,api}.ts`.

**Services**
22. `src/services/resume/service.ts` — CRUD + updateSections + duplicate.
23. `src/services/resume/mapper.ts` — row→ResumeData mapping (incl. custom sections).
24. `src/services/resume/completion.ts` — section status + completion % (dashboard widget + builder).
25. `src/services/resume/bullet-matcher.ts` — pure fuzzy bullet rewriting.
26. `src/services/resume-analyzer/index.ts` — pipeline orchestrator.
27. `src/services/resume-analyzer/deep-ats.ts` — the deep deterministic ATS report (biggest analysis module).
28. `src/services/resume-analyzer/ats-scorer.ts` — 8-subscore weighted ATS engine.
29. `src/services/resume-analyzer/{parser,grammar-checker,strength}.ts`.
30. `src/services/jd-analyzer/engine.ts` — JD keyword/skill-gap/role/category engine.
31. `src/services/ai/client.ts` — Gemini client + prompt builder + status mapping.
32. `src/services/ai/prompts.ts` — DB-backed prompt registry (60s cache).
33. `src/services/ai/guard.ts` — injection sanitizer + numeric-claim validator.
34. `src/services/export/{pdfRenderer,docxGenerator,htmlRenderer,txtGenerator,formats,pdf-templates}.tsx/ts`.
35. `src/services/github/sync.ts` — repo polling → updates → notifications/email.
36. `src/services/resume-updates/service.ts` — add repo as project.
37. `src/services/applications/service.ts` — tracker CRUD (paginated).
38. `src/services/notifications/{service,email}.ts` — in-app + Resend.
39. `src/services/templates/service.ts` — catalog CRUD.
40. `src/services/projects/suggest.ts` — deterministic repo ranking fallback.

**Features / UI**
41. `src/app/ats-check/page.tsx` — the deep-ATS report UI + one-click apply-all.
42. `src/app/builder/[resumeId]/{layout,page,builder-context}.tsx` — builder shell + autosave context.
43. `src/app/tools/application-kit/page.tsx` — one-click application workflow.
44. `src/features/resume-builder/config/resume-types.ts` — section config per target level.
45. `src/features/resume-builder/config/template-recommendation.ts` + `template-discovery.ts` — explainable template scoring.
46. `src/features/resume-builder/templates/TemplateRenderer.tsx` + `theme.ts` — template router + theming.
47. `src/features/ai-assistant/context/AiAssistantContext.tsx` — AI panel state/history.
48. `src/features/theme/ThemeProvider.tsx` — dark mode + no-flash script.
49. `src/components/layout/DashboardLayout.tsx` / `Navbar.tsx` / `NotificationCenter.tsx` — app shell.
50. `src/features/subscription/components/UpgradeDialog.tsx` + `SubscriptionGuard.tsx` — paywall UX.

**API routes (most important)**
51. `src/app/api/ats-analyze/route.ts` — deep ATS + AI enrichment + persistence.
52. `src/app/api/ai/route.ts` — rate-limited, plan-gated AI proxy.
53. `src/app/api/resumes/[id]/route.ts` — builder save (PUT/PATCH) with section loop.
54. `src/app/api/stripe/webhook/route.ts` — signature-verified, idempotent subscription sync.
55. `src/app/api/auth/route.ts` — signup + profile update.
56. `src/app/api/resumes/import/route.ts` — file → AI parse → resume.
57. `src/app/api/export/[resumeId]/route.ts` — format-dispatching export.
58. `src/app/api/cron/github-poll/route.ts` — scheduled sync.
59. `src/app/api/admin/users/[id]/route.ts` — promote/deactivate + audit.
60. `src/app/api/health/route.ts` + `src/app/api/templates/route.ts` — caching/CORS reference implementations.

**Data**
- `supabase/migrations/00001_schema.sql` (core + RLS), `00003_subscriptions.sql` (plans/settings/prompts/usage), `00007_templates_catalog.sql`, `00023_resume_share.sql`, `00026_custom_sections.sql`, `00027_rls_ownership_audit.sql`, `00028_webhook_events.sql`.

---

## 22. Developer Onboarding Guide

**1. Get it running**
```bash
pnpm install && cp .env.example .env.local   # fill Supabase URL/keys, NEXTAUTH_SECRET/URL, ENCRYPTION_KEY, ADMIN_EMAILS, GEMINI_API_KEY
pnpm dev                                     # Turbopack dev server on :3000
```
Apply `supabase/migrations/*.sql` in numeric order (SQL editor or `supabase db push`). Set `ADMIN_EMAILS` to your email to see `/admin`.

**2. Where to start reading**
- Data model: `src/types/resume.ts` → `supabase/migrations/00001_schema.sql`.
- Auth: `src/lib/auth.ts` + `src/middleware.ts`.
- One full vertical slice: `app/ats-check` (UI) → `api/ats-analyze` → `services/resume-analyzer/deep-ats.ts`.
- Conventions: `lib/api.ts` envelope, `lib/validation.ts` zod, `lib/subscription.ts` plan gates.

**3. How a feature gets added**
1. Add zod schema in `lib/validation.ts` + types in `types/*.ts`.
2. Add service function in the right `services/*` folder (pure logic → testable module).
3. Add `app/api/.../route.ts` — `getServerSession` → rate-limit → plan gate → `validateOrError` → service → `ok()/fail()` (or `withErrorHandling`).
4. Build UI under `features/<name>/` (client component), wire to the route.
5. For AI: add prompt to `services/ai/prompts.ts` `DEFAULT_PROMPTS` + `types/ai.ts` `AiAction` + `lib/validation.ts` enum.
6. Migration (numbered, RLS policy included) + optional catalog seed.
7. Unit test the pure logic (`*.test.ts`); run `pnpm test`, `npx tsc --noEmit`, `pnpm lint`.

**4. Debugging**
- `pnpm dev` + browser; Sentry captures prod errors (`logError` tags `area: api`).
- Route issues: check `getServerSession` (unauthenticated → 401), rate limits (`redis` or memory), plan limits (`usage_counts`), RLS (if you see empty data, suspect RLS — try `createAdminSupabaseClient` only in server code).
- AI issues: `GEMINI_API_KEY` + Gemini quota (free tier ~1,500 req/day); deterministic fallbacks mask AI failures by design.
- DB: Supabase dashboard SQL editor; `webhook_events` shows Stripe event dedup.

**5. Common pitfalls**
- **Never import `createAdminSupabaseClient` into client code** (service-role key leak).
- **Always filter by `user_id`** — RLS also protects, but route ownership checks are the contract.
- **Don't add a new section table without**: migration (RLS + FK cascade), `types/resume.ts`, `mapper.ts`, builder section editor, template render, export generators (pdf/docx/txt/html), `updateSections` case, completion config.
- The gray palette is CSS variables — never hardcode `gray-*` hex in components expecting light mode only; use semantic tokens (`bg-background`, `text-black`) or rely on the variable flip.
- Premium templates are gated server-side (both create + update) — keep the gate server-side.
- `updateSections` wipes + re-inserts: pass complete arrays.

**6. Conventions**
- Conventional commits (`feat/fix/test/perf/chore(scope):`), one concern per commit.
- Services return domain objects; routes return `{ success, data|error }`.
- Vitest for tests; `@/` alias imports; Prettier not configured (eslint only).

---

## 23. Final Project Summary

**Architecture:** A clean, feature-based Next.js monolith with a thin API layer over a service layer over Postgres-with-RLS. Auth is NextAuth JWT reconciled to Supabase profiles; data isolation is enforced twice (route ownership checks + RLS). AI is hybrid: deterministic engines for the core analysis (free, fast, testable) with Gemini 2.0 Flash enrichment — a pragmatic cost/quality trade-off.

**Strengths:** Excellent security posture for an MVP (RLS everywhere, encrypted tokens, SSRF guard, rate limiting, CSP, safe errors, audit log); comprehensive feature surface (builder, analysis, matching, application kit, exports, payments, admin, integrations); disciplined code organization with pure testable modules; idempotent webhooks; dark mode done via palette inversion (scalable).

**Weaknesses:** Dual resume mappers; big files (`ats-check` page, `htmlRenderer`); `tsc` not fully green on `main`; stale README; vestigial code; no e2e/load tests; single-model AI with no streaming/RAG; sequential cron fan-out.

**Risks:** Service-role key usage surface (OAuth callback); `'unsafe-inline'` script-src; hardcoded admin emails; reliance on free-tier Gemini quotas; git history may contain old secrets (README warns to rotate).

**Overall:** A well-engineered, production-minded MVP. The architecture will scale to thousands of users with modest work: finish type generation, green CI, e2e tests, and move caching/background work off-process. The hybrid AI design is the most defensible engineering decision in the codebase.

---
*End of analysis. Compiled from the `feat/production-hardening` working tree, August 2026.*
