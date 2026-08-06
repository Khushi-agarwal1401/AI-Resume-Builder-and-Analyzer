# AI Resume Builder & Analyzer — Complete Technical Analysis

> A staff-engineer onboarding analysis of the repository `Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer`.
> Written for a senior engineer who has never seen this project. All file references are relative to the repo root.
> Analysis date: August 2026 · Branch analyzed: `feat/production-hardening` (7 commits ahead of origin).
> **Revision note:** this document is updated after the 7-phase production-hardening program (TypeScript green, ATS page split, UPSERT, TanStack Query, Playwright e2e, background jobs, typed Supabase schema). Items marked ✅ were resolved by that work; the prior analysis's flagged debts are now fixed unless noted.

---

## 1. Executive Summary

| Attribute | Value |
|---|---|
| **Project name** | AI Resume Builder & Analyzer |
| **Purpose** | AI-assisted resume creation, ATS analysis, job-description matching, tailoring, and multi-format export |
| **Business problem** | Candidates waste hours building resumes that fail ATS filters and don't match target roles. The app compresses this into: build → analyze → tailor → export |
| **Target users** | Students, freshers, early-career professionals, working engineers; secondary: universities, placement cells, career coaches (admin panel) |
| **Maturity** | **Production-ready MVP.** Core (builder, analysis, AI, export, payments, admin) fully functional; `tsc`/lint/test/build all green; 13 Playwright e2e specs; typed DB layer; background-job queue for heavy AI |
| **Architecture** | Next.js 15 App Router (React 19, TypeScript strict) + Supabase (PostgreSQL, RLS, typed clients) + NextAuth v4 (JWT) + Gemini 2.0 Flash + Stripe. Feature-folder frontend, service-layer backend, thin API routes; BullMQ worker for async AI |
| **Scale** | 52 API route files, 33 pages, 34 vitest files (436 tests) + 13 Playwright specs, 32 DB migrations, 29 tables in the typed `Database` |

**High-level workflow**

```
Sign up (OAuth or email) → Onboarding (user type + career goals)
  → Build resume (13-15 sections, 8 templates, AI assistant, autosave)
  → Analyze (deterministic ATS engine + optional Gemini enrichment)
  → Match against JD (keyword/skill-gap/experience analysis)
  → Tailor (Application Kit: resume, cover letter, recruiter email,
            LinkedIn message, interview questions)
  → Export (PDF / DOCX / TXT / HTML) → Track applications → GitHub/LinkedIn sync
  → Heavy AI can run async: enqueue → BullMQ worker → poll job status
```

The application is **auth-first**: nearly every page and API route sits behind NextAuth. Data is **user-scoped by Supabase Row-Level Security** (RLS). The "AI" is a **hybrid**: a large deterministic rule-based analysis engine (runs offline, no cost) with optional Gemini enrichment layered on top.

---

## 2. Tech Stack

### Frontend
| Tech | Why |
|---|---|
| **Next.js 15 (App Router)** | Server components + API routes in one codebase; `output: "standalone"` for container deploy |
| **React 19 + TypeScript (strict)** | Strict typing everywhere; `@/*` path alias → `src/` |
| **TanStack Query v5** | ✅ new — typed query-key factory (`lib/query/keys.ts`), resume hooks with optimistic updates (`lib/query/resume-hooks.ts`); dashboard CRUD migrated off manual fetch |
| **Tailwind CSS 3.4** | Utility styling; **dark mode via CSS-variable palette** (`darkMode: "class"`, gray-50→950 mapped to `rgb(var(--gray-N))` so ~2,000 classes flip automatically) |
| **Framer Motion / GSAP / react-three-fiber** | Landing-page animations & 3D hero (presentational only) |
| **lucide-react + react-icons** | Icons |
| **sonner** | Toast notifications |
| **clsx + tailwind-merge** | `cn()` class merging |

