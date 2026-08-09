import { PostgresClient, type DbClient } from "@/lib/db/query-builder";
import type { Database } from "./types";

export type AdminClient = DbClient<Database>;

let _admin: AdminClient | null = null;

/**
 * Admin/service-level data client. Previously the service-role client (which
 * bypassed RLS). With Neon there is no RLS — this is the same Postgres pool,
 * kept as a separate factory so background workers, webhooks, and public share
 * pages can keep their existing code path.
 */
export function createAdminClient(): AdminClient {
  if (_admin) return _admin;
  _admin = new PostgresClient<Database>();
  return _admin;
}
