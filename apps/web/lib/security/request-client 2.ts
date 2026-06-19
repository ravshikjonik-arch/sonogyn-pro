/** Client identity for rate limiting (IP behind proxy). */
export function rateLimitKeyFromRequest(request: Request, prefix: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return `${prefix}:${ip}`;
}

/** Allow Stripe redirect URLs only to this app origin. */
export function isAllowedAppRedirectUrl(url: string, appOrigin: string): boolean {
  try {
    const target = new URL(url);
    const origin = new URL(appOrigin);
    return target.origin === origin.origin;
  } catch {
    return false;
  }
}
