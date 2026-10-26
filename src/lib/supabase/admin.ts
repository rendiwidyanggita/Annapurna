import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client using Service Role Key.
 * Bypasses RLS and allows administrative operations like banning users or invalidating sessions.
 * NEVER expose this client to frontend browser code.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
