import type { IotaSimpleCode, IotaSimpleRulesResult, IotaSimpleVerdict } from "./types";
import {
  ORADS_US_PITFALL_BULLETS,
  ORADS_US_SOLID_COMPONENT_MIN_MM,
  SUPPLEMENTARY_READING,
  oradsManagementForCategory,
} from "./orads-protocol";

/** IOTA Simple Rules — дескрипторы IOTA group (B/M). */
export const IOTA_BENIGN_DESCRIPTORS: { code: IotaSimpleCode; labelRu: string }[] = [
  { code: "B1", labelRu: "Однокамерное образование" },
  { code: "B2", labelRu: "Солидный компонент <7 мм" },
  { code: "B3", labelRu: "Акустическая тень за гипер/гипоэхогенной областью" },
  { code: "B4", labelRu: "Гладкая внутренняя стенка ≥3 мм" },
  { code: "B5", labelRu: "Размер <100 мм" },
  { code: "B6", labelRu: "Отсутствие кровотока на ЦДК" },
];

export const IOTA_MALIGNANT_DESCRIPTORS: { code: IotaSimpleCode; labelRu: string }[] = [
  { code: "M1", labelRu: "Солидное образование с неровным контуром" },
  { code: "M2", labelRu: "Асцит" },
  { code: "M3", labelRu: "≥4 папиллярных разрастаний" },
  { code: "M4", labelRu: "Многокамерное кистозно-солидное >100 мм с неровным контуром" },
  { code: "M5", labelRu: "Гиперваскуляризация (ЦДК, 4 балла)" },
];

/** Клинические уточнения при применении O-RADS US / IOTA. */
export const ORADS_US_CLINICAL_BULLETS = ORADS_US_PITFALL_BULLETS;

/** @deprecated используйте ORADS_US_CLINICAL_BULLETS */
export const OZERSKAYA_IOTA_BULLETS = ORADS_US_CLINICAL_BULLETS;

/** @deprecated используйте oradsManagementForCategory из orads-protocol */
export const OZERSKAYA_ORADS_MANAGEMENT = {
  1: oradsManagementForCategory(1),
  2: oradsManagementForCategory(2),
  3: oradsManagementForCategory(3),
  4: oradsManagementForCategory(4),
  5: oradsManagementForCategory(5),
} as const;

export function evaluateIotaSimpleRules(
  benignCodes: IotaSimpleCode[],
  malignantCodes: IotaSimpleCode[],
): IotaSimpleRulesResult {
  const benignMatched = [...new Set(benignCodes)];
  const malignantMatched = [...new Set(malignantCodes)];

  let verdict: IotaSimpleVerdict = "indeterminate";
  let summaryRu = "Признаки смешанные или неполные — рассчитайте полную категорию O-RADS US.";

  if (benignMatched.length > 0 && malignantMatched.length === 0) {
    verdict = "benign";
    summaryRu =
      "Только доброкачественные признаки IOTA — вероятно доброкачественное (подтвердите O-RADS US).";
  } else if (malignantMatched.length > 0 && benignMatched.length === 0) {
    verdict = "malignant";
    summaryRu = "Злокачественные признаки IOTA без доброкачественных — высокая вероятность злокачественности.";
  } else if (malignantMatched.length > 0 && benignMatched.length > 0) {
    summaryRu =
      "Конфликт B и M признаков — не полагаться только на Simple Rules; назначьте O-RADS US.";
  }

  return {
    verdict,
    benignMatched,
    malignantMatched,
    summaryRu,
    supplementaryNote:
      verdict === "benign"
        ? "При типичной морфологии O-RADS 2 (тератома, геморрагическая, эндометриома) сверяйте с таблицей Classic Benign."
        : undefined,
    ozerskayaNote:
      verdict === "benign"
        ? "При типичной морфологии O-RADS 2 (тератома, геморрагическая, эндометриома) сверяйте с таблицей Classic Benign."
        : undefined,
  };
}

/** @deprecated используйте ORADS_US_SOLID_COMPONENT_MIN_MM */
export const OZERSKAYA_SOLID_COMPONENT_MIN_MM = ORADS_US_SOLID_COMPONENT_MIN_MM;

/** @deprecated используйте oradsManagementForCategory */
export function ozerskayaManagementForOrads(category: 1 | 2 | 3 | 4 | 5): string {
  return oradsManagementForCategory(category);
}

/** @deprecated используйте SUPPLEMENTARY_READING */
export const OZERSKAYA_CITATION = SUPPLEMENTARY_READING[0]?.citation ?? "";
