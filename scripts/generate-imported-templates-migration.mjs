#!/usr/bin/env node
/**
 * Generates supabase/migrations/00032_imported_templates_catalog.sql from the
 * imported-template catalog TS files.
 *
 * Usage: node scripts/generate-imported-templates-migration.mjs
 *
 * The migration:
 *   1. Drops the resumes.template CHECK constraint (the catalog is now
 *      data-driven and open-ended — validation lives in app code).
 *   2. Extends templates.category CHECK to 'imported'.
 *   3. Seeds every catalog entry (75 imported) as an active template row.
 *   4. Reconciles stale rows from an earlier import iteration whose key
 *      scheme (aurum-*, reactive-*, rendercv-*, resumake-*) is no longer in
 *      the catalog, so databases seeded by that attempt don't show
 *      duplicate designs.
 * The 8 built-in templates are already seeded by earlier migrations.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "supabase/migrations/00032_imported_templates_catalog.sql");
const FILES = [
  path.join(ROOT, "src/features/resume-builder/templates/imported/cvaurum.ts"),
  path.join(ROOT, "src/features/resume-builder/templates/imported/community.ts"),
];

/** Pull {id,name,description,tags,atsScore,color,columns} out of a catalog TS file. */
function extractEntries(file) {
  const src = fs.readFileSync(file, "utf8");
  const entries = [];
  // Split on each `id: "..."` marker — every template object starts with it.
  const parts = src.split(/id: "/).slice(1);
  for (const part of parts) {
    const id = part.slice(0, part.indexOf('"'));
    if (!id || /[^a-z0-9-]/.test(id)) continue;
    const grab = (key) => {
      const m = part.match(new RegExp(`${key}: \\"([^\\"]+)\\"`));
      // Raw value — SQL escaping happens once, in lit().
      return m ? m[1] : "";
    };
    const name = grab("name");
    const description = grab("description");
    if (!name) continue;
    entries.push({ id, name, description });
  }
  return entries;
}

const entries = FILES.flatMap(extractEntries);
const seen = new Set();
const unique = entries.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
console.log(`Extracted ${unique.length} imported templates.`);

const categoryCheck = [
  "'ats-professional'", "'modern'", "'minimal'", "'executive'", "'student'",
  "'creative'", "'executive-sidebar'", "'modern-card'", "'imported'",
].join(", ");

/** SQL string literal (single-quoted, ''-escaped). */
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

// Bare VALUES tuples — the column list lives only in the INSERT header above.
const rows = unique
  .map((e, i) => `(${lit(e.name)}, 'imported', ${lit(e.description)}, ${lit(e.id)}, true, ${50 + i})`)
  .join(",\n");

// Old key scheme from the earlier import attempt that was already seeded into
// some databases. The new catalog keys are cv-*, rr-*, rc-*, rm-*, or-* — so
// any row using the old prefixes is stale and must go, to avoid duplicates.
const staleWhere =
  " (component_key LIKE 'aurum-%' OR component_key LIKE 'reactive-%'" +
  " OR component_key LIKE 'rendercv-%' OR component_key LIKE 'resumake-%')";

const sql = `-- Imported template catalog: 83 total designs (8 built-in + 75 curated
-- imported from CVAurum, reactive-resume, resumake.io, rendercv, and
-- open-resume; non-professional / non-company-safe designs excluded).
--
-- The imported templates are DATA-DRIVEN: a single generic renderer consumes
-- each config, so the app can grow the catalog without adding React components.
-- The DB stores them so the admin catalog + /api/templates stay in sync, and
-- the resumes.template CHECK constraint is dropped since the set is open-ended
-- (app-level validation is the guard now).

-- 1. Resume template column: drop the fixed 8-key CHECK constraint.
ALTER TABLE resumes DROP CONSTRAINT IF EXISTS resumes_template_check;

-- 2. templates.category: allow the 'imported' category.
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_category_check;
ALTER TABLE templates ADD CONSTRAINT templates_category_check
  CHECK (category IN (${categoryCheck}));

-- 3. Seed the 75 imported templates (idempotent via component_key UNIQUE).
INSERT INTO templates (name, category, description, component_key, is_active, sort_order)
VALUES
${rows}
ON CONFLICT (component_key) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_active = true,
  sort_order = EXCLUDED.sort_order;

-- 4. Reconcile rows from an earlier import iteration (old key scheme) so the
-- catalog matches the app exactly. Only touches keys that are no longer part
-- of the catalog; admin-created rows with other keys are left untouched.
DELETE FROM templates
WHERE${staleWhere};
`;

fs.writeFileSync(OUT, sql, "utf8");
console.log(`Wrote ${OUT}`);
