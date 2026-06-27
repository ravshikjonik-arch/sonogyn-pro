/** Public web path prefix (apps/web/public/clinical/orads-nosology). */
export const ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE = "/clinical/orads-nosology";

export type OradsNosologySubtype =
  | "simple_cyst"
  | "hemorrhagic"
  | "endometrioma"
  | "dermoid"
  | "paraovarian"
  | "peritoneal_inclusion"
  | "hydrosalpinx";

export type OradsNosologyAtlasEntry = {
  id: string;
  subtype: OradsNosologySubtype;
  titleRu: string;
  oradsHint: string;
  protocolText: string;
  /** Relative public URL; mobile resolves via web API base. */
  imageSrc: string;
  imageAlt: string;
};

/** Подтипы без эхограммы — добавить в ORADS_NOSOLOGY_ATLAS, когда будут материалы. */
export const ORADS_NOSOLOGY_PENDING_SUBTYPES: OradsNosologySubtype[] = [
  "dermoid",
  "peritoneal_inclusion",
  "hydrosalpinx",
];

/** Учебные эхограммы + готовые формулировки для протокола (O-RADS 2, типичные кисты). */
export const ORADS_NOSOLOGY_ATLAS: OradsNosologyAtlasEntry[] = [
  {
    id: "functional_cyst",
    subtype: "simple_cyst",
    titleRu: "Функциональная киста",
    oradsHint: "O-RADS 2 · простая / функциональная киста",
    protocolText:
      "Функциональная киста. В проекции яичника визуализируется анэхогенное округлое образование с анэхогенным внутренним содержимым без включений размерами 30×30 мм при ЦДК 0. Корковый слой яичника не прослеживается, фолликулы не визуализируются.",
    imageSrc: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/functional-cyst.png`,
    imageAlt: "УЗИ: простая функциональная киста яичника",
  },
  {
    id: "hemorrhagic_cyst",
    subtype: "hemorrhagic",
    titleRu: "Геморрагическая киста",
    oradsHint: "O-RADS 2 · типичная геморрагическая киста",
    protocolText:
      "Геморрагическая киста. В проекции яичника визуализируется округлое образование с неоднородной внутренней структурой в виде фибринового сгустка, размерами 32×30 мм. Корковый слой яичника не прослеживается, фолликулы не визуализируются. Гематоперитонеум?",
    imageSrc: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/hemorrhagic-cyst.png`,
    imageAlt: "УЗИ: геморрагическая киста яичника с сетчатым рисунком",
  },
  {
    id: "endometrioid_cyst",
    subtype: "endometrioma",
    titleRu: "Эндометриоидная («шоколадная») киста",
    oradsHint: "O-RADS 2 · эндометриома · «матовое стекло»",
    protocolText:
      "Эндометриоидная киста. В проекции яичника локализуется округлое образование с густым неоднородным внутренним содержимым — мелкодисперсная взвесь, «симптом матового стекла», размерами 37×31 мм; при ЦДК — слабый фрагментарный сигнал. Корковый слой яичника не прослеживается, фолликулы не визуализируются.",
    imageSrc: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/endometrioid-cyst.png`,
    imageAlt: "УЗИ: эндометриоидная киста яичника",
  },
  {
    id: "paraovarian_cyst",
    subtype: "paraovarian",
    titleRu: "Параовариальная киста",
    oradsHint: "O-RADS 2 · внеяичниковая локализация",
    protocolText:
      "Параовариальная киста. Однокамерное анэхогенное тонкостенное образование без пристеночных включений; внутреннее содержимое однородное, без перегородок, солидных компонентов и папиллярных разрастаний.",
    imageSrc: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/paraovarian-cyst.png`,
    imageAlt: "УЗИ: параовариальная киста рядом с яичником",
  },
];

export function getOradsNosologyBySubtype(
  subtype: OradsNosologySubtype | string | undefined,
): OradsNosologyAtlasEntry | undefined {
  if (!subtype) return undefined;
  return ORADS_NOSOLOGY_ATLAS.find((e) => e.subtype === subtype);
}

export function getOradsNosologyById(id: string): OradsNosologyAtlasEntry | undefined {
  return ORADS_NOSOLOGY_ATLAS.find((e) => e.id === id);
}

export function isOradsNosologyPending(subtype: string | undefined): boolean {
  if (!subtype) return false;
  return ORADS_NOSOLOGY_PENDING_SUBTYPES.includes(subtype as OradsNosologySubtype);
}

export function resolveOradsNosologyImageUri(imageSrc: string, webApiBase: string): string {
  const base = webApiBase.replace(/\/$/, "");
  return `${base}${imageSrc.startsWith("/") ? imageSrc : `/${imageSrc}`}`;
}
