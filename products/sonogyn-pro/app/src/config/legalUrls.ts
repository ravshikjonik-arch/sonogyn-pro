/**
 * Replace with your production HTTPS URLs before App Store / Play submission.
 * Apple and Google require a publicly accessible privacy policy URL.
 *
 * Placeholder `example.com` links are disabled in-app (Android was hanging on
 * slow / blocked resolves). Use real URLs before enabling external opens.
 */
export const LEGAL_PUBLIC_URLS = {
  privacyPolicy: "https://example.com/privacy-policy",
  termsOfUse: "https://example.com/terms-of-use",
} as const;

export function legalPublicUrlsAreConfigured(): boolean {
  const p = LEGAL_PUBLIC_URLS.privacyPolicy;
  const t = LEGAL_PUBLIC_URLS.termsOfUse;
  return !p.includes("example.com") && !t.includes("example.com");
}

