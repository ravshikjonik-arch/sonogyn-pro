import type { ReportCitation } from "@repo/types";

/** Minimal shape compatible with @repo/evidence-retrieval EvidenceRecord */
export type EvidenceRecordLike = {
  id: string;
  provider: string;
  title: string;
  url: string;
  year?: number;
  journal?: string;
  abstract?: string;
  doi?: string;
  pmid?: string;
  recordType?: string;
};

const PROVIDER_STANDARD: Record<string, string> = {
  pubmed: "PubMed",
  europe_pmc: "Europe PMC",
  cochrane: "Cochrane Library",
  semantic_scholar: "Semantic Scholar",
  clinical_trials: "ClinicalTrials.gov",
  kr_mz_rf: "КР МЗ РФ",
  static_corpus: "SonoEvidence",
  openfda: "OpenFDA",
  dailymed: "DailyMed",
  who: "WHO",
  nice: "NICE",
  ema: "EMA",
};

/** Map unified EBM records → SRE ReportCitation[] for structured reports. */
export function mapEvidenceRecordsToReportCitations(
  records: EvidenceRecordLike[],
  options?: { max?: number; standardPrefix?: string },
): ReportCitation[] {
  const max = options?.max ?? 12;
  return records.slice(0, max).map((r, index) => ({
    id: r.id || `ebm-${index + 1}`,
    standard: options?.standardPrefix
      ? `${options.standardPrefix} · ${PROVIDER_STANDARD[r.provider] ?? r.provider}`
      : PROVIDER_STANDARD[r.provider] ?? r.provider,
    version: r.year ? String(r.year) : undefined,
    label: r.title,
    url: r.url,
    quote: r.abstract?.slice(0, 280) || r.journal || undefined,
  }));
}

/** Merge calculator/static citations with live EBM hits (dedupe by url). */
export function mergeReportCitations(
  primary: ReportCitation[],
  evidence: ReportCitation[],
  max = 20,
): ReportCitation[] {
  const seen = new Set<string>();
  const out: ReportCitation[] = [];
  for (const c of [...primary, ...evidence]) {
    const key = c.url ?? c.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= max) break;
  }
  return out;
}
