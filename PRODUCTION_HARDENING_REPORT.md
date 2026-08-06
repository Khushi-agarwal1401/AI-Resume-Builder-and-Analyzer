# Production-Hardening Report

Branch: `feat/production-hardening` · 6 commits ahead of origin
Scope: the 7-phase hardening program (TypeScript → file splitting → UPSERT → React Query → Playwright → background jobs → typed Supabase).

---

## 1. Files changed

**Phase 1 — TypeScript (earlier hardening commits)**
- `src/services/resume/mapper.ts` — consolidated the dual resume mappers into one (`mapRowToResumeData`).
- `src/lib/supabase/middleware.ts` — removed (vestigial; zero importers confirmed before deletion).
- `src/services/resume/service.test.ts`, `src/services/resume/mapper.test.ts` — coverage for the consolidated mapper.

**Phase 2 — ATS page split (`370f1bc`)**
- `src/app/ats-check/page.tsx` (1254 → ~400 lines) split into:
  - `src/app/ats-check/types.ts` — shared report/meta/UI types
  - `src/app/ats-check/constants.ts` — static lists (score thresholds, tone colors, etc.)
  - `src/app/ats-check/components/` — shared presentational components
  - `src/app/ats-check/tabs/overview.tsx`, `keywords.tsx`, `bullets.tsx`, `formatting.tsx`, `improvements.tsx`

**Phase 3 — UPSERT (`0c2d74d`)**
- `src/services/resume/service.ts` — `updateSections` rewritten from delete-then-insert to single UPSERT on `id` (skills: `onConflict: resume_id`) + diff-delete of removed rows.
- `supabase/migrations/00029_*` (skills unique index on `resume_id`).

**Phase 4 — React Query (`2399c83`)**
- `src/app/providers.tsx` — `QueryClientProvider` with sane defaults.
- `src/lib/query/keys.ts` — typed query-key factory.
- `src/features/resume/hooks/` — `useResumes`, `useResume`, mutations with optimistic updates + invalidation.
- `src/app/dashboard/page.tsx` — CRUD migrated off manual `fetch` + local state.
- `package.json` — added `pnpm typecheck` script.

**Phase 5 — Playwright E2E (`aec1534`)**
- `e2e/` — Page Object Models (`pages/`), shared fixtures, and 13 specs (signup, login, logout, resume builder, autosave, ATS analysis, AI generation, export, payments, admin login, protected routes, public pages).
- `.github/workflows/e2e.yml` — dedicated E2E CI workflow.

**Phase 6 — Background jobs (`8e3e1f7`)**
- `supabase/migrations/00030_background_jobs.sql` — job tracking table with status/result/error/attempts.
- `src/lib/jobs/` — `queues.ts` (BullMQ, inline fallback when Redis is absent), `ats-processor.ts` (shared executor), `store.ts` (service-role persistence + ownership checks), `types.ts`.
- `src/services/resume-analyzer/ats-pipeline.ts` — shared deterministic + AI pipeline used by sync and async paths.
- `src/workers/ai-worker.ts` — standalone worker entrypoint (`pnpm worker`), graceful shutdown.
- `src/app/api/jobs/[id]/route.ts` — job status API (owner-scoped).
- `src/app/api/ats-analyze/route.ts` — `mode: "async"` support.
- `package.json` / `pnpm-workspace.yaml` — `worker` script; fixed `allowBuilds` so esbuild/msgpackr-extract build correctly.

**Phase 7 — Typed Supabase (`e996233`)**
- `src/lib/supabase/types.ts` — full hand-generated `Database` type: **26 tables** (+ Views/Functions placeholders), complete `Row`/`Insert`/`Update` shapes, `Json` helper, and `Relationships` arrays.
- `src/lib/supabase/server.ts`, `admin.ts`, `client.ts` — all three clients now `createServerClient<Database>(…)`.
- `supabase/migrations/00031_settings_notification_toggles.sql` — the toggles the settings page already expects.
- 14 call sites fixed to satisfy the strict clients (typed update payloads, `Json` casts, status narrowing, worker null guards).

## 2. LOC changed

| Phase | Net lines |
| --- | --- |
| Phase 2 (ATS split) | ~−850 net (1 × 1254-line file → 8 focused modules) |
| Phase 6 (background jobs) | ~+750 (queue infra, worker, pipeline, migration) |
| Phase 7 (typed schema) | **+1,376 / −266** (types.ts +1397) |
| Phases 1, 3, 4, 5 | modest deltas (refactors + tests + e2e) |

