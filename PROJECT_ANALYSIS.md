# AI Resume Builder & Analyzer — Complete Onboarding Analysis

> Written for a senior engineer joining the team who has never seen this project.
> Every claim below was verified against the repository (commit `main`, working tree including uncommitted WIP). Where a behavior could not be determined from code alone, it is explicitly marked **"verify at runtime"**.

---

## 1. Executive Summary

| | |
|---|---|
| **Project name** | `ai-resume-builder-and-analyzer` (product name: "AI Resume Builder & Analyzer" / "ResumeAI") |
| **Purpose** | A full-stack SaaS web app for building, analyzing, tailoring, and exporting resumes with AI assistance. |
| **Business problem** | Job seekers waste hours writing resumes that get filtered out by Applicant Tracking Systems (ATS). This product combines a structured resume builder with deterministic ATS-scoring, AI content generation (anti-hallucination guarded), GitHub/LinkedIn auto-import, multi-format export (PDF/DOCX/HTML/TXT/LaTeX), job tracking, and a freemium subscription (Stripe). |
| **Target users** | Job seekers (students, freshers, experienced professionals), plus internal admins (user management, prompt editing, template catalog, audit log). No team/enterprise tier yet. |
| **Maturity** | **Feature-complete MVP transitioning to production.** Has CI (lint/typecheck/tests/build), a 475-test suite, Sentry, rate limiting, durable webhook idempotency, RLS audits, and background jobs — but also several hardening gaps (see §17, §20). No deployed demo URL found in the repo. |
| **Architecture (one line)** | A Next.js 15 (App Router) monolith where thin API-route "controllers" delegate to a service layer over Supabase/PostgreSQL (PostgREST + RLS), auth is NextAuth.js JWT with Supabase as the identity/user store, Gemini powers AI, Stripe powers billing, and Redis is optional (rate limiting + BullMQ background jobs with an inline fallback). |
| **High-level workflow** | Sign up → onboarding (user type, career goals) → create/import resume → edit sections in the builder (with debounced autosave, AI inline tools, custom section order) → run ATS/JD analysis (deterministic + AI deep scan) → apply one-click fixes → pick a template variant → export or share via token link → optionally connect GitHub/LinkedIn to auto-fill and get "resume updates" → track applications. Admins manage users, prompts, templates, and analytics in `/admin`. |

---

## 2. Tech Stack

### Frontend
| Tech | Why |
|---|---|
| **Next.js 15 (App Router)** | SSR/SSG for landing + share pages, RSC where possible, API routes as the backend, Turbopack dev (`next dev --turbo`). |
| **React 19** | Component model; `memo` used for the template renderer (A-18). |
| **TypeScript 5.x strict** | `strict: true`, `@/` path alias → `./src`. |
| **Tailwind CSS 3.4** | Design tokens are CSS variables (`globals.css`) mapped in `tailwind.config.js`; dark mode via `.dark` class. |
| **TanStack Query 5** | Server-state cache for resumes/notifications (`src/lib/query/`). |
| **next-auth/react** | Session client. |
| **framer-motion, GSAP, three.js (+drei/fiber)** | Animations; the 3D hero (`src/components/3d/FloatingOrbs.tsx`). |
| **lucide-react + react-icons** | Icons. |
| **sonner** | Toasts (incl. AI anti-fabrication warnings). |
| **qrcode.react** | QR codes on public share links. |
| **driver.js** | Guided product tour (`src/components/TourGuide.tsx`). |
| **@react-pdf/renderer** | PDF export — reuses the **same** React template components as the builder (the `src/services/export/pdf-templates.tsx` renderers). |
| **docx (npm)** | DOCX export. |
| **mammoth** | DOCX text extraction for resume upload/import. |
| **pdf-parse + pdfjs-dist 5.x** | PDF text extraction; a dedicated worker bootstrap exists in `parser.ts` (see §12/§16 for the bundled-worker fix). |

### Backend / Data
| Tech | Why |
|---|---|
| **Supabase (PostgreSQL 15+) + PostgREST** | Database, RLS, and (partially) identity. All reads/writes go through the typed Supabase JS client — there is no ORM and no raw SQL outside migrations. |
| **@supabase/ssr** | Browser + server cookie-based clients. |
| **NextAuth.js v4** | Session management (JWT strategy), Google/GitHub/LinkedIn OAuth + credentials. |
| **Zod 4** | Every API payload validated (`src/lib/validation.ts`, `validateOrError`). |
| **ioredis** | Rate limiting; also BullMQ broker. **Optional** — in-memory fallbacks everywhere. |
| **BullMQ 6** | Background job queue (`ats-analysis`); optional. |
| **stripe SDK** | Checkout, customer portal, signature-verified webhooks. |
| **Google Gemini** | AI (`gemini-2.0-flash`, fallback `gemini-2.5-flash-lite`), REST via fetch, no SDK. |
| **Resend (HTTP API)** | Notification emails (optional, skipped silently when unconfigured). |
| **@sentry/nextjs** | Error + performance monitoring (server, edge, client). |
| **bcrypt** | Not used — passwords live in Supabase Auth, not this repo. |

### Tooling / Ops
| Tech | Why |
|---|---|
| **pnpm 11** (workspace + `allowBuilds` + overrides in `pnpm-workspace.yaml`) | Package manager; **pnpm-only** repo. |
| **Node 22** (`.nvmrc`) | Runtime; pnpm 11 requires ≥22.13. |
| **Vitest 3** | 475 tests / 36 files (`src/**/*.test.ts(x)`). |
| **ESLint 9 flat config** | `@next/eslint-plugin-next` + `typescript-eslint` recommended; **no Prettier** — formatting follows ESLint conventions. |
| **GitHub Actions** | `ci.yml` (lint/typecheck/test/build + template-catalog integrity gate) and `pr-quality.yml` (title format, labeler, description warning). |
| **Vercel** (recommended target) | `next.config.mjs` sets `output: "standalone"`; `postbuild` copies static assets. |
| **Sentry** | DSN auto-detected by the Next.js SDK; enabled only in production. |

---

## 3. Folder Structure

```
.
├── supabase/migrations/          # 39 numbered SQL files (00001…00038; 00011 appears twice)
├── scripts/                      # generate-supabase-types.mjs, generate-imported-templates-migration.mjs, rls-audit.sql
├── .github/workflows/            # ci.yml, pr-quality.yml (+ PR templates, labeler)
├── patches/                      # @react-pdf__textkit@6.3.0.patch (pnpm patched dependency)
└── src/
    ├── middleware.ts             # Route protection (NextAuth withAuth)
    ├── instrumentation.ts        # Loads Sentry config by runtime (nodejs/edge)
    ├── types/                    # Shared domain types: resume.ts, user.ts, ai.ts, api.ts
    ├── app/                      # App Router: pages + all API routes under app/api/
    ├── components/               # Cross-feature UI: ui/, layout/, landing/, 3d/, TourGuide
    ├── features/                 # Feature modules (auth, resume-builder, ai-assistant, ats-check,
    │                             #  subscription, theme, dashboard, export, onboarding)
    ├── lib/                      # Shared infra: auth, validation, api (response helpers),
    │                             #  rate-limit, encryption, stripe, subscription, fetch-url (SSRF),
    │                             #  admin, admin-emails, github, github-oauth, supabase/{client,server,admin,types},
    │                             #  jobs/{types,queues,store,ats-processor}, query/{client,keys,resume-hooks}
    ├── services/                 # Business logic (thin routes call these)
    └── workers/ai-worker.ts      # Standalone BullMQ worker (pnpm worker)
```

### Major folder responsibilities

| Folder | Purpose / main files | Depends on |
|---|---|---|
| `src/app/api/**` | ~60 route handlers — thin "controllers": authenticate → validate (Zod) → rate/usage-limit → call service → respond. | `lib/*`, `services/*` |
| `src/services/**` | Pure business logic: `resume/` (CRUD, mapper, completion, bullet-matcher), `resume-analyzer/` (parser, ATS scorers, grammar, strength, deep-ATS, pipeline), `jd-analyzer/`, `ai/` (client, prompts, guard), `export/` (PDF/DOCX/TXT/HTML/LaTeX generators + template renderers), `notifications/`, `templates/`, `applications/`, `resume-updates/`, `github/sync.ts`, `projects/suggest.ts`. | `lib/supabase/*`, `lib/*`, `types/*`, `features/resume-builder/config/*` (template presets/variants) |
| `src/features/**` | Feature modules, each with `components/`, `hooks/`, sometimes `api/` or `config/`. The two biggest: `resume-builder/` (builder UI + template catalog/config + all template components) and `ai-assistant/` (AI panel, context, inline tools). | `services/*` via API routes, `lib/query` |
| `src/lib/**` | Cross-cutting infrastructure — no UI. | none (leaf-ish) |
| `src/components/**` | Reusable UI: `ui/` (Button, Input, Spinner, Card primitives, ConfirmDialog, ErrorBoundary), `layout/` (Navbar, DashboardLayout, UserMenu, AdminSidebar, GlobalSearch, NotificationCenter, CommandPalette, MobileBottomNav, Footer), `landing/`, `3d/`. | `features/*`, `lib/utils` |
| `supabase/migrations/` | Schema, RLS, indexes, triggers, seeds. Applied manually/in order (no CI apply). | n/a |
| `scripts/` | Type generation (`generate-supabase-types.mjs`), RLS audit SQL, imported-template migration generator. | n/a |

