import type { CacheStore } from "@repo/evidence-retrieval";
import { createMemoryCacheStore } from "@repo/evidence-retrieval";

import { getUpstashRestCredentials } from "@/lib/security/upstash-env";

const GUIDELINES_REDIS_KEY = "sonogyn:guidelines_external_v1";

function tryCreateRedis(): {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, opts: { ex: number }) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
} | null {
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

/**
 * Layered Evidence cache: in-process memory + optional Upstash Redis.
 * Survives across serverless instances when Redis is configured.
 */
export function createEvidenceCacheStore(): CacheStore {
  const memory = createMemoryCacheStore();
  const redis = tryCreateRedis();
  if (!redis) return memory;

  const prefix = "sonogyn:ebm:";

  return {
    async get<T>(key: string): Promise<T | undefined> {
      const local = await Promise.resolve(memory.get<T>(key));
      if (local !== undefined) return local;

      try {
        const raw = await redis.get(prefix + key);
        if (!raw) return undefined;
        const parsed = (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
        memory.set(key, parsed, 60_000);
        return parsed;
      } catch {
        return undefined;
      }
    },
    async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
      memory.set(key, value, ttlMs);
      const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000));
      try {
        await redis.set(prefix + key, JSON.stringify(value), { ex: ttlSec });
      } catch {
        /* non-fatal — memory still holds */
      }
    },
  };
}

/** Shared WHO/NICE/EMA index across instances (default 15 min). */
export async function readGuidelinesRedisCache<T>(): Promise<T | null> {
  const redis = tryCreateRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(GUIDELINES_REDIS_KEY);
    if (!raw) return null;
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
  } catch {
    return null;
  }
}

export async function writeGuidelinesRedisCache(value: unknown, ttlSec = 900): Promise<void> {
  const redis = tryCreateRedis();
  if (!redis) return;
  try {
    await redis.set(GUIDELINES_REDIS_KEY, JSON.stringify(value), { ex: ttlSec });
  } catch {
    /* ignore */
  }
}

export async function clearGuidelinesRedisCache(): Promise<void> {
  const redis = tryCreateRedis();
  if (!redis) return;
  try {
    await redis.del(GUIDELINES_REDIS_KEY);
  } catch {
    /* ignore */
  }
}
