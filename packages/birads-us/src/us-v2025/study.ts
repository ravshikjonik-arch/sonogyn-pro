import { assessBiradsUsLesion } from "./assess";
import { BIRADS_CATEGORY_INFO } from "./lexicon";
import type { BiradsCategory, BiradsCategoryInfo, BiradsUsLesionInput, BiradsUsLesionResult } from "./types";

export type BreastSide = "right" | "left";
export type BreastDepth = "anterior" | "middle" | "posterior";
export type BreastLymphStation =
  | "intramammary"
  | "axillary_I"
  | "axillary_II"
  | "axillary_III"
  | "internal_mammary"
  | "supraclavicular";
export type BreastLymphAssessment = "normal" | "indeterminate" | "suspicious";

export type BreastLesion = {
  id: string;
  side?: BreastSide;
  /** Clock-face position 1–12 as seen facing the patient. */
  clock?: number;
  distanceFromNippleMm?: number;
  depth?: BreastDepth;
  /** Width × anteroposterior × length, mm. */
  dimensionsMm?: { width?: number; anteroposterior?: number; length?: number };
  findings: BiradsUsLesionInput;
};

export type BreastLymphNodeFinding = { side: BreastSide; station: BreastLymphStation; assessment: BreastLymphAssessment };

export type BreastStudyInput = {
  /** Sides that were examined; an examined side without lesions is BI-RADS 1. */
  sidesExamined: BreastSide[];
  lesions: BreastLesion[];
  lymphNodes?: BreastLymphNodeFinding[];
};

export type BreastLesionEvaluation = { lesionId: string; side?: BreastSide; result: BiradsUsLesionResult };

export type BreastSideAssessment =
  | { side: BreastSide; status: "final"; info: BiradsCategoryInfo; fromLesionId: string | null }
  | { side: BreastSide; status: "pending"; lesionIds: string[]; messageRu: string }
  | { side: BreastSide; status: "not_examined" };

export type BreastStudyEvaluation = {
  lesions: BreastLesionEvaluation[];
  sides: BreastSideAssessment[];
  warningsRu: string[];
  errors: { lesionId: string; messageRu: string }[];
};

/** ACR hierarchy for the overall assessment: 1 < 2 < 3 < 6 < 0 < 4 < 5. */
const RANK: Record<BiradsCategory, number> = { "1": 1, "2": 2, "3": 3, "6": 4, "0": 5, "4A": 6, "4B": 7, "4C": 8, "5": 9 };

const SIDES: BreastSide[] = ["right", "left"];
const STATIONS: BreastLymphStation[] = ["intramammary", "axillary_I", "axillary_II", "axillary_III", "internal_mammary", "supraclavicular"];

function validateLesion(l: BreastLesion): string[] {
  const errors: string[] = [];
  if (l.side !== undefined && !SIDES.includes(l.side)) errors.push("Недопустимая сторона.");
  if (l.clock !== undefined && !(Number.isInteger(l.clock) && l.clock >= 1 && l.clock <= 12)) {
    errors.push("Положение по циферблату — целое число от 1 до 12.");
  }
  if (l.distanceFromNippleMm !== undefined && !(Number.isFinite(l.distanceFromNippleMm) && l.distanceFromNippleMm >= 0 && l.distanceFromNippleMm <= 300)) {
    errors.push("Расстояние от соска — от 0 до 300 мм.");
  }
  const d = l.dimensionsMm;
  if (d) {
    for (const v of [d.width, d.anteroposterior, d.length]) {
      if (v !== undefined && !(Number.isFinite(v) && v > 0 && v <= 200)) {
        errors.push("Размеры образования — положительные числа до 200 мм.");
        break;
      }
    }
  }
  return errors;
}

export function evaluateBreastStudy(input: BreastStudyInput): BreastStudyEvaluation {
  const errors: { lesionId: string; messageRu: string }[] = [];
  const ids = new Set<string>();
  for (const l of input.lesions) {
    if (ids.has(l.id)) errors.push({ lesionId: l.id, messageRu: "Повторяющийся идентификатор образования." });
    ids.add(l.id);
    for (const messageRu of validateLesion(l)) errors.push({ lesionId: l.id, messageRu });
    if (l.side && !input.sidesExamined.includes(l.side)) {
      errors.push({ lesionId: l.id, messageRu: "Образование на стороне, которая не отмечена как осмотренная." });
    }
  }
  for (const n of input.lymphNodes ?? []) {
    if (!SIDES.includes(n.side) || !STATIONS.includes(n.station)) errors.push({ lesionId: "lymph", messageRu: "Недопустимое описание лимфоузла." });
  }
  if (errors.length > 0) return { lesions: [], sides: [], warningsRu: [], errors };

  const lesions = input.lesions.map((l) => ({ lesionId: l.id, side: l.side, result: assessBiradsUsLesion(l.findings) }));

  const sides: BreastSideAssessment[] = SIDES.map((side) => {
    if (!input.sidesExamined.includes(side)) return { side, status: "not_examined" };
    const own = lesions.filter((l) => l.side === side);
    if (own.length === 0) return { side, status: "final", info: BIRADS_CATEGORY_INFO["1"], fromLesionId: null };
    const pending = own.filter((l) => l.result.status !== "ok" || l.result.final === null);
    if (pending.length > 0) {
      return {
        side,
        status: "pending",
        lesionIds: pending.map((l) => l.lesionId),
        messageRu: "Итоговая категория появится, когда у всех образований этой стороны будет категория.",
      };
    }
    let best = own[0];
    for (const l of own) {
      const a = l.result.status === "ok" && l.result.final ? RANK[l.result.final.category] : 0;
      const b = best.result.status === "ok" && best.result.final ? RANK[best.result.final.category] : 0;
      if (a > b) best = l;
    }
    const info = best.result.status === "ok" && best.result.final ? best.result.final : BIRADS_CATEGORY_INFO["1"];
    return { side, status: "final", info, fromLesionId: best.lesionId };
  });

  const warningsRu: string[] = [];
  const unsided = lesions.filter((l) => !l.side);
  if (unsided.length) warningsRu.push("У части образований не указана сторона — они не учтены в итоговой категории железы.");
  for (const n of input.lymphNodes ?? []) {
    if (n.assessment === "suspicious") {
      warningsRu.push("Подозрительный лимфоузел: оценивается отдельно; при необходимости верификации врач может учесть это в итоговой категории.");
      break;
    }
  }
  return { lesions, sides, warningsRu, errors };
}
