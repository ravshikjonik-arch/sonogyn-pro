import { CACHE_TTL, cacheKey } from "../infra/cache.js";
import { fetchWithTimeout, withRetry } from "../infra/retry.js";
import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery, ProviderSearchResult } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

function ncbiBase(config: AdapterContext["config"]): string {
  return config.ncbiBaseUrl?.trim() || "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
}

function ncbiParams(config: AdapterContext["config"], extra: Record<string, string>): URLSearchParams {
  const p = new URLSearchParams(extra);
  const key = config.ncbiApiKey?.trim();
  if (key) p.set("api_key", key);
  return p;
}

export const pubmedAdapter: EvidenceAdapter = {
  id: "pubmed",
  label: "PubMed",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    if (!q) return adapterResult("pubmed", [], 0, "skipped");

    const ck = cacheKey("pubmed", q, String(query.limit ?? 15));
    const cached = ctx.cache.get<ProviderSearchResult>(ck);
    if (cached) return cached;

    try {
      const max = ctx.config.maxRecordsPerProvider ?? 15;
      const esearchParams = ncbiParams(ctx.config, {
        db: "pubmed",
        term: q,
        retmax: String(max),
        retmode: "json",
        sort: "relevance",
      });

      const esearchUrl = `${ncbiBase(ctx.config)}/esearch.fcgi?${esearchParams.toString()}`;
      const esearchRes = await withRetry(
        () =>
          fetchWithTimeout(esearchUrl, {
            headers: { "User-Agent": "SonoGynPro/1.0 (evidence-retrieval)" },
            timeoutMs: ctx.config.adapterTimeoutMs,
            signal: ctx.signal,
          }),
        {
          signal: ctx.signal,
          shouldRetry: (_e, _a) => true,
        },
      );

      if (!esearchRes.ok) {
        const status = esearchRes.status === 429 ? "rate_limited" : "error";
        return adapterResult("pubmed", [], Date.now() - started, status, `HTTP ${esearchRes.status}`);
      }

      const esearchJson = (await esearchRes.json()) as {
        esearchresult?: { idlist?: string[] };
      };
      const ids = esearchJson.esearchresult?.idlist ?? [];
      if (ids.length === 0) {
        const empty = adapterResult("pubmed", [], Date.now() - started);
        ctx.cache.set(ck, empty, CACHE_TTL.search);
        return empty;
      }

      const esummaryParams = ncbiParams(ctx.config, {
        db: "pubmed",
        id: ids.join(","),
        retmode: "json",
      });
      const esummaryUrl = `${ncbiBase(ctx.config)}/esummary.fcgi?${esummaryParams.toString()}`;
      const esummaryRes = await fetchWithTimeout(esummaryUrl, {
        headers: { "User-Agent": "SonoGynPro/1.0 (evidence-retrieval)" },
        timeoutMs: ctx.config.adapterTimeoutMs,
        signal: ctx.signal,
      });

      if (!esummaryRes.ok) {
        return adapterResult("pubmed", [], Date.now() - started, "error", `esummary HTTP ${esummaryRes.status}`);
      }

      const esummaryJson = (await esummaryRes.json()) as {
        result?: Record<
          string,
          {
            uid?: string;
            title?: string;
            fulljournalname?: string;
            source?: string;
            pubdate?: string;
            authors?: { name?: string }[];
            elocationid?: string;
          }
        >;
      };

      const records = ids
        .map((id, index) => {
          const row = esummaryJson.result?.[id];
          if (!row?.title) return null;
          const yearMatch = row.pubdate?.match(/\b(19|20)\d{2}\b/);
          const doiMatch = row.elocationid?.match(/doi:\s*(\S+)/i);
          return buildEvidenceRecord({
            provider: "pubmed",
            sourceId: id,
            title: row.title.replace(/\.$/, ""),
            journal: row.fulljournalname || row.source,
            year: yearMatch ? Number.parseInt(yearMatch[0], 10) : undefined,
            authors: row.authors?.map((a) => a.name ?? "").filter(Boolean),
            doi: doiMatch?.[1],
            pmid: id,
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            relevanceScore: Math.max(0.35, 1 - index * 0.04),
          });
        })
        .filter(Boolean) as ReturnType<typeof buildEvidenceRecord>[];

      const result = adapterResult("pubmed", limitRecords(records, max), Date.now() - started);
      ctx.cache.set(ck, result, CACHE_TTL.search);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes("Abort") ? "timeout" : "error";
      return adapterResult("pubmed", [], Date.now() - started, status, message);
    }
  },
};

export async function fetchPubmedAbstracts(
  pmids: string[],
  ctx: AdapterContext,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (pmids.length === 0) return out;

  const params = ncbiParams(ctx.config, {
    db: "pubmed",
    id: pmids.join(","),
    rettype: "abstract",
    retmode: "text",
  });
  const url = `${ncbiBase(ctx.config)}/efetch.fcgi?${params.toString()}`;
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": "SonoGynPro/1.0 (evidence-retrieval)" },
    timeoutMs: ctx.config.adapterTimeoutMs,
    signal: ctx.signal,
  });
  if (!res.ok) return out;

  const text = await res.text();
  const blocks = text.split(/\n\n(?=PMID-)/);
  for (const block of blocks) {
    const pmidMatch = block.match(/^PMID-\s*(\d+)/m);
    const abstractMatch = block.match(/AB\s+-\s+([\s\S]+?)(?=\n[A-Z]{2,3}\s+-|$)/);
    if (pmidMatch?.[1] && abstractMatch?.[1]) {
      out.set(pmidMatch[1], abstractMatch[1].replace(/\s+/g, " ").trim());
    }
  }
  return out;
}
