import type { CookieOptions } from "@supabase/ssr";

import { getAuthSessionMaxAgeSec } from "@/lib/auth/dev-auth-mode";

/** HttpOnly session cookies — refresh token недоступен JS (XSS). */
export function supabaseCookieOptions(): CookieOptions {
  const maxAge = getAuthSessionMaxAgeSec();
  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

/** Merge HttpOnly defaults when persisting auth cookies from route handlers. */
export function withSecureCookieOptions(options?: CookieOptions): CookieOptions {
  const base = supabaseCookieOptions();
  return { ...base, ...options, httpOnly: true };
}