### Backend / Data / Infra
| Tech | Why |
|---|---|
| **Next.js API routes** (52 files) | REST-style handlers, `force-dynamic` |
| **Supabase (PostgreSQL + Auth + RLS)** | Managed Postgres; RLS is the authorization backbone; 32 migrations; **typed `Database` (29 tables) wired into all three clients** ✅ |
| **@supabase/ssr 0.12 + supabase-js 2.111** | ✅ upgraded to fix a generic-signature mismatch that collapsed row types to `never` under strict clients |
| **NextAuth v4 (JWT sessions)** | OAuth (Google/GitHub/LinkedIn) + credentials; JWT strategy (30d max age, 7d rolling) |
| **Google Gemini 2.0 Flash** | All AI generation (`services/ai/client.ts`, 25s timeout, free-tier friendly) |
| **Stripe** | Subscriptions (checkout sessions, webhooks, customer portal); Pro $12/mo or $90/yr |
| **BullMQ + ioredis (Redis)** | ✅ new — background job queue for heavy AI (ATS analysis); Redis also backs rate limiting; **inline (no-Redis) fallback** keeps callers working |
| **Resend** | Notification emails (opt-in channels) |
| **Sentry (@sentry/nextjs)** | Error + performance monitoring (client, server, edge) |
| **Node crypto (AES-256-GCM)** | Application-layer encryption of GitHub OAuth tokens (`lib/encryption.ts`) |
| **Docker / docker-compose / Vercel** | Container build (multi-stage standalone) + cron support |
| **GitHub Actions** | CI (lint, typecheck, test, build on Node matrix), docker build, PR quality, **e2e workflow** |

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
| **Vitest** | 34 test files / **436 tests** (unit + API-route tests), node environment, `@` alias |
| **Playwright** | ✅ new — `e2e/` with Page Object Models (`pages/`), shared fixtures, **13 specs** across auth, protected routes, and public pages; `e2e.yml` CI workflow |

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
│   │   ├── dashboard/           # Resume dashboard + widgets (React Query)
│   │   ├── templates/ pricing/ jobs/ analytics/ settings/ updates/
│   │   ├── ats-check/           # ✅ split into page + 5 tab components +
│   │   │                        #    types.ts, constants.ts, components.tsx
│   │   ├── tools/{cover-letter, job-match, application-kit}
│   │   ├── resume/[resumeId]/{analysis, ats-score, variants/{role,company}}
│   │   ├── integrations/{github, linkedin}
│   │   ├── admin/               # Dashboard, users, prompts, templates, audit
│   │   ├── share/[token]/ preview/[resumeId]/
│   │   └── api/                 # 52 route.ts files (see §9)
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
│   │   ├── supabase/            # client / server / admin + types.ts (29-table Database) ✅
│   │   ├── jobs/                # ✅ queues (BullMQ), ats-processor, store, types
│   │   └── query/               # ✅ TanStack Query client, keys, resume-hooks
│   ├── workers/                 # ✅ ai-worker.ts (standalone BullMQ worker, `pnpm worker`)
│   ├── services/                # Business logic (thin routes call these)
│   │   ├── resume/              # CRUD (UPSERT sections), mapper, completion, bullet-matcher
│   │   ├── resume-analyzer/     # parser, ats-scorer, deep-ats, grammar, strength,
│   │   │                        # ✅ ats-pipeline.ts (shared sync/async orchestrator)
│   │   ├── jd-analyzer/         # JD keyword/skill-gap engine
│   │   ├── ai/                  # Gemini client, prompts, injection guards
│   │   ├── export/              # pdf/docx/html/txt generators
│   │   ├── github/ sync.ts      # repo polling
│   │   ├── applications/ notifications/ resume-updates/ templates/ projects/
│   └── types/                   # resume.ts, ai.ts, user.ts, api.ts
├── e2e/                         # ✅ Playwright: pages/ (POM), fixtures.ts, specs/
├── supabase/migrations/         # 32 numbered SQL migrations (RLS everywhere)
├── .github/workflows/           # ci.yml, pr-quality.yml, docker.yml, e2e.yml ✅
├── Dockerfile / docker-compose.yml / vercel.json / next.config.mjs / playwright.config.ts ✅
├── .env.example / .nvmrc / vitest.config.ts / tailwind.config.js
```

**Architectural rules (deduced from code):**
- **Service layer**: routes authenticate → validate → call `src/services/*` → return JSON. Services never read HTTP.
- **Feature modules** own their UI + hooks + api clients; `src/components/` is cross-feature UI.
- **Supabase client split**: `lib/supabase/client.ts` (browser, anon key), `server.ts` (SSR cookie-scoped), `admin.ts` (service-role, RLS bypass — server only); **all three are typed with `Database`** ✅.
- **Pure logic is extracted for testability**: `bullet-matcher.ts`, `completion.ts`, `deep-ats.ts`, `ats-scorer.ts`, `ats-pipeline.ts`, `template-recommendation.ts`, `projects/suggest.ts` are framework-free.
- **Jobs split**: queueing (`lib/jobs/queues.ts`), execution (`lib/jobs/ats-processor.ts`), persistence (`lib/jobs/store.ts`), and the worker process (`workers/ai-worker.ts`) are separate so API routes never run AI inline when Redis is present.

---

## 4. Application Architecture

**Style:** Server-rendered Next.js App Router with API routes; feature-based monolith; Postgres as the single source of truth; server-side RLS for data isolation; **optional async path for heavy AI work**.

**Layer separation**

```
UI (app/ + features/)  →  API Routes (app/api/**)  →  Services (src/services/**)  →  Supabase/Postgres
        │                        │                          │
        │                        │── lib/validation (zod)   │── lib/supabase/{server,admin,types} ✅
        │                        │── lib/rate-limit         │── lib/encryption
        │                        │── lib/api (envelope)     │── lib/subscription
        └── lib/supabase/client (direct reads where needed)  └── external: Gemini, Stripe, GitHub, Resend
        └── lib/query (React Query hooks)   │── lib/jobs (BullMQ) + workers/ai-worker → background_jobs
```

**Request flow (typical authenticated POST, sync)**

1. `src/middleware.ts` (NextAuth `withAuth`) checks the JWT cookie for non-public paths.
2. Route handler: `getServerSession(authOptions)` → 401 if absent.
3. Rate limit (`checkRateLimit`, Redis→memory fallback).
4. Plan-gated usage check (`getUserPlanLimits` + `checkUsageLimit` — e.g. `maxAiActions`, `maxAtsChecks`).
5. Zod validation (`validateOrError`).
6. Service call (business logic, DB access).
7. Response via unified envelope `{ success: true, data }` / `{ success: false, error }` (helpers in `lib/api.ts`).

**Async request flow (ATS analysis, `mode: "async"`)**

```
POST /api/ats-analyze (mode=async)
  → createJob → background_jobs (queued) → BullMQ "ats-analysis" queue
  → 202 { queued, jobId }                       (HTTP returns immediately)
  → worker (pnpm worker) drains queue → processAtsJob → runAtsPipeline → persist
  → client polls GET /api/jobs/[jobId] → status + result
  → no Redis configured? job runs inline in the request (same code path)
```

**Error handling flow**
- Unexpected errors → `withErrorHandling` wrapper → `logError()` (console + Sentry) → safe 500 (`safeErrorMessage` never leaks raw messages in production).
- Validation errors → 400 with `details[]`.
- No global error boundary on the API layer; routes that don't use the wrapper have per-route try/catch (some duplicate `error.message` — see §16).

**Configuration management**
- **Env vars** validated at startup by `lib/env-validator.ts` (critical vars throw — Supabase URL/keys, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`, `ADMIN_EMAILS`). `REDIS_URL` is optional: absent → inline job fallback + in-memory rate limit.
- Docker passes env through `docker-compose.yml`; `next.config.mjs` adds security headers + image domains.
- `SKIP_ENV_VALIDATION` build arg exists in the Dockerfile.

**Notable patterns**
- **Dual-session model**: NextAuth JWT (`next-auth.session-token`) for app auth; Supabase cookie session used server-side for DB queries. The two are reconciled in the NextAuth `jwt` callback (creates/looks up the Supabase `profiles` row, stores `token.id` = profile UUID).
- **Cron**: `/api/cron/github-poll` invoked by Vercel cron (see `vercel.json`); shares the same `syncGitHubForUser` service as the manual poll.
- **Shared ATS pipeline**: `services/resume-analyzer/ats-pipeline.ts` is the single orchestrator used by the sync route, the async worker, and the inline fallback — identical behavior everywhere.

---

## 5. Frontend Analysis

- **Framework/routing**: Next.js App Router; route groups `(auth)`, `(onboarding)`; dynamic routes `builder/[resumeId]/[sectionId]`, `share/[token]`.
- **Layouts**: root `layout.tsx` (Navbar + ThemeProvider + Providers + sonner Toaster); `DashboardLayout` (sidebar + mobile nav); `admin/layout.tsx`; `builder/[resumeId]/layout.tsx` (builder chrome + theme toggle). `providers.tsx` now also mounts the **TanStack Query `QueryClientProvider`** ✅.
- **Global state**: React Context only — `SessionProvider` (NextAuth), `DashboardSearchProvider` (global search), `AiAssistantContext` + `AiHistoryContext` (AI panel state/history), `BuilderContext` (resume data + debounced autosave data). **No Redux/Zustand**.
- **Local state**: hooks per feature — `useResumeForm`, `useHistory`, `useKeyboardShortcuts`, `useTemplateFavorites`, `useInView`, `useAiAssistant`, `useAuth`, `useSubscription`, `useTheme`.
- **Data fetching**: ✅ **TanStack Query** for the resume/dashboard domain — typed query keys (`lib/query/keys.ts`), `useResumes`/`useResume` + create/update/delete mutations with optimistic updates (`lib/query/resume-hooks.ts`); the dashboard CRUD was migrated off manual `fetch`/local state. Other features still `fetch` to API routes (e.g. `useSubscription` polls `/api/stripe/checkout`); the builder autosaves via debounced PUT.
- **Forms/validation**: controlled components + zod schemas shared with the server (`lib/validation.ts`).
- **Reusable UI**: `components/ui/` (Button, Input, Spinner, Card variants, ConfirmDialog, ErrorBoundary) + section-card components.
- **Performance**: `useMemo`/`useCallback` throughout, lazy-loaded 3D scenes, `next/image`, skeleton/empty states, debounced saves, paginated lists (applications, audit log), resume preview rendered client-side with pagination (`PaginatedResumePreview`); ✅ the ATS report is no longer one 1,254-line bundle — it is split into five tab components loaded from `page.tsx`.
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

- **Entry points**: `src/middleware.ts` (edge auth gate) + App Router handlers; `src/instrumentation.ts` boots Sentry per runtime; `src/workers/ai-worker.ts` is a separate long-running process (`pnpm worker`).
- **"Controllers"** = API route files: auth, validation, rate-limiting, plan gates, then delegate.
- **Services** (the real business logic):
  - `services/resume/service.ts` — resume CRUD + `updateSections` (**UPSERT on stable ids + diff-delete**, ✅ replacing delete-then-insert) + `duplicateResume`; handles live-DB drift (`isMissingColumnError` retries strip theme columns on older schemas).
  - `services/resume/mapper.ts` — single snake_case → `ResumeData` mapper (✅ consolidated; handles `section_order`, `custom_sections`, `accent_color`).
  - `services/resume-analyzer/*` — deterministic parser/scorer/grammar/deep-ATS pipeline (see §12) + ✅ `ats-pipeline.ts` shared orchestrator.
  - `services/jd-analyzer/engine.ts` — keyword extraction, role detection, skill-gap, experience-gap, category detection.
  - `services/ai/*` — Gemini client, DB-overridable prompt registry with 60s cache, injection guards.
  - `services/github/sync.ts` — poll repos → `resume_updates` rows → notifications + opt-in emails.
  - `services/applications`, `resume-updates`, `templates`, `notifications`, `projects/suggest`.
- **Middleware**: NextAuth edge middleware. (`lib/supabase/middleware.ts` was vestigial and ✅ removed.)
- **Background jobs** ✅: `lib/jobs/` — `queues.ts` (BullMQ `Queue`, inline fallback when `REDIS_URL` unset), `ats-processor.ts` (status transitions + shared pipeline), `store.ts` (service-role persistence + owner-scoped reads), `types.ts`; worker in `workers/ai-worker.ts` (concurrency 2, graceful SIGINT/SIGTERM shutdown).
- **Auth/authorization**: `getServerSession` on every route; admin routes additionally call `isAdmin(userId, email)` (env list + hardcoded list + `profiles.role = 'admin'`), and mutations are recorded via `logAdminAction` → `admin_audit_log`.
- **Typed persistence** ✅: every Supabase query now flows through `Database`-typed clients; dynamic payload builders are typed to `Insert`/`Update` row shapes with deliberate `Json` casts.

---

## 7. Database Analysis

**Type:** PostgreSQL via Supabase. **29 tables** in the typed `Database` (incl. ✅ `background_jobs`), RLS enabled on every user-data table, all FK-referenced to `profiles(id) ON DELETE CASCADE`. Migrations are plain SQL in `supabase/migrations/` (32 files, applied in numeric order — **not** managed by a migration runner). ✅ `src/lib/supabase/types.ts` is a hand-maintained full `Row`/`Insert`/`Update` + `Json` + `Relationships` type wired into all clients.

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
| `settings` | Notification prefs | user_id(unique), email_notifications, resume_updates, job_alerts, dark_mode (✅ + toggles via 00031) |
| `admin_audit_log` | Admin mutation trail | admin_id, action, target_type/id, changes(jsonb) |
| `notifications` | In-app notification center | user_id, type, title, message, link, read |
| `webhook_events` | Stripe idempotency ledger | event_id(unique) |
| `background_jobs` | ✅ job queue ledger | user_id, job_type('ats-analysis'\|…), status('queued'\|'processing'\|'completed'\|'failed'\|'cancelled'), payload(jsonb), result(jsonb), error, attempts, started_at, completed_at |

### Indexes
`idx_applications_user_id`, `idx_applications_user_status`, `idx_notifications_user_created`, `idx_resume_updates_status`, `idx_resume_updates_user_id`, unique `resumes_share_token_idx`, unique `user_id` on subscriptions/settings, unique `(user_id, metric)` on usage_counts, **unique `skills.resume_id`** (✅ 00029 upsert support), plus auth/admin perf indexes (migration 00015).

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
profiles 1──* background_jobs (queue ledger, service-role written)
```

### RLS posture
Every user-data table: `USING (user_id = auth.uid())` on SELECT/INSERT/UPDATE/DELETE. `templates`: public read, admin-write. `prompts`: admin-only. **No permissive policies** — the service-role client (webhooks, cron, public share lookup, job worker) bypasses RLS deliberately.

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

**Permission checks:** RLS is the data-level enforcement; route-level checks are `session.user.id` ownership filters (`eq("user_id", userId)` everywhere) + plan gates (premium template switch → 403 `upgradeRequired`). Job reads go through `getJobForUser(id, userId)` — ownership enforced even on the service-role client ✅.

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
| PUT/PATCH | `/api/resumes/[id]` | Update resume / sections (`sectionType`+`data`, or `sections{}`); builder autosave (300 writes/min/user); premium-template gate | ✅ | `resumes`, sections | `updateResume`/`updateSections` (✅ UPSERT) |
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
| POST | `/api/ats-analyze` | Deep ATS report via shared pipeline; ✅ **`mode: "async"` enqueues on BullMQ and returns `{queued, jobId}` immediately**; sync mode persists history + `resumes.ats_score` | ✅ (plan-gated: `ats_checks`) | `ats_analyses`, `resumes`, `background_jobs` | `ats-pipeline` + `jobs/*` |
| GET | `/api/ats-analyses` | ATS history | ✅ | `ats_analyses` | service |
| GET | `/api/ats-score/[resumeId]` | Stored score + breakdown | ✅ | `resumes` | service |
| POST | `/api/analyze-jd` | JD match (keywords, gaps, %, category) | ✅ (plan-gated: `jd_analyses`) | `job_analyses` | `jd-analyzer/engine` |
| GET | `/api/analyze-jd` | JD analysis history (`?resumeId=`) | ✅ | `job_analyses` | service |
| GET | `/api/search` | Global dashboard search | ✅ | `resumes` | service |

### Jobs (✅ new)
| Method | URL | Purpose | Auth | Tables | Service |
|---|---|---|---|---|---|
| GET | `/api/jobs/[id]` | Poll background job status/result (owner-scoped) | ✅ | `background_jobs` | `jobs/store.getJobForUser` |

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
| POST | `/api/stripe/webhook` | Signature-verified events; **idempotent** (memory set + `webhook_events` unique ledger, delete-on-failure so retries reprocess); unknown price → safe `free` + Sentry alert; typed update payloads ✅ | — | `subscriptions`, `webhook_events` | service-role client |

### Export / data
| Method | URL | Purpose | Auth | Tables | Service |
|---|---|---|---|---|---|
| GET | `/api/export/[resumeId]?format=pdf\|docx\|txt\|html` | Multi-format export (filename sanitized) | ✅ | `resumes` | `export/*` generators |
| GET | `/api/data-export` | Download all user data (GDPR) | ✅ | all user tables | service |
| GET | `/api/notifications` | List + unread count + mark read | ✅ | `notifications` | `notifications/service` |
| GET/PUT | `/api/resume-updates`, PUT `[id]` | List / set added·ignored / add repo to resume | ✅ | `resume_updates`, `projects` | `resume-updates/service` |
| GET/PUT | `/api/settings` | Notification prefs (✅ typed toggles via 00031) | ✅ | `settings` | service |

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
- **DB**: `resumes` + 12 section tables.
- **Logic**: `RESUME_TYPES` section config per `targetLevel` (student/fresher/student_internship/experienced); `getOrderedSections` merges custom `sectionOrder` + user-created `customSections`; `computeResumeCompletion` weights required vs optional sections; debounced autosave PUT (300/min cap); ✅ **section saves use UPSERT on stable ids with diff-delete**.
- **Dependencies**: 8 templates (`features/resume-builder/templates/`), theme tokens, AI assistant.

### 10.2 AI Assistant (in-builder)
- **Frontend**: `features/ai-assistant/` — AiAssistantPanel, BulletEnhancer, SummaryGenerator/Improver, GrammarChecker, AchievementSuggestor, MetricsAdder, ActionVerbs, SectionRewriter, AtsOptimizer, WeakContentDetector, AiHistoryView.
- **Backend**: `POST /api/ai`, `services/ai/*` (17 actions).
- **Logic**: per-action prompts with `{input}`/`{context}` slots; DB-overridable via `prompts` table (60s cache); injection sanitization + numeric-claims validation (`guard.ts`); **deterministic fallbacks** (WeakContentDetector, ActionVerbs) when AI fails.
- **DB**: `prompts`, `usage_counts`.

### 10.3 ATS Check / Deep Analysis
- **Frontend**: ✅ `app/ats-check/` split — `page.tsx` + `OverviewTab`, `KeywordsTab`, `BulletsTab`, `FormattingTab`, `ImprovementsTab` (+ `types.ts`, `constants.ts`, `components.tsx`); one-click apply-all improvements + manual checklist.
- **Backend**: `POST /api/ats-analyze` (shared pipeline + ✅ async mode), `GET /api/ats-score/[resumeId]`, `GET /api/ats-analyses`, `GET /api/jobs/[id]`.
- **Logic**: `ats-pipeline.ts` orchestrates `analyzeDeepAts` (deterministic: parser confidence, keyword scan with synonym aliases, density, bullet quality with rewrites, formatting, repetition, recruiter score, ranked top improvements) → optional Gemini `ats-deep-analyze` merge (clamped numeric fields, weak-bullet filter against actual text).
- **DB**: `ats_analyses`, `resumes.ats_score` (dashboard cards), `usage_counts`, `background_jobs` (async).

### 10.4 JD Match
- **Frontend**: `app/tools/job-match/page.tsx`, `app/resume/[resumeId]/analysis/page.tsx`.
- **Backend**: `POST /api/analyze-jd` (JSON or FormData, incl. JD URL via SSRF-guarded `fetch-url.ts`), `GET /api/analyze-jd`.
- **Logic**: `jd-analyzer/engine.ts` — 120+ common-skill lexicon, role-type detection (9 roles), experience-year extraction, category inference, matched/missing/skills/tools, category-specific suggestions.
- **DB**: `job_analyses`.

### 10.5 Application Kit (one-click application workflow)
- **Frontend**: `app/tools/application-kit/page.tsx` (489 lines) — paste a JD, generate customized resume, cover letter, recruiter email, LinkedIn message, interview questions, skill gaps.
- **Backend**: 3 AI actions (`recruiter-email`, `linkedin-message`, `interview-questions`) via `POST /api/ai`; admin-editable prompts.
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

### 10.13 Background jobs (✅ new)
- **Frontend**: `app/ats-check` polls `GET /api/jobs/[id]` after an async `ats-analyze`.
- **Backend**: `lib/jobs/*`, `workers/ai-worker.ts`; job lifecycle `queued → processing → completed/failed`, 3 BullMQ attempts with exponential backoff.
- **Logic**: `ats-pipeline.ts` shared by sync/async/inline paths; `processAtsJob` persists result + resume score; inline fallback when Redis is absent (still DB-tracked).
- **DB**: `background_jobs`.

---

## 11. Data Flow (traced request)

**Example A: ATS-check a stored resume (sync) → see score on dashboard.**

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
 ├─ runAtsPipeline → analyzeDeepAts (pure, deterministic) → Gemini merge (best-effort)
 ├─ insert ats_analyses row  +  UPDATE resumes SET ats_score, ats_breakdown
 ├─ incrementUsage(ats_checks)
 └─ { success, data: DeepAtsReport, ai:{status} }
 │
 ▼
UI renders tabbed report; dashboard card reads resumes.ats_score (GET /api/resumes)
```

**Example B: ATS-check in async mode.**

```
UI → POST /api/ats-analyze { mode: "async" }
  → createJob(background_jobs: queued) → BullMQ "ats-analysis" queue
  → 200 { queued: true, jobId }
UI → GET /api/jobs/[jobId]  (owner-scoped)
  → worker (pnpm worker) drains queue:
      processAtsJob → updateJobStatus(processing) → runAtsPipeline
      → persist ats_analyses + resumes.ats_score → updateJobStatus(completed, result)
  → client re-polls until completed/failed; no Redis → runs inline instead
```

**DB layer**: every query is `createServerSupabaseClient()` (RLS applies → only own rows) **except**: webhooks, cron, public `/share` fetches, the NextAuth jwt-callback profile lookup, and the job worker/store, which use the **service-role** client (`lib/supabase/admin.ts`).

---

## 12. AI Integration

| Aspect | Detail |
|---|---|
| **Provider** | Google Gemini (REST `generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`) |
| **Model** | `gemini-2.0-flash` (single model everywhere) |
| **Prompt architecture** | Per-action templates with `{input}`/`{context}` slots (`services/ai/prompts.ts`); **DB-overridable** via `prompts` table (cache 60s, invalidate on admin publish) |
| **Streaming** | ❌ None — one-shot `generateContent` with 25s AbortController timeout |
| **Async execution** | ✅ **BullMQ background worker** (`workers/ai-worker.ts`) for heavy analysis; HTTP returns immediately in async mode; inline fallback without Redis |
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
| **Supabase** | Postgres + Auth (OAuth users reconciled via service role); ✅ typed clients | URL + anon + service-role keys | Errors surfaced as 500s; RLS is DB-side |
| **Google Gemini** | All AI generation | `GEMINI_API_KEY` | Mapped status messages (400/401/403/429/500/503); deterministic fallbacks |
| **Stripe** | Subscriptions: checkout, portal, webhooks, customers | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs | Webhook unknown price → default `free` + alert; no Stripe → free plan only |
| **GitHub API** | Repo sync, trending, contributions, OAuth | OAuth client id/secret; user token (AES-256-GCM encrypted) | Safe error messages; sync no-ops on failure |
| **LinkedIn API** | OAuth + (paste import uses Gemini, not API) | client id/secret | Import best-effort |
| **Redis** | ✅ Rate limiting **and** BullMQ job queue | `REDIS_URL`/HOST/PORT | Rate limit → in-memory sliding-window fallback (fail-closed); queue → inline job execution fallback |
| **Resend** | Opt-in notification emails | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Silently skipped when unconfigured; never throws |
| **Sentry** | Errors + performance (server/edge/client) | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG/PROJECT/AUTH_TOKEN` | Import-guarded try/catch everywhere (`logError`) |
| **Google Fonts** | Inter/JetBrains Mono (CSP allowlist) | — | — |
| **Vercel** | Hosting + cron (`/api/cron/github-poll` @ 06:00) | `vercel.json` | — |

---

## 14. Security Review

**Strengths (verified in code):**
- RLS on all user tables with ownership policies; service-role only in server-only contexts (webhooks, cron, share lookup, job worker/store).
- ✅ **Typed DB clients** remove the previous `Record<string, unknown>` cast surface on writes; update payloads are literal-typed and excess-key-checked.
- CSP with tight `default-src 'self'` + HSTS/XFO/nosniff/Referrer-Policy/Permissions-Policy headers (`next.config.mjs`).
- Rate limiting: login (5/min/email), AI (20/min/IP), builder save (300/min/user), resume import, signup.
- Input validation: zod on every write route; output sanitization: `escapeHtml` in HTML export, email HTML, `sanitizeFilename` for Content-Disposition.
- Secrets: env-var only; `ENCRYPTION_KEY` (32-byte hex) validated; GitHub tokens encrypted at rest with key-rotation support.
- SSRF guard on user-supplied JD URLs: DNS resolution + private-IP block (IPv4/IPv6 incl. `::ffff:` mapped), 3-redirect cap, 2MB cap, 8s timeout.
- Admin mutations audit-logged; `is_active=false` blocks login; error messages sanitized (`safeErrorMessage`; raw `error.message` leaks removed from auth/admin/GitHub routes).
- Session cookies: httpOnly + secure + sameSite=lax + `__Secure-` prefix in prod; 30-day JWT with rolling refresh.
- ✅ Job status API enforces ownership even through the service-role client (`getJobForUser` filters by `user_id`).

**Weak points / risks:**
1. **OAuth → Supabase reconciliation uses the service-role key** in the NextAuth `jwt` callback (`lib/auth.ts`) — this path is exercised on every OAuth login; it is server-only, but it's the highest-value surface to review. If `profiles` email matching is ever ambiguous (duplicate emails), behavior is deterministic but must be tested.
2. **No CSRF protection beyond NextAuth defaults** on the credential-less API POSTs (sameSite=lax mitigates; custom API routes don't verify CSRF tokens — acceptable for same-origin SPA + lax cookies, but worth documenting).
3. **Rate limiting is per-IP (AI) / per-user (save)** — no per-account global throttle on resume creation/export; abuse is bounded by plan limits instead.
4. **`dangerouslySetInnerHTML`** for the theme no-flash script (`layout.tsx`) — a static constant, low risk, but flagged by CSP tooling (script-src includes `'unsafe-inline'`).
5. **Hardcoded admin emails** in `lib/admin-emails.ts` (rotating a compromised list requires a deploy).
6. **File uploads** are parsed server-side with pdf-parse/mammoth — large/zip-bomb docs are bounded by route-level checks but there's no explicit per-user upload quota beyond request size limits.
7. **Job worker credentials**: the worker uses the service-role client — fine today (single-tenant ops), but worth documenting that a hostile Redis (`REDIS_URL` from env) could enqueue arbitrary `jobType` names (job types are whitelisted at the enqueue API; the worker only listens on known queues).
8. `fetch-url.ts` blocks private IPs at DNS level — good; note it resolves once per redirect hop (correct) and rejects `.internal`/`.local`/`.lan`.

---

## 15. Performance Review

**Caching:**
- ✅ **TanStack Query** client cache for resume/dashboard reads (typed keys, dedupe, background refetch, optimistic updates).
- Public: `/api/templates` `public, s-maxage=300, swr=300`; `/api/health` `no-store`.
- In-app: prompt registry 60s TTL.
- **Gap:** no Redis cache for hot queries (profiles, templates) beyond rate limits; no ISR on marketing pages.

**DB queries:**
- `getResume` uses a **single batched query** (12 related tables, ordered) — avoids N+1. ✅
- Resume list is a single indexed-by-`updated_at` query. Applications/audit are paginated. ✅
- ✅ **`updateSections` is now a single UPSERT per section** (stable ids, `onConflict: "id"`, skills `onConflict: "resume_id"`) + one diff-delete for removed rows — the previous 12 sequential delete+insert pairs are gone.

**N+1:** None found in hot paths (batch selects used); GitHub sync loops are per-repo but bounded (50 repos).

**Bundle / rendering:**
- Heavy deps (three.js, GSAP, react-pdf) are on marketing/builder pages only; 3D scenes are client-lazy; PDF render is server-side.
- ✅ `ats-check/` is split into five tab components (no more single 1,254-line client bundle); `deep-ats.ts` (600+ lines, server-side) is the remaining large module.
- Dark mode uses CSS variables → no re-render cost; palette inversion avoids per-file rewrites.

**API bottlenecks:**
- ✅ **Async mode moves heavy AI off the HTTP request** when Redis is configured (BullMQ worker); sync mode still blocks (sub-second deterministic + ~2-5s AI) and remains the default when no Redis.
- Stripe webhook uses service-role client; idempotency ledger adds one insert per event (indexed unique).

---

## 16. Code Quality Review

**Strong:**
- Consistent feature/service/lib layout; strict TS with shared types (`types/resume.ts`, `types/ai.ts`) **and now the typed Supabase `Database`** ✅.
- Small, single-purpose pure functions extracted for tests (bullet-matcher, completion, deep-ats, ats-pipeline, template-recommendation, project suggest).
- Unified response envelope + `withErrorHandling`.
- Meaningful commit history (conventional commits; phase-based PRs — mapper tests, UPSERT, ATS split, React Query, Playwright, background jobs, typed schema, docs).
- Inline docs explain *why* (K-14/RLS comments, webhook idempotency rationale, UPSERT rationale).

**Debt / weaknesses (with ✅ = resolved by hardening):**
1. ✅ **Duplicate mappers** — consolidated into `services/resume/mapper.ts` (handles `section_order`, `custom_sections`, `accent_color`); the inline copy is gone.
2. ✅ **README drift** — rewritten for pnpm, 34 vitest files + Playwright, 8 templates, real export.
3. **Mixed error handling** — some routes use `withErrorHandling`; others keep per-route try/catch returning generic 404/500 (e.g. `resumes/[id]` returns 404 for internal errors). Inconsistent but safe.
4. **Large files** — ✅ `ats-check/page.tsx` split; remaining: `deep-ats.ts` (600+ lines), `htmlRenderer.ts` (string-based template renderers with a TODO to migrate to `renderToStaticMarkup`).
5. **Unused/vestigial code** — ✅ `lib/supabase/middleware.ts` removed; remaining: `services/ai/types.ts` is empty; `strength.ts` superseded by `deep-ats.ts` for the main flow; landing 3D scenes present but unused.
6. ✅ **Build errors on `main`** — `tsc --noEmit` is fully green (0 errors); lint 0 errors (7 pre-existing warnings in `app/page.tsx`, sign-in).
7. ✅ **`updateSections` delete-then-insert** — replaced by UPSERT with stable IDs; diff-delete only touches rows the client removed.
8. **Typed-schema maintenance** — `src/lib/supabase/types.ts` is hand-maintained; the live DB has drifted from repo migrations (e.g. `is_active`, `last_seen_at`, `repo_stars` exist in migrations but not the deployed DB — code tolerates this via `isMissingColumnError` retries). Regenerating via `supabase gen types` against a synced DB is the recommended next step.

**SOLID/Clean-Architecture verdict:** Good separation (services = single responsibility); jobs are cleanly split (queue/processor/store/worker); the dual-mapper + big-page drift that motivated the hardening program is resolved. No DI framework (not needed at this scale).

---

## 17. Current Development Status

**Completed (production-quality):** builder (13-15 sections, 8 templates, autosave, reorder, custom sections), AI assistant (17 actions), deterministic ATS + deep ATS + AI enrichment, JD matching, Application Kit, multi-format export (PDF/DOCX/TXT/HTML), GitHub sync + cron, job tracker, notifications + Resend email, subscriptions (Stripe), admin panel (users/stats/prompts/templates/audit), share links, data export, dark mode, API hardening, security headers, Docker + CI — **plus the hardening program:**
- ✅ `tsc`/lint green, 436 vitest tests, **13 Playwright e2e specs** (+ CI workflow).
- ✅ `updateSections` UPSERT; typed 29-table `Database` across all Supabase clients.
- ✅ TanStack Query (dashboard/resumes with optimistic updates).
- ✅ Background jobs: BullMQ worker (`pnpm worker`), job status API, async ATS mode, shared pipeline.
- ✅ ATS page split into five tab components; README modernized; stray `packages/` dir gitignored.

**Incomplete / partial:**
- LinkedIn OAuth import is partial (paste-import complete; deep profile sync not).
- Playwright specs run against a local/dev server — to be fully green in CI they need a seeded test DB + Stripe test keys.
- Live DB has unapplied migrations (drift from repo); `supabase gen types` not yet run against the canonical DB.
- No load tests; analytics page is basic; jobs page is a thin wrapper (uses GitHub trending).
- Onboarding is 2-step only; no multi-language.

**TODOs / markers found:** `htmlRenderer.ts` TODO (migrate to renderToStaticMarkup), `scripts/` (fix_resumes_console.py, rls-audit.sql, fix_env_validation.py, fix_auth_rate_limit.py — ad-hoc maintenance scripts).

**Dead code:** empty `services/ai/types.ts`, `strength.ts` (legacy report), landing 3D scenes (`Hero3DScene`, `Sync3DScene`) present but unused.

**Experimental:** dark-mode CSS-variable inversion (feature-flagged only by presence of `.dark`), Application Kit (new, no analytics yet), async ATS mode (defaults to sync when Redis is absent).

---

## 18. Build & Deployment

**Env vars:** 30+ — see `.env.example` (Supabase, Gemini, OAuth ×3, NextAuth, ENCRYPTION_KEY, Stripe, Redis, Sentry, ADMIN_EMAILS, ALLOWED_ORIGINS). Critical ones are startup-validated. `REDIS_URL` is optional (enables the job queue; absent → inline fallback).

**Build:**
```bash
pnpm install
export SKIP_ENV_VALIDATION=false  # CI sets false
pnpm build   # next build --standalone; postbuild copies static+public into standalone
```

**Worker (new):**
```bash
pnpm worker   # tsx src/workers/ai-worker.ts — requires REDIS_URL + Supabase env; graceful shutdown on SIGINT/SIGTERM
```

**E2E (new):**
```bash
pnpm exec playwright test   # e2e/ specs; playwright.config.ts; Page Object Models in e2e/pages/
```

**Docker:** multi-stage `node:22-alpine` (builder → runner as non-root `nextjs`), `NEXT_PUBLIC_*` build args, `PORT=3000`, `CMD node server.js`. `docker-compose.yml` wires the full env surface (add `pnpm worker` as a second service when Redis is provisioned).

**CI/CD (`.github/workflows/`):**
- `ci.yml` — Lint, TypeCheck, Test & Build on a Node version matrix (pnpm).
- `pr-quality.yml` — PR quality gates.
- `docker.yml` — Docker image build.
- `e2e.yml` — ✅ Playwright e2e run.

**Deploy targets:** Vercel (recommended; `vercel.json` defines the daily cron) or any Node 20+ host / Docker; the worker needs a long-running host or a container with Redis.

**Cloud infra:** Supabase (DB/auth), Vercel (hosting), Stripe, Gemini, Redis (optional: rate limiting + queue), Resend, Sentry — all external/managed; no self-hosted infra.

---

## 19. Dependency Graph (module level)

```
app/* pages ──► features/* ──► components/* (shared UI)
                  │
app/api/* routes ─► lib/ (auth, validation, rate-limit, api envelope, supabase clients)
                  │        ├── supabase/{server,admin,client} ← types.ts (Database) ✅
                  │        └── query/ (TanStack Query client + resume hooks) ✅
                  ▼
             services/*
               ├─ resume/            (CRUD/UPSERT, mapper, completion, bullet-matcher)
               ├─ resume-analyzer/   (parser → ats-scorer/deep-ats/grammar
               │                      → ats-pipeline.ts ✅ shared orchestrator)
               ├─ jd-analyzer/       (depends on ats-scorer types only)
               ├─ ai/                (client ← prompts ← guard; prompts ← supabase)
               ├─ export/            (pdf ← @react-pdf; docx ← docx; txt; html)
               ├─ github/sync        (→ notifications → email; encryption)
               ├─ applications/ resume-updates/ templates/ notifications/ projects/
               └─ (all → lib/supabase/*)

  async path:  api/ats-analyze → lib/jobs/queues → BullMQ/Redis
                            ↓ createJob / updateJobStatus → lib/jobs/store → supabase/admin
               workers/ai-worker → lib/jobs/ats-processor → services/resume-analyzer/ats-pipeline ✅
               client polls api/jobs/[id] → lib/jobs/store.getJobForUser

external: Gemini (ai/client) · Stripe (webhook/checkout) · GitHub API (github/*) ·
          Resend (notifications/email) · Redis (rate-limit + jobs) · Sentry (lib/api, instrumentation)
```

Key coupling notes: `services/resume/mapper.ts` imports from `features/resume-builder/config/resume-types.ts` (completion), so the feature layer is a dependency of the service layer for the completion widget — a minor inversion; `lib/subscription` imports `lib/stripe` for plan limits; `lib/jobs/*` imports the admin Supabase client (service role) for queue-ledger persistence.

---

## 20. Improvement Suggestions

**Architecture (✅ = done during hardening)**
- ✅ Consolidate the two resume mappers into `mapper.ts` everywhere.
- ✅ Split `ats-check/page.tsx` into tabs; remaining: split `deep-ats.ts`; migrate `htmlRenderer.ts` to `renderToStaticMarkup` (acknowledged TODO).
- ✅ Add a typed DB layer (29-table `Database` in `lib/supabase/types.ts`); **next step: regenerate from `supabase gen types` against the canonical DB** so hand-maintenance stops.
- Standardize all routes on `withErrorHandling` + `ok()/fail()` (remove remaining per-route try/catch).

**Performance**
- ✅ Client-side TanStack Query for dashboard/resume reads; extend to ATS history, applications, and admin tables.
- ✅ Parallel `updateSections` → single UPSERT with `ON CONFLICT`; benchmark confirms single-write + diff-delete.
- ✅ Lazy-load the ATS report (split into tab components); memoize the deep-ATS engine result.

**Security**
- ✅ `tsc --noEmit` green; add `pnpm audit` to CI.
- Add per-account rate limits on create/export; optional CSRF token on mutating API routes.
- Move `ADMIN_EMAILS` fully to env (keep hardcoded list only for bootstrapping, remove from client bundle if possible — note the client redirect list is deliberate).
- Rotate credentials if any were ever committed (README warns about git-history secrets).
- Document worker credential posture (service-role) and whitelist job types at the enqueue boundary.

**Scalability / product**
- ✅ Background job for AI fan-out (BullMQ + `pnpm worker`); provision Redis (e.g. Upstash) so ATS and future resume-generation/job-match always run async; add job cancellation + progress endpoints.
- ✅ e2e tests (Playwright: auth, protected routes, public pages) — extend to the full signup→build→analyze→export flow with a seeded test DB; API contract tests.
- Apply the pending migrations to the live Supabase project so `isMissingColumnError` retries become dead code.
- Add usage analytics + funnel instrumentation (Sentry is wired; product analytics is not).

**Future roadmap** (from README + code): kanban job tracker, interview-question predictions (partially shipped in Application Kit), multi-language resumes, coach/team collaboration, public API.

---

## 21. Important Files (top 60)

**Config / infra**
1. `package.json` — deps, scripts (dev/build/test/lint/**typecheck**/**worker**).
2. `next.config.mjs` — standalone output, security headers/CSP, image domains.
3. `tailwind.config.js` — design tokens + CSS-variable gray palette (dark mode).
4. `src/middleware.ts` — NextAuth route protection.
5. `src/instrumentation.ts` + `sentry.{server,edge}.config.ts` + `instrumentation-client.ts` — Sentry init.
6. `Dockerfile` / `docker-compose.yml` / `vercel.json` / `.env.example` / `vitest.config.ts` / `playwright.config.ts` ✅.
7. `.github/workflows/{ci,pr-quality,docker,e2e}.yml` ✅.

