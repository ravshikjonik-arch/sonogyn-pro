/** Production/staging app origin for auth redirects (email confirm, OAuth). */
export function resolveAppOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/\/$/, "");
  if (vercelProduction) return `https://${vercelProduction}`;

  const vercelUrl = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercelUrl) return `https://${vercelUrl}`;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    if (host) return `${forwardedProto ?? "https"}://${host}`;
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}
