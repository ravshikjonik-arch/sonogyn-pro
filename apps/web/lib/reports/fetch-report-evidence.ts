import { evaluateThyroidFromInput, resolveOradsCategory } from "@repo/report-engine";
import { searchEvidenceUnified, type EvidenceRecord } from "@repo/evidence-retrieval";
import type {
  AdnexStructuredReportInput,
  ObstetricStructuredReportInput,
  StructuredReportInput,
  ThyroidStructuredReportInput,
} from "@repo/types";

import { buildRetrievalConfigAsync } from "@/lib/evidence/retrieval-config";

const REPORT_EVIDENCE_TIMEOUT_MS = 6000;

const REPORT_EVIDENCE_PROVIDERS = [
  "static_corpus",
  "kr_mz_rf",
  "who",
  "nice",
  "pubmed",
  "cochrane",
  "europe_pmc",
] as const;

function buildAdnexEvidenceQuery(input: AdnexStructuredReportInput): string {
  const orads = resolveOradsCategory(input);
  const parts = [`O-RADS ${orads}`, "ovarian adnexal mass", "ultrasound management"];
  if (input.classification.iotaVerdict === "malignant") {
    parts.push("malignancy risk");
  } else if (input.classification.iotaVerdict === "benign") {
    parts.push("benign follow-up");
  }
  if (input.freeTextFindings?.trim()) {
    parts.push(input.freeTextFindings.trim().slice(0, 120));
  }
  return parts.join(" ");
}

function buildThyroidEvidenceQuery(input: ThyroidStructuredReportInput): string {
  const result = evaluateThyroidFromInput(input);
  const parts = ["thyroid nodule", "TI-RADS", "ACR", "ultrasound", "FNA"];
  if (result.categoryLabel) parts.push(result.categoryLabel);
  if (result.fnaRecommended) parts.push("fine needle aspiration indication");
  if (input.freeTextFindings?.trim()) {
    parts.push(input.freeTextFindings.trim().slice(0, 100));
  }
  return parts.join(" ");
}

function buildObstetricEvidenceQuery(input: ObstetricStructuredReportInput): string {
  const ga = input.biometry.gestationalAgeWeeks;
  const parts =
    ga != null && ga <= 14
      ? ["first trimester", "ultrasound screening", "ISUOG", "FMF"]
      : ["fetal biometry", "obstetric ultrasound", "ISUOG", "growth assessment"];
  if (ga != null) parts.push(`${ga} weeks gestation`);
  if (input.freeTextFindings?.trim()) {
    parts.push(input.freeTextFindings.trim().slice(0, 100));
  }
  return parts.join(" ");
}

export function buildReportEvidenceQuery(input: StructuredReportInput): string | null {
  switch (input.domain) {
    case "adnex":
      return buildAdnexEvidenceQuery(input);
    case "thyroid":
      return buildThyroidEvidenceQuery(input);
    case "obstetric":
      return buildObstetricEvidenceQuery(input);
    default:
      return null;
  }
}

/** Live EBM hits merged into structured report citations (all SRE domains). */
export async function fetchEvidenceForReportInput(
  input: StructuredReportInput,
  options?: { limit?: number },
): Promise<EvidenceRecord[]> {
  const queryText = buildReportEvidenceQuery(input);
  if (!queryText) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REPORT_EVIDENCE_TIMEOUT_MS);

  try {
    const config = await buildRetrievalConfigAsync();
    const result = await searchEvidenceUnified(
      {
        query: queryText,
        limit: options?.limit ?? 8,
        preferHighEvidence: true,
        providers: [...REPORT_EVIDENCE_PROVIDERS],
      },
      { config, signal: controller.signal },
    );
    return result.records;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