**Auth / core libs**
8. `src/lib/auth.ts` — NextAuth options (providers, jwt/session callbacks, cookie hardening, OAuth↔profiles reconciliation).
9. `src/lib/supabase/{client,server,admin,types}.ts` — three typed clients + the 29-table `Database` type ✅.
10. `src/lib/api.ts` — ok/fail/applyCors/publicCacheHeaders/safeErrorMessage/logError/withErrorHandling.
11. `src/lib/validation.ts` — all zod schemas + `validateOrError`.
12. `src/lib/rate-limit.ts` — Redis + in-memory sliding window.
13. `src/lib/encryption.ts` — AES-256-GCM with key rotation.
14. `src/lib/subscription.ts` + `src/lib/stripe.ts` — plan limits, usage counters, Stripe client.
15. `src/lib/admin.ts` + `admin-emails.ts` — admin checks + audit logging.
16. `src/lib/fetch-url.ts` — SSRF-guarded JD fetching.
17. `src/lib/github.ts` — encrypted token access + authenticated GitHub fetch.
18. `src/lib/env-validator.ts` — startup env checks.
19. `src/lib/query/{client,keys,resume-hooks}.ts` — ✅ TanStack Query setup.
20. `src/lib/jobs/{queues,ats-processor,store,types}.ts` — ✅ BullMQ queue/processor/persistence.
21. `src/workers/ai-worker.ts` — ✅ standalone background worker.

