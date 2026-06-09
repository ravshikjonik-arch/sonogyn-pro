import crypto from "crypto";

type MobileSessionPayload = {
  access_token: string;
  refresh_token: string;
};

type Entry = { payload: MobileSessionPayload; expiresAt: number };

const memoryStore = new Map<string, Entry>();
const TTL_MS = 120_000;

function purgeMemory(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(key);
  }
}

async function redisSet(code: string, payload: MobileSessionPayload): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return false;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    const redis = new Redis({ url, token });
    await redis.set(`sonogyn:mobile-exchange:${code}`, payload, { ex: Math.ceil(TTL_MS / 1000) });
    return true;
  } catch {
    return false;
  }
}

async function redisGet(code: string): Promise<MobileSessionPayload | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    const redis = new Redis({ url, token });
    const payload = (await redis.get(`sonogyn:mobile-exchange:${code}`)) as MobileSessionPayload | null;
    if (payload) await redis.del(`sonogyn:mobile-exchange:${code}`);
    return payload;
  } catch {
    return null;
  }
}

/** Одноразовый код для передачи mobile-сессии без токенов в URL. */
export async function createMobileSessionExchange(payload: MobileSessionPayload): Promise<string> {
  const code = crypto.randomBytes(24).toString("base64url");
  const stored = await redisSet(code, payload);
  if (!stored) {
    purgeMemory();
    memoryStore.set(code, { payload, expiresAt: Date.now() + TTL_MS });
  }
  return code;
}

export async function consumeMobileSessionExchange(code: string): Promise<MobileSessionPayload | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const fromRedis = await redisGet(trimmed);
  if (fromRedis) return fromRedis;

  purgeMemory();
  const entry = memoryStore.get(trimmed);
  if (!entry || entry.expiresAt <= Date.now()) {
    memoryStore.delete(trimmed);
    return null;
  }
  memoryStore.delete(trimmed);
  return entry.payload;
}
