import { Vector3 } from "three";
import { computeFibroidClinicalMetrics } from "./clinicalFibroidLogic";
import { analyzeUterusHit } from "./figoHitMapping";
import { enrichAnnotationFromSlice } from "./sliceAtlas";
import { PATHOLOGY_LABELS_RU, type PathologyAnnotation, type PathologyType } from "./pathologyTypes";

function fmtSize(s: { length: number; width: number; depth: number }): string {
  const L = Math.round(s.length);
  const W = Math.round(s.width);
  const D = Math.round(s.depth);
  if (D > 0 && D !== L && D !== W) return `${L}×${W}×${D} мм`;
  return `${L}×${W} мм`;
}

function myomaLine(a: PathologyAnnotation): string {
  const local = new Vector3(...a.position);
  const m = computeFibroidClinicalMetrics(local, a.pedunculated ?? false);
  const figo = a.figoOverride ?? a.figoType ?? m.figoType;
  const loc = a.localizationRu ?? m.localizationRu;
  const shapeNote = a.sliceStroke
    ? ` (контур на срезе ${Math.round(a.sizeMm.length)}×${Math.round(a.sizeMm.width)} мм)`
    : a.sliceShape
    ? ` (контур на срезе ${Math.round(a.sizeMm.length)}×${Math.round(a.sizeMm.width)} мм)`
    : "";
  return `Миома тела матки (${figo >= 0 && figo <= 8 ? `FIGO ${figo}` : "FIGO ?"}), ${loc}, размеры ${fmtSize(a.sizeMm)}${shapeNote}.`;
}

function adenomyosisLine(a: PathologyAnnotation): string {
  const loc = a.localizationRu ?? "тело матки";
  return `Очаг аденомиоза, ${loc}, размеры ${fmtSize(a.sizeMm)}${a.comment ? `. ${a.comment}` : ""}.`;
}

function polypLine(a: PathologyAnnotation): string {
  const loc = a.localizationRu ?? "полость матки";
  return `Полип эндометрия, локализация: ${loc}, размеры ${fmtSize(a.sizeMm)}.`;
}

function scarLine(a: PathologyAnnotation): string {
  return `Рубец на матке (истмоцеле / ниша после КС), размеры ниши ${fmtSize(a.sizeMm)}${a.comment ? `. ${a.comment}` : ""}.`;
}

function otherLine(a: PathologyAnnotation): string {
  const label = a.comment?.trim() || "образование";
  return `${label}, размеры ${fmtSize(a.sizeMm)}.`;
}

const LINE_BUILDERS: Record<PathologyType, (a: PathologyAnnotation) => string> = {
  myoma: myomaLine,
  adenomyosis: adenomyosisLine,
  polyp: polypLine,
  scar: scarLine,
  other: otherLine,
};

/** Обогатить маркер расчётными полями по срезу или 3D-позиции */
export function enrichAnnotation(
  a: PathologyAnnotation,
  pedunculatedForHit = false,
): PathologyAnnotation {
  if (a.sliceNorm) {
    return enrichAnnotationFromSlice(a, pedunculatedForHit);
  }
  const local = new Vector3(...a.position);
  const hit = analyzeUterusHit(local, pedunculatedForHit || a.pedunculated === true);
  const loc =
    a.type === "myoma"
      ? computeFibroidClinicalMetrics(local, a.pedunculated ?? false)
      : null;

  return {
    ...a,
    layerLabelRu: hit.layerLabelRu,
    localizationRu: loc?.localizationRu ?? describeZoneRu(local),
    figoType: a.type === "myoma" ? (loc?.figoType ?? hit.figoType) : undefined,
  };
}

function describeZoneRu(local: Vector3): string {
  const hit = analyzeUterusHit(local, false);
  const m = computeFibroidClinicalMetrics(local, false);
  return m.localizationRu || hit.layerLabelRu;
}

export function generateProtocolText(annotations: PathologyAnnotation[]): string {
  if (annotations.length === 0) {
    return "";
  }
  return annotations
    .map((raw) => {
      const a = enrichAnnotation(raw);
      const builder = LINE_BUILDERS[a.type];
      return builder(a);
    })
    .join("\n");
}

export function generateAnnotationSummaryList(annotations: PathologyAnnotation[]): string[] {
  return annotations.map((a) => {
    const label = PATHOLOGY_LABELS_RU[a.type];
    const enriched = enrichAnnotation(a);
    return `• ${label}: ${LINE_BUILDERS[a.type](enriched)}`;
  });
}