**Types**
22. `src/types/resume.ts` — the full `ResumeData` model (17+ section shapes).
23. `src/types/ai.ts` — `AiAction` union (17 actions), request/response, analysis types.
24. `src/types/{user,api}.ts`.

**Services**
25. `src/services/resume/service.ts` — CRUD + `updateSections` (UPSERT) + duplicate.
26. `src/services/resume/mapper.ts` — the single row→ResumeData mapper (incl. custom sections) ✅.
27. `src/services/resume/completion.ts` — section status + completion % (dashboard widget + builder).
28. `src/services/resume/bullet-matcher.ts` — pure fuzzy bullet rewriting.
29. `src/services/resume-analyzer/ats-pipeline.ts` — ✅ shared sync/async ATS orchestrator.
30. `src/services/resume-analyzer/index.ts` — pipeline orchestrator.
31. `src/services/resume-analyzer/deep-ats.ts` — the deep deterministic ATS report (largest remaining module).
32. `src/services/resume-analyzer/ats-scorer.ts` — 8-subscore weighted ATS engine.
33. `src/services/resume-analyzer/{parser,grammar-checker,strength}.ts`.
34. `src/services/jd-analyzer/engine.ts` — JD keyword/skill-gap/role/category engine.
35. `src/services/ai/client.ts` — Gemini client + prompt builder + status mapping.
36. `src/services/ai/prompts.ts` — DB-backed prompt registry (60s cache).
37. `src/services/ai/guard.ts` — injection sanitizer + numeric-claim validator.
38. `src/services/export/{pdfRenderer,docxGenerator,htmlRenderer,txtGenerator,formats,pdf-templates}.tsx/ts`.
39. `src/services/github/sync.ts` — repo polling → updates → notifications/email.
40. `src/services/resume-updates/service.ts` — add repo as project.
41. `src/services/applications/service.ts` — tracker CRUD (paginated, typed updates ✅).
42. `src/services/notifications/{service,email}.ts` — in-app + Resend.
43. `src/services/templates/service.ts` — catalog CRUD.

