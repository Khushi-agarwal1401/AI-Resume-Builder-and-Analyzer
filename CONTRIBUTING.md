# Contributing to AI Resume Builder & Analyzer

Thanks for your interest in contributing! This document outlines the workflow,
conventions, and expectations for the repository.

> **Community standards** — By participating, you agree to abide by our
> [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable
> behavior to the repository maintainers.
>
> **Security** — Found a vulnerability? Do **not** open a public issue. See
> [SECURITY.md](SECURITY.md) for our private reporting process.

## Getting Started

### Prerequisites

- **Node.js ≥ 22.13** (see `.nvmrc` — pnpm 11 requires it)
- **pnpm ≥ 11**
- A Neon PostgreSQL database (connection string in `DATABASE_URL`)
- Google Gemini API key for AI features (optional for most UI work)

### Local setup

```bash
pnpm install
cp .env.example .env.local   # then fill in values
pnpm dev
```

### Database

The consolidated schema lives in `db/schema.sql` and is applied with
`pnpm db:migrate` (psql). See the README's Database Setup section for details.

## Development Workflow

1. **Create a branch** from `main`:

   ```bash
   git checkout main && git pull
   git checkout -b feat/your-feature
   ```

2. **Make changes.** Follow the conventions below.
3. **Run checks before pushing:**

   ```bash
   pnpm run lint      # ESLint
   pnpm exec tsc --noEmit   # TypeScript
   pnpm test          # Vitest unit tests
   ```

4. **Open a pull request** against `main` with a clear description.

## Branch & Commit Conventions

- Use [Conventional Commits](https://www.conventionalcommits.org/):
  `feat(scope): description`, `fix(scope): description`, `chore:`, `docs:`,
  `test:`, `refactor:`, `perf:`, `ci:`.
- Keep commits focused and atomic.
- PR titles must follow the conventional commit format (enforced by
  `.github/workflows/pr-quality.yml` — currently a warning).

## Code Conventions

- **Language:** TypeScript with `strict: true`. No `any` without justification.
- **Imports:** use the `@/` alias (`src/` root).
- **Features:** keep UI features self-contained under `src/features/<feature>/`
  with their components, hooks, and context colocated.
- **Server logic:** domain/processing logic belongs in `src/services/`;
  infrastructure (database, Stripe, Redis) in `src/lib/`.
- **Routes:** Next.js App Router — server logic in route handlers
  (`src/app/api/**/route.ts`), validation via `src/lib/validation.ts` schemas.
- **Security:** never trust client input; validate on the server. Never log
  secrets. Never commit `.env*` files.
- **Database:** schema changes are made in `db/schema.sql` (idempotent — safe
  to re-run).

## Testing

- Unit tests use **Vitest** (`pnpm test`).
- Test files live next to the code they test: `*.test.ts` / `*.test.tsx`.
- Keep AI-dependent tests deterministic with mocked clients/fetches.

## Pull Request Checklist

- [ ] Branch is up to date with `main`
- [ ] `pnpm run lint` passes
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm test` passes
- [ ] New features have tests where practical
- [ ] Database changes are reflected in `db/schema.sql`
- [ ] No secrets, keys, or `.env` values committed
- [ ] PR description explains the change and testing done

## Reporting Bugs & Feature Requests

Open an issue using the provided templates. For security vulnerabilities, see
[SECURITY.md](SECURITY.md) — do **not** open a public issue.
