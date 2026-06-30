import type { RetrievalConfig } from "@repo/evidence-retrieval";

import { loadExternalGuidelines } from "@/lib/evidence/load-external-guidelines";

export function buildRetrievalConfig(): RetrievalConfig {
  return {
    ncbiApiKey: process.env.NCBI_API_KEY?.trim(),
    ncbiBaseUrl: process.env.NCBI_EUTILS_BASE?.trim(),
    semanticScholarApiKey: process.env.SEMANTIC_SCHOLAR_API_KEY?.trim(),
    crossrefMailto: process.env.CROSSREF_MAILTO?.trim() || "support@sonogyn.pro",
    adapterTimeoutMs: Number.parseInt(process.env.EVIDENCE_ADAPTER_TIMEOUT_MS ?? "8000", 10) || 8000,
    maxRecordsPerProvider: Number.parseInt(process.env.EVIDENCE_MAX_PER_PROVIDER ?? "12", 10) || 12,
  };
}

export async function buildRetrievalConfigAsync(): Promise<RetrievalConfig> {
  const externalGuidelines = await loadExternalGuidelines();
  return {
    ...buildRetrievalConfig(),
    externalGuidelines: externalGuidelines.length > 0 ? externalGuidelines : undefined,
  };
}