**Features / UI**
44. `src/app/ats-check/{page,OverviewTab,KeywordsTab,BulletsTab,FormattingTab,ImprovementsTab,types,constants,components}.tsx/ts` — ✅ split deep-ATS report UI.
45. `src/app/builder/[resumeId]/{layout,page,builder-context}.tsx` — builder shell + autosave context.
46. `src/app/tools/application-kit/page.tsx` — one-click application workflow.
47. `src/features/resume-builder/config/resume-types.ts` — section config per target level.
48. `src/features/resume-builder/config/template-recommendation.ts` + `template-discovery.ts` — explainable template scoring.
49. `src/features/resume-builder/templates/TemplateRenderer.tsx` + `theme.ts` — template router + theming.
50. `src/features/ai-assistant/context/AiAssistantContext.tsx` — AI panel state/history.
51. `src/features/theme/ThemeProvider.tsx` — dark mode + no-flash script.
52. `src/components/layout/DashboardLayout.tsx` / `Navbar.tsx` / `NotificationCenter.tsx` — app shell.
53. `src/features/subscription/components/UpgradeDialog.tsx` + `SubscriptionGuard.tsx` — paywall UX.
54. `src/app/providers.tsx` — ✅ TanStack Query + Session providers.

**API routes (most important)**
55. `src/app/api/ats-analyze/route.ts` — deep ATS (sync + ✅ async modes) + persistence.
56. `src/app/api/jobs/[id]/route.ts` — ✅ job status polling (owner-scoped).
57. `src/app/api/ai/route.ts` — rate-limited, plan-gated AI proxy.
58. `src/app/api/resumes/[id]/route.ts` — builder save (PUT/PATCH) with section UPSERT.
59. `src/app/api/stripe/webhook/route.ts` — signature-verified, idempotent subscription sync (typed updates ✅).
60. `src/app/api/export/[resumeId]/route.ts` + `src/app/api/cron/github-poll/route.ts` + `src/app/api/health/route.ts` — format dispatch / scheduled sync / liveness.

