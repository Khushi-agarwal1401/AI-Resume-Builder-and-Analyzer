-- 00029_upsert_support.sql
-- Enable UPSERT-based section writes (Phase 3 of the production-hardening work):
--
-- 1. skills: enforce a single row per resume so updateSections can upsert with
--    onConflict: "resume_id" instead of delete-then-insert. The app already
--    treats skills as single-row; this just makes the invariant enforceable.
-- 2. (Generic section tables already have a PRIMARY KEY on id, which is the
--    onConflict target used by the new updateSections upsert path.)

-- Deduplicate any legacy skills rows first (keep the earliest id per resume),
-- otherwise the unique index below would fail on existing data.
DELETE FROM public.skills a
USING public.skills b
WHERE a.resume_id = b.resume_id
  AND a.id > b.id;

-- Enforce one skills row per resume.
CREATE UNIQUE INDEX IF NOT EXISTS skills_resume_id_key
  ON public.skills (resume_id);
