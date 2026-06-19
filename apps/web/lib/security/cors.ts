/**
 * CORS для API: разрешаем основной домен и его поддомены.
 *
 * Источник списка:
 *  - NEXT_PUBLIC_APP_URL (origin приложения);
 *  - CORS_ALLOWED_ORIGINS (через запятую, опционально);
 *  - базовый домен CORS_BASE_DOMAIN (default sonogyn-pro.ru) + все поддомены *.<домен>;
 *  - localhost в development.
 *
 * Возвращаем заголовки только если Origin разрешён (никаких "*").
 */
const DEFAULT_BASE_DOMAIN = "sonogyn-pro.ru";

function baseDomain(): string {
  return (process.env.CORS_BASE_DOMAIN?.trim() || DEFAULT_BASE_DOMAIN).toLowerCase();
}

function explicitOrigins(): string[] {
  const list = [
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    ...(process.env.CORS_ALLOWED_ORIGINS?.split(",").map((s) => s.trim()) ?? []),
  ].filter((v): v is string => Boolean(v));
  return list.map((v) => v.replace(/\/$/, "").toLowerCase());
}

function isAllowedOrigin(origin: string): boolean {
  let host: string;
  let protocol: string;
  try {
    const url = new URL(origin);
    host = url.host.toLowerCase();
    protocol = url.protocol;
  } catch {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) return true;
  }

  if (protocol !== "https:" && process.env.NODE_ENV === "production") return false;

  if (explicitOrigins().includes(origin.replace(/\/$/, "").toLowerCase())) return true;

  const domain = baseDomain();
  const hostname = host.split(":")[0];
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

/** Заголовки CORS для разрешённого Origin, иначе null. */
export function resolveCorsHeaders(request: Request): Record<string, string> | null {
  const origin = request.headers.get("origin");
  if (!origin || !isAllowedOrigin(origin)) return null;

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Idempotency-Key, x-sonogyn-client, x-cron-secret",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