**E2E (new)**
- `e2e/specs/{auth,protected-routes,public-pages}.spec.ts` + `e2e/pages/` (POM) + `e2e/fixtures.ts` — 13 specs.

**Data**
- `supabase/migrations/00001_schema.sql` (core + RLS), `00003_subscriptions.sql` (plans/settings/prompts/usage), `00007_templates_catalog.sql`, `00023_resume_share.sql`, `00026_custom_sections.sql`, `00027_rls_ownership_audit.sql`, `00028_webhook_events.sql`, `00029_upsert_support.sql`, `00030_background_jobs.sql`, `00031_settings_notification_toggles.sql`.

---

## 22. Developer Onboarding Guide

**1. Get it running**
```bash
pnpm install && cp .env.example .env.local   # fill Supabase URL/keys, NEXTAUTH_SECRET/URL, ENCRYPTION_KEY, ADMIN_EMAILS, GEMINI_API_KEY
pnpm dev                                     # Turbopack dev server on :3000
```
Apply `supabase/migrations/*.sql` (32 files) in numeric order (SQL editor or `supabase db push`). Set `ADMIN_EMAILS` to your email to see `/admin`. For background jobs: set `REDIS_URL` and run `pnpm worker` in a second terminal (the app falls back to inline jobs without it).

**2. Where to start reading**
- Data model: `src/types/resume.ts` → `supabase/migrations/00001_schema.sql` → `src/lib/supabase/types.ts` (the typed `Database`).
- Auth: `src/lib/auth.ts` + `src/middleware.ts`.
- One full vertical slice: `app/ats-check` (UI) → `api/ats-analyze` (sync + async) → `services/resume-analyzer/ats-pipeline.ts` → `lib/jobs/*` + `workers/ai-worker.ts`.
- Conventions: `lib/api.ts` envelope, `lib/validation.ts` zod, `lib/subscription.ts` plan gates, `lib/query/` for React Query hooks.

