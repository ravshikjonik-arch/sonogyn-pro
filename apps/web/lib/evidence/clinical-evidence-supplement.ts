import { searchEvidenceUnified } from "@repo/evidence-retrieval";

import { buildRetrievalConfigAsync } from "@/lib/evidence/retrieval-config";

const CLINICAL_EVIDENCE_TIMEOUT_MS = 4500;

/** Compact EBM snippet for clinical Sonogyn chat (non-evidence mode). */
export async function fetchClinicalEvidenceSupplement(query: string): Promise<string | null> {
  const q = query.trim();
  if (q.length < 5) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLINICAL_EVIDENCE_TIMEOUT_MS);

  try {
    const config = await buildRetrievalConfigAsync();
    const result = await searchEvidenceUnified(
      {
        query: q,
        limit: 6,
        preferHighEvidence: true,
        providers: ["static_corpus", "kr_mz_rf", "who", "nice", "pubmed", "cochrane"],
      },
      { config, signal: controller.signal },
    );

    if (result.records.length === 0) return null;

    const lines = result.records.slice(0, 6).map((r, i) => {
      const meta = [r.provider, r.year ? String(r.year) : null].filter(Boolean).join(", ");
      return `[${i + 1}] ${r.title} (${meta})\n    ${r.url}`;
    });

    return lines.join("\n");
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
