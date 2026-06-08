import type { SliceLesionShape } from "./sliceLesionShape";
import type { SliceStroke } from "./sliceStrokeAnalysis";

/** Тип патологии на срезе / модели матки */
export type PathologyType = "myoma" | "adenomyosis" | "polyp" | "scar" | "other";

export const PATHOLOGY_LABELS_RU: Record<PathologyType, string> = {
  myoma: "Миома",
  adenomyosis: "Аденомиоз",
  polyp: "Полип эндометрия",
  scar: "Рубец / истмоцеле",
  other: "Другое",
};

export type SizeMm = {
  length: number;
  width: number;
  depth: number;
};

export type PathologyAnnotation = {
  id: string;
  type: PathologyType;
  /** Локальные координаты (проекция среза) */
  position: [number, number, number];
  /** Центр узла на сагиттальном срезе 0–1 */
  sliceNorm?: [number, number];
  /** Овал узла (legacy) */
  sliceShape?: SliceLesionShape;
  /** Контур, нарисованный врачом */
  sliceStroke?: SliceStroke;
  sizeMm: SizeMm;
  comment?: string;
  /** Для миомы: на ножке */
  pedunculated?: boolean;
  /** Расчётный или ручной FIGO (0–8) */
  figoType?: number;
  figoOverride?: number | null;
  localizationRu?: string;
  layerLabelRu?: string;
};

export function defaultPathologyAnnotation(
  type: PathologyType,
  at?: [number, number, number],
  sliceNorm?: [number, number],
): PathologyAnnotation {
  return {
    id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    position: at ?? [0.05, 0.2, 0.55],
    sliceNorm,
    sizeMm: { length: 20, width: 18, depth: 16 },
    pedunculated: false,
    figoOverride: null,
  };
}

export const DEFAULT_MODEL_SCALE = 1;
export const MODEL_SCALE_MIN = 0.65;
export const MODEL_SCALE_MAX = 1.45;
