import { PostgresClient, type DbClient } from "@/lib/db/query-builder";
import type { Database } from "./types";

export type ServerClient = DbClient<Database>;

/**
 * Server-side data client backed directly by the Neon Postgres pool.
 * There is no RLS anymore, so one connection serves every request. Ownership
 * is enforced in application code via the NextAuth session's user id.
 */
export async function createServerClient(): Promise<ServerClient> {
  return new PostgresClient<Database>();
}
