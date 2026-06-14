import crypto from "crypto";

import { createServiceRoleClient } from "@/utils/supabase/admin";
import { getUpstashRestCredentials } from "@/lib/security/upstash-env";
import { verificationPepper } from "@/lib/auth/verification/code-generator";

const CACHE_TTL_SEC = 300; // 5 минут

type MemoryCacheEntry = { userId: string; expiresAt: number };
const memoryCache = new Map<string, MemoryCacheEntry>();

function emailCacheKey(normalizedEmail: string): string {
  const hash = crypto.createHash("sha256").update(normalizedEmail).digest("hex").slice(0, 24);
  return `sonogyn:user-lookup:email:${hash}`;
}

function getRedisClient(): InstanceType<typeof import("@upstash/redis").Redis> | null {
  const creds = getUpstashRestCredentials();
  if (!creds) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    return new Redis({ url: creds.url, token: creds.token });
  } catch {
    return null;
  }
}

async function readCachedUserId(normalizedEmail: string): Promise<string | null> {
  const key = emailCacheKey(normalizedEmail);
  const redis = getRedisClient();

  if (redis) {
    const hit = await redis.get<string>(key);
    return hit ?? null;
  }

  const mem = memoryCache.get(key);
  if (!mem || Date.now() >= mem.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return mem.userId;
}

async function writeCachedUserId(normalizedEmail: string, userId: string): Promise<void> {
  const key = emailCacheKey(normalizedEmail);
  const redis = getRedisClient();

  if (redis) {
    await redis.set(key, userId, { ex: CACHE_TTL_SEC });
    return;
  }

  memoryCache.set(key, { userId, expiresAt: Date.now() + CACHE_TTL_SEC * 1000 });
}

/**
 * Быстрый поиск user id по email без auth.admin.listUsers().
 * 1) Совпадение с текущей сессией
 * 2) KV cache (5 мин)
 * 3) public.user_metadata (индекс по email)
 */
export async function resolveUserIdByEmail(
  email: string,
  sessionUser?: { id: string; email?: string | null } | null,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  if (sessionUser?.email?.trim().toLowerCase() === normalized) {
    await writeCachedUserId(normalized, sessionUser.id);
    return sessionUser.id;
  }

  const cached = await readCachedUserId(normalized);
  if (cached) return cached;

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("user_metadata")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    // Таблица может ещё не быть применена — не ломаем регистрацию.
    return null;
  }

  if (data?.id) {
    await writeCachedUserId(normalized, data.id);
    return data.id;
  }

  return null;
}

/** Инвалидация кеша после подтверждения email (опционально). */
export async function invalidateUserEmailCache(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const key = emailCacheKey(normalized);
  const redis = getRedisClient();
  if (redis) {
    await redis.del(key);
  }
  memoryCache.delete(key);
}

export function buildContactRateLimitKey(method: string, contact: string): string {
  const pepper = verificationPepper();
  const hash = crypto
    .createHash("sha256")
    .update(`${method}:${contact.trim().toLowerCase()}:${pepper}`)
    .digest("hex")
    .slice(0, 32);
  return `auth-send-code:contact:${hash}`;
}
