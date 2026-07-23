/**
 * Атлас эхограмм патологии эндометрия.
 * Реальные эхограммы отмечены realExampleImage + realExampleCaption.
 */

export const ENDOMETRIUM_ATLAS_IMAGE_BASE = "/clinical/endometrium-atlas";

export type EndometriumPathologySubtype =
  | "polyp"
  | "hyperplasia"
  | "synechiae"
  | "tamoxifen_changes"
  | "endometrial_cancer";

export type EndometriumAtlasEntry = {
  id: string;
  subtype: EndometriumPathologySubtype;
  titleRu: string;
  hint: string;
  keySignsRu: string[];
  protocolText: string;
  imageSrc: string;
  imageAlt: string;
  /** Реальная эхограмма (jpg/png). Если задано — показывается рядом с базовой. */
  realExampleImage?: string;
  /** Описание реального примера (подпись к эхограмме). */
  realExampleCaption?: string;
};

export const ENDOMETRIUM_ATLAS: EndometriumAtlasEntry[] = [
  {
    id: "endometrial_polyp",
    subtype: "polyp",
    titleRu: "Полип эндометрия",
    hint: "Очаговое образование в полости матки · ICD-10 N84.0",
    keySignsRu: [
      "Гиперэхогенное образование в полости",
      "Сосуд в ножке при ЦДК",
      "Отделение от окружающего эндометрия",
      "При СГ: дефект наполнения с чётким контуром",
    ],
    protocolText:
      "В полости матки определяется образование эндометриального типа размерами __ мм, гиперэхогенное, на ножке/широком основании. При ЦДК — единичный сосуд в ножке. Рекомендовано: СПП, гистология.",
    imageSrc: `${ENDOMETRIUM_ATLAS_IMAGE_BASE}/endometrial-polyp.jpg`,
    imageAlt: "УЗИ: полип эндометрия",
    realExampleImage: `${ENDOMETRIUM_ATLAS_IMAGE_BASE}/endometrial-polyp.jpg`,
    realExampleCaption:
      "Реальная эхограмма: полип эндометрия — очаговое образование в полости матки. Слева — B-режим (измерение), справа — ЦДК с кровотоком в ножке образования.",
  },
];

export function getEndometriumAtlasBySubtype(
  subtype: EndometriumPathologySubtype | string | undefined,
): EndometriumAtlasEntry | undefined {
  if (!subtype) return undefined;
  return ENDOMETRIUM_ATLAS.find((e) => e.subtype === subtype);
}

export function getEndometriumAtlasById(id: string): EndometriumAtlasEntry | undefined {
  return ENDOMETRIUM_ATLAS.find((e) => e.id === id);
}
