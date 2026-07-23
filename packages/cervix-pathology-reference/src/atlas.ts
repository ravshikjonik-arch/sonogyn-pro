/**
 * Атлас эхограмм патологии цервикального канала.
 * Реальные эхограммы отмечены realExampleImage + realExampleCaption.
 */

export const CERVIX_ATLAS_IMAGE_BASE = "/clinical/cervix-atlas";

export type CervixPathologySubtype =
  | "polyp"
  | "nabothian_cyst"
  | "cervical_incompetence"
  | "cervical_fibroid";

export type CervixAtlasEntry = {
  id: string;
  subtype: CervixPathologySubtype;
  titleRu: string;
  hint: string;
  keySignsRu: string[];
  protocolText: string;
  imageSrc: string;
  imageAlt: string;
  /** Реальная эхограмма (jpg/png). Если задано — показывается. */
  realExampleImage?: string;
  /** Описание реального примера. */
  realExampleCaption?: string;
};

export const CERVIX_ATLAS: CervixAtlasEntry[] = [
  {
    id: "cervical_polyp",
    subtype: "polyp",
    titleRu: "Полип цервикального канала",
    hint: "Очаговое образование в цервикальном канале · ICD-10 N84.1",
    keySignsRu: [
      "Гиперэхогенное образование в канале шейки матки",
      "Округлая или овальная форма",
      "Чёткие контуры",
      "Может выявляться сосуд в ножке при ЦДК",
    ],
    protocolText:
      "В цервикальном канале визуализируется образование гиперэхогенной структуры размерами __ мм, с чёткими ровными контурами, на ножке/широком основании. При ЦДК — единичный сосуд в ножке. Рекомендовано: гистероскопия, гистология.",
    imageSrc: `${CERVIX_ATLAS_IMAGE_BASE}/cervical-polyp.jpg`,
    imageAlt: "УЗИ: полип цервикального канала",
    realExampleImage: `${CERVIX_ATLAS_IMAGE_BASE}/cervical-polyp.jpg`,
    realExampleCaption:
      "Реальная эхограмма: полип цервикального канала — очаговое образование в просвете канала шейки матки.",
  },
];

export function getCervixAtlasBySubtype(
  subtype: CervixPathologySubtype | string | undefined,
): CervixAtlasEntry | undefined {
  if (!subtype) return undefined;
  return CERVIX_ATLAS.find((e) => e.subtype === subtype);
}

export function getCervixAtlasById(id: string): CervixAtlasEntry | undefined {
  return CERVIX_ATLAS.find((e) => e.id === id);
}
