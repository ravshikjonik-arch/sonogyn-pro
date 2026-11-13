import type { ExternalGuidelineRecord } from "@repo/evidence-retrieval";

import {
  clearGuidelinesRedisCache,
  readGuidelinesRedisCache,
  writeGuidelinesRedisCache,
} from "@/lib/evidence/redis-cache-store";
import { createServiceRoleClient } from "@/utils/supabase/admin";

let cache: { at: number; rows: ExternalGuidelineRecord[] } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Load WHO/NICE/EMA rows from Supabase (falls back to package seed only). */
export async function loadExternalGuidelines(): Promise<ExternalGuidelineRecord[]> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.rows;

  const fromRedis = await readGuidelinesRedisCache<ExternalGuidelineRecord[]>();
  if (fromRedis) {
    cache = { at: now, rows: fromRedis };
    return fromRedis;
  }

  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from("guidelines_external_index")
      .select("source, external_id, title, url, body_text, published_at")
      .in("source", ["who", "nice", "ema", "rf_regulation"])
      .order("published_at", { ascending: false })
      .limit(500);

    if (error || !data?.length) {
      cache = { at: now, rows: [] };
      return [];
    }

    const rows: ExternalGuidelineRecord[] = data.map((row) => ({
      source: row.source as ExternalGuidelineRecord["source"],
      externalId: row.external_id,
      title: row.title,
      url: row.url,
      summary: row.body_text?.slice(0, 500) || undefined,
      year: row.published_at ? new Date(row.published_at).getFullYear() : undefined,
    }));

    cache = { at: now, rows };
    void writeGuidelinesRedisCache(rows, 900);
    return rows;
  } catch {
    cache = { at: now, rows: [] };
    return [];
  }
}

export function clearExternalGuidelinesCache(): void {
  cache = null;
  void clearGuidelinesRedisCache();
}
