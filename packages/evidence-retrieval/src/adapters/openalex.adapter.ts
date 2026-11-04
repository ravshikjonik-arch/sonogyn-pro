import { CACHE_TTL, cacheKey } from "../infra/cache.js";
import { fetchWithTimeout, withRetry } from "../infra/retry.js";
import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery, ProviderSearchResult } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

type OpenAlexWork = {
  id?: string;
  display_name?: string;
  publication_year?: number;
  doi?: string | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  primary_location?: { source?: { display_name?: string | null } | null; landing_page_url?: string | null } | null;
  authorships?: { author?: { display_name?: string | null } | null }[];
  open_access?: { is_oa?: boolean; oa_url?: string | null } | null;
  type?: string | null;
};

function reconstructAbstract(index: Record<string, number[]> | null | undefined): string | undefined {
  if (!index) return undefined;
  const pairs: { word: string; pos: number }[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) pairs.push({ word, pos });
  }
  if (!pairs.length) return undefined;
  pairs.sort((a, b) => a.pos - b.pos);
  return pairs
    .map((p) => p.word)
    .join(" ")
    .slice(0, 1200);
}

function openAlexId(raw?: string): string {
  if (!raw) return `oa-${Date.now()}`;
  return raw.replace(/^https?:\/\/openalex\.org\//i, "");
}

export const openAlexAdapter: EvidenceAdapter = {
  id: "openalex",
  label: "OpenAlex",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    if (!q) return adapterResult("openalex", [], 0, "skipped");

    const ck = cacheKey("openalex", q, String(query.limit ?? 12));
    const cached = await Promise.resolve(ctx.cache.get<ProviderSearchResult>(ck));
    if (cached) return cached;

    try {
      const max = Math.min(ctx.config.maxRecordsPerProvider ?? 12, 15);
      const params = new URLSearchParams({
        search: q,
        per_page: String(max),
        mailto: "evidence@sonogyn-pro.ru",
      });
      const url = `https://api.openalex.org/works?${params.toString()}`;
      const res = await withRetry(
        () =>
          fetchWithTimeout(url, {
            headers: { Accept: "application/json", "User-Agent": "SonoGynPro/1.0 (evidence-retrieval)" },
            timeoutMs: ctx.config.adapterTimeoutMs,
            signal: ctx.signal,
          }),
        { signal: ctx.signal, shouldRetry: () => true },
      );

      if (!res.ok) {
        const status = res.status === 429 ? "rate_limited" : "error";
        return adapterResult("openalex", [], Date.now() - started, status, `HTTP ${res.status}`);
      }

      const json = (await res.json()) as { results?: OpenAlexWork[] };
      const records = (json.results ?? []).map((work, index) => {
        const doi = work.doi?.replace(/^https?:\/\/doi\.org\//i, "") || undefined;
        const landing =
          work.open_access?.oa_url ||
          work.primary_location?.landing_page_url ||
          (doi ? `https://doi.org/${doi}` : `https://openalex.org/${openAlexId(work.id)}`);
        return buildEvidenceRecord({
          provider: "openalex",
          sourceId: openAlexId(work.id),
          title: work.display_name || "OpenAlex work",
          abstract: reconstructAbstract(work.abstract_inverted_index ?? undefined),
          authors: (work.authorships ?? [])
            .map((a) => a.author?.display_name)
            .filter((n): n is string => Boolean(n))
            .slice(0, 8),
          journal: work.primary_location?.source?.display_name || undefined,
          year: work.publication_year,
          doi,
          url: landing,
          publicationTypes: work.type ? [work.type] : undefined,
          isOpenAccess: Boolean(work.open_access?.is_oa),
          relevanceScore: 0.88 - index * 0.03,
        });
      });

      const result = adapterResult("openalex", limitRecords(records, max), Date.now() - started);
      ctx.cache.set(ck, result, CACHE_TTL.search);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return adapterResult("openalex", [], Date.now() - started, "error", message);
    }
  },
};
