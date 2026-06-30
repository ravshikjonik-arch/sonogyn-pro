import { CACHE_TTL, cacheKey } from "../infra/cache.js";
import { fetchWithTimeout } from "../infra/retry.js";
import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery, ProviderSearchResult } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

type S2Paper = {
  paperId?: string;
  title?: string;
  abstract?: string;
  year?: number;
  url?: string;
  publicationTypes?: string[];
  journal?: { name?: string };
  authors?: { name?: string }[];
  externalIds?: { DOI?: string; PubMed?: string };
  isOpenAccess?: boolean;
};

export const semanticScholarAdapter: EvidenceAdapter = {
  id: "semantic_scholar",
  label: "Semantic Scholar",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    if (!q) return adapterResult("semantic_scholar", [], 0, "skipped");

    const ck = cacheKey("semantic_scholar", q, String(query.limit ?? 15));
    const cached = ctx.cache.get<ProviderSearchResult>(ck);
    if (cached) return cached;

    try {
      const max = ctx.config.maxRecordsPerProvider ?? 15;
      const params = new URLSearchParams({
        query: q,
        limit: String(max),
        fields: "title,abstract,year,url,publicationTypes,journal,authors,externalIds,isOpenAccess",
      });

      const headers: Record<string, string> = { Accept: "application/json" };
      const apiKey = ctx.config.semanticScholarApiKey?.trim();
      if (apiKey) headers["x-api-key"] = apiKey;

      const url = `https://api.semanticscholar.org/graph/v1/paper/search?${params.toString()}`;
      const res = await fetchWithTimeout(url, { headers, timeoutMs: ctx.config.adapterTimeoutMs, signal: ctx.signal });

      if (!res.ok) {
        return adapterResult(
          "semantic_scholar",
          [],
          Date.now() - started,
          res.status === 429 ? "rate_limited" : "error",
          `HTTP ${res.status}`,
        );
      }

      const json = (await res.json()) as { data?: S2Paper[] };
      const papers = json.data ?? [];

      const records = papers
        .map((paper, index) => {
          if (!paper.title || !paper.paperId) return null;
          return buildEvidenceRecord({
            provider: "semantic_scholar",
            sourceId: paper.paperId,
            title: paper.title,
            abstract: paper.abstract,
            authors: paper.authors?.map((a) => a.name ?? "").filter(Boolean),
            journal: paper.journal?.name,
            year: paper.year,
            doi: paper.externalIds?.DOI,
            pmid: paper.externalIds?.PubMed,
            url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
            publicationTypes: paper.publicationTypes,
            isOpenAccess: paper.isOpenAccess,
            relevanceScore: Math.max(0.35, 1 - index * 0.04),
          });
        })
        .filter(Boolean) as ReturnType<typeof buildEvidenceRecord>[];

      const result = adapterResult("semantic_scholar", limitRecords(records, max), Date.now() - started);
      ctx.cache.set(ck, result, CACHE_TTL.search);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return adapterResult(
        "semantic_scholar",
        [],
        Date.now() - started,
        message.includes("Abort") ? "timeout" : "error",
        message,
      );
    }
  },
};
