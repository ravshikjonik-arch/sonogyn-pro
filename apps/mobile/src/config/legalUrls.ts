/**
 * Replace with your production HTTPS URLs before App Store / Play submission.
 * Apple and Google require a publicly accessible privacy policy URL.
 *
 * Placeholder `example.com` links are disabled in-app (Android was hanging on
 * slow / blocked resolves). Use real URLs before enabling external opens.
 */
/** Stable HTTPS URLs for store review and in-app consent (Play / TestFlight). */
const LEGAL_BASE = "https://sonogyn-pro.ru";

export const LEGAL_PUBLIC_URLS = {
  privacyPolicy: `${LEGAL_BASE}/privacy`,
  termsOfUse: `${LEGAL_BASE}/terms`,
  supportEmail: "Sonogyn-pro@mail.ru",
} as const;

export function legalPublicUrlsAreConfigured(): boolean {
  const p = LEGAL_PUBLIC_URLS.privacyPolicy;
  const t = LEGAL_PUBLIC_URLS.termsOfUse;
  return !p.includes("example.com") && !t.includes("example.com");
}