**3. How a feature gets added**
1. Add zod schema in `lib/validation.ts` + types in `types/*.ts` (and the `Database` type if new columns/tables are introduced).
2. Add service function in the right `services/*` folder (pure logic → testable module).
3. Add `app/api/.../route.ts` — `getServerSession` → rate-limit → plan gate → `validateOrError` → service → `ok()/fail()` (or `withErrorHandling`).
4. Build UI under `features/<name>/` (client component), wire to the route; for data reads prefer the `lib/query/` hooks.
5. For AI: add prompt to `services/ai/prompts.ts`; for heavy/optional work, consider the BullMQ job path (`lib/jobs/`) instead of blocking the request.
6. For writes that replace section rows, use the UPSERT pattern in `updateSections` (stable ids, `onConflict`, diff-delete).

**4. Validation before pushing**
```bash
pnpm typecheck && pnpm lint && pnpm test   # 0 errors · 436 tests
pnpm build                                 # standalone output
pnpm exec playwright test                  # e2e (needs dev server + seeded DB)
```

**5. Common pitfalls**
- Two `00011_*` migrations exist (`00011_ats_scores.sql`, `00011_profiles_is_active.sql`) — a numbering collision that also signals live-DB drift; always check whether a migration was actually applied.
- The typed `Database` is hand-maintained — when changing schema, update `lib/supabase/types.ts` in the same PR or `tsc` fails.
- `settings`/`subscriptions` toggles must be typed in both the zod schema and the `Database` Update types (excess keys are rejected at compile time).
- Redis is optional: don't assume `REDIS_URL`; the inline fallback path must keep working.
- Dark-mode palette lives in Tailwind CSS variables — don't hardcode `bg-gray-*` values that break the `.resume-paper` print palette.