## 3. TypeScript errors fixed

- `pnpm typecheck` (via `tsc --noEmit`): **0 errors** on the whole project.
- Phase 7 alone surfaced and fixed **~230 errors** after the strict clients landed: 165 from the `@supabase/ssr`/`supabase-js` version mismatch (rows collapsed to `never`), then ~51 real code errors → 21 → 0.
- No `@ts-ignore` / `@ts-nocheck` added; `any` avoided. Remaining `as never`/`as unknown as Json` casts are confined to genuinely dynamic payload builders (theme-aware resume inserts, cross-table section loops).

## 4. Files split

- `src/app/ats-check/page.tsx` (1254 lines) → types, constants, shared components, five tab components.
- `src/services/resume/mapper.ts` consolidated (two mappers → one).
- `src/services/resume-analyzer/` gained `ats-pipeline.ts` (shared analysis orchestration reused by sync route, async route, and worker).
- `src/lib/jobs/` and `src/workers/` isolate queue/worker concerns from API routes.

## 5. Database optimizations

- **UPSERT replaces delete-then-insert** in `updateSections` — stable IDs, preserved `created_at`, diff-delete only for removed rows.
- Skills persist as one row per resume (`unique(resume_id)`, migration 00029).
- Migration 00031 adds `settings` notification toggles the app already writes.
- Single batched `getResume` query (embedded section tables) replaces 7 parallel queries (pre-existing, kept).

## 6. Performance improvements

- React Query: dashboard/resume data cached with typed keys, automatic dedupe, background refetch, optimistic updates.
- Background jobs: heavy AI work (ATS analysis) no longer blocks HTTP requests when Redis is configured — poll `GET /api/jobs/:id`.
- ATS page split also reduced client-bundle churn for tab switching.

## 7. React Query adoption

- Provider in `src/app/providers.tsx`; typed query-key factory in `src/lib/query/keys.ts`.
- `useResumes` / `useResume` / create–update–delete mutations with optimistic updates and targeted invalidation.
- Dashboard CRUD migrated off manual fetching. (Scope was intentionally limited to the resume/dashboard domain — "do NOT over-fetch" per the brief.)

## 8. Test coverage added

- Unit: mapper edge cases (section_order, custom_sections, accent_color) — 7 tests; ATS tab components; queue/store; analyzer pipeline.
- **436 tests pass across 34 vitest files.**
- E2E: Playwright + POMs + fixtures, **13 specs** covering auth flows, builder, autosave, ATS analysis, AI generation, export, payments, admin, and protected routes; runs in CI (`.github/workflows/e2e.yml`).
- All API routes continue to pass their existing integration tests under the new typed clients.

## 9. Remaining technical debt

- `src/lib/supabase/types.ts` is hand-maintained. The live DB has drifted from repo migrations (e.g. `is_active`, `last_seen_at`, `repo_stars` exist in migrations but not the deployed DB — code tolerates this via `isMissingColumnError` retries). Best fix: run `supabase gen types` against a synced environment and commit the output.
- 7 pre-existing ESLint warnings (unused vars in `src/app/page.tsx`, `sign-in/page.tsx`) — not introduced by this work.
- Playwright specs need a seeded test DB / Stripe test keys to be fully green in CI.
- Background jobs fall back to inline execution without Redis — correct but means long AI calls still block the request in that mode.
- No service-role-only RLS policy exists for `background_jobs` writes from the worker — mitigated today because the worker uses the admin client.

## 10. Future recommendations

1. **Generate types**: `supabase gen types typescript` against the canonical DB; delete the hand-maintained `types.ts`.
2. **Apply the 7 unapplied migrations** to the live DB (or reconcile drift) so `isMissingColumnError` retries become dead code.
3. **Real queue in production**: provision Redis (Upstash) so `ats-analysis` (and later resume generation / job match) always run async; add job cancellation + progress endpoints.
4. **E2E hardening**: seed users via API in Playwright fixtures; add Stripe test-mode webhook replay.
5. **React Query expansion**: migrate ATS history, applications, and admin tables onto the same hooks.
6. **Watch the remaining `as never` casts** in the section-loop insert — they exist because `supabase.from(table)` is union-typed; a per-table typed map would remove them.
7. **Final validation state**: `pnpm lint` ✅ (0 errors), `pnpm typecheck` ✅ (0 errors), `pnpm test` ✅ (436/436), `pnpm build` ✅ (standalone output + static assets).
