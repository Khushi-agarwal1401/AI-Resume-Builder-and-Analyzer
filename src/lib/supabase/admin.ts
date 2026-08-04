import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Explicit loose typing: the schema-generic inference of createClient (no
// generated Database type) resolves table rows to `never` under this project's
// strict tsconfig, which would break every .select()/upsert() call site. This
// client is intentionally untyped — rows are cast at the call sites.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdminSupabaseClient = SupabaseClient<any, any, any>;
let _admin: AdminSupabaseClient | null = null;

/**
 * Service-role Supabase client — bypasses RLS. Server-only; never import
 * into client components. Used for public share fetches and admin ops.
 */
export function createAdminSupabaseClient(): AdminSupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service-role configuration");
  }
  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}
