/**
 * Поля ввода эластографии (web). min/max из @repo/medical-calculations.
 */

import { HARD_LIMITS } from "@repo/medical-calculations/elastography";
import type { ElastographyMethod, ElastographyOrgan } from "@repo/medical-calculations/elastography";

export type WebFieldDefinition = {
  key: string;
  label: string;
  hint?: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  optional?: boolean;
};

function r(limit: keyof typeof HARD_LIMITS) {
  return { min: HARD_LIMITS[limit].min, max: HARD_LIMITS[limit].max };
}

const L = {
  kPa: r("kPa"),
  stiffness: r("stiffnessIndex"),
  strain: r("strainRatio"),
  tsukuba: r("tsukubaScore"),
  sizeMm: r("lesionSizeMm"),
  depthMm: r("lesionDepthMm"),
  weeks: r("gestationalWeeks"),
} as const;

export const ORGAN_LABELS: Record<Exclude<ElastographyOrgan, "abdomen_liver">, string> = {
  cervix: "Шейка матки",
  myometrium: "Миометрий",
  ovary: "Яичники",
  breast: "Молочная железа",
};

export const METHOD_LABELS: Record<ElastographyMethod, string> = {
  strain: "Strain (компрессионная)",
  shear_wave: "SWE (сдвиговая волна)",
  both: "Комбинированная оценка",
};

export const ORGAN_METHODS: Record<Exclude<ElastographyOrgan, "abdomen_liver">, ElastographyMethod[]> = {
  cervix: ["strain"],
  myometrium: ["shear_wave"],
  ovary: ["strain", "shear_wave", "both"],
  breast: ["strain", "shear_wave", "both"],
};

export const ORGAN_FIELD_DEFINITIONS: Record<
  Exclude<ElastographyOrgan, "abdomen_liver">,
  Partial<Record<ElastographyMethod, WebFieldDefinition[]>>
> = {
  cervix: {
    strain: [
      { key: "internalOsStiffness", label: "Жёсткость внутреннего зева", min: L.stiffness.min, max: L.stiffness.max, step: 0.01 },
      { key: "externalOsStiffness", label: "Жёсткость наружного зева", min: L.stiffness.min, max: L.stiffness.max, step: 0.01 },
      { key: "gestationalWeeks", label: "Срок беременности", unit: "нед", min: L.weeks.min, max: L.weeks.max, step: 1, optional: true },
    ],
  },
  myometrium: {
    shear_wave: [
      { key: "lesionYoungModulusKpa", label: "E образования", unit: "кПа", min: L.kPa.min, max: L.kPa.max, step: 0.1 },
      { key: "referenceMyometriumKpa", label: "E референсного миометрия", unit: "кПа", min: L.kPa.min, max: L.kPa.max, step: 0.1 },
    ],
  },
  ovary: {
    strain: [{ key: "strainRatio", label: "Strain ratio", min: L.strain.min, max: L.strain.max, step: 0.1 }],
    shear_wave: [{ key: "youngModulusKpa", label: "Модуль Юнга (E)", unit: "кПа", min: L.kPa.min, max: L.kPa.max, step: 0.1 }],
    both: [
      { key: "strainRatio", label: "Strain ratio", min: L.strain.min, max: L.strain.max, step: 0.1 },
      { key: "youngModulusKpa", label: "Модуль Юнга (E)", unit: "кПа", min: L.kPa.min, max: L.kPa.max, step: 0.1, optional: true },
    ],
  },
  breast: {
    strain: [
      { key: "tsukubaScore", label: "Оценка Tsukuba", min: L.tsukuba.min, max: L.tsukuba.max, step: 1 },
      { key: "strainRatio", label: "Strain ratio (жир/очаг)", min: L.strain.min, max: L.strain.max, step: 0.1, optional: true },
    ],
    shear_wave: [
      { key: "emaxKpa", label: "Emax", unit: "кПа", min: L.kPa.min, max: L.kPa.max, step: 0.1 },
      { key: "lesionSizeMm", label: "Размер образования", unit: "мм", min: L.sizeMm.min, max: L.sizeMm.max, step: 1, optional: true },
      { key: "lesionDepthMm", label: "Глубина залегания", unit: "мм", min: L.depthMm.min, max: L.depthMm.max, step: 1, optional: true },
    ],
    both: [
      { key: "tsukubaScore", label: "Оценка Tsukuba", min: L.tsukuba.min, max: L.tsukuba.max, step: 1 },
      { key: "strainRatio", label: "Strain ratio", min: L.strain.min, max: L.strain.max, step: 0.1, optional: true },
      { key: "emaxKpa", label: "Emax", unit: "кПа", min: L.kPa.min, max: L.kPa.max, step: 0.1, optional: true },
    ],
  },
};

export const ELASTO_DISCLAIMER =
  "Справочный CDS-отчёт. Не является медицинским диагнозом — интерпретация остаётся за специалистом.";
