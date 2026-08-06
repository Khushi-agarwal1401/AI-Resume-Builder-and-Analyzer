#!/usr/bin/env node
/**
 * Regenerates `src/lib/supabase/types.ts` from the LIVE Supabase project.
 *
 * Usage:
 *   node scripts/generate-supabase-types.mjs                    # reads .env.local (URL + service-role key)
 *   node scripts/generate-supabase-types.mjs --openapi <file>   # or from a saved OpenAPI JSON file
 *
 * How it works:
 *  1. Fetches the PostgREST OpenAPI spec of the live project (service-role key).
 *  2. Derives the `Database` type from it (Row/Insert/Update/Relationships).
 *  3. Applies MIGRATION_ONLY overlays: columns/tables that exist in the repo's
 *     migrations (and are used by the code) but are NOT yet in the deployed DB.
 *     The service layer already tolerates this drift via isMissingColumnError
 *     retries (see services/resume/service.ts).
 *  4. Applies TYPE_OVERRIDES for columns where the OpenAPI spec loses information
 *     (plain-text enums, unknown nullability) so the emitted types match the
 *     repo's intended schema.
 *  5. Writes the file with a generated header. Run `pnpm typecheck` after.
 *
 * When the live DB catches up with the migrations, the MIGRATION_ONLY map below
 * can be emptied and regeneration produces the pure live schema.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "src/lib/supabase/types.ts");
const ENV_FILE = path.join(ROOT, ".env.local");

// ── Migration-only columns (in code, not yet in the live DB) ───────────────
// Each entry documents the migration that adds the column. Types match the
// repo's intended schema and the code that consumes them.
const MIGRATION_ONLY_COLUMNS = {
  profiles: {
    // 00011_profiles_is_active.sql · 00016_profiles_last_seen.sql
    is_active: "boolean | null",
    last_seen_at: "string | null",
  },
  resumes: {
    // 00022_resume_theme.sql · 00023_resume_share.sql · 00024_resume_section_order.sql
    // 00025_download_count.sql · 00026_custom_sections.sql
    accent_color: "string | null",
    font_family: "string | null",
    section_order: "Json | null",
    custom_sections: "Json | null",
    download_count: "number | null",
    view_count: "number | null",
    share_token: "string | null",
    share_enabled: "boolean | null",
    share_updated_at: "string | null",
  },
  resume_updates: {
    // 00020_resume_updates_repo_stats.sql
    repo_stars: "number | null",
    repo_forks: "number | null",
  },
  applications: {
    // 00021_application_outcomes.sql
    outcome_type: '"round_reached" | "offer" | "rejected" | null',
    outcome_notes: "string | null",
    interview_round: "number | null",
  },
  settings: {
    // 00003_subscriptions.sql · 00031_settings_notification_toggles.sql
    resume_updates: "boolean",
    job_alerts: "boolean",
  },
};

// ── Migration-only tables (exist in code, not in the live DB) ──────────────
const MIGRATION_ONLY_TABLES = {
  // 00030_background_jobs.sql
  background_jobs: {
    Row: {
      id: "string",
      user_id: "string",
      job_type: '"ats-analysis" | "resume-generation" | "job-match"',
      status: '"queued" | "processing" | "completed" | "failed" | "cancelled"',
      payload: "Json",
      result: "Json | null",
      error: "string | null",
      attempts: "number",
      created_at: "string",
      started_at: "string | null",
      completed_at: "string | null",
    },
    Insert: {
      id: "string?",
      user_id: "string",
      job_type: '"ats-analysis" | "resume-generation" | "job-match"',
      status: '"queued" | "processing" | "completed" | "failed" | "cancelled"?',
      payload: "Json?",
      result: "Json | null?",
      error: "string | null?",
      attempts: "number?",
      started_at: "string | null?",
      completed_at: "string | null?",
    },
    Update: {
      job_type: '"ats-analysis" | "resume-generation" | "job-match"?',
      status: '"queued" | "processing" | "completed" | "failed" | "cancelled"?',
      payload: "Json?",
      result: "Json | null?",
      error: "string | null?",
      attempts: "number?",
      started_at: "string | null?",
      completed_at: "string | null?",
    },
    Relationships: [["user_id", "profiles", "id", false]],
  },
  // 00028_webhook_events.sql
  webhook_events: {
    Row: { id: "string", event_id: "string", processed_at: "string" },
    Insert: { id: "string?", event_id: "string" },
    Update: { event_id: "string?" },
    Relationships: [],
  },
  // 00013_admin_audit_log.sql
  admin_audit_log: {
    Row: {
      id: "string",
      admin_id: "string",
      action: "string",
      target_type: "string",
      target_id: "string",
      changes: "Json",
      created_at: "string",
    },
    Insert: {
      id: "string?",
      admin_id: "string",
      action: "string",
      target_type: "string",
      target_id: "string",
      changes: "Json",
    },
    Update: { action: "string?", target_type: "string?", target_id: "string?", changes: "Json?" },
    Relationships: [["admin_id", "profiles", "id", false]],
  },
};

// ── Type overrides for columns where the OpenAPI spec loses information ────
// Keyed "table.column" → explicit TypeScript type (overrides spec-derived type).
const TYPE_OVERRIDES = {
  // Live templates.category is a plain text column; the app models the 8 known values.
  "templates.category":
    '"ats-professional" | "modern" | "minimal" | "executive" | "student" | "creative" | "executive-sidebar" | "modern-card"',
  // Live reports these as NOT NULL (required), but the app writes NULLs.
  "notifications.message": "string | null",
  "notifications.link": "string | null",
  // Live settings booleans have no nullability info; the app treats them as booleans.
  "settings.email_notifications": "boolean",
  "settings.dark_mode": "boolean",
  "settings.resume_updates": "boolean",
  "settings.job_alerts": "boolean",
  // Live resumes stores these as text[]; the app's ResumeData uses Json for them.
  "resumes.coursework": "Json",
  "resumes.interests": "Json",
};

// ── Column renames the live DB hasn't applied yet (00017_rename_current_role.sql) ──
const COLUMN_RENAMES = { current_role: "current_position" };

// ─────────────────────────────── spec loading ──────────────────────────────

async function loadSpec() {
  const argIdx = process.argv.indexOf("--openapi");
  const explicit = argIdx >= 0 ? process.argv[argIdx + 1] : null;

  if (explicit && !/^https?:\/\//.test(explicit) && fs.existsSync(explicit)) {
    return JSON.parse(fs.readFileSync(explicit, "utf8"));
  }

  const env = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf8") : "";
  const url = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m)?.[1];
  const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m)?.[1];
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing from .env.local");
  }
  const endpoint = `${url}/rest/v1/?apikey=${key}`;
  const res = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`OpenAPI fetch failed: ${res.status}`);
  return res.json();
}

// ─────────────────────────────── type mapping ──────────────────────────────

function baseType(prop) {
  if (prop.format === "jsonb" || prop.format === "json") return "Json";
  if (prop.type === "integer" || prop.type === "number") return "number";
  if (prop.type === "boolean") return "boolean";
  if (prop.type === "array") {
    const item = prop.items?.type;
    if (item === "integer") return "number[]";
    return "string[]";
  }
  if (Array.isArray(prop.enum)) return prop.enum.map((e) => JSON.stringify(String(e))).join(" | ");
  return "string";
}

function isNullable(col, prop, required) {
  if (required.includes(col)) return false;
  // Timestamp/uuid columns with DB defaults are NOT NULL in Postgres.
  if (prop.default !== undefined && (prop.format === "uuid" || prop.format === "timestamp with time zone")) return false;
  return true;
}

function typeFor(table, col, prop, required) {
  const key = `${table}.${col}`;
  if (TYPE_OVERRIDES[key]) return TYPE_OVERRIDES[key];
  const t = baseType(prop);
  return isNullable(col, prop, required) ? `${t} | null` : t;
}

function isPk(prop) {
  return typeof prop.description === "string" && prop.description.includes("Primary Key");
}

// ─────────────────────────────── table builder ─────────────────────────────

function relationshipsFrom(table, props) {
  const rels = [];
  for (const [col, prop] of Object.entries(props)) {
    const m = typeof prop.description === "string" ? prop.description.match(/fk table='([^']+)' column='([^']+)'/) : null;
    if (m) rels.push([col, m[1], m[2], false]);
  }
  return rels;
}

function buildTable(table, def) {
  const props = def.properties || {};
  const required = def.required || [];
  const renamed = {};
  for (const [col, prop] of Object.entries(props)) {
    renamed[COLUMN_RENAMES[col] ?? col] = prop;
  }

  const row = {};
  const insert = {};
  const update = {};
  for (const [col, prop] of Object.entries(renamed)) {
    const t = typeFor(table, col, prop, required);
    row[col] = t;
    if (isPk(prop)) {
      insert[col] = "string?";
      continue; // PKs are not updatable
    }
    // Required in PostgREST only when NOT NULL without a default; columns with
    // DB defaults (now(), 'pending', false, …) are optional in Insert.
    if (required.includes(col) && prop.default === undefined) {
      insert[col] = t;
    } else {
      insert[col] = `${t}?`;
    }
    if (col !== "user_id") update[col] = `${t}?`;
  }

  // Migration-only columns (added to Row/Insert/Update).
  for (const [col, t] of Object.entries(MIGRATION_ONLY_COLUMNS[table] || {})) {
    row[col] = t;
    insert[col] = `${t}?`;
    if (col !== "user_id") update[col] = `${t}?`;
  }

  const rels = relationshipsFrom(table, props).map(
    ([col, refTable, refCol, one]) =>
      `          { foreignKeyName: "${table}_${col}_fkey"; columns: ["${col}"]; isOneToOne: ${one}; referencedRelation: "${refTable}"; referencedColumns: ["${refCol}"] }`
  );

  return { table, row, insert, update, rels };
}

function formatShape(obj) {
  return Object.entries(obj)
    .map(([k, v]) => {
      const optional = String(v).endsWith("?");
      const t = optional ? String(v).slice(0, -1) : String(v);
      // Only break long quoted unions (e.g. the 8-value template category) onto
      // multiple lines; `string | null`-style types stay on one line.
      const multi = t.includes('"') && t.length > 60;
      const body = multi
        ? t
            .split(" | ")
            .map((line) => `            | ${line}`)
            .join("\n")
        : t;
      return `          ${k}${optional ? "?" : ""}: ${body};`;
    })
    .join("\n");
}

function emit() {
  const header = `// ─────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit by hand.
//
// Source: the LIVE Supabase project's PostgREST OpenAPI spec (service-role
// key) merged with the repo migrations for columns/tables that exist in code
// but are not yet in the deployed DB (MIGRATION_ONLY overlays).
//
// Regenerate with:
//   node scripts/generate-supabase-types.mjs          (reads .env.local)
//   node scripts/generate-supabase-types.mjs --openapi <file>
// Then run \`pnpm typecheck\`.
// ────────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {`;

  return header;
}

// ─────────────────────────────────── main ──────────────────────────────────

const spec = await loadSpec();
const definitions = spec.definitions || spec.components?.schemas || {};
const tables = Object.entries(definitions).sort(([a], [b]) => a.localeCompare(b));

const tableBlocks = [];
for (const [table, def] of tables) {
  const built = buildTable(table, def);
  const rels = built.rels.length ? `[\n${built.rels.join(",\n")}\n        ]` : "[]";
  tableBlocks.push(
    `      ${table}: {\n` +
      `        Row: {\n${formatShape(built.row)}\n        };\n` +
      `        Insert: {\n${formatShape(built.insert)}\n        };\n` +
      `        Update: {\n${formatShape(built.update)}\n        };\n` +
      `        Relationships: ${rels};\n` +
      `      };`
  );
}

// Migration-only tables appended after the live tables.
for (const [table, def] of Object.entries(MIGRATION_ONLY_TABLES)) {
  // Normalize a trailing "?" in a type value into an optional key (`id: "string?"` → `id?: string`).
  const fmt = (shape, optionalPk = false) =>
    Object.entries(shape)
      .map(([k, v]) => {
        const vStr = String(v);
        const trailing = vStr.endsWith("?");
        const t = trailing ? vStr.slice(0, -1) : vStr;
        const isPkOpt = optionalPk && k === "id" && !trailing;
        return `          ${k}${trailing || isPkOpt ? "?" : ""}: ${t};`;
      })
      .join("\n");
  const rels = def.Relationships.length
    ? `[\n${def.Relationships.map(
        ([col, refTable, refCol, one]) =>
          `          { foreignKeyName: "${table}_${col}_fkey"; columns: ["${col}"]; isOneToOne: ${one}; referencedRelation: "${refTable}"; referencedColumns: ["${refCol}"] }`
      ).join(",\n")}\n        ]`
    : "[]";
  tableBlocks.push(
    `      ${table}: {\n` +
      `        Row: {\n${fmt(def.Row)}\n        };\n` +
      `        Insert: {\n${fmt(def.Insert, true)}\n        };\n` +
      `        Update: {\n${fmt(def.Update)}\n        };\n` +
      `        Relationships: ${rels};\n` +
      `      };`
  );
}

const out =
  emit() +
  "\n" +
  tableBlocks.join("\n") +
  `\n    };\n    Views: Record<string, never>;\n    Functions: Record<string, never>;\n    Enums: Record<string, never>;\n    CompositeTypes: Record<string, never>;\n  };\n}\n`;

fs.writeFileSync(OUT, out);
const liveCols = tables.reduce((n, [, d]) => n + Object.keys(d.properties || {}).length, 0);
const overlayCols = Object.values(MIGRATION_ONLY_COLUMNS).reduce((n, c) => n + Object.keys(c).length, 0);
console.log(
  `✓ regenerated ${OUT}\n  live tables: ${tables.length} (${liveCols} columns) · migration-only columns: ${overlayCols} · migration-only tables: ${
    Object.keys(MIGRATION_ONLY_TABLES).length
  }`
);
