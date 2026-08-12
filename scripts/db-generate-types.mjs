#!/usr/bin/env node
/**
 * Generates `src/lib/db/types.ts` from `db/schema.sql`.
 *
 * The types were previously hand-maintained and drifted from the schema
 * (missing columns, stale CHECK unions). This script makes `db/schema.sql`
 * the single source of truth and eliminates that whole class of bug.
 *
 * Usage:
 *   node scripts/db-generate-types.mjs           # regenerate types.ts
 *   node scripts/db-generate-types.mjs --check   # exit 1 if types.ts is stale
 *
 * Parsing rules (tuned to this repo's schema.sql):
 *   • Tables:      `CREATE TABLE IF NOT EXISTS <name> ( … )` — bodies are
 *                  split into column definitions on top-level commas, so
 *                  multi-line CHECK IN lists stay intact.
 *   • Enums:       `CREATE TYPE <name> AS ENUM ( … )` (inside DO $$ blocks).
 *   • Type map:    TEXT/UUID → string, INTEGER/BIGINT → number,
 *                  BOOLEAN → boolean, JSON/JSONB → Json, timestamps/dates →
 *                  string, TEXT[] → string[].
 *   • Unions:      CREATE TYPE enums always become literal unions;
 *                  templates.category, applications.outcome_type and
 *                  background_jobs.job_type/status keep literal unions from
 *                  their CHECK IN lists (existing codebase convention).
 *                  All other CHECK-only TEXT columns stay `string`.
 *   • Nullability: a column is non-null in `Row` when it is NOT NULL or has
 *                  a DEFAULT (matches the app's existing convention); `Insert`
 *                  requires columns that are NOT NULL with no DEFAULT;
 *                  `Update` makes every column optional.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = join(root, "db", "schema.sql");
const typesPath = join(root, "src", "lib", "db", "types.ts");
const checkOnly = process.argv.includes("--check");

const sql = readFileSync(schemaPath, "utf8");

// ── SQL type → TS type ──────────────────────────────────────────────────────
const BASE_TYPE_MAP = {
  text: "string",
  varchar: "string",
  char: "string",
  uuid: "string",
  integer: "number",
  int: "number",
  smallint: "number",
  bigint: "number",
  numeric: "number",
  "double precision": "number",
  real: "number",
  boolean: "boolean",
  bool: "boolean",
  json: "Json",
  jsonb: "Json",
  timestamptz: "string",
  timestamp: "string",
  date: "string",
  time: "string",
  timetz: "string",
};

/**
 * CHECK IN lists that keep literal unions (existing codebase convention).
 * Enum-typed columns are unioned automatically via CREATE TYPE parsing.
 */
const CHECK_UNION_TABLES = new Map([
  ["templates", new Set(["category"])],
  ["applications", new Set(["outcome_type"])],
  ["background_jobs", new Set(["job_type", "status"])],
]);

// ── Parsing helpers ─────────────────────────────────────────────────────────

const quote = (v) => `"${v}"`;

function extractStringList(raw) {
  return raw
    .split(",")
    .map((v) => v.trim().replace(/^'/, "").replace(/'$/, ""))
    .filter(Boolean);
}

/** `CREATE TYPE name AS ENUM ('a', 'b')` → name → ["a", "b"] */
function parseEnums(source) {
  const enums = new Map();
  const re = /CREATE\s+TYPE\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+AS\s+ENUM\s*\(([^)]*)\)/g;
  for (const m of source.matchAll(re)) {
    enums.set(m[1], extractStringList(m[2]));
  }
  return enums;
}

/** Extract every `CREATE TABLE IF NOT EXISTS name ( body )` body by name. */
function parseTableBodies(source) {
  const tables = new Map();
  const re = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+("?)([a-zA-Z_][a-zA-Z0-9_]*)\1\s*\(/g;
  for (const m of source.matchAll(re)) {
    const name = m[2];
    let depth = 1;
    let i = m.index + m[0].length;
    for (; i < source.length && depth > 0; i++) {
      if (source[i] === "(") depth++;
      else if (source[i] === ")") depth--;
    }
    tables.set(name, source.slice(m.index + m[0].length, i - 1));
  }
  return tables;
}

/** Split a table body into column definitions on top-level commas. */
function splitTopLevel(body) {
  const tokens = [];
  let depth = 0;
  let current = "";
  for (const ch of body) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      tokens.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) tokens.push(current);
  return tokens;
}

const TABLE_LEVEL_CONSTRAINT = /^\s*(UNIQUE|CONSTRAINT|PRIMARY|FOREIGN|CHECK|EXCLUDE|INDEX)\b/i;

/**
 * Parse one column definition like:
 *   `user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL`
 *   `category TEXT NOT NULL CHECK (category IN (\n  'a', 'b'\n))`
 * Returns null for table-level constraints / unparsable lines.
 */