---

## 23. Final Project Summary

**Architecture:** A pragmatic feature-based Next.js monolith with a clean service layer, RLS-backed Supabase, a hybrid deterministic+LLM AI stack, and now an optional async job path for heavy work. The seven-phase hardening program resolved the original flagged debts: `tsc`/lint are green, the ATS UI is split, section writes are UPSERT-based, the client cache and data fetching use TanStack Query, e2e coverage exists (Playwright), heavy AI can run in a BullMQ worker, and the entire persistence layer is typed through a 29-table `Database`.

**Strengths:** Type safety (strict TS + typed Supabase + zod on every route); clean layering and testable pure modules (436 tests); security posture (RLS, rate limiting, SSRF guard, encrypted tokens, sanitized errors, audit log); dual-mode AI (deterministic fallbacks keep the app working without Gemini); explicit rationale comments (K-14/RLS/UPSERT).

**Weaknesses / risks:** hand-maintained DB types (drift between repo migrations and the live DB); service-role usage in the OAuth reconciliation path and the job worker; mixed error-handling styles; `htmlRenderer.ts` string templates; a few vestigial files; e2e specs not yet fully self-sufficient in CI (need seeded DB + Stripe test keys).

**Overall design:** solid, conventional, and production-credible for its scope — a well-organized codebase that a new senior engineer can contribute to within a day using §22.

**Future scalability:** the queue/worker split, typed schema, and React Query caching lay the groundwork for fan-out (resume generation, job match) and multi-instance deployment; the main scaling prerequisites are provisioning Redis, syncing the live DB to migrations, and regenerating DB types from the canonical schema.
