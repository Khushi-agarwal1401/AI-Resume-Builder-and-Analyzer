import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type AdminSupabaseClient = SupabaseClient<Database>;

let _admin: AdminSupabaseClient | null = null;

/**
 * Service-role Supabase client — bypasses RLS. Server-only; never import
 * into client components. Used for public share fetches, admin ops, and the
 * background worker. Row types come from the generated Database type.
 */
export function createAdminSupabaseClient(): AdminSupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service-role configuration");
  }
  _admin = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}
