import type { ClinicalSupportBundle } from "@/lib/copilot/types";

/** Universal framing for CDS outputs — not a substitute for physician judgment. */
export const CDS_FRAMING_HEADER =
  "Ниже приведены «клинические поддерживающие предложения» (clinical decision support). " +
  "Это не диагноз и не самостоятельное медицинское решение. Требуется верификация врачом.";

export function wrapClinicalSupportBundle(
  partial: Omit<ClinicalSupportBundle, "framing">,
): ClinicalSupportBundle {
  return {
    framing: "clinical_support_suggestions",
    summary: partial.summary,
    findings: partial.findings,
    followUpSuggestions: partial.followUpSuggestions,
    additionalTestsSuggestions: partial.additionalTestsSuggestions,
    citations: partial.citations,
  };
}
