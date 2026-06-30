import { CACHE_TTL, cacheKey } from "../infra/cache.js";
import { fetchWithTimeout } from "../infra/retry.js";
import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery, ProviderSearchResult } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

export const openFdaAdapter: EvidenceAdapter = {
  id: "openfda",
  label: "OpenFDA",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const term = query.query.trim();
    if (!term) return adapterResult("openfda", [], 0, "skipped");

    const ck = cacheKey("openfda", term);
    const cached = ctx.cache.get<ProviderSearchResult>(ck);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        search: `openfda.brand_name:${term} OR openfda.generic_name:${term}`,
        limit: "5",
      });
      const url = `https://api.fda.gov/drug/label.json?${params.toString()}`;
      const res = await fetchWithTimeout(url, {
        timeoutMs: ctx.config.adapterTimeoutMs,
        signal: ctx.signal,
      });

      if (!res.ok) {
        if (res.status === 404) {
          const empty = adapterResult("openfda", [], Date.now() - started);
          ctx.cache.set(ck, empty, CACHE_TTL.metadata);
          return empty;
        }
        return adapterResult("openfda", [], Date.now() - started, "error", `HTTP ${res.status}`);
      }

      const json = (await res.json()) as {
        results?: {
          id?: string;
          set_id?: string;
          effective_time?: string;
          openfda?: { brand_name?: string[]; generic_name?: string[] };
          purpose?: string[];
          warnings?: string[];
          pregnancy_or_breast_feeding?: string[];
        }[];
      };

      const records = (json.results ?? []).map((row, index) => {
        const brand = row.openfda?.brand_name?.[0] || row.openfda?.generic_name?.[0] || term;
        const abstract = [
          ...(row.purpose ?? []).slice(0, 1),
          ...(row.pregnancy_or_breast_feeding ?? []).slice(0, 1),
          ...(row.warnings ?? []).slice(0, 1),
        ].join(" ");

        return buildEvidenceRecord({
          provider: "openfda",
          sourceId: row.set_id || row.id || brand,
          title: `FDA label · ${brand}`,
          abstract: abstract.slice(0, 1200) || undefined,
          url: row.set_id
            ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${row.set_id}`
            : "https://open.fda.gov/",
          recordType: "drug_label",
          relevanceScore: 0.9 - index * 0.05,
        });
      });

      const result = adapterResult("openfda", limitRecords(records, 5), Date.now() - started);
      ctx.cache.set(ck, result, CACHE_TTL.metadata);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return adapterResult("openfda", [], Date.now() - started, "error", message);
    }
  },
};

export const dailyMedAdapter: EvidenceAdapter = {
  id: "dailymed",
  label: "DailyMed",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const term = query.query.trim();
    if (!term) return adapterResult("dailymed", [], 0, "skipped");

    try {
      const params = new URLSearchParams({ drug_name: term, pagesize: "5", page: "1" });
      const url = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?${params.toString()}`;
      const res = await fetchWithTimeout(url, {
        timeoutMs: ctx.config.adapterTimeoutMs,
        signal: ctx.signal,
      });

      if (!res.ok) {
        return adapterResult("dailymed", [], Date.now() - started, "error", `HTTP ${res.status}`);
      }

      const json = (await res.json()) as {
        data?: { setid?: string; title?: string; published_date?: string }[];
      };

      const records = (json.data ?? []).map((row, index) =>
        buildEvidenceRecord({
          provider: "dailymed",
          sourceId: row.setid || row.title || term,
          title: row.title || `DailyMed · ${term}`,
          url: row.setid
            ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${row.setid}`
            : "https://dailymed.nlm.nih.gov/",
          recordType: "drug_label",
          relevanceScore: 0.85 - index * 0.05,
        }),
      );

      return adapterResult("dailymed", limitRecords(records, 5), Date.now() - started);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return adapterResult("dailymed", [], Date.now() - started, "error", message);
    }
  },
};

