# Scripts

Utility scripts for development and maintenance. All commands run from the
repository root.

| Script | Purpose |
|---|---|
| `generate-supabase-types.mjs` | Regenerates `src/lib/supabase/types.ts` from the Supabase project. Requires `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ACCESS_TOKEN`) in the environment. Run via `pnpm gen:types`. |
| `generate-imported-templates-migration.mjs` | Regenerates the imported-template catalog seed migration (`supabase/migrations/00032_imported_templates_catalog.sql`). Run with `node scripts/generate-imported-templates-migration.mjs`. |
| `rls-audit.sql` | Ad-hoc SQL for auditing Row Level Security policies across all tables. Run manually in the Supabase SQL editor. |

## Conventions

- `.mjs` scripts are plain Node ESM — no build step required.
- Scripts must never require secrets to be hardcoded; read from environment.
- Keep output deterministic so regenerated files produce minimal diffs.
