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
 *   3. Seeds every catalog entry (88 imported) as an active template row.
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
      const m = part.match(new RegExp(`${key}: \\"([^\\"]+)\"`));
      return m ? m[1].replace(/'/g, "''") : "";
    };
    const name = grab("name");
    const description = grab("description");
    const color = grab("primary") || "#2563eb";
    const tagsMatch = part.match(/tags: \[([^\]]*)\]/);
    const atsMatch = part.match(/atsScore: (\d+)/);
    const columnsMatch = part.match(/columns: (\d)/);
    if (!name) continue;
    entries.push({
      id,
      name,
      description,
      tags: (tagsMatch?.[1] ?? "")
        .split(",")
        .map((t) => t.replace(/["'\s]/g, ""))
        .filter(Boolean),
      atsScore: atsMatch ? Number(atsMatch[1]) : 90,
      color,
      columns: columnsMatch ? Number(columnsMatch[1]) : 1,
    });
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

const rows = unique
  .map((e, i) => {
    const cols = `(name, category, description, component_key, is_active, sort_order) VALUES (${lit(e.name)}, 'imported', ${lit(e.description)}, ${lit(e.id)}, true, ${50 + i})`;
    return cols;
  })
  .join(",\n");

const sql = `-- Imported template catalog: 96 total designs (8 built-in + 88 imported
-- from CVAurum, reactive-resume, resumake.io, rendercv, and open-resume).
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

-- 3. Seed the 88 imported templates (idempotent via component_key UNIQUE).
INSERT INTO templates (name, category, description, component_key, is_active, sort_order)
VALUES
${rows}
ON CONFLICT (component_key) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_active = true,
  sort_order = EXCLUDED.sort_order;
`;

fs.writeFileSync(OUT, sql, "utf8");
console.log(`Wrote ${OUT}`);
