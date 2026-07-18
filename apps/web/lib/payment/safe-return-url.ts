/** Restrict payment return URLs to same origin (anti-phishing after checkout). */
export function safePaymentReturnUrl(appOrigin: string, raw?: string | null): string {
  const fallback = `${appOrigin.replace(/\/$/, "")}/profile?checkout=success`;
  const candidate = raw?.trim();
  if (!candidate) return fallback;

  try {
    const base = appOrigin.replace(/\/$/, "");
    const url = new URL(candidate);
    const expected = new URL(base);
    if (url.origin !== expected.origin) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}
