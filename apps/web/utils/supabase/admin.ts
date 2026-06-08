import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client (service role). **Never** import from Client Components or expose to the browser.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Alias for server routes (Telegram auth, admin flows). */
export const createAdminClient = createServiceRoleClient;