---

## 4. Application Architecture

### Style
A **modular monolith** inside a single Next.js app. There is no separate backend service; the API routes *are* the backend. Layering is enforced by convention (not by package boundaries):

```
Browser
  │  fetch("/api/...") + cookie session
  ▼
App Router route handler  ── getServerSession() → 401 if no session
  │  Zod validateOrError() → 400
  │  checkRateLimit() / getUserPlanLimits()+checkUsageLimit() → 429/403
  ▼
Service layer (src/services/**)
  │  createServerSupabaseClient()  (anon key + cookies → RLS)
  ▼
Supabase PostgREST → PostgreSQL (RLS policies enforce ownership)
```

**Key invariants observed across every route:**
1. **Auth gate first**: `getServerSession(authOptions)`; no session → `401 {success:false}`.
2. **Zod validation** via `validateOrError` (shared helper in `lib/validation.ts`).
3. **Usage limits** (`getUserPlanLimits` + `checkUsageLimit`/`incrementUsage` from `lib/subscription.ts`) gate AI actions, ATS checks, JD analyses, resume count, and PDF export. Admins (`isAdminEmail`) are exempt.
4. **Rate limits** (Redis, in-memory fallback) on AI (`20/min/IP`), login (`5/min/email`), builder saves (`300/min/user`), exports (`60/min/user`), password/email changes (`3/hour`).
5. **Response envelope**: `{success:true, data}` or `{success:false, error}` (`lib/api.ts`). `withErrorHandling` wraps handlers so unexpected errors are logged to Sentry and returned as a safe generic 500 (never leaks messages/stack/SQL).
6. **Best-effort side effects**: notifications, view/download counters, `last_seen_at`, audit log are wrapped in try/catch and never fail the main operation.

### Two DB clients — the critical mental model
- **`createServerSupabaseClient()`** (`lib/supabase/server.ts`) — anon key + cookies. **RLS applies.** This is what authenticated routes/services use.
- **`createAdminSupabaseClient()`** (`lib/supabase/admin.ts`) — `SUPABASE_SERVICE_ROLE_KEY`, **bypasses RLS**. Used only for: public share page reads, Stripe webhook writes, background job store, the cron GitHub poll, and admin user deactivation. Callers still filter by `user_id` explicitly (defense in depth).

### Auth / RLS coupling (⚠️ read carefully, verify at runtime)
The app authorizes requests with **NextAuth JWTs**, but Supabase RLS computes `auth.uid()` from **Supabase's own session cookie** (`sb-…-auth-token`). These two cookies are only coupled implicitly:
- **Credentials login**: `CredentialsProvider.authorize` calls `supabase.auth.signInWithPassword()` on the *server* Supabase client; `@supabase/ssr` writes the Supabase session cookie through its `setAll` hook, so credentials users receive both cookies and RLS works.
- **OAuth (Google/GitHub/LinkedIn)**: the `jwt` callback maps the NextAuth identity to a Supabase `auth.users` row via the **service role**, but **no Supabase session cookie is created**. If no Supabase session exists, `auth.uid()` is null and every RLS policy returns false — meaning OAuth sign-ins could see an empty app. There is **no `setSession`/token-exchange code anywhere** (verified by search). **Verify with a Google/GitHub login against a real Supabase project.** If broken, the fix is to exchange the NextAuth session for a Supabase session on sign-in (or add a token claim → RLS mapping).
- Some routes (`references`, `exports/[id]`, `resumes/[id]/exports`, `updates` page, `reset-password` page) call the **browser** `createClient()` from server code — a smell; those work only when the browser's Supabase session cookie is present.

### Error handling flow
```
route handler (possibly wrapped in withErrorHandling)
 ├─ known errors → fail(msg, status) / NextResponse.json (leak-safe, hard-coded)
 └─ unexpected → withErrorHandling catches → logError (console + Sentry, tagged area:"api")
                  → fail("An unexpected error occurred…")   // safe in prod
```

### Configuration management
- **Env vars**: `lib/env-validator.ts` runs at import and **throws** if critical vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ENCRYPTION_KEY`, `ADMIN_EMAILS`) are missing; warns for optional ones. Full list in `.env.example` (Supabase, Gemini, OAuth clients, Stripe, Redis, Sentry, Resend).
- **next.config.mjs**: `output:"standalone"`, `serverExternalPackages:["pdf-parse","pdfjs-dist"]` (the fake-worker fix), image remote patterns (Google + GitHub avatars), and security headers (CSP, HSTS, nosniff, frame/ref policy).
- **Admin config**: `ADMIN_EMAILS` env + hardcoded `DEFAULT_ADMIN_EMAILS` in `lib/admin-emails.ts` + `profiles.role='admin'` — a user is admin if *any* source matches (`lib/admin.ts:isAdmin`).

---

## 5. Frontend Analysis

### Framework & routing
Next.js 15 App Router. **~45 pages** under `src/app/`: marketing/landing (`page.tsx`), auth (`(auth)/login|sign-up|forgot-password|reset-password`), onboarding (`(onboarding)/onboarding/user-type|carrer-goal`), `dashboard/`, `builder/[resumeId]/` (+ per-section routes), `templates/`, `ats-check/`, `resume/[resumeId]/{analysis,ats-score,variants/{role,company},export-history}`, `jobs/`, `updates/`, `integrations/{github,linkedin}`, `tools/` (cover-letter, cover-letter-sync, bulk-tailor, skill-gap, interview-coach, job-match, reference-manager, application-kit), `preview/[resumeId]`, `share/[token]` (public), `notifications/`, `analytics/`, `admin/` (users, prompts, templates, ats, subscriptions, audit), `settings/` (+`settings/subscription`), `pricing/`, `post-login/`.

### Layout
`app/layout.tsx` → `ThemeProvider` → `Providers` (SessionProvider → QueryClientProvider → DashboardSearchProvider) → `Navbar` + `main` + `CommandPalette` + `Toaster`. Authed app areas use `components/layout/DashboardLayout.tsx` (fixed sidebar, sign-out, user menu) and `Navbar` with `UserMenu`; the `Navbar` renders nothing on auth pages.

### Component hierarchy
```
RootLayout
 └ Navbar (landing/marketing vs app-bar modes; NotificationCenter, ThemeToggle, UserMenu, GlobalSearch, QuickCreateButton)
 └ main
    ├ Landing page (3D orbs, hero, PipelineEngineVisualizer, ResumeCardFan, pricing, footer)
    └ DashboardLayout (sidebar nav + content)
       └ page content (feature components)
 └ CommandPalette (global ⌘K) + Toaster
