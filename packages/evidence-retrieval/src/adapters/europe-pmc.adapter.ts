import { CACHE_TTL, cacheKey } from "../infra/cache.js";
import { fetchWithTimeout } from "../infra/retry.js";
import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery, ProviderSearchResult } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

type EuropePmcHit = {
  id?: string;
  pmid?: string;
  doi?: string;
  title?: string;
  authorString?: string;
  journalTitle?: string;
  pubYear?: string;
  abstractText?: string;
  isOpenAccess?: string;
  source?: string;
};

export const europePmcAdapter: EvidenceAdapter = {
  id: "europe_pmc",
  label: "Europe PMC",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    if (!q) return adapterResult("europe_pmc", [], 0, "skipped");

    const ck = cacheKey("europe_pmc", q, String(query.limit ?? 15));
    const cached = ctx.cache.get<ProviderSearchResult>(ck);
    if (cached) return cached;

    try {
      const max = ctx.config.maxRecordsPerProvider ?? 15;
      const params = new URLSearchParams({
        query: q,
        format: "json",
        pageSize: String(max),
        resultType: "core",
      });

      const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?${params.toString()}`;
      const res = await fetchWithTimeout(url, {
        headers: { Accept: "application/json" },
        timeoutMs: ctx.config.adapterTimeoutMs,
        signal: ctx.signal,
      });

      if (!res.ok) {
        return adapterResult(
          "europe_pmc",
          [],
          Date.now() - started,
          res.status === 429 ? "rate_limited" : "error",
          `HTTP ${res.status}`,
        );
      }

      const json = (await res.json()) as { resultList?: { result?: EuropePmcHit[] } };
      const hits = json.resultList?.result ?? [];

      const records = hits
        .map((hit, index) => {
          const sourceId = hit.pmid || hit.id || hit.doi;
          if (!hit.title || !sourceId) return null;
          return buildEvidenceRecord({
            provider: "europe_pmc",
            sourceId: String(sourceId),
            title: hit.title,
            abstract: hit.abstractText,
            authors: hit.authorString?.split(", ").filter(Boolean),
            journal: hit.journalTitle,
            year: hit.pubYear ? Number.parseInt(hit.pubYear, 10) : undefined,
            doi: hit.doi,
            pmid: hit.pmid,
            url: hit.pmid
              ? `https://europepmc.org/article/MED/${hit.pmid}`
              : `https://europepmc.org/search?query=${encodeURIComponent(hit.title)}`,
            isOpenAccess: hit.isOpenAccess === "Y",
            relevanceScore: Math.max(0.35, 1 - index * 0.04),
          });
        })
        .filter(Boolean) as ReturnType<typeof buildEvidenceRecord>[];

      const result = adapterResult("europe_pmc", limitRecords(records, max), Date.now() - started);
      ctx.cache.set(ck, result, CACHE_TTL.search);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return adapterResult(
        "europe_pmc",
        [],
        Date.now() - started,
        message.includes("Abort") ? "timeout" : "error",
        message,
      );
    }
  },
};

/** Cochrane systematic reviews via Europe PMC journal filter. */
export const cochraneAdapter: EvidenceAdapter = {
  id: "cochrane",
  label: "Cochrane Library",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    if (!q) return adapterResult("cochrane", [], 0, "skipped");

    const cochraneQuery = `(${q}) AND JOURNAL:"Cochrane Database of Systematic Reviews"`;
    return europePmcAdapter.search({ ...query, query: cochraneQuery }, ctx).then((res) => ({
      ...res,
      provider: "cochrane" as const,
      records: res.records.map((r) => ({
        ...r,
        id: `cochrane:${r.sourceId}`,
        provider: "cochrane" as const,
        recordType: "systematic_review" as const,
        evidenceLevel: "I" as const,
      })),
      latencyMs: Date.now() - started,
    }));
  },
};
