/**
 * Edge-safe auth/product flags — no Node `crypto`, no admin Supabase.
 * Middleware must import only from this module (not `dev-account.ts`).
 */

/** UTC midnight 27.12.2026 — keep in sync with `lib/config/test-mode.ts`. */
const PLATFORM_LAUNCH_AT_MS = Date.UTC(2026, 11, 27, 0, 0, 0);

export function isDevAutoLoginEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_AUTO_LOGIN === "true";
}

/** Локально открыть кабинет без Supabase-регистрации (только dev). */
export function isDevSkipAuthEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true";
}

function envFlagTruthy(raw: string | undefined, defaultTrue: boolean): boolean {
  const value = (raw ?? (defaultTrue ? "true" : "false")).trim().toLowerCase();
  return value !== "false" && value !== "0" && value !== "no";
}

/**
 * Product mode: open clinical tools without registration (marketing/demo).
 * Middleware hybrid: `/patients`, `/profile`, `/paywall`, `/dashboard`, `/admin`, `/author`
 * remain auth-required even when this flag is true.
 *
 * Priority:
 * 1) Explicit env off → false
 * 2) After 27.12.2026 UTC → false (unless `OPEN_ACCESS_FORCE=true`)
 * 3) Else `OPEN_ACCESS_FULL` → `NEXT_PUBLIC_OPEN_ACCESS_FULL` → default true
 */
export function isFullOpenAccessEnabled(nowMs: number = Date.now()): boolean {
  const envAllows = envFlagTruthy(
    process.env.OPEN_ACCESS_FULL ?? process.env.NEXT_PUBLIC_OPEN_ACCESS_FULL,
    true,
  );
  if (!envAllows) return false;

  if (nowMs >= PLATFORM_LAUNCH_AT_MS) {
    return envFlagTruthy(process.env.OPEN_ACCESS_FORCE, false);
  }

  return true;
}
