import { getUpstashRestCredentials } from "@/lib/security/upstash-env";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

type Bucket = { count: number; resetAt: number };
type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

const LIMIT = 3;
const WINDOW_SEC = 60;
const WINDOW_MS = WINDOW_SEC * 1000;

const memoryStore = new Map<string, Bucket>();

function consumeMemory(key: string): RateLimitResult {
  const now = Date.now();
  let bucket = memoryStore.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    memoryStore.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count <= LIMIT) return { ok: true };
  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return { ok: false, retryAfterSec };
}

/**
 * Fixed-window счётчик через Upstash REST (fetch — Edge-safe, без SDK с Node API).
 * Возвращает null, если креды/сеть недоступны (решение принимает вызывающий код).
 */
async function consumeUpstashRest(
  creds: { url: string; token: string },
  ip: string,
): Promise<RateLimitResult | null> {
  const windowId = Math.floor(Date.now() / WINDOW_MS);
  const key = `sonogyn-edge:sms-send:${ip}:${windowId}`;

  try {
    const res = await fetch(`${creds.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(WINDOW_SEC)],
      ]),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as Array<{ result?: number; error?: string }>;
    const count = typeof data?.[0]?.result === "number" ? data[0].result : null;
    if (count === null) return null;

    if (count <= LIMIT) return { ok: true };

    const nextWindowMs = (windowId + 1) * WINDOW_MS;
    const retryAfterSec = Math.max(1, Math.ceil((nextWindowMs - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  } catch {
    return null;
  }
}

/**
 * Edge rate-limit отправки SMS-кодов: 3/мин на IP.
 * Prod без рабочего Upstash → fail-closed; dev → in-memory fallback.
 */
export async function smsSendEdgeRateLimit(request: Request): Promise<RateLimitResult> {
  if (process.env.AUTH_RATE_LIMIT_RELAXED === "true") return { ok: true };

  const ip = rateLimitKeyFromRequest(request, "edge-sms-send");
  const creds = getUpstashRestCredentials();

  if (creds) {
    const result = await consumeUpstashRest(creds, ip);
    if (result) return result;
    // REST недоступен:
    if (process.env.NODE_ENV === "production") return { ok: false, retryAfterSec: 60 };
    return consumeMemory(ip);
  }

  if (process.env.NODE_ENV === "production") return { ok: false, retryAfterSec: 60 };
  return consumeMemory(ip);
}
