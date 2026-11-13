/**
 * In-memory request coalescing: the same key within `ttlMs` returns the first run's result
 * (in-flight promises are shared). Per server instance only — no persistence (Phase C constraint).
 */
export type IdempotencyCache<T> = {
  run(key: string, fn: () => Promise<T>): Promise<{ value: T; replay: boolean }>;
  size(): number;
};

export function createIdempotencyCache<T>(options: { ttlMs: number; maxEntries?: number; now?: () => number }): IdempotencyCache<T> {
  const now = options.now ?? (() => Date.now());
  const max = options.maxEntries ?? 500;
  const entries = new Map<string, { at: number; promise: Promise<T> }>();

  const evict = () => {
    const t = now();
    for (const [k, v] of entries) if (t - v.at > options.ttlMs) entries.delete(k);
    while (entries.size > max) entries.delete(entries.keys().next().value!);
  };

  return {
    async run(key, fn) {
      evict();
      const hit = entries.get(key);
      if (hit) return { value: await hit.promise, replay: true };
      const promise = fn();
      entries.set(key, { at: now(), promise });
      try {
        return { value: await promise, replay: false };
      } catch (e) {
        entries.delete(key);
        throw e;
      }
    },
    size: () => entries.size,
  };
}
