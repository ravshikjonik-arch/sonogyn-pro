const PRODUCTION_FALLBACK = "https://sonogyn-pro.ru";

function normalizeOrigin(raw: string | undefined | null): string | null {
  const value = raw?.trim().replace(/\/$/, "") ?? "";
  if (!value) return null;
  // Empty / placeholder values from broken Vercel sync must not win.
  if (value === '""' || value === "''") return null;
  try {
    const url = value.includes("://") ? new URL(value) : new URL(`https://${value}`);
    if (!url.host) return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/** Production/staging app origin for auth redirects (email confirm, OAuth). */
export function resolveAppOrigin(request: Request): string {
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) {
    // On Vercel production never trust localhost from a stale env value.
    if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production" && configured.includes("localhost")) {
      return PRODUCTION_FALLBACK;
    }
    return configured;
  }

  const vercelProduction = normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelProduction) return vercelProduction;

  const vercelUrl = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercelUrl) return `https://${vercelUrl}`;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    if (host) {
      const origin = `${forwardedProto ?? "https"}://${host}`;
      if (process.env.VERCEL_ENV === "production" && host.includes("localhost")) {
        return PRODUCTION_FALLBACK;
      }
      return origin;
    }
  }

  try {
    const origin = new URL(request.url).origin;
    if (process.env.VERCEL_ENV === "production" && origin.includes("localhost")) {
      return PRODUCTION_FALLBACK;
    }
    return origin;
  } catch {
    return process.env.NODE_ENV === "production" ? PRODUCTION_FALLBACK : "http://localhost:3000";
  }
}
