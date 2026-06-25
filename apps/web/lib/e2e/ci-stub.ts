/** E2E fixture mode (Playwright webServer + GitHub Actions e2e job). */
export function isE2eFixturesEnabled(): boolean {
  return process.env.E2E_FIXTURES === "true";
}

/** GitHub Actions CI uses a non-routable Supabase placeholder URL. */
export function isCiPlaceholderSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  return url.includes("example.supabase.co");
}

/** Stub Supabase-backed reads in CI e2e instead of returning 500 on network failure. */
export function isE2eCiStubMode(): boolean {
  return isE2eFixturesEnabled() && isCiPlaceholderSupabase();
}
