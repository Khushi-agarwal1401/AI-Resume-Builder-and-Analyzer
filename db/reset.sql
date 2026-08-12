-- ═══════════════════════════════════════════════════════════════════════════
--  DESTRUCTIVE RESET — DO NOT RUN AGAINST A DATABASE WITH DATA YOU NEED
-- ═══════════════════════════════════════════════════════════════════════════
--
--  ⚠⚠⚠  THIS FILE DELETES ALL TABLES, ALL TYPES, AND ALL DATA  ⚠⚠⚠
--
--  Every table and enum type in the application schema is dropped with
--  CASCADE. There is NO undo. After running this you MUST re-apply the
--  idempotent schema to rebuild everything:
--      psql "$DATABASE_URL" -f db/reset.sql
--      psql "$DATABASE_URL" -f db/schema.sql
--
--  Never run this file manually or in an automated pipeline. Use the guarded
--  script instead, which requires explicit confirmation:
--      pnpm db:reset                        # interactive confirmation required
--      DB_RESET_CONFIRM=yes pnpm db:reset   # non-interactive (CI/scripts)
--
--  Intended for local development and throwaway environments only.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP TABLE IF EXISTS
  exports,
  "references",
  resume_versions,
  background_jobs,
  webhook_events,
  notifications,
  admin_audit_log,
  ats_analyses,
  templates,
  resume_updates,
  applications,
  settings,
  prompts,
  usage_counts,
  subscriptions,
  subscription_plans,
  job_analyses,
  activities,
  volunteer,
  publications,
  open_source,
  leadership,
  coding_profiles,
  languages,
  achievements,
  certifications,
  skills,
  projects,
  experience,
  education,
  resumes,
  profiles
CASCADE;

DROP TYPE IF EXISTS application_status;
DROP TYPE IF EXISTS update_source;
DROP TYPE IF EXISTS update_status;

COMMIT;
