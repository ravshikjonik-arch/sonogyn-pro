import type { ExternalGuidelineRecord } from "@repo/evidence-retrieval";

import { createServiceRoleClient } from "@/utils/supabase/admin";

let cache: { at: number; rows: ExternalGuidelineRecord[] } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Load WHO/NICE/EMA rows from Supabase (falls back to package seed only). */
export async function loadExternalGuidelines(): Promise<ExternalGuidelineRecord[]> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.rows;

  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from("guidelines_external_index")
      .select("source, external_id, title, url, body_text, published_at")
      .in("source", ["who", "nice", "ema"])
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
    return rows;
  } catch {
    cache = { at: now, rows: [] };
    return [];
  }
}

export function clearExternalGuidelinesCache(): void {
  cache = null;
}
