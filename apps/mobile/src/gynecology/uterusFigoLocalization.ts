import type { FigoType } from "./figoFibroid";

/** Нормализованная точка по холсту схемы (0–1). */
export type UterusNormPoint = { x: number; y: number };

export type UterineTapLocalization = {
  /** Одна строка для протокола (как у МЖ: «Правая МЖ: ВНК…»). */
  narrativeLine: string;
  wallLine: string;
  thirdLine: string;
  figoSubtypeRu: string;
};

const FIGO_SUBTYPE_RU: Record<FigoType, string> = {
  0: "интракавитарный миоматозный узел на ножке",
  1: "субмукозный миоматозный узел (менее половины объёма интрамурально)",
  2: "субмукозный миоматозный узел (не менее половины объёма интрамурально)",
  3: "интрамуральный узел с контактом с эндометрием без выступания в полость",
  4: "интрамуральный узел без контакта с эндометрием и серозой",
  5: "субсерозный миоматозный узел (не менее половины объёма интрамурально)",
  6: "субсерозный миоматозный узел (менее половины объёма интрамурально)",
  7: "субсерозный миоматозный узел на ножке",
  8: "леиомиома иной локализации (включая шеечную)",
};

export function figoSubtypeRu(figoType: FigoType): string {
  return FIGO_SUBTYPE_RU[figoType];
}

/** Треть тела матки по сагиттальной схеме (исключая шейку). */
export function corpusThirdFromPoint(p: UterusNormPoint): string {
  if (p.y > 0.76) return "сегмент не применим (перешеек/шейка на схеме)";
  if (p.y < 0.35) return "верхняя треть тела матки";
  if (p.y < 0.53) return "средняя треть тела матки";
  return "нижняя треть тела матки";
}

/** Стенка / сегмент в сагиттальной плоскости (без «часов», как на УЗИ спереди). */
export function wallSegmentFromPoint(p: UterusNormPoint): string {
  if (p.y > 0.76) return "шейка матки / нижний сегмент";
  if (p.y < 0.28 && p.x > 0.35 && p.x < 0.68) return "дно матки";
  if (p.x < 0.38) return "передняя стенка тела матки";
  if (p.x > 0.62) return "задняя стенка тела матки";
  if (p.x >= 0.38 && p.x <= 0.62 && p.y >= 0.34 && p.y <= 0.62) return "область эндометрия и перегородки (субмукозные типы)";
  return "тело матки (парамётральная проекция на схеме)";
}

export function buildUterineTapLocalization(
  p: UterusNormPoint,
  figoType: number,
  locationWallRu: string
): UterineTapLocalization {
  const ft = figoType as FigoType;
  const thirdLine = corpusThirdFromPoint(p);
  const wallLine = wallSegmentFromPoint(p);
  const figoSubtypeRuLine = figoSubtypeRu(ft);

  const narrativeLine =
    `Матка (схема сагиттально, ориентир секреторный эндометрий): очаг в проекции «${wallLine}», ${thirdLine}. ` +
    `Классификация FIGO leiomyoma subclassification (PALM-COEIN — L): тип ${figoType} — ${figoSubtypeRuLine}. ` +
    `(Уточнение по слою: см. формулировку отношения к полости и серозе в протоколе.)`;

  return {
    narrativeLine,
    wallLine: `${wallLine} · отнесение по стенке (PALM): ${locationWallRu}`,
    thirdLine,
    figoSubtypeRu: figoSubtypeRuLine,
  };
}
