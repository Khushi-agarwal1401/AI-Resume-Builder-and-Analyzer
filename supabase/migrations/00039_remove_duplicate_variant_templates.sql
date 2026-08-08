-- Remove duplicate/imported template rows — keep only the 8 original templates.
--
-- The marketplace previously shipped 55+ "variant" templates that duplicated the
-- 8 original layouts (same renderer, different accent/font) plus a data-driven
-- imported catalog (75 rows seeded by 00032). The app catalog now contains only
-- the 8 originals, and `resumes.template` values that still carry a removed
-- variant key keep rendering through their original archetype via the app-side
-- LEGACY_VARIANTS map (src/features/resume-builder/config/template-variants.ts),
-- so no existing resume changes format.
--
-- This migration removes every non-original catalog row. `templates` is a
-- public catalog table (no FK from resumes — the template value is a text
-- column), so deleting rows never touches user data.
--
-- Idempotent: re-running deletes nothing new.
--
-- NOTE: intentionally broad — it removes every row that is not one of the 8
-- originals, including any admin-created custom template rows. The category
-- CHECK constraint is left untouched (00038's version still allows 'imported'
-- etc., which the admin template API can still write).
DELETE FROM templates
WHERE component_key NOT IN (
    'ats-professional',
    'modern',
    'student',
    'minimal',
    'executive',
    'creative',
    'executive-sidebar',
    'modern-card'
);
