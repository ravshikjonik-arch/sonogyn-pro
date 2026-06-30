import type {
  CacheStore,
  EvidenceProviderId,
  EvidenceRecord,
  EvidenceSearchQuery,
  ProviderSearchResult,
  RetrievalConfig,
} from "../types.js";

export type AdapterContext = {
  config: RetrievalConfig;
  cache: CacheStore;
  signal?: AbortSignal;
};

export type EvidenceAdapter = {
  id: EvidenceProviderId;
  label: string;
  search(query: EvidenceSearchQuery, ctx: AdapterContext): Promise<ProviderSearchResult>;
};

export function adapterResult(
  provider: EvidenceProviderId,
  records: EvidenceRecord[],
  latencyMs: number,
  status: ProviderSearchResult["status"] = "ok",
  error?: string,
): ProviderSearchResult {
  return { provider, status, records, latencyMs, error };
}

export function limitRecords(records: EvidenceRecord[], limit: number): EvidenceRecord[] {
  return records.slice(0, Math.max(1, limit));
}
