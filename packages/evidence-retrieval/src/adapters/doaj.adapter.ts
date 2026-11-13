import { CACHE_TTL, cacheKey } from "../infra/cache.js";
import { fetchWithTimeout, withRetry } from "../infra/retry.js";
import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery, ProviderSearchResult } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

type DoajArticle = {
  id?: string;
  bibjson?: {
    title?: string;
    abstract?: string;
    year?: string | number;
    author?: { name?: string }[];
    journal?: { title?: string };
    link?: { type?: string; url?: string }[];
    identifier?: { type?: string; id?: string }[];
  };
};

export const doajAdapter: EvidenceAdapter = {
  id: "doaj",
  label: "DOAJ",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    if (!q) return adapterResult("doaj", [], 0, "skipped");

    const ck = cacheKey("doaj", q, String(query.limit ?? 10));
    const cached = await Promise.resolve(ctx.cache.get<ProviderSearchResult>(ck));
    if (cached) return cached;

    try {
      const max = Math.min(ctx.config.maxRecordsPerProvider ?? 10, 12);
      const url = `https://doaj.org/api/search/articles/${encodeURIComponent(q)}?pageSize=${max}&page=1`;
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
        return adapterResult("doaj", [], Date.now() - started, status, `HTTP ${res.status}`);
      }

      const json = (await res.json()) as { results?: DoajArticle[] };
      const records = (json.results ?? []).map((row, index) => {
        const bib = row.bibjson ?? {};
        const doi = bib.identifier?.find((i) => i.type?.toLowerCase() === "doi")?.id;
        const fulltext = bib.link?.find((l) => l.type === "fulltext")?.url;
        const yearNum = typeof bib.year === "number" ? bib.year : Number(bib.year);
        return buildEvidenceRecord({
          provider: "doaj",
          sourceId: row.id || doi || bib.title || `doaj-${index}`,
          title: bib.title || "DOAJ article",
          abstract: bib.abstract?.slice(0, 1200),
          authors: (bib.author ?? []).map((a) => a.name).filter((n): n is string => Boolean(n)).slice(0, 8),
          journal: bib.journal?.title,
          year: Number.isFinite(yearNum) ? yearNum : undefined,
          doi: doi || undefined,
          url: fulltext || (doi ? `https://doi.org/${doi}` : `https://doaj.org/search/articles?ref_query=${encodeURIComponent(q)}`),
          isOpenAccess: true,
          relevanceScore: 0.86 - index * 0.03,
        });
      });

      const result = adapterResult("doaj", limitRecords(records, max), Date.now() - started);
      ctx.cache.set(ck, result, CACHE_TTL.search);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return adapterResult("doaj", [], Date.now() - started, "error", message);
    }
  },
};
