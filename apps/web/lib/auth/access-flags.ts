/**
 * Edge-safe auth/product flags — no Node `crypto`, no admin Supabase.
 * Middleware must import only from this module (not `dev-account.ts`).
 */

export function isDevAutoLoginEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_AUTO_LOGIN === "true";
}

/** Локально открыть кабинет без Supabase-регистрации (только dev). */
export function isDevSkipAuthEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true";
}

/**
 * Product mode: open clinical tools without registration (marketing/demo).
 * Middleware hybrid: `/patients`, `/profile`, `/paywall`, `/dashboard`, `/admin`, `/author`
 * remain auth-required even when this flag is true.
 *
 * Priority: `OPEN_ACCESS_FULL` (server/API) → `NEXT_PUBLIC_OPEN_ACCESS_FULL` (client build) → default true.
 * So a false NEXT_PUBLIC cannot accidentally lock API routes while OPEN_ACCESS_FULL=true.
 */
export function isFullOpenAccessEnabled(): boolean {
  const raw = (
    process.env.OPEN_ACCESS_FULL ??
    process.env.NEXT_PUBLIC_OPEN_ACCESS_FULL ??
    "true"
  )
    .trim()
    .toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "no";
}
