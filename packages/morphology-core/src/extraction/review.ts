import { defaultFeatureRegistry } from "../features";
import type { FeatureRegistry } from "../registry";
import type { MorphologyObservation, MorphologyStatus, MorphologyValue } from "../types";
import type { ClinicalAssertion, MorphologyExtractionResult } from "./types";

export type ReviewAction = "confirm" | "accept_not_assessed" | "edit" | "reject" | "choose_alternative";

/** UI-neutral row for the future physician review screen (Web and React Native). */
export type ExtractionReviewItem = {
  observationId: string;
  featureId: string;
  displayName: string;
  subjectId: string | null;
  laterality: MorphologyObservation["laterality"];
  valueLabel: string;
  alternativeLabels: string[];
  sourceFragments: string[];
  /** Extraction confidence (reading/mapping), not clinical certainty. */
  extractionConfidence: number | null;
  /** How the text stated it. */
  statementCertainty: ClinicalAssertion[];
  status: MorphologyStatus;
  warnings: string[];
  actions: ReviewAction[];
};

function label(registry: FeatureRegistry, featureId: string, value: MorphologyValue | null, o?: MorphologyObservation): string {
  const def = registry.get(featureId);
  if (o?.measurement != null) return `${o.measurement} ${o.unit ?? ""}`.trim();
  if (!value) return "—";
  const codeLabel = (c: string) => def?.allowedValues?.find((v) => v.code === c)?.label ?? c;
  switch (value.kind) {
    case "boolean":
      return value.present ? "есть" : "нет";
    case "enum":
      return codeLabel(value.code);
    case "enum_set":
      return value.codes.map(codeLabel).join(", ");
    case "text":
      return value.text;
    case "quantity":
      return `${value.value} ${value.unit}`;
    case "not_assessed":
      return "не оценено";
  }
}

export function buildExtractionReviewItems(
  result: MorphologyExtractionResult,
  registry: FeatureRegistry = defaultFeatureRegistry,
): ExtractionReviewItem[] {
  return result.observations.map((o) => {
    const ev = result.evidence.find((e) => e.observationId === o.id);
    const subjectRef = result.subjects.find((s) => s.subjectId === o.subjectId)?.ref;
    const warnings = result.ambiguities
      .filter((a) => a.featureId === o.feature && (!a.subjectRef || a.subjectRef === subjectRef))
      .map((a) => a.detail);
    if (o.status === "uncertain") warnings.push("Неуверенная формулировка в тексте");
    if (o.status === "contradicted") warnings.push("Противоречивые сведения — выберите значение");
    if (o.status === "not_assessed") warnings.push("В тексте указано, что признак не оценивался — это не отрицательный результат");
    return {
      observationId: o.id,
      featureId: o.feature,
      displayName: registry.get(o.feature)?.displayName ?? o.feature,
      subjectId: o.subjectId ?? null,
      laterality: o.laterality ?? null,
      valueLabel: o.status === "not_assessed" ? "не оценено" : label(registry, o.feature, o.value, o),
      alternativeLabels: (o.alternatives ?? []).map((a) => label(registry, o.feature, a)),
      sourceFragments: ev?.fragments.map((f) => f.text) ?? (o.rawText ? [o.rawText] : []),
      extractionConfidence: o.confidence?.score ?? null,
      statementCertainty: ev?.assertions ?? [],
      status: o.status,
      warnings,
      actions:
        o.status === "contradicted"
          ? ["choose_alternative", "edit", "reject"]
          : o.status === "not_assessed"
            ? ["accept_not_assessed", "edit", "reject"]
            : ["confirm", "edit", "reject"],
    };
  });
}
