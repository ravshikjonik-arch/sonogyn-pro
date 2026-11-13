import { runMorphologyExtraction, type ExtractionGuards } from "../pipeline";
import type { AnatomicalSite, ModelMention, ModelSubject, MorphologyExtractionResult } from "../types";

export const T = "2026-11-06T10:00:00.000Z";
export const XID = "x";

export const OK_GUARDS: ExtractionGuards = {
  detectPhi: () => ({ ok: true, reasons: [] }),
  detectPromptInjection: () => ({ ok: true }),
};

export const S = (
  ref: string,
  site: AnatomicalSite,
  laterality: ModelSubject["laterality"] = null,
  lateralityText: string | null = null,
): ModelSubject => ({ ref, site, laterality, lateralityText, sourceText: null });

export const M = (p: Partial<ModelMention> & { sourceText: string }): ModelMention => ({
  subjectRef: "S1",
  featureId: null,
  site: null,
  assertion: "affirmed",
  valueCode: null,
  valueCodes: null,
  present: null,
  text: null,
  measurementText: null,
  extractionConfidence: 0.9,
  note: null,
  ...p,
});

/** Runs the real pipeline with a deterministic "model" response. */
export async function run(
  text: string,
  modelResponse: unknown,
  opts: { calls?: { n: number } } = {},
): Promise<MorphologyExtractionResult> {
  return runMorphologyExtraction({
    text,
    guards: OK_GUARDS,
    now: () => T,
    extractionId: XID,
    complete: async () => {
      if (opts.calls) opts.calls.n += 1;
      return {
        ok: true,
        content: typeof modelResponse === "string" ? modelResponse : JSON.stringify(modelResponse),
        model: "stub-model",
        provider: "stub",
      };
    },
  });
}

export const find = (r: MorphologyExtractionResult, feature: string, subjectRef?: string) =>
  r.observations.find((o) => o.feature === feature && (!subjectRef || o.subjectId === `${XID}:${subjectRef}`));

export const unresolvedReasons = (r: MorphologyExtractionResult) => r.unresolvedMentions.map((u) => u.reason);