function parseColumn(raw, enums, tableName, warnings) {
  const token = raw.trim();
  if (!token) return null;
  if (TABLE_LEVEL_CONSTRAINT.test(token)) return null;

  const m = token.match(/^("?)([a-zA-Z_][a-zA-Z0-9_]*)\1\s+([a-zA-Z_][a-zA-Z0-9_]*)(\[\])?\s*([\s\S]*)$/);
  if (!m) {
    warnings.push(`  ⚠ ${tableName}: could not parse column definition: ${token.slice(0, 60)}…`);
    return null;
  }

  const name = m[2];
  const baseType = m[3];
  const isArray = !!m[4];
  const opts = m[5] ?? "";

  // PRIMARY KEY implies NOT NULL in Postgres even without the explicit keyword.
  const hasNotNull = /\bNOT\s+NULL\b|\bPRIMARY\s+KEY\b/i.test(opts);
  const hasDefault = /\bDEFAULT\b/i.test(opts);
  const ref = opts.match(/REFERENCES\s+("?)([a-zA-Z_][a-zA-Z0-9_]*)\1\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/);
  const checkIn = opts.match(/CHECK\s*\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s+IN\s*\(([\s\S]*?)\)/);

  const lower = baseType.toLowerCase();
  let ts;
  if (enums.has(baseType)) {
    ts = enums.get(baseType).map(quote).join(" | ");
  } else if (CHECK_UNION_TABLES.get(tableName)?.has(name) && checkIn) {
    ts = extractStringList(checkIn[1]).map(quote).join(" | ");
  } else if (BASE_TYPE_MAP[lower] !== undefined) {
    ts = BASE_TYPE_MAP[lower];
  } else {
    warnings.push(`  ⚠ ${tableName}.${name}: unknown type "${baseType}" — defaulting to string`);
    ts = "string";
  }
  if (isArray) ts = `${ts}[]`;

  return {
    name,
    ts,
    nonNull: hasNotNull || hasDefault,
    requiredOnInsert: hasNotNull && !hasDefault,
    relationship: ref ? { table: ref[2], column: ref[3] } : null,
  };
}

// ── Generation ──────────────────────────────────────────────────────────────

const enums = parseEnums(sql);
const warnings = [];

const tables = new Map();
for (const [name, body] of parseTableBodies(sql)) {
  const cols = [];
  for (const token of splitTopLevel(body)) {
    const col = parseColumn(token, enums, name, warnings);
    if (col) cols.push(col);
  }
  tables.set(name, cols);
}

const tableNames = [...tables.keys()].sort();

// ── DDL coverage guard ─────────────────────────────────────────────────────
// The parser only understands CREATE TABLE IF NOT EXISTS and CREATE TYPE
// AS ENUM. Any other schema-changing DDL would silently produce incomplete
// types, so it must fail loudly in --check mode instead.
function detectUncoveredDdl(source, parsedTables) {
  const issues = [];
  // Drop full-line `--` comments first — the schema header documents the
  // conventions ("CREATE TABLE IF NOT EXISTS …", "ALTER TABLE … ADD COLUMN")
  // and those mentions must not count as real DDL.
  const ddl = source.replace(/^\s*--.*$/gm, "");

  const declared = [...ddl.matchAll(/CREATE\s+TABLE\b/gi)].length;
  if (declared !== parsedTables.size) {
    issues.push(
      `Parser found ${parsedTables.size} tables but schema.sql declares ${declared} CREATE TABLE statement(s) — ` +
      `a table was not parsed (is it missing \`IF NOT EXISTS\`?).`
    );
  }

  const lineRe = /^\s*(CREATE\s+TABLE|ALTER\s+TABLE|ALTER\s+TYPE|DROP\s+(TABLE|TYPE|COLUMN)|RENAME\s+TO)\b.*$/gim;
  for (const m of ddl.matchAll(lineRe)) {
    const line = m[0].trim();
    const kw = m[1].toUpperCase();
    if (kw.startsWith("CREATE TABLE")) {
      if (!/IF\s+NOT\s+EXISTS/i.test(line)) {
        issues.push(`CREATE TABLE without \`IF NOT EXISTS\` (types cannot be generated): ${line}`);
      }
    } else if (kw.startsWith("ALTER TABLE")) {
      // Allowed: additive live-DB convergence fixups that mirror a column
      // already present in the CREATE TABLE body (so types stay correct).
      if (/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/i.test(line)) continue;
      // Allowed: the documented teamsize → team_size convergence rename.
      if (/RENAME\s+COLUMN\s+teamsize\s+TO\s+team_size/i.test(line)) continue;
      issues.push(`Unhandled ALTER TABLE (types generator does not parse it): ${line}`);
    } else if (kw.startsWith("ALTER TYPE")) {
      if (/ADD\s+VALUE\s+IF\s+NOT\s+EXISTS/i.test(line)) continue;
      issues.push(`Unhandled ALTER TYPE (types generator does not parse it): ${line}`);
    } else {
      issues.push(`Destructive/unhandled DDL in schema.sql: ${line}`);
    }
  }
  return issues;
}

const ddlIssues = detectUncoveredDdl(sql, tables);

const INDENT = "          "; // 10 spaces — columns nest under `Table → Row/Insert/Update`

function renderTypeBlock(cols, mode) {
  const lines = [];
  for (const col of cols) {
    let decl;
    if (mode === "Row") {
      decl = `${col.name}: ${col.nonNull ? col.ts : `${col.ts} | null`};`;
    } else if (mode === "Insert") {
      if (col.requiredOnInsert) decl = `${col.name}: ${col.ts};`;
      else decl = `${col.name}?: ${col.nonNull ? col.ts : `${col.ts} | null`};`;
    } else {
      decl = `${col.name}?: ${col.nonNull ? col.ts : `${col.ts} | null`};`;
    }
    lines.push(INDENT + decl);
  }
  return lines.join("\n");
}

function renderRelationships(name, cols) {
  const rels = cols.filter((c) => c.relationship);
  if (rels.length === 0) return "[]";
  const items = rels.map(
    (c) =>
      `          { foreignKeyName: ${quote(`${name}_${c.name}_fkey`)}; columns: [${quote(c.name)}]; isOneToOne: false; referencedRelation: ${quote(c.relationship.table)}; referencedColumns: [${quote(c.relationship.column)}] }`
  );
  return `[\n${items.join(",\n")}\n        ]`;
}

const tableBlocks = tableNames
  .map((name) => {
    const cols = tables.get(name);
    return [
      `      ${name}: {`,
      `        Row: {\n${renderTypeBlock(cols, "Row")}\n        };`,
      `        Insert: {\n${renderTypeBlock(cols, "Insert")}\n        };`,
      `        Update: {\n${renderTypeBlock(cols, "Update")}\n        };`,
      `        Relationships: ${renderRelationships(name, cols)};`,
      `      };`,
    ].join("\n");
  })
  .join("\n");

const enumNames = [...enums.keys()].sort();
const enumBlock = enumNames
  .map((name) => `      ${name}: ${enums.get(name).map(quote).join(" | ")};`)
  .join("\n");

// ── Runtime column list ────────────────────────────────────────────────────
// Mirrors the tables/columns of db/schema.sql so app code (e.g. the resume
// service's section write whitelist) can derive persistable columns instead
// of hand-maintaining a second copy that drifts.
const columnList = tableNames
  .map((name) => `  ${name}: [${tables.get(name).map((c) => quote(c.name)).join(", ")}],`)
  .join("\n");

const output = `// ─────────────────────────────────────────────────────────────
// Database types — AUTO-GENERATED from db/schema.sql.
//
// Do NOT edit by hand. Regenerate with:
//     pnpm db:gen-types
// Verify sync (CI gate) with:
//     pnpm db:check-types
//
// Type mapping rules:
//   • TEXT/UUID → string, INTEGER/BIGINT → number, BOOLEAN → boolean,
//     JSON/JSONB → Json, timestamps/dates → string, TEXT[] → string[]
//   • CREATE TYPE enums → string literal unions
//   • templates.category, applications.outcome_type, background_jobs
//     .job_type/.status keep literal unions (CHECK IN lists); other
//     CHECK-only TEXT columns stay \`string\`.
//   • A column is non-null in \`Row\` when it is NOT NULL or has a DEFAULT
//     (matches the app's existing convention).
//   • DB_TABLE_COLUMNS (runtime const) mirrors every table's columns so
//     services can derive persistable column whitelists without drift.
//   • The parser covers CREATE TABLE IF NOT EXISTS and CREATE TYPE AS ENUM
//     only — any other schema-changing DDL makes \`db:check-types\` fail loudly
//     (see detectUncoveredDdl).
//
// The \`profiles\` table carries the self-hosted auth columns
// (password_hash, password_reset_token, password_reset_expires_at).
// ─────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Runtime table → column map, derived from db/schema.sql (see generator header). */
export const DB_TABLE_COLUMNS = {
${columnList}
} as const;

export interface Database {
  public: {
    Tables: {
${tableBlocks}
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
${enumBlock}
    };
    CompositeTypes: Record<string, never>;
  };
}
`;

if (checkOnly) {
  if (ddlIssues.length > 0) {
    console.error("✗ db/schema.sql contains DDL the type generator cannot parse:");
    for (const i of ddlIssues) console.error(`  • ${i}`);
    console.error("  Add the column to the CREATE TABLE body (so types are generated) and keep");
    console.error("  any live-DB convergence fixup guarded/ADD COLUMN IF NOT EXISTS.");
    process.exit(1);
  }
  const existing = existsSync(typesPath) ? readFileSync(typesPath, "utf8") : "";
  if (existing !== output) {
    console.error("✗ src/lib/db/types.ts is out of sync with db/schema.sql.");
    console.error("  Run `pnpm db:gen-types` and commit the result.");
    for (const w of warnings) console.error(w);
    process.exit(1);
  }
  console.log("✓ src/lib/db/types.ts is in sync with db/schema.sql.");
} else {
  writeFileSync(typesPath, output);
  console.log("Regenerated src/lib/db/types.ts from db/schema.sql.");
  for (const w of warnings) console.error(w);
  for (const i of ddlIssues) console.error(`⚠ ${i}`);
}
