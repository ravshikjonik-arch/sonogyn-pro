import type { OradsCategoryNumber, OradsColorCode, OradsTreeResult } from "./types";

/** ACR O-RADS US v2022 Table 2 — risk of malignancy (ROM) ranges. */
export const ORADS_ROM_BY_CATEGORY: Record<OradsCategoryNumber, string> = {
  0: "N/A",
  1: "Normal / no ROM stratification",
  2: "<1%",
  3: "1–<10%",
  4: "10–<50%",
  5: "≥50%",
};

export const ORADS_COLOR_BY_CATEGORY: Record<OradsCategoryNumber, OradsColorCode> = {
  0: "slate",
  1: "sky",
  2: "emerald",
  3: "amber",
  4: "orange",
  5: "red",
};

const CATEGORY_LABEL: Record<OradsCategoryNumber, OradsTreeResult["category"]> = {
  0: "O-RADS 0",
  1: "O-RADS 1",
  2: "O-RADS 2",
  3: "O-RADS 3",
  4: "O-RADS 4",
  5: "O-RADS 5",
};

/** Build a terminal tree result (text via i18n keys). */
export function oradsResult(
  categoryNumber: OradsCategoryNumber,
  managementKey: string,
  rationaleKey?: string,
  riskPercent?: string,
): OradsTreeResult {
  return {
    category: CATEGORY_LABEL[categoryNumber],
    categoryNumber,
    riskPercent: riskPercent ?? ORADS_ROM_BY_CATEGORY[categoryNumber],
    managementKey,
    colorCode: ORADS_COLOR_BY_CATEGORY[categoryNumber],
    rationaleKey,
  };
}
