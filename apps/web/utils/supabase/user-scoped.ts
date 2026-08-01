import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * PostgREST client scoped to a user JWT (Bearer / mobile).
 * Cookie SSR client alone cannot see `auth.uid()` for Bearer-only requests.
 */
export function createUserScopedSupabaseClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function bearerAccessTokenFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/** Prefer Bearer-scoped client when present; otherwise cookie SSR client. */
export function resolveDataSupabaseClient(
  request: Request,
  cookieClient: SupabaseClient,
): SupabaseClient {
  const token = bearerAccessTokenFromRequest(request);
  return token ? createUserScopedSupabaseClient(token) : cookieClient;
}
