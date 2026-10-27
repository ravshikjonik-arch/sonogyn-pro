import type { Vector3 } from "three";
import { classifyFigo } from "@repo/myoma-education/calc";
import { CERVIX_Y_MAX, cylindricalR, radialDepth01 } from "./profile";

export type AnatomyLayerId = "endometrium" | "junctional_zone" | "myometrium" | "subserosa" | "serosa" | "cervix";

export const ANATOMY_LAYER_LABEL_RU: Record<AnatomyLayerId, string> = {
  endometrium: "Эндометрий",
  junctional_zone: "Переходная зона (JZ)",
  myometrium: "Миометрий",
  subserosa: "Подсерозный слой",
  serosa: "Сероза",
  cervix: "Шейка матки",
};

export type UterusHitResult = {
  figoType: number;
  layerId: AnatomyLayerId;
  layerLabelRu: string;
  depth01: number;
  tooltipEn: string;
  tooltipRu: string;
  /** Образовательная группа по запросу ТЗ */
  bucketRu: "Субмукозная" | "Интрамуральная" | "Субсерозная" | "Иная";
};

function layerFromDepth(depth01: number, y: number): { id: AnatomyLayerId; ru: string } {
  if (y < CERVIX_Y_MAX) return { id: "cervix", ru: ANATOMY_LAYER_LABEL_RU.cervix };
  if (depth01 < 0.1) return { id: "endometrium", ru: ANATOMY_LAYER_LABEL_RU.endometrium };
  if (depth01 < 0.22) return { id: "junctional_zone", ru: ANATOMY_LAYER_LABEL_RU.junctional_zone };
  if (depth01 < 0.72) return { id: "myometrium", ru: ANATOMY_LAYER_LABEL_RU.myometrium };
  if (depth01 < 0.9) return { id: "subserosa", ru: ANATOMY_LAYER_LABEL_RU.subserosa };
  return { id: "serosa", ru: ANATOMY_LAYER_LABEL_RU.serosa };
}

const SUBMUCOSAL_BAND = 0.12;
const ENDOMETRIAL_CONTACT_BAND = 0.28;
const INTRAMURAL_BAND = 0.58;
/** На этой глубине схемы субсерозный узел имеет ровно 50% интрамурального компонента. */
const SUBSEROSAL_FIFTY_DEPTH = 0.82;

/** Схематическая доля интрамурального компонента от среднего диаметра, не измерение. */
export function schematicIntramuralPercent(depth01: number): number {
  if (depth01 < SUBMUCOSAL_BAND) return (depth01 / SUBMUCOSAL_BAND) * 100;
  if (depth01 < INTRAMURAL_BAND) return 100;
  if (depth01 <= SUBSEROSAL_FIFTY_DEPTH) {
    const t = (depth01 - INTRAMURAL_BAND) / (SUBSEROSAL_FIFTY_DEPTH - INTRAMURAL_BAND);
    return 100 - t * 50;
  }
  const t = (depth01 - SUBSEROSAL_FIFTY_DEPTH) / (1 - SUBSEROSAL_FIFTY_DEPTH);
  return Math.max(0, 50 * (1 - t));
}

function figoFromDepth(depth01: number, y: number, pedunculated: boolean): number {
  if (y < CERVIX_Y_MAX) return Number(classifyFigo({ location: "other" }).figo);
  if (depth01 < SUBMUCOSAL_BAND) {
    if (pedunculated && depth01 < 0.04) {
      return Number(classifyFigo({ location: "intracavitary", pedunculated: true }).figo);
    }
    return Number(
      classifyFigo({
        location: "submucosal",
        intramuralPercent: Math.round(schematicIntramuralPercent(depth01) * 10) / 10,
      }).figo,
    );
  }
  if (depth01 < ENDOMETRIAL_CONTACT_BAND) {
    return Number(classifyFigo({ location: "intramural", contactsEndometrium: true }).figo);
  }
  if (depth01 < INTRAMURAL_BAND) {
    return Number(classifyFigo({ location: "intramural", contactsEndometrium: false }).figo);
  }
  if (pedunculated && depth01 > 0.88) {
    return Number(classifyFigo({ location: "subserosal", pedunculated: true }).figo);
  }
  return Number(
    classifyFigo({
      location: "subserosal",
      intramuralPercent: Math.round(schematicIntramuralPercent(depth01) * 10) / 10,
    }).figo,
  );
}

