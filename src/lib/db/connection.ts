import { Pool } from "@neondatabase/serverless";

let _pool: Pool | null = null;

/**
 * Shared Neon Postgres connection pool. Uses a single DATABASE_URL for every
 * connection — there is no RLS or auth-scoped role anymore, so one pool serves
 * all server-side reads/writes. Never import into client components.
 */
export function getPool(): Pool {
  if (_pool) return _pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Missing DATABASE_URL environment variable — set it to your Neon Postgres connection string"
    );
  }

  _pool = new Pool({ connectionString, max: 10 });
  return _pool;
}

/** Release the pool (used in tests / worker shutdown). */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
