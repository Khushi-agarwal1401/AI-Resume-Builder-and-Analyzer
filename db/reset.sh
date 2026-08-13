#!/usr/bin/env bash
#
# Guarded destructive database reset for AI Resume Builder & Analyzer.
#
# Usage:
#   npm run db:reset                        # interactive confirmation required
#   DB_RESET_CONFIRM=yes npm run db:reset   # non-interactive (CI/scripts)
#
# Drops every table/enum in the app schema (db/reset.sql), then re-applies
# the idempotent schema + seeds (db/schema.sql).
#
# NOTE: if the schema re-apply fails after the drop, the database is left
# without tables — re-run `npm run db:migrate` to rebuild.

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Error: DATABASE_URL is not set." >&2
  exit 1
fi

if [[ "${DB_RESET_CONFIRM:-}" != "yes" ]]; then
  echo "⚠⚠⚠  DANGER: this command DROPS ALL TABLES AND DATA" >&2
  echo "      in the database at DATABASE_URL." >&2
  echo >&2
  read -r -p "Type RESET to confirm: " answer || { echo "Cannot read confirmation (non-interactive). Re-run with DB_RESET_CONFIRM=yes." >&2; exit 1; }
  if [[ "$answer" != "RESET" ]]; then
    echo "Aborted — no changes made." >&2
    exit 1
  fi
fi

echo "Dropping all tables… (db/reset.sql)"
psql "$DATABASE_URL" -f db/reset.sql

echo "Applying idempotent schema… (db/schema.sql)"
psql "$DATABASE_URL" -f db/schema.sql

echo "Database reset complete."
