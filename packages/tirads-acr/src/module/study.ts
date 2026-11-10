import { evaluateAcrTiradsStrict } from "../acr-strict";
import { evaluateEuTirads } from "../eu";
import {
  toAcrLymphNodes,
  type ThyroidComparisonRow,
  type ThyroidNodule,
  type ThyroidNoduleEvaluation,
  type ThyroidStudyEvaluation,
  type ThyroidStudyInput,
} from "./types";

const LOCATIONS = ["right_lobe", "left_lobe", "isthmus"] as const;

const DIMENSION_NAMES_RU = [
  ["longitudinal", "продольный"],
  ["anteroposterior", "переднезадний"],
  ["transverse", "поперечный"],
] as const;

/** Dimensions still to enter; size-based tactics need all three (SonoGyn Pro rule). */
export function missingNoduleDimensionsRu(nodule: ThyroidNodule): string[] {
  const d = nodule.dimensionsMm ?? {};
  return DIMENSION_NAMES_RU.filter(([key]) => {
    const v = d[key];
    return !(typeof v === "number" && Number.isFinite(v) && v > 0);
  }).map(([, name]) => name);
}

/** Largest diameter, only when all three dimensions are measured; otherwise size-based tactics stay undetermined. */
export function maxNoduleDiameterMm(nodule: ThyroidNodule): number | undefined {
  if (missingNoduleDimensionsRu(nodule).length) return undefined;
  const d = nodule.dimensionsMm!;
  return Math.max(d.longitudinal!, d.anteroposterior!, d.transverse!);
}

function validateNodule(nodule: ThyroidNodule): string[] {
  const errors: string[] = [];
  if (nodule.location !== undefined && !LOCATIONS.includes(nodule.location)) {
    errors.push("Недопустимая локализация узла.");
  }
  const d = nodule.dimensionsMm;
  if (d) {
    for (const v of [d.longitudinal, d.anteroposterior, d.transverse]) {
      if (v !== undefined && (typeof v !== "number" || !Number.isFinite(v) || v <= 0)) {
        errors.push("Размеры узла должны быть положительными числами (мм).");
        break;
      }
    }
  }
  return errors;
}

/** Each engine runs on its own answers; no result of one system is passed to the other. */
export function evaluateThyroidNodule(nodule: ThyroidNodule, study: Omit<ThyroidStudyInput, "nodules">): ThyroidNoduleEvaluation {
  const maxDiameterMm = maxNoduleDiameterMm(nodule);
  const eu = nodule.eu
    ? evaluateEuTirads(
        { ...nodule.eu, maxDiameterMm, lymphNodes: study.lymphNodes, isPediatric: study.isPediatric },
        study.euProfile,
      )
    : null;
  const acr = nodule.acr
    ? evaluateAcrTiradsStrict({
        ...nodule.acr,
        largestDiameterMm: maxDiameterMm,
        lymphNodes: toAcrLymphNodes(study.lymphNodes),
        isPediatric: study.isPediatric,
      })
    : null;
  return { noduleId: nodule.id, location: nodule.location, dimensionsMm: nodule.dimensionsMm, maxDiameterMm, eu, acr };
}

const ACR_RANK: Record<string, number> = { TR1: 1, TR2: 2, TR3: 3, TR4: 4, TR5: 5 };

function pickHighest(
  rows: ThyroidNoduleEvaluation[],
  rank: (row: ThyroidNoduleEvaluation) => number | null,
): string | null {
  let best: ThyroidNoduleEvaluation | null = null;
  let bestRank = -1;
  for (const row of rows) {
    const r = rank(row);
    if (r === null) continue;
    const larger = (row.maxDiameterMm ?? 0) > (best?.maxDiameterMm ?? 0);
    if (r > bestRank || (r === bestRank && larger)) {
      best = row;
      bestRank = r;
    }
  }
  return best?.noduleId ?? null;
}

function compare(row: ThyroidNoduleEvaluation): ThyroidComparisonRow {
  const eu = row.eu?.status === "ok" ? row.eu : null;
  const acr = row.acr?.status === "ok" ? row.acr : null;
  const euFna = eu?.management.fna ?? null;
  const acrFna = acr?.management.fna ?? null;
  const decided = (v: string | null) => v === "indicated" || v === "not_indicated";
  const fnaAgreement = decided(euFna) && decided(acrFna) ? euFna === acrFna : null;
  return {
    noduleId: row.noduleId,
    euCategory: eu?.category ?? null,
    acrCategory: acr?.result.category ?? null,
    euFna,
    acrFna,
    fnaAgreement,
    noteRu:
      fnaAgreement === false
        ? "Системы расходятся в показаниях к ТАБ — у них разные критерии и пороги. Решение принимает врач."
        : null,
  };
}

export function evaluateThyroidStudy(input: ThyroidStudyInput): ThyroidStudyEvaluation {
  const errors: { noduleId: string; messageRu: string }[] = [];
  const ids = new Set<string>();
  for (const n of input.nodules) {
    if (ids.has(n.id)) errors.push({ noduleId: n.id, messageRu: "Повторяющийся идентификатор узла." });
    ids.add(n.id);
    for (const messageRu of validateNodule(n)) errors.push({ noduleId: n.id, messageRu });
  }
  if (errors.length > 0) return { nodules: [], highestEu: null, highestAcr: null, comparison: [], errors };

  const { nodules, ...study } = input;
  const rows = nodules.map((n) => evaluateThyroidNodule(n, study));
  return {
    nodules: rows,
    highestEu: pickHighest(rows, (r) => (r.eu?.status === "ok" ? r.eu.category : null)),
    highestAcr: pickHighest(rows, (r) => (r.acr?.status === "ok" ? ACR_RANK[r.acr.result.category] : null)),
    comparison: rows.map(compare),
    errors,
  };
}
