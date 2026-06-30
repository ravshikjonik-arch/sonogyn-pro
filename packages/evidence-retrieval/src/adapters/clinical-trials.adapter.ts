import { CACHE_TTL, cacheKey } from "../infra/cache.js";
import { fetchWithTimeout } from "../infra/retry.js";
import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery, ProviderSearchResult } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

type ClinicalTrialStudy = {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
      officialTitle?: string;
    };
    statusModule?: {
      overallStatus?: string;
    };
    designModule?: {
      studyType?: string;
    };
    descriptionModule?: {
      briefSummary?: string;
    };
    conditionsModule?: {
      conditions?: string[];
    };
    armsInterventionsModule?: {
      interventions?: { name?: string }[];
    };
  };
};

export const clinicalTrialsAdapter: EvidenceAdapter = {
  id: "clinical_trials",
  label: "ClinicalTrials.gov",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    if (!q) return adapterResult("clinical_trials", [], 0, "skipped");

    const ck = cacheKey("clinical_trials", q, String(query.limit ?? 10));
    const cached = ctx.cache.get<ProviderSearchResult>(ck);
    if (cached) return cached;

    try {
      const max = Math.min(ctx.config.maxRecordsPerProvider ?? 10, 10);
      const params = new URLSearchParams({
        "query.term": q,
        pageSize: String(max),
        format: "json",
      });

      const url = `https://clinicaltrials.gov/api/v2/studies?${params.toString()}`;
      const res = await fetchWithTimeout(url, {
        headers: { Accept: "application/json" },
        timeoutMs: ctx.config.adapterTimeoutMs,
        signal: ctx.signal,
      });

      if (!res.ok) {
        return adapterResult(
          "clinical_trials",
          [],
          Date.now() - started,
          res.status === 429 ? "rate_limited" : "error",
          `HTTP ${res.status}`,
        );
      }

      const json = (await res.json()) as { studies?: ClinicalTrialStudy[] };
      const studies = json.studies ?? [];

      const records = studies
        .map((study, index) => {
          const id = study.protocolSection?.identificationModule?.nctId;
          const title =
            study.protocolSection?.identificationModule?.briefTitle ||
            study.protocolSection?.identificationModule?.officialTitle;
          if (!id || !title) return null;

          const interventions =
            study.protocolSection?.armsInterventionsModule?.interventions
              ?.map((i) => i.name)
              .filter(Boolean)
              .join("; ") || undefined;

          return buildEvidenceRecord({
            provider: "clinical_trials",
            sourceId: id,
            title,
            abstract: study.protocolSection?.descriptionModule?.briefSummary,
            recordType: "clinical_trial",
            studyDesign: study.protocolSection?.designModule?.studyType,
            intervention: interventions,
            population: study.protocolSection?.conditionsModule?.conditions?.join("; "),
            url: `https://clinicaltrials.gov/study/${id}`,
            relevanceScore: Math.max(0.3, 0.85 - index * 0.05),
          });
        })
        .filter(Boolean) as ReturnType<typeof buildEvidenceRecord>[];

      const result = adapterResult("clinical_trials", limitRecords(records, max), Date.now() - started);
      ctx.cache.set(ck, result, CACHE_TTL.search);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return adapterResult(
        "clinical_trials",
        [],
        Date.now() - started,
        message.includes("Abort") ? "timeout" : "error",
        message,
      );
    }
  },
};
