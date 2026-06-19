import type { CookieOptions } from "@supabase/ssr";

/** HttpOnly session cookies — refresh token недоступен JS (XSS). */
export function supabaseCookieOptions(): CookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  };
}

/** Merge HttpOnly defaults when persisting auth cookies from route handlers. */
export function withSecureCookieOptions(options?: CookieOptions): CookieOptions {
  const base = supabaseCookieOptions();
  return { ...base, ...options, httpOnly: true };
}