```

### Reusable components & UI primitives
`components/ui/`: `Button`, `Input`, `Spinner`, `SectionCard`, `ItemCard` (used by all builder sections), `BentoCard`, `AtsBadge`, `ConfirmDialog`, `ErrorBoundary`. `features/resume-builder/components/sections/*` define the per-section forms (Experience, Education, Skills, Projects, CustomSectionEditor, etc.) over SectionCard/ItemCard.

### State management
- **Server state**: TanStack Query (`lib/query/`): `useResumes`, `useResume`, `useCreateResume`, `useDeleteResume` (optimistic), `useDuplicateResume`, `useRenameResume`, `useChangeTemplate`, `useTogglePinResume`. Query keys centralized in `lib/query/keys.ts`.
- **Client state**: local `useState` in feature hooks; React Context for cross-cutting: `AiAssistantContext` + `AiHistoryContext` (ai-assistant), `BuilderContext` (`builder/[resumeId]/builder-context.tsx`), `DashboardSearchContext`, `ThemeProvider`.
- **Auth**: `features/auth/hooks/useAuth.ts` wraps `useSession`.

### The builder (the most complex client area)
`features/resume-builder/`:
- `hooks/useResumeForm.ts` — loads resume, `updateField`, **1s debounced autosave** calling `PUT /api/resumes/:id` with the whole `sections` payload; routes also rate-limit saves (300/min).
- `hooks/useHistory.ts`, `useKeyboardShortcuts.ts`, `useCommandPalette.ts`, `useInView.ts`, `useTemplateFavorites.ts`.
- `components/workspace/` — `SectionNavList`, `SectionReorderDialog`, `TopToolbar`, `RightPreviewPanel`, `PaginatedResumePreview`, `MobileBuilderOverlays`, `ResumeCompletionWidget`.
- `config/` — the **template catalog core**: `template-variants.ts` (~59 variant entries), `template-registry.ts` (metadata: ATS scores, roles, categories, tiers), `template-families.ts`, `template-recommendation.ts` (+ deterministic fallback), `template-search.ts`, `template-pagination.ts`, `template-section-presets.ts` (role-aware section structure for new resumes), `resume-types.ts`, `sample-resume.ts`. This whole area has **dedicated Vitest coverage** (`template-variants.test.ts` gates CI).
- `templates/` — the 8 archetype renderers (`Modern.tsx`, `AtsProfessional.tsx`, `Student.tsx`, `Minimal.tsx`, `Executive.tsx`, `Creative.tsx`, `ExecutiveSidebar.tsx`, `ModernCard.tsx`) + `TemplateRenderer.tsx` (memoized dispatch) + `preview/` (TemplateGrid/Card/Detail). `imported/catalog.ts` is **intentionally empty** (legacy).

### Data fetching & caching
- React Query (staleTime 30s, no refetch on focus, retry 1).
- Server components used for public/landing/share pages (`share/[token]` is an async server component).
- All `/api/*` routes are `force-dynamic` (no route caching).

### Performance optimizations in the UI
Memoized template renderer (A-18); debounced autosave; Tailwind JIT; Next `Image` (Google/GitHub avatars); paginated resume preview; `import()` code-splitting in places (e.g., Supabase clients, Sentry, queue modules, `pdf-parse`).

---

## 6. Backend Analysis

There is no conventional controllers/repositories split; the mapping is:

| Concept | Where |
|---|---|
| Entry point | Next.js route handlers (`app/api/**/route.ts`) + `middleware.ts` + optional standalone worker `workers/ai-worker.ts` (`pnpm worker`) |
| Controllers | Route handlers (auth + validate + limits + call service) |
| Services | `src/services/**` |
| Repository/data layer | Supabase typed client (`lib/supabase/*`) with PostgREST; migrations define DB constraints |
| Middleware | `src/middleware.ts` (withAuth; public path allowlist) |
| AuthN | `lib/auth.ts` (NextAuth options) |
| AuthZ | Route-level `isAdmin`/`isAdminEmail`; DB-level RLS |
| Validation | Zod schemas + `validateOrError` |
| Background jobs | `lib/jobs/{queues,store,ats-processor}.ts` + `workers/ai-worker.ts` + `api/cron/github-poll` |

### Notable routes/behaviors
- **`POST /api/ai`** — the AI proxy (rate limit 20/min/IP, monthly usage check, oversize 413, prompt injection guards, anti-fabrication warnings, notification dedupe).
- **`POST /api/ats-analyze`** — multipart (file upload) or JSON; supports `mode:"async"` → BullMQ job with inline fallback; runs the shared `runAtsPipeline`; persists `ats_analyses` + `resumes.ats_score`.
- **`POST /api/stripe/webhook`** — signature-verified; dual-layer idempotency (in-memory fast path + durable `webhook_events` table with unique event_id); unknown prices safely map to `free`; handles `checkout.session.completed`, `customer.subscription.updated/deleted`.
- **`POST /api/cron/github-poll`** — service-role client, iterates connected users, calls `syncGitHubForUser`.
- **`GET /api/health`** — liveness (checks Supabase connectivity).
- **Admin routes** — every admin handler checks `isAdmin` first; mutations call `logAdminAction` (audit log).

### Security-critical utilities
`lib/fetch-url.ts` — SSRF-guarded URL fetcher (DNS-level private/loopback block incl. IPv4-mapped IPv6, redirect re-validation, 8s timeout, 2MB cap, HTML→text). `lib/encryption.ts` — AES-256-GCM `iv:ciphertext:authTag`, dual-key rotation support (`ENCRYPTION_KEY_PREVIOUS`). `lib/rate-limit.ts` — sliding-window Redis INCR + fail-closed memory fallback.

---

## 7. Database Analysis

**Type**: PostgreSQL via Supabase. **No ORM** — typed client + migrations. **39 migration files** (note: `00011` exists twice: `00011_ats_scores.sql` and `00011_profiles_is_active.sql` — run both; README says 36/38, the truth is 39 files). Migrations are applied manually/in order (see §18).

### Tables (grouped)

**Identity & profile**
| Table | Purpose | Notes |
|---|---|---|
| `profiles` | User profile (onboarding fields, `role`, `is_active`, `last_seen_at`, `github_token` encrypted, `github_connected`) | FK→`auth.users`; trigger `handle_new_user` auto-inserts on signup; RLS own-row |
| `settings` | Per-user toggles (`email_notifications`, `dark_mode`, `resume_updates`, `job_alerts`) | 1:1 with user |

**Resume core**
| Table | Purpose |
|---|---|
| `resumes` | Header row: title, `template` (CHECK constraint **dropped** in 00032 — open-ended), `target_level`, `personal_info` JSONB, `summary`, `coursework`/`interests` arrays, `section_order` JSONB, `custom_sections` JSONB, `accent_color`, `font_family`, `ats_score`/`ats_breakdown`, `share_token` (unique partial index), `share_enabled`, `view_count`, `download_count`, `is_pinned` |
| 13 section tables | `education`, `experience`, `projects`, `skills` (single row/resume, unique on `resume_id` since 00029), `certifications`, `achievements`, `languages`, `coding_profiles`, `leadership`, `open_source`, `publications`, `volunteer`, `activities` — all `resume_id` FK ON DELETE CASCADE, all RLS owner-scoped via `EXISTS(resumes WHERE user_id=auth.uid())` |

**Analysis & career data**
| Table | Purpose |
|---|---|
| `ats_analyses` | History of ATS runs (score + JSONB breakdown) |
| `job_analyses` | JD-vs-resume analysis history |
| `applications` | Job tracker (status enum, `outcome_type`, `interview_round`) |
| `resume_updates` | GitHub-detected repo suggestions (status pending/added/ignored, stars/forks) |
| `resume_versions` | Full JSONB snapshots for fork/diff/rollback |
| `references` | Reference Manager records |
| `exports` | Export history (format, template, file_size) |
| `notifications` | In-app notification center |
| `background_jobs` | Status/result source of truth for BullMQ work |

**Commerce & platform**
| Table | Purpose |
|---|---|
| `subscription_plans` | Plan catalog (seeded free/pro in 00003) |
| `subscriptions` | User subscription (unique `user_id`, Stripe ids, status enum) |
| `usage_counts` | Monthly usage meters (unique `user_id,metric`) |
| `prompts` | Admin-overridable AI prompt templates |
| `templates` | Template catalog (8 built-ins + 59 variants in 00038 + legacy "imported" rows in 00032) |
| `admin_audit_log` | Admin mutation audit trail |
| `webhook_events` | Durable Stripe webhook idempotency ledger (no RLS — service-role only) |

### Relationships (ER diagram)

```
auth.users (Supabase-managed)
   │ 1─∞  profiles  ─1─1─ settings
   │          │ 1─∞ subscriptions ─∞─1 subscription_plans
   │          │ 1─∞ usage_counts
   │          │ 1─∞ notifications
   │          │ 1─∞ applications ──∞─1 resumes
   │          │ 1─∞ resume_updates
   │          │ 1─∞ resume_versions
   │          │ 1─∞ references
   │          │ 1─∞ exports
   │          │ 1─∞ admin_audit_log
   │
   resumes 1─∞ {education, experience, projects, skills, certifications,
                 achievements, languages, coding_profiles, leadership,
                 open_source, publications, volunteer, activities}
   resumes 1─∞ ats_analyses · job_analyses (resume_id SET NULL on delete)
   resumes 1─∞ resume_versions · exports
```

### Key constraints & indexes
- **RLS on every table** (enabled + owner-scoped policies). Audit-migration `00027` specifically closed two "FOR ALL USING (true)" holes on `subscriptions`/`usage_counts`.
- `public.is_admin()` SECURITY DEFINER helper for admin policies.
- **`delete_user_account()`** SECURITY DEFINER RPC (00010) — the only sanctioned way to delete a user (cascades everything). The new `/api/auth/delete-account` route calls it via a server-side service-role client because the browser Supabase client has no session (see git WIP).
- Indexes on `user_id`, `resume_id`, `share_token`, `created_at`, status columns, admin analytics (00015), `last_seen_at` (00016).
- `handle_new_user` trigger on `auth.users` (00001); `update_updated_at_column` trigger referenced by `references` (00035) — **verify this function exists in your live DB** (it is not defined in any committed migration; the `references` migration calls it directly).

---

## 8. Authentication & Authorization

### Login flows
1. **Credentials** — `LoginForm` → `signIn("credentials")` → `CredentialsProvider.authorize`:
   - Rate limit `5/min` per email.
   - `supabase.auth.signInWithPassword` (this also writes the Supabase session cookie — see §4 caveat).
   - Rejects if `profiles.is_active = false` (admin deactivation, R-11).
   - Returns NextAuth user; `jwt` callback stores `token.id = user.id`.
2. **OAuth** — Google / GitHub / LinkedIn via NextAuth providers. `jwt` callback maps email → Supabase `profiles.id` (creating the Supabase auth user via service role if missing, incl. a repair path for "already registered"); sets `token.isNewUser`. OAuth tokens for the *integrations* (GitHub repo import, LinkedIn) are separate OAuth exchanges (§13) and are encrypted at rest.
3. **Sign-up** — `POST /api/auth` → `supabase.auth.signUp` + profile upsert; respects email confirmation; `POST /api/auth` also handles profile updates (PUT) with rate-limited password/email changes.
4. **Forgot/reset password** — new WIP flow: `/forgot-password` page → `POST /api/auth/forgot-password` → Supabase `resetPasswordForEmail`; `/reset-password` page reads `#access_token` from the URL hash and calls `supabase.auth.updateUser` (Supabase's own recovery, not NextAuth).

### Sessions
- **NextAuth JWT strategy**: `maxAge` 30 days, rolling `updateAge` 7 days. Cookie names/security switched in production (`__Secure-` prefix, `httpOnly`, `sameSite:lax`, `secure`).
- The `jwt` callback also **fire-and-forget updates `profiles.last_seen_at`** on every request (best-effort; this is RLS-dependent — see §4 caveat).

### Authorization
- **Route level**: `getServerSession` on every API route; admin routes additionally call `isAdmin(userId, email)`.
- **Data level**: RLS ownership policies (the real boundary).
- **Feature level**: plan limits enforced server-side (`getUserPlanLimits` — only `active`/`trialing` grant Pro; canceled/past-due falls back to free, K-14). `isAdminEmail` exemptions for AI/ATS usage limits.
- **Protected routes**: `middleware.ts` withAuth allowlists `/`, `/pricing`, `/login`, `/sign-up`, `/forgot-password`, `/reset-password`, `/share`, NextAuth API, static assets.

### Security mechanisms
CSP + security headers (next.config), CSRF protection via NextAuth's built-in csrf token cookie, rate limiting, Zod validation, RLS, AES-256-GCM token encryption, SSRF guard, webhook signature verification + idempotent ledger, anti-hallucination AI guard, safe error messages, audit log. **No refresh tokens** (NextAuth JWT), **no 2FA**, **no email verification requirement** for credentials signup beyond Supabase's `signUp` behavior.

---

## 9. API Documentation

Convention: all responses are `{success, data}` / `{success, error}` unless noted. All routes except public ones require the NextAuth session cookie. `#` = authenticated.

### Auth
| Method | URL | Purpose | Body → Tables | Errors |
|---|---|---|---|---|
| POST | `/api/auth` | Sign up (Supabase signUp + profile upsert) | `{email,password,fullName}` → `auth.users`, `profiles` | 400 validation, 409 existing |
| PUT | `/api/auth` | Update profile / password / email (rate-limited) | `updateProfileSchema` → `profiles` | 400, 401, 429 |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler | — | — |
| POST | `/api/auth/forgot-password` | Send recovery email | `{email}` → `auth` (Supabase) | 400, 429 |
| POST | `/api/auth/delete-account` | Delete account (service-role → `delete_user_account` RPC) | — → cascade all | 401 |

### Resumes
| Method | URL | Purpose | Tables |
|---|---|---|---|
| GET | `/api/resumes` | List (with `ats_score`, counts, `is_pinned`) | `resumes` |
| POST | `/api/resumes` | Create (profile pre-fill, template preset section order, theme) | `resumes` + sections |
| GET/PUT/PATCH/DELETE | `/api/resumes/:id` | Read full (batched 1-round-trip with 13 section tables), update (incl. `sections` map → `updateSections` UPSERT), section PATCH, delete | `resumes` + all sections |
| POST | `/api/resumes/:id/duplicate` | Deep copy with new id | `resumes` + sections |
| POST | `/api/resumes/:id/share` | Enable/disable share token (unguessable, unique) | `resumes` |
| POST | `/api/resumes/:id/add-keywords` | Insert missing JD keywords into skills | `skills` |
| POST | `/api/resumes/:id/apply-bullets` | Apply AI bullet rewrites (bullets must match, `bullet-matcher.ts`) | `experience` |
| POST | `/api/resumes/:id/apply-grammar` | Apply safe grammar fixes | `experience`, `resumes` |
| POST | `/api/resumes/import` | Import pasted text / uploaded PDF/DOCX/TXT (parser + AI extraction) | `resumes` + sections |
| GET/POST | `/api/resumes/versions` | List/create versions (snapshots); diff/rollback | `resume_versions` |
| GET | `/api/resumes/:id/exports` | Export history | `exports` |

### Analysis
| Method | URL | Purpose |
|---|---|---|
| POST | `/api/resume-analyze` | File/text → parsed + ATS + grammar + strength report |
| POST | `/api/ats-analyze` | Full ATS (deterministic deep scan + AI enrichment; sync or async job) |
| GET | `/api/ats-analyses` | Analysis history |
| GET | `/api/ats-score/:resumeId` | Stored score + (POST variants re-run) |
| POST | `/api/analyze-jd` | JD keyword/skill-gap/role/category analysis; GET for history |
| GET | `/api/data-export?type=ats` | Download ATS reports (JSON/CSV) |

### AI
| Method | URL | Purpose |
|---|---|---|
| POST | `/api/ai` | 15+ action types (`aiActionEnum`): generate-summary, enhance-bullet, check-grammar, suggest-achievements, add-keywords, rewrite-section, cover-letter, ats-score, analyze-jd, company-variant, role-variant, profile-improvement, github-repo-suggest, recruiter-email, linkedin-message, interview-questions |

### Templates
| Method | URL | Purpose |
|---|---|---|
| GET | `/api/templates` | Active catalog from `templates` table |
| POST | `/api/templates/recommend` | AI template recommendation (deterministic fallback `template-recommendation.ts`) |

### Export
| Method | URL | Purpose |
|---|---|---|
| GET | `/api/export/:resumeId?format=pdf\|docx\|txt\|html\|latex` | Generate + download (PDF gated to Pro); increments `download_count`; notification |
| GET | `/api/exports/:id` | Fetch a recorded export record |

### Integrations
| Method | URL | Purpose |
|---|---|---|
| GET/POST | `/api/github/connect` | OAuth start / code exchange (token encrypted at rest) |
| GET | `/api/github/callback` | OAuth callback (state-cookie checked) |
| GET | `/api/github/repos|contributions|trending` | GitHub API proxies |
| GET | `/api/github/suggest` | AI repo suggestions (with deterministic fallback `projects/suggest.ts`) |
| POST | `/api/github/import-username` | Import repos by username |
| POST | `/api/github/poll` | Manual sync → `resume_updates` |
| GET/POST | `/api/linkedin/connect|callback` | LinkedIn OAuth (scope limited; full sync blocked upstream) |
| POST | `/api/linkedin/import-paste` | AI-structured import from pasted profile |
| POST | `/api/linkedin/manual-add` | Add certificate/achievement manually |
| GET | `/api/linkedin/imports` | List past imports |

### Job tracker & updates
| Method | URL | Purpose |
|---|---|---|
| GET/POST | `/api/applications` | List (paginated, status filter) / create |
| PUT/DELETE | `/api/applications/:id` | Update (outcomes, interview rounds) / delete |
| GET | `/api/resume-updates` | Update feed (limit 50) |
| PUT | `/api/resume-updates/:id` | Mark added (→ inserts real project row) / ignored |

### Misc
| Method | URL | Purpose |
|---|---|---|
| GET | `/api/notifications` | Notification center list + unread count; POST mark-all-read |
| GET | `/api/search` | Global search across resumes/profiles |
| GET/POST | `/api/stripe/checkout`, GET `/api/stripe/portal`, POST `/api/stripe/webhook` | Billing |
| GET | `/api/jobs/:id` | Background job status/result poll |
| GET/POST | `/api/references`, `/api/references/:id` | Reference manager CRUD |
| GET | `/api/settings`, PUT | Settings toggles |
| POST | `/api/projects/suggest` | GitHub project ranking |
| GET | `/api/health` | Health check |
| GET/POST | `/api/admin/*` (users, stats, prompts, templates, ats, subscriptions, audit) | Admin console (admin-only) |
| POST | `/api/cron/github-poll` | Scheduled GitHub sync for all users |

---

## 10. Feature Breakdown

| Feature | Frontend | Backend/Service | Tables | Logic notes |
|---|---|---|---|---|
| **Resume builder** | `features/resume-builder/**`, `builder/[resumeId]/**` | `services/resume/{service,mapper,completion,validation,bullet-matcher}.ts` | `resumes` + 13 sections | Batched read (1 round trip), UPSERT section writes with diff-delete, column-whitelist sanitization, PGRST204/42703 schema-retry compatibility, debounced autosave |
| **ATS analysis** | `features/ats-check/**` (tabs), `ats-check/page.tsx` | `services/resume-analyzer/*` (`ats-scorer`, `deep-ats`, `ats-pipeline`, `grammar-checker`, `strength`, `parser`) | `ats_analyses`, `resumes.ats_score` | Deterministic hybrid scoring + optional Gemini enrichment; one-click fixes via add-keywords/apply-bullets/apply-grammar |
| **Template marketplace** | `templates/page.tsx`, `features/resume-builder/config/*`, `templates/preview/*` | `services/templates/service.ts` | `templates` | 8 archetypes + ~59 variants; registry metadata; AI + deterministic recommendation; search/pagination; role/level filters |
| **Multi-format export** | `features/export/*`, `preview/[resumeId]` | `services/export/*` | `exports`, `resumes.download_count` | Same React components for web + PDF; separate DOCX/HTML/TXT/LaTeX generators; per-variant accent/font |
| **Resume sharing** | `share/[token]/page.tsx` | service-role read + mapper | `resumes` (share_token) | Unguessable token, opt-in, view counting, QR codes |
| **GitHub integration** | `integrations/github/**` | `api/github/*`, `services/github/sync.ts` | `profiles.github_token` (encrypted), `resume_updates` | OAuth, repo import, contribution graphs, trending, poll, cron |
| **LinkedIn** | `integrations/linkedin/**` | `api/linkedin/*`, AI `linkedin-import-paste` prompt | `profiles`, resumes sections | Paste import; manual adds; full sync blocked by LinkedIn API shutdown (known issue) |
| **AI assistant** | `features/ai-assistant/**` (panel, inline tools, history) | `services/ai/*`, `api/ai` | `prompts`, `usage_counts`, `notifications` | Guarded prompts, admin-overridable, usage-limited |
| **Application kit / tools** | `tools/*` pages | `services/ai` prompts (recruiter-email, linkedin-message, interview-questions), `analyze-jd` | `job_analyses` | JD → resume/cover-letter/email/message/questions/skill-gaps in one flow |
| **Job tracker** | `jobs/page.tsx` | `services/applications/service.ts` | `applications` | Statuses, interview rounds, outcomes |
| **Resume updates feed** | `updates/page.tsx` | `services/resume-updates/*` | `resume_updates`, `projects` | GitHub-driven "recently updated" stream, apply/ignore |
| **Versions** | `resume/[resumeId]/...`, builder | `api/resumes/versions` | `resume_versions` | Full snapshots, fork/diff/rollback |
| **Notifications** | `components/layout/NotificationCenter.tsx`, `notifications/page.tsx` | `services/notifications/*` | `notifications`, `settings` | Email (Resend) + in-app; channel toggles; dedupe windows |
| **Subscription** | `settings/subscription`, `pricing`, `features/subscription/*` | `lib/stripe.ts`, `lib/subscription.ts`, `api/stripe/*` | `subscriptions`, `usage_counts`, `subscription_plans`, `webhook_events` | Server-enforced limits; idempotent webhooks |
| **Admin console** | `admin/**` (+ layout, AdminSidebar) | `api/admin/*`, `lib/admin.ts` | `admin_audit_log`, `templates`, `prompts`, `profiles`, `subscriptions` | Users (incl. deactivate), stats, prompts, templates, ATS analytics, audit log |
| **Onboarding + tour** | `(onboarding)/onboarding/*`, `components/TourGuide.tsx` | `services/resume` pre-fill | `profiles` | Career-goal capture feeds resume creation |
| **Analytics** | `analytics/page.tsx` | `api/admin/stats` | `profiles`, `subscriptions`, `job_analyses`, `resumes` | Admin platform metrics |

---

## 11. Data Flow (traced examples)

### Trace A — AI action (e.g. "enhance-bullet")

```
UI (AiInlineButton) → features/ai-assistant/api/ai.ts: callAi(action,input,context)
  → POST /api/ai
  → getServerSession (401 if none)
  → checkRateLimit("ai:<ip>", 20/min)                     → 429
  → getUserPlanLimits + checkUsageLimit("ai_actions")      → 403
  → validateOrError(aiRequestSchema)                       → 400
  → capContent (oversize → 413)
  → services/ai/client.ts callGemini:
       buildPrompt(sanitizeRequest) → fetch generativelanguage…:generateContent
       (model order gemini-2.0-flash → 2.5-flash-lite, 3 attempts/model, 25s timeout,
         backoff 300ms*2^attempt, retryable statuses 408/429/5xx)
       validateNumericClaims(output, source) → warnings
  → incrementUsage("ai_actions") (upsert usage_counts with monthly reset)
  → dedupe + createNotification(type="ai")
  → {success, output, warnings} → toast warnings → builder shows text
```
No streaming; no persistence of AI responses.

### Trace B — builder autosave (PUT /api/resumes/:id)

```
BuilderForm edit → useResumeForm.updateField → state
  → 1s debounce → PUT /api/resumes/:id
  → session → checkRateLimit("builder-save:<uid>", 300/min)
  → validateOrError(updateResumeSchema)
  → service.updateResume (resumes row: title/template/theme/sectionOrder/customSections/pin)
  → for each section key: service.updateSections(resumeId, uid, sectionType, rows)
       • column whitelist + camel→snake mapping (SECTION_COLUMNS / CAMEL_TO_SNAKE)
       • skills: upsert onConflict resume_id
       • others: upsert onConflict id (stable client UUIDs preserved, non-UUIDs dropped)
       • diff-delete rows whose ids vanished
       • PGRST204 → strip missing column → retry
  → ok()
```
RLS filters every `.eq("user_id", …)` query to the caller's own rows.

### Trace C — public share page (no auth)

```
GET /share/<token> → middleware allows /share
  → SharePage (server component) → createAdminSupabaseClient (service role, RLS bypassed)
  → resumes.select(*).eq(share_token, token).eq(share_enabled, true) → mapRowToResumeData
  → MemoTemplateRenderer → HTML
  → view_count++ (best-effort) → metadata robots:noindex
```

---

## 12. AI Integration

| Aspect | Implementation |
|---|---|
| **Provider** | Google Gemini REST API (`generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`) — no SDK. |
| **Models** | `gemini-2.0-flash` primary, `gemini-2.5-flash-lite` fallback (in `MODEL_ORDER`). |
| **Prompt architecture** | Per-action system prompts in `services/ai/client.ts` `PROMPTS` (build-in fallback) **and** duplicated defaults in `services/ai/prompts.ts` `DEFAULT_PROMPTS`. At runtime `getPrompt(action)` resolves: 60s-cached DB row → active `prompts` table row → default. **⚠️ Duplication**: `client.ts`'s inline `PROMPTS` map is a stale second source that does NOT include newer actions (profile-improvement, github-repo-suggest, linkedin-import-paste, resume-import-upload) — those newer prompts only exist in `prompts.ts`. |
| **Prompt hygiene** | `{input}`/`{context}` substitution; all prompts contain explicit anti-hallucination rules ("never invent metrics/experience"). |
| **Input guard** | `guard.ts`: regex strip of instruction-override phrases (prompt injection), `capContent` size budget (12k input / 30k context; >2x → rejected with 413). |
| **Output guard** | `validateNumericClaims` flags %/$/counts/years in AI output not traceable to source; surfaced as warning toasts (A-04). |
| **Structured output** | JSON-shaped prompts + `extractJson`/`parseAiData` post-processing in `ats-pipeline.ts` (robust to markdown fences). |
| **Streaming** | ❌ None — single `generateContent` call per request. |
| **Memory / history** | ❌ Stateless. `AiHistoryContext` stores *client-side* history of results only. |
| **Embeddings / vector DB / RAG** | ❌ None. Deterministic keyword engines (JD analyzer, ATS scorer, project suggest) cover matching. |
| **Tool/function calling** | ❌ Not used. |
| **Token management** | Character caps + timeouts (25s) + retries/backoff + model fallback; no token-budget math. |
| **Cost/abuse control** | Rate limit + monthly plan limits; ATS deep analysis can run in a BullMQ worker to avoid blocking the request. |
| **Background AI** | `lib/jobs/ats-processor.ts` + `workers/ai-worker.ts` (BullMQ `ats-analysis`, concurrency 2, 3 attempts w/ exponential backoff; inline execution when Redis unset). |

---

## 13. External Services

| Service | Usage | Credentials / config |
|---|---|---|
| **Supabase** | Postgres DB, RLS, Auth (user store + password/recovery), storage not used | URL + anon key (client/server) + service-role key (admin/webhook/worker) |
| **Google Gemini** | All AI generation | `GEMINI_API_KEY` |
| **Stripe** | Subscriptions: checkout sessions, customer portal, webhooks | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, 2× price IDs (server + public) |
| **GitHub API** | Repos, contributions, trending; OAuth (own app) for token | `GITHUB_CLIENT_ID/SECRET` (auth), per-user OAuth token (encrypted in `profiles.github_token`) |
| **Google / GitHub OAuth** | NextAuth identity providers | `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` |
| **LinkedIn** | OAuth identity + profile OAuth (limited); paste-import instead of full sync | `LINKEDIN_CLIENT_ID/SECRET` |
| **Resend** | Transactional notification emails (optional) | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (not in `.env.example` — add it) |
| **Redis** | Rate limiting + BullMQ broker (optional) | `REDIS_URL` / `REDIS_HOST`/`REDIS_PORT` |
| **Sentry** | Error + performance monitoring | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG/PROJECT/AUTH_TOKEN` |
| **Vercel** | Deployment target (standalone build) | — |
| **No other** | No Firebase, AWS, SMS, analytics SDKs, or object storage | — |

---

## 14. Security Review

### What's solid
- **RLS everywhere** with owner-scoped policies; service role restricted to server-only modules; explicit `user_id` filters even with the service role.
- **Webhook security**: signature verification (`constructEvent`), durable idempotency (`webhook_events` unique `event_id`), unknown prices → free (never silently upgrade), 24h in-memory fast path with delete-on-failure so Stripe retries reprocess.
- **Token encryption at rest** (AES-256-GCM) with rotation support.
- **SSRF guard** on all outbound URL fetches (DNS re-lookup per redirect, RFC1918/loopback/link-local + IPv4-mapped IPv6 blocked).
- **Input validation** on every route (Zod); SQL injection risk is minimal because all queries go through PostgREST parameter binding (raw SQL only in migrations/RPCs).
- **XSS**: React escapes by default; HTML export uses `escapeHtml` on every interpolated field; CSP set (with caveats below).
- **Rate limiting** on login, AI, exports, saves, and sensitive profile changes.
- **Safe error messages** (no internal leakage in prod), Sentry for internal visibility.
- **Anti-hallucination** AI guard reduces fabricated-metric risk (a product-trust issue, not a vuln).
- **Deactivated accounts** blocked at login (`is_active=false`).

### Weak points / risks
| # | Finding | Impact |
|---|---|---|
| 1 | **NextAuth JWT vs Supabase RLS coupling** (§4) — OAuth sign-ins create no Supabase session cookie; all RLS reads could silently return empty. | **Critical to verify.** If confirmed, OAuth users see an empty app while credentials users work. |
| 2 | **CSP allows `'unsafe-inline'` + `'unsafe-eval'`** in `script-src`. | Weakens XSS defense-in-depth (Next.js often needs inline scripts, but `unsafe-eval` is broad). |
| 3 | `ALLOWED_ORIGINS` CORS: `isAllowedOrigin` returns `true` for requests **without** an Origin header — fine for curl/webhooks, but means CORS enforcement is bypassable by non-browser clients (acceptable, but note it). | Low. |
| 4 | **Hardcoded admin emails** in source (`admin-emails.ts`) — they grant admin on any deployment that reuses this codebase. | Remove before production or rotate. |
| 5 | `planIdFromPrice` logs unknown prices and **maps them to `free`** — safe, but a misconfigured price silently downgrades paying customers. | Operational. |
| 6 | **`profiles.github_token`** is encrypted, but the decrypt path is shared by cron (admin client) — fine; but tokens are long-lived with no revocation flow. | Low/Medium. |
| 7 | `setInterval` in-memory webhook dedupe + `processedEvents` per instance — already mitigated by the DB ledger. | Low. |
| 8 | **No rate limit on `/api/auth` signup or forgot-password** beyond Redis checks where applied — verify. | Spam/abuse. |
| 9 | Some routes use the **browser Supabase client in server code** (`references`, `exports`) — inconsistent session source. | Fragile; see #1. |
| 10 | Share URLs are unguessable-but-unguarded: anyone with the token views the resume (by design). No expiry/revocation per-link. | Product decision; flag for privacy. |

---

## 15. Performance Review

| Area | Assessment |
|---|---|
| **Resume read path** | ✅ Single batched PostgREST query loads the resume + 13 section tables in one round trip (`service.ts:getResume`), ordered per table. |
| **N+1 risk** | ⚠️ `getResumes` list endpoint can issue up to 4 sequential queries on **schema mismatch** only (fine). `duplicateResume` does 1 read + 14 writes (expected). Admin stats run several aggregate queries (fine at this scale). The `jwt` callback fires a DB write on *every request* (`last_seen_at`) — a write per request across all authed traffic; best-effort but noisy. |
| **Rendering** | ✅ Memoized template renderer; paginated preview; heavy 3D only on landing; `serverExternalPackages` keeps pdfjs out of bundles. |
| **Bundle size** | ⚠️ 8 template archetype components ship to the client builder; `@react-pdf/renderer` + `three` are large (three only on landing). No bundle analysis in CI. |
| **Caching** | ⚠️ All API routes `force-dynamic`; no ISR/edge caching except static marketing assets. Share pages are server-rendered per request (no cache). `publicCacheHeaders` helper exists but is barely used. |
| **Memory** | PDF renders happen server-side per request (`renderToBuffer`) — CPU/memory heavy under load; exports rate-limited to 60/min/user but no global concurrency cap. |
| **DB** | Indexes cover the hot paths (`user_id`, `resume_id`, `share_token`, `created_at`). `usage_counts` upserts monthly — fine. |
| **Rate limiting** | Redis with fail-closed memory fallback — good; memory fallback is per-instance (acceptable for dev, weak for multi-instance prod without Redis). |

---

## 16. Code Quality Review

**Strengths**
- Clean layering: routes are thin, services carry logic, Supabase access is centralized in three clients.
- **Single DB→client mapper** (`services/resume/mapper.ts`) shared by CRUD, share page, previews — exactly one mapping definition.
- Exceptional defensive programming: PGRST204/42703 schema-retry, column whitelists on section writes, diff-delete UPSERTs, best-effort side effects, safe error envelopes.
- Real tests (475) across services, mappers, parsers, guards, export parity, and API routes.
- Consistent response envelope + `withErrorHandling`.
- CI enforces catalog invariants (template variant integrity as a hard gate).

**Weaknesses / technical debt**
| # | Finding |
|---|---|
| 1 | **Prompt templates duplicated** between `services/ai/client.ts` (stale `PROMPTS`) and `services/ai/prompts.ts` (`DEFAULT_PROMPTS`) — drift already visible (newer actions missing from the inline map). |
| 2 | **Migration numbering collision**: two `00011_*` files; README's "36 migrations" is wrong (39 files). No single source of truth for applied migrations. |
| 3 | **Template catalog has three overlapping sources**: DB `templates` (8 + 59 variants in 00038 + 75 legacy "imported" rows in 00032), config `template-variants.ts` + `template-registry.ts`, and the intentionally-empty `imported/catalog.ts`. README says 67/59/88 in different places; DB rows for "imported" designs have **no renderer** (fall back to Modern via `archetypeForTemplate`). |
| 4 | `services/ai/types.ts` is **empty**; type definitions live in `types/ai.ts`. |
| 5 | README overstates some features ("30+ templates" vs 8 archetypes; "36 migrations"). |
| 6 | Routes like `references`, `exports/[id]`, `resumes/[id]/exports` import the *browser* Supabase client into server code. |
| 7 | `useResumeForm`/`useSubscription` fetch without error retry/abort; no React Query for the builder (manual fetch). |
| 8 | `isAdminEmail` hardcoded list is committed to source (see §14.4). |
| 9 | No Prettier; formatting is convention-only. |
| 10 | `git status` shows uncommitted WIP: forgot/reset-password pages, `/api/auth/delete-account` (+ tests), `UserMenu`, sidebar/navbar rework, `?tab=account` deep-link. `src/app/(auth)` and `src/app/api/auth/{forgot-password,delete-account}` are **untracked** — make sure they land in the next commit. |

---

## 17. Current Development Status

**Completed** (in production shape): builder with autosave + custom sections + section order; template marketplace (8 archetypes + variants, search, recommendation); deterministic + AI ATS analysis with one-click fixes; JD analyzer; application kit; multi-format export with cross-format parity tests; share links + QR + view counts; GitHub import/poll/cron; LinkedIn paste-import; job tracker; resume versions; references; notifications (in-app + email); subscriptions via Stripe with durable webhooks; admin console + audit log; onboarding + tour; analytics; dark mode.

**In progress / WIP (uncommitted, per git status + README roadmap)**: forgot/reset-password flow; account deletion via server route; navbar/sidebar/UserMenu polish; deep GitHub integration; analytics dashboards (application conversion); multi-language; team features.

**Known issues (README)**: LinkedIn full OAuth sync blocked by LinkedIn's API changes; gitignored local `packages/` experiments excluded from tsconfig.

**Dead/legacy code**: `features/resume-builder/templates/imported/catalog.ts` intentionally empty; `services/ai/types.ts` empty; `htmlRenderer.ts` TODO comment (line ~1009) flags string-based renderers for consolidation into `renderToStaticMarkup`; legacy "imported" DB rows without renderers.

**Experimental**: BullMQ background jobs (optional infra), AI deep-ATS enrichment, template variant catalog (config-driven).

---

## 18. Build & Deployment

### Environment variables
`.env.example` is the source of truth (Supabase, Gemini, OAuth, NextAuth, encryption, admin emails, Stripe, Redis, Sentry). `lib/env-validator.ts` fails fast on missing critical vars at import time.

### Build
```bash
corepack enable            # pnpm 11 (Node ≥22.13)
pnpm install --frozen-lockfile
pnpm run lint              # eslint . --max-warnings 200
pnpm exec tsc --noEmit
pnpm test                  # vitest run (475 tests)
pnpm run build             # next build (standalone) + postbuild copies static assets
pnpm start                 # next start (or node .next/standalone/server.js)
pnpm worker                # tsx src/workers/ai-worker.ts (needs REDIS_URL)
pnpm gen:types             # regenerate src/lib/supabase/types.ts from live DB
```

### CI (GitHub Actions)
- **`ci.yml`** — two jobs: (1) `catalog-integrity` runs `test:catalog` (variant invariants; **hard gate**); (2) `quality` on Node 22 (24 experimental): lint → typecheck → tests → build (only when Supabase secrets present). pnpm 11 pinned.
- **`pr-quality.yml`** — conventional-commit title warning, auto-labeler, missing-description warning (none blocking).

### Deployment
- **Recommended: Vercel** (Next.js auto-detect). Set all env vars, deploy. Standalone output also supports Railway/Render/Netlify.
- **Database**: run `supabase/migrations/` in order (or `supabase db push`). `scripts/rls-audit.sql` verifies policy coverage. Seeds are embedded in migrations (plans in 00003, templates in 00007/00037/00038).
- **Background worker**: deploy `pnpm worker` as a separate process if you want async ATS analysis; otherwise the inline fallback runs jobs in-request.
- **Cron**: `/api/cron/github-poll` must be invoked by an external scheduler (Vercel Cron not configured in-repo).

---

## 19. Dependency Graph

```
app/api (controllers)
  ├─► lib/auth.ts ─► lib/supabase/server.ts ─► (cookies + anon key)
  ├─► lib/validation.ts   (Zod schemas — standalone)
  ├─► lib/rate-limit.ts   ─► ioredis / memory
  ├─► lib/subscription.ts ─► lib/stripe.ts + lib/supabase/server.ts
  ├─► lib/api.ts          (ok/fail/withErrorHandling — standalone)
  ├─► lib/admin.ts        ─► lib/admin-emails.ts + supabase/server
  └─► services/**:
        services/resume/*        ─► supabase/server + features/resume-builder/config/template-section-presets
        services/ai/*            ─► Gemini REST + supabase/server (prompts table) + guard
        services/resume-analyzer ─► parser/ats-scorer/deep-ats/grammar/strength (pure) + ai/client (pipeline)
        services/jd-analyzer     ─► (pure, imports resume-analyzer types)
        services/export/*        ─► types/resume + features/resume-builder/templates (theme + variants)
        services/notifications   ─► supabase/server + supabase/admin + Resend
        services/github|applications|resume-updates|templates|projects ─► supabase/server (+ encryption)
        lib/jobs/*               ─► supabase/admin + bullmq
features/** (UI) ─► lib/query (TanStack) ─► app/api ─► services
```

Key rule: **features must never import services directly** (everything goes over the HTTP API); services may import feature *config* (template presets/variants/theme) — an intentional but noteworthy inversion.

---

## 20. Improvement Suggestions

**Architecture**
1. Resolve the **NextAuth↔Supabase session coupling** (highest priority, §14 #1): provision a Supabase session for OAuth users at login (token exchange via `supabase.auth.setSession` with a short-lived session from a `/api/auth/token` route) or replace RLS `auth.uid()` checks with a policy-friendly JWT claim. Add an integration test that logs in via OAuth and reads a resume.
2. **Deduplicate prompts**: delete the inline `PROMPTS` in `client.ts`, always resolve via `getPrompt` from `prompts.ts`.
3. **Unify the template catalog**: single source (config) → DB mirror via one generator script; delete the legacy 75 "imported" rows or ship a data-driven renderer for them.
4. Fix migration numbering (rename duplicate `00011_profiles_is_active.sql`) and add a `schema_migrations` ledger / `supabase db push` workflow in CI.
5. Stop importing the browser Supabase client in server code (`references`, `exports`, `resumes/[id]/exports`, `updates` page).

**Performance**
6. Add `Cache-Control` to the share page (or ISR) since it's public and token-addressed.
7. Move `last_seen_at` writes off the hot path (batch job or only on login).
8. Add a global concurrency cap for PDF rendering (worker queue) instead of per-user limits only.
9. Consider `renderToStaticMarkup` consolidation for HTML export (there's already a TODO).

**Security**
10. Tighten CSP (remove `unsafe-eval` if the 3D/PDF tooling allows it); add `upgrade-insecure-requests`.
11. Remove hardcoded admin emails; move entirely to `ADMIN_EMAILS` + DB role.
12. Add rate limits to signup/forgot-password if missing; add a global abuse limiter.
13. Add share-link revocation + optional expiry.

**Code quality**
14. Add `npm-run-all`-style parallel CI steps; add bundle-size analysis (`@next/bundle-analyzer`) and a Prettier config (or document the no-Prettier decision).
15. Commit the WIP auth/account-deletion work and add the missing `RESEND_API_KEY`/`RESEND_FROM_EMAIL` to `.env.example`.

**Roadmap (from README)**: GitHub deep integration, analytics dashboards, multi-language, per-JD interview questions, LinkedIn bidirectional sync, team/collaboration features.

---

## 21. Important Files (50+)

### Config & infra
| File | Purpose |
|---|---|
| `package.json` | Scripts, deps, pnpm overrides |
| `next.config.mjs` | Standalone output, pdfjs externals, images, security headers |
| `tailwind.config.js` | Design tokens (CSS-variable-backed colors, type scale) |
| `tsconfig.json` / `eslint.config.mjs` / `vitest.config.ts` / `pnpm-workspace.yaml` | Tooling |
| `.env.example` | Env contract |
| `.github/workflows/ci.yml` + `pr-quality.yml` | CI/CD |
| `src/instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` | Sentry bootstrap |
| `supabase/migrations/*` | Schema/RLS/seed (see §7) |
| `scripts/generate-supabase-types.mjs`, `scripts/rls-audit.sql` | Typegen + policy audit |

### lib (infrastructure)
| File | Purpose |
|---|---|
| `src/lib/auth.ts` | NextAuth options: providers, JWT/session callbacks, cookie hardening, rate-limited credentials, deactivation check |
| `src/lib/validation.ts` | All Zod schemas + `validateOrError` |
| `src/lib/api.ts` | `ok/fail/withErrorHandling/logError/CORS/publicCacheHeaders` |
| `src/lib/rate-limit.ts` | Redis sliding-window + memory fallback |
| `src/lib/encryption.ts` | AES-256-GCM + key rotation |
| `src/lib/subscription.ts` / `src/lib/stripe.ts` | Plan limits + Stripe client/plans |
| `src/lib/fetch-url.ts` | SSRF-guarded fetch |
| `src/lib/admin.ts` / `src/lib/admin-emails.ts` | Admin checks + audit log |
| `src/lib/github.ts` / `src/lib/github-oauth.ts` | GitHub token access + OAuth state |
| `src/lib/supabase/{client,server,admin,types}.ts` | The three DB clients |
| `src/lib/jobs/{types,queues,store,ats-processor}.ts` | Background jobs (BullMQ + inline) |
| `src/lib/query/{client,keys,resume-hooks}.ts` | TanStack Query setup + resume hooks |
| `src/middleware.ts` | Auth-gated routing |
| `src/workers/ai-worker.ts` | Standalone ATS queue worker |

### services
| File | Purpose |
|---|---|
| `src/services/resume/service.ts` | Resume CRUD, batched reads, UPSERT section writes, schema-retry |
| `src/services/resume/mapper.ts` | Single DB→client mapper (shared everywhere) |
| `src/services/resume/completion.ts` | Completion % + missing-section logic |
| `src/services/resume/bullet-matcher.ts` | Exact/fuzzy matching for AI bullet applies |
| `src/services/ai/client.ts` | Gemini calls, model fallback, retries |
| `src/services/ai/prompts.ts` | Default prompts + `prompts` table resolution/cache |
| `src/services/ai/guard.ts` | Injection sanitize + numeric-claim validation |
| `src/services/resume-analyzer/{parser,ats-scorer,deep-ats,ats-pipeline,grammar-checker,strength}.ts` | The ATS engine |
| `src/services/jd-analyzer/engine.ts` | JD keyword/role/category/gap analysis |
| `src/services/export/{pdfRenderer,docxGenerator,htmlRenderer,latexRenderer,txtGenerator,formats,pdf-templates}.tsx|ts` | Export generators |
| `src/services/notifications/{service,email}.ts` | In-app + Resend email notifications |
| `src/services/applications/service.ts` | Job tracker |
| `src/services/resume-updates/service.ts` | Update feed + add-to-resume |
| `src/services/github/sync.ts` | GitHub poll/sync |
| `src/services/templates/service.ts` | Template catalog CRUD |
| `src/services/projects/suggest.ts` | Deterministic repo ranking fallback |

### features / app
| File | Purpose |
|---|---|
| `src/features/resume-builder/config/template-variants.ts` | Variant catalog (source of truth for marketplace) |
| `src/features/resume-builder/config/template-registry.ts` | Registry metadata (ATS scores, roles, tiers) |
| `src/features/resume-builder/config/template-recommendation.ts` | Recommendation engine (+ fallback) |
| `src/features/resume-builder/config/template-section-presets.ts` | Role-aware section order for new resumes |
| `src/features/resume-builder/templates/TemplateRenderer.tsx` | Memoized dispatcher to the 8 archetypes |
| `src/features/resume-builder/templates/{Modern,AtsProfessional,Student,Minimal,Executive,Creative,ExecutiveSidebar,ModernCard}.tsx` | Archetype renderers (web) |
| `src/features/resume-builder/hooks/useResumeForm.ts` | Builder state + 1s debounced autosave |
| `src/app/builder/[resumeId]/builder-context.tsx` | Builder context contract |
| `src/features/ai-assistant/{hooks/useAiAssistant.ts,api/ai.ts,context/*}` | AI assistant wiring |
| `src/features/ats-check/*` | ATS report tabs/components |
| `src/features/auth/hooks/useAuth.ts`, `components/*` | Auth UI + hook |
| `src/features/subscription/{hooks/useSubscription.ts,components/UpgradeDialog.tsx}` | Billing UX |
| `src/app/api/{ai,resumes,[...]}` routes | Controllers (see §9) |
| `src/app/share/[token]/page.tsx` | Public share page |
| `src/app/api/stripe/webhook/route.ts` | Payment event handling |
| `src/app/api/ats-analyze/route.ts` | ATS entry (file/resume/text, sync/async) |
| `src/app/layout.tsx`, `src/app/providers.tsx` | App shell + providers |

---

## 22. Developer Onboarding Guide

### Where to start
1. **Read this document** (§1–§7) and the README (note where README diverges: template counts, migration count, "30+ templates").
2. `cp .env.example .env.local`, fill Supabase + `NEXTAUTH_SECRET` + `ENCRYPTION_KEY` + `ADMIN_EMAILS`; `corepack enable && pnpm install`.
3. Apply `supabase/migrations/` in order to your Supabase project; `pnpm gen:types` to refresh `lib/supabase/types.ts`.
4. `pnpm dev` → `localhost:3000`.

### How a feature is added (house pattern)
- New DB shape → new migration (`ALTER TABLE …` with `IF NOT EXISTS` + RLS policy + index).
- New API → route under `app/api/<name>/route.ts` following the checklist: `getServerSession` → rate/usage limit → Zod `validateOrError` → call a service → `ok()`/`fail()`. Wrap with `withErrorHandling` if async parsing may throw.
- New business logic → `src/services/<domain>/`. New UI → `src/features/<feature>/` with components + hooks. Never call services from features directly.
- Add Vitest coverage for services/mappers (`src/**/*.test.ts`), model tests on `route.test.ts` co-located with the route.
- Update README if you touch env vars, endpoints, or feature counts.

### Debugging
- Server errors: check response envelope (`{success:false, error}` is safe-mode); real detail goes to Sentry (`logError`) and the terminal via `console.error`.
- DB visibility issues: remember **three clients** — anon+RLS (server), service-role (admin/webhook/worker), browser (client). If a query "returns nothing", suspect the RLS/session coupling (§4) before the SQL.
- Rate limits: keys are `ratelimit:<scope>:<key>:<window>` in Redis; memory fallback resets per instance.
- Tests: `pnpm test src/<file>`; `test:catalog` for template invariants.

### Common pitfalls
- **pnpm only** (no npm lockfile); Node ≥22.13.
- Two `00011` migrations — apply both.
- `ENCRYPTION_KEY` must be 32-byte hex (64 chars); losing it breaks stored GitHub tokens (rotation via `ENCRYPTION_KEY_PREVIOUS`).
- AI prompts: edit the `prompts` table (admin) or `prompts.ts` defaults — **not** the inline `PROMPTS` in `client.ts` (stale).
- `resumes.template` has **no DB CHECK** anymore; validate template keys in app code.
- Don't deploy the hardcoded admin emails list as-is.

### Coding conventions
- `@/` aliases; feature modules under `features/`; services under `services/`; types in `types/`.
- API responses use the `ok/fail` envelope; 4xx/5xx statuses per the `ApiErrorStatus` union.
- DB writes go through services; side effects are best-effort (never break the main op).
- Zod for every payload; `validateOrError` for routes.
- Tests: Vitest, globals on, `@` alias configured.

---

## 23. Final Project Summary

- **Architecture**: A well-layered Next.js 15 monolith over Supabase/Postgres with a strict "route → service → Supabase" discipline, NextAuth JWT sessions, an optional Redis-backed queue for AI work, and an impressively defensive data layer (UPSERT section writes, schema-version retries, column whitelists, dual-key encryption, durable webhook idempotency).
- **Strengths**: clean separation of concerns; single resume mapper; comprehensive tests incl. cross-format export parity and template-catalog CI gates; strong security posture (RLS, SSRF guard, safe errors, anti-hallucination AI); enterprise-grade webhook handling; feature breadth (builder, ATS, JD, exports, integrations, billing, admin, analytics).
- **Weaknesses**: dual-auth (NextAuth vs Supabase RLS) coupling that is fragile and unverified for OAuth; duplicated prompt definitions; three overlapping template-catalog sources with legacy rows that have no renderer; migration numbering collision; stale README claims; a handful of browser-client-in-server-code spots; uncommitted WIP that should be merged soon.
- **Risks**: the auth/RLS coupling (#1 — verify immediately); committed admin emails; long-lived encrypted GitHub tokens with no revocation; no streaming/token budget on AI; no global export concurrency control; no staging/deploy automation beyond CI.
- **Overall design**: thoughtful and above-average for its stage — the service-layer architecture and defensive data handling would scale into a multi-service split (worker, export service) without a rewrite. The single biggest technical bet is Supabase's RLS-as-authz model combined with a non-Supabase session manager; making that explicit and correct should be the first engineering priority.
- **Future scalability**: the monolith can grow (feature modules already isolate domains); adding edge caching for public pages, queueing exports, splitting the worker, and moving to Supabase-native auth (or a token exchange) are the natural next steps. The template-catalog architecture (config-driven variants over 8 archetypes) is a genuinely scalable foundation.
