/**
 * BI-RADS US — цветовое кодирование для 3D-очагов.
 * ACR BI-RADS Ultrasound (2013, 2023 update).
 */

export type BiradsCategory = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const BIRADS_LABELS_RU: Record<BiradsCategory, string> = {
  0: "BI-RADS 0 — нужны доп. исследования",
  1: "BI-RADS 1 — без находок",
  2: "BI-RADS 2 — доброкачественно",
  3: "BI-RADS 3 — вероятно доброкачественно",
  4: "BI-RADS 4 — подозрительно",
  5: "BI-RADS 5 — высокая вероятность злокачественности",
  6: "BI-RADS 6 — верифицированная ЗНО",
};

export const BIRADS_COLORS: Record<BiradsCategory, string> = {
  0: "#9E9E9E",
  1: "#4CAF50",
  2: "#8BC34A",
  3: "#FFC107",
  4: "#FF9800",
  5: "#F44336",
  6: "#B71C1C",
};

export function getBiradsColor(category: BiradsCategory): string {
  return BIRADS_COLORS[category];
}

export const BREAST_QUADRANT_LABELS_RU = {
  upper_outer: "верхне-наружный",
  upper_inner: "верхне-внутренний",
  lower_outer: "нижне-наружный",
  lower_inner: "нижне-внутренний",
  retroareolar: "подсосочная зона",
} as const;
