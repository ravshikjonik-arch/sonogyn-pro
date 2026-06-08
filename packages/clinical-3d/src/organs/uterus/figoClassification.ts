/**
 * FIGO Classification of Uterine Fibroids (PALM-COEIN).
 * Munro et al., FIGO Menstrual Disorders Committee, 2011; обновление 2018.
 * @see https://www.figo.org/news/new-classification-system-of-uterine-fibroids
 */

import type { FigoType, FibroidAnnotation } from "../../types";

export type { FigoType };

export interface FigoPosition {
  description: string;
  /** Позиция на 2D-схеме (нормированные 0–1). */
  iconPosition: { x: number; y: number };
}

export const FIGO_TYPES: Record<FigoType, FigoPosition> = {
  "0": {
    description: "Субмукозная на ножке, полностью в полости",
    iconPosition: { x: 0.5, y: 0.15 },
  },
  "1": {
    description: "Субмукозная, <50% в миометрии",
    iconPosition: { x: 0.5, y: 0.25 },
  },
  "2": {
    description: "Субмукозная, ≥50% в миометрии",
    iconPosition: { x: 0.5, y: 0.35 },
  },
  "3": {
    description: "Интрамуральная, контактирует с эндометрием",
    iconPosition: { x: 0.5, y: 0.45 },
  },
  "4": {
    description: "Интрамуральная, полностью в толще миометрия",
    iconPosition: { x: 0.5, y: 0.55 },
  },
  "5": {
    description: "Субсерозная, ≥50% интрамурально",
    iconPosition: { x: 0.5, y: 0.65 },
  },
  "6": {
    description: "Субсерозная, <50% интрамурально",
    iconPosition: { x: 0.5, y: 0.75 },
  },
  "7": {
    description: "Субсерозная на ножке",
    iconPosition: { x: 0.5, y: 0.85 },
  },
  "8": {
    description: "Атипичная локализация (шейка, связка)",
    iconPosition: { x: 0.5, y: 0.95 },
  },
};

/** Цвет по близости к полости матки (образовательная легенда). */
export function getFigoColor(type: FigoType): string {
  if (["0", "1", "2"].includes(type)) return "#FF5252";
  if (["3", "4"].includes(type)) return "#FF9800";
  if (["5", "6", "7"].includes(type)) return "#4CAF50";
  return "#9C27B0";
}

export function isCavityDeformed(fibroids: FibroidAnnotation[]): boolean {
  return fibroids.some((f) => ["0", "1", "2", "3"].includes(f.metadata.figoType));
}

export function getEndometrialCavityStatus(
  fibroids: FibroidAnnotation[],
): "normal" | "compressed" | "deformed" | "obliterated" {
  const submucosal = fibroids.filter((f) => ["0", "1", "2"].includes(f.metadata.figoType));
  if (submucosal.length === 0) return "normal";
  const maxDiameter = Math.max(...submucosal.map((f) => f.metadata.longestDiameter));
  if (maxDiameter < 20) return "compressed";
  if (maxDiameter < 50) return "deformed";
  return "obliterated";
}
