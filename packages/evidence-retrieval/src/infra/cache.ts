import type { CacheStore } from "../types.js";

type Entry = { value: unknown; expiresAt: number };

/** In-process TTL cache (web layer may wrap Redis). */
export function createMemoryCacheStore(): CacheStore {
  const map = new Map<string, Entry>();

  return {
    get<T>(key: string): T | undefined {
      const row = map.get(key);
      if (!row) return undefined;
      if (Date.now() > row.expiresAt) {
        map.delete(key);
        return undefined;
      }
      return row.value as T;
    },
    set<T>(key: string, value: T, ttlMs: number): void {
      map.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
  };
}

export const CACHE_TTL = {
  search: 60 * 60 * 1000,
  metadata: 7 * 24 * 60 * 60 * 1000,
  guidelines: 30 * 24 * 60 * 60 * 1000,
} as const;

export function cacheKey(provider: string, query: string, suffix = ""): string {
  const q = query.toLowerCase().trim().slice(0, 200);
  return `ebm:${provider}:${q}${suffix ? `:${suffix}` : ""}`;
}