/** 0–2 субмукозные, 3–4 интрамуральные, 5–7 субсерозные. Тип 5 не интрамуральный. */
export function figoEducationalBucket(figo: number): UterusHitResult["bucketRu"] {
  if (figo === 8) return "Иная";
  if (figo <= 2) return "Субмукозная";
  if (figo <= 4) return "Интрамуральная";
  return "Субсерозная";
}

const FIGO_LABEL_EN: Record<number, string> = {
  0: "FIGO 0 — pedunculated submucosal (intracavitary)",
  1: "FIGO 1 — submucosal, <50% intramural component",
  2: "FIGO 2 — submucosal, ≥50% intramural component",
  3: "FIGO 3 — contacts endometrium, 100% intramural",
  4: "FIGO 4 — intramural, no endometrium/serosa contact",
  5: "FIGO 5 — subserosal, ≥50% intramural component",
  6: "FIGO 6 — subserosal, <50% intramural component",
  7: "FIGO 7 — pedunculated subserosal",
  8: "FIGO 8 — other (including cervical)",
};

const FIGO_LABEL_RU: Record<number, string> = {
  0: "FIGO 0 — субмукозный на ножке (интракавитарно)",
  1: "FIGO 1 — субмукозный, интрамуральный компонент <50% среднего диаметра",
  2: "FIGO 2 — субмукозный, интрамуральный компонент ≥50% среднего диаметра",
  3: "FIGO 3 — интрамуральный, контакт с эндометрием, без выступания в полость",
  4: "FIGO 4 — интрамуральный, окружён миометрием",
  5: "FIGO 5 — субсерозный, интрамуральный компонент ≥50% среднего диаметра",
  6: "FIGO 6 — субсерозный, интрамуральный компонент <50% среднего диаметра",
  7: "FIGO 7 — субсерозный на ножке",
  8: "FIGO 8 — иная локализация (включая шеечную)",
};

export function buildUterusHitFromParts(input: {
  figoType: number;
  layerId: AnatomyLayerId;
  layerLabelRu: string;
  depth01: number;
  note?: string;
}): UterusHitResult {
  const { figoType, layerId, layerLabelRu, depth01, note } = input;
  const noteSeg = note ? ` · ${note}` : "";
  const figoEn = FIGO_LABEL_EN[figoType] ?? `FIGO ${figoType}`;
  const figoRu = FIGO_LABEL_RU[figoType] ?? `FIGO ${figoType}`;
  return {
    figoType,
    layerId,
    layerLabelRu,
    depth01,
    tooltipEn: `${figoEn} · ${layerLabelRu}${noteSeg} · depth≈${(depth01 * 100).toFixed(0)}%`,
    tooltipRu: `${figoRu} · ${layerLabelRu}${noteSeg}. Схема расположения, не измерение.`,
    bucketRu: figoEducationalBucket(figoType),
  };
}

export function analyzeUterusHit(worldPoint: Vector3, pedunculated: boolean): UterusHitResult {
  const y = worldPoint.y;
  const r = cylindricalR(worldPoint.x, worldPoint.z);
  const depth01 = radialDepth01(r, y);
  const layer = layerFromDepth(depth01, y);
  const figo = figoFromDepth(depth01, y, pedunculated);
  return buildUterusHitFromParts({
    figoType: figo,
    layerId: layer.id,
    layerLabelRu: layer.ru,
    depth01,
  });
}
