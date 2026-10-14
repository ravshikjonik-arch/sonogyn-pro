import { getReferatImagePath } from "./referatImageMap";
import {
  ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE,
  type OradsNosologySubtype,
} from "./nosologyAtlas";

export type OradsPhotoCategoryId = 0 | 1 | 2 | 3 | 4 | 5;

export type OradsAcrDescriptorGroup = "assessment" | "classic-benign";

export type OradsCategoryPhotoCard = {
  id: string;
  category: OradsPhotoCategoryId;
  titleRu: string;
  /** Как в таблице ACR Assessment Categories / Classic Benign. */
  acrLabelEn: string;
  imageSrc?: string;
  imageAlt: string;
  keySignsRu: string[];
  sizeNoteRu?: string;
  managementRu?: string;
  group: OradsAcrDescriptorGroup;
  subtype?: OradsNosologySubtype;
  disclaimerRu: string;
};

export type OradsAcrCategoryMeta = {
  id: OradsPhotoCategoryId;
  titleRu: string;
  titleEn: string;
  rom: string;
  riskRu: string;
  managementRu: string;
  tone: "slate" | "sky" | "emerald" | "amber" | "orange" | "red";
};

export const ORADS_PHOTO_CARD_DISCLAIMER_RU =
  "Учебный пример по лексикону ACR O-RADS US v2022. Сверьте с монитором. Не диагноз — интерпретация специалиста.";

export const ORADS_ACR_CATEGORY_META: Record<OradsPhotoCategoryId, OradsAcrCategoryMeta> = {
  0: {
    id: 0,
    titleRu: "Неполная оценка",
    titleEn: "Incomplete Evaluation",
    rom: "N/A",
    riskRu: "Признаки нельзя охарактеризовать из‑за техники",
    managementRu: "Повторное УЗИ или МРТ.",
    tone: "slate",
  },
  1: {
    id: 1,
    titleRu: "Нормальный яичник",
    titleEn: "Normal Ovary",
    rom: "0%",
    riskRu: "Физиология, без образования",
    managementRu: "Наблюдение не требуется.",
    tone: "sky",
  },
  2: {
    id: 2,
    titleRu: "Почти наверняка доброкачественное",
    titleEn: "Almost Certainly Benign",
    rom: "<1%",
    riskRu: "Simple cyst, typical classic benign, типичное экстраовариальное",
    managementRu: "По таблице Classic Benign: размер и менопауза. Клиника — гинеколог по показаниям.",
    tone: "emerald",
  },
  3: {
    id: 3,
    titleRu: "Низкий риск",
    titleEn: "Low Risk",
    rom: "1–<10%",
    riskRu: "Неровная однокамерная; многокамерная гладкая <10 см CS <4; солидное гладкое CS 1",
    managementRu: "Если не удаляют — УЗИ в пределах 6 мес. При солидном — УЗИ-эксперт или МРТ (O-RADS MRI). Клиника — гинеколог.",
    tone: "amber",
  },
  4: {
    id: 4,
    titleRu: "Промежуточный риск",
    titleEn: "Intermediate Risk",
    rom: "10–<50%",
    riskRu: "1–3 папилляры / солидный компонент; многокамерное с солидным CS 1–2; солидное гладкое CS 2–3 без тени",
    managementRu: "УЗИ-эксперт, МРТ (O-RADS MRI) или протокол онкогинеколога. Клиника — гинеколог ± онкогинеколог.",
    tone: "orange",
  },
  5: {
    id: 5,
    titleRu: "Высокий риск",
    titleEn: "High Risk",
    rom: "≥50%",
    riskRu: "≥4 папилляры; солидное неровное; CS 4; асцит / перитонеальные узлы",
    managementRu: "Визуализация и клиника — по протоколу онкогинеколога.",
    tone: "red",
  },
};

export function parseOradsCategoryFromHint(hint: string): OradsPhotoCategoryId | null {
  const match = hint.match(/O-RADS\s*([0-5])/i);
  if (!match) return null;
  return Number(match[1]) as OradsPhotoCategoryId;
}

function nosology(file: string): string {
  return `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/${file}`;
}

function card(partial: Omit<OradsCategoryPhotoCard, "disclaimerRu">): OradsCategoryPhotoCard {
  return { ...partial, disclaimerRu: ORADS_PHOTO_CARD_DISCLAIMER_RU };
}

/** Дескрипторы как в приложении / PDF ACR O-RADS US v2022 Assessment Categories + Classic Benign. */
const ACR_CARDS: Record<OradsPhotoCategoryId, OradsCategoryPhotoCard[]> = {
  0: [
    card({
      id: "acr:0-incomplete",
      category: 0,
      titleRu: "Технически неадекватно",
      acrLabelEn: "Incomplete evaluation",
      imageAlt: "O-RADS 0 — неполная оценка",
      keySignsRu: [
        "Признаки для стратификации риска нельзя точно охарактеризовать",
        "Размер, неполная визуализация или нет ЦДК",
      ],
      managementRu: "Повторное УЗИ или МРТ.",
      group: "assessment",
    }),
  ],
  1: [
    card({
      id: "acr:1-no-lesion",
      category: 1,
      titleRu: "Нет образования яичника",
      acrLabelEn: "No ovarian lesion",
      imageSrc: getReferatImagePath("atlas/physiologic"),
      imageAlt: "Нормальный яичник без focal образования",
      keySignsRu: ["Нет lesion", "Физиологический рисунок яичника"],
      managementRu: "Наблюдение не требуется.",
      group: "assessment",
    }),
    card({
      id: "acr:1-follicle",
      category: 1,
      titleRu: "Фолликул ≤3 см",
      acrLabelEn: "Follicle ≤3 cm",
      imageSrc: getReferatImagePath("atlas/physiologic"),
      imageAlt: "Физиологический фолликул",
      keySignsRu: ["Simple cyst", "Пременопауза", "≤3 см"],
      sizeNoteRu: "≤3 см",
      managementRu: "Наблюдение не требуется.",
      group: "assessment",
    }),
    card({
      id: "acr:1-corpus-luteum",
      category: 1,
      titleRu: "Жёлтое тело (обычно ≤3 см)",
      acrLabelEn: "Corpus luteum, typically ≤3 cm",
      imageSrc: getReferatImagePath("atlas/physiologic"),
      imageAlt: "Жёлтое тело",
      keySignsRu: ["Толстая стенка", "Периферический кровоток", "Обычно ≤3 см"],
      sizeNoteRu: "обычно ≤3 см",
      managementRu: "Наблюдение не требуется.",
      group: "assessment",
    }),
  ],
  2: [
    card({
      id: "acr:2-simple-cyst",
      category: 2,
      titleRu: "Простая киста",
      acrLabelEn: "Simple cyst",
      imageSrc: nosology("functional-cyst-real.jpg"),
      imageAlt: "Простая однокамерная анэхогенная киста",
      keySignsRu: ["Однокамерная", "Анэхогенная", "Гладкая стенка", "Без солидного компонента"],
      sizeNoteRu: "Пре: >3–<10 см; пост: ≤5 см — O-RADS 2 (см. таблицу размера)",
      managementRu: "По размеру и менопаузе: без наблюдения или УЗИ через 12 мес.",
      subtype: "simple_cyst",
      group: "assessment",
    }),
    card({
      id: "acr:2-nonsimple-smooth",
      category: 2,
      titleRu: "Однокамерная гладкая, не simple",
      acrLabelEn: "Unilocular, smooth, non-simple cyst",
      imageSrc: getReferatImagePath("atlas/simple_cyst"),
      imageAlt: "Non-simple unilocular cyst",
      keySignsRu: ["Внутренние эхосигналы и/или неполная септация", "Гладкая стенка", "Без солидного компонента"],
      sizeNoteRu: ">3 но <10 см — контроль УЗИ через 6 мес. (ACR)",
      group: "assessment",
    }),
    card({
      id: "acr:2-bilocular",
      category: 2,
      titleRu: "Двухкамерная гладкая киста",
      acrLabelEn: "Bilocular, smooth cyst",
      imageSrc: getReferatImagePath("atlas/irregular_wall"),
      imageAlt: "Bilocular smooth cyst",
      keySignsRu: ["2 камеры", "Гладкие стенки", "Без солидного компонента", "v2022: ниже риск, чем multilocular"],
      group: "assessment",
    }),
    card({
      id: "acr:2-hemorrhagic",
      category: 2,
      titleRu: "Типичная геморрагическая киста",
      acrLabelEn: "Typical hemorrhagic cyst",
      imageSrc: nosology("hemorrhagic-cyst-real.jpg"),
      imageAlt: "Типичная геморрагическая киста",
      keySignsRu: [
        "Однокамерная, без внутреннего кровотока",
        "Ретикулярный рисунок (фибрин) или ретрактильный сгусток",
      ],
      sizeNoteRu: "<10 см",
      managementRu: "Пре ≤5 см — без УЗИ; >5–<10 см — УЗИ через 2–3 мес. Постменопауза поздняя — не типична, пересчитать по другим дескрипторам.",
      subtype: "hemorrhagic",
      group: "classic-benign",
    }),
    card({
      id: "acr:2-dermoid",
      category: 2,
      titleRu: "Типичный дермоид",
      acrLabelEn: "Typical dermoid cyst",
      imageSrc: nosology("dermoid-cyst-real.jpg"),
      imageAlt: "Типичная зрелая кистозная тератома",
      keySignsRu: [
        "≤3 камеры, без внутреннего кровотока",
        "Гиперэхогенный компонент ± тень, линии/точки или плавающие сферы",
      ],
      sizeNoteRu: "<10 см",
      managementRu: "≤3 см — можно УЗИ через 12 мес.; >3–<10 см — если не удаляют, УЗИ через 12 мес.",
      subtype: "dermoid",
      group: "classic-benign",
    }),
    card({
      id: "acr:2-endometrioma",
      category: 2,
      titleRu: "Типичная эндометриома",
      acrLabelEn: "Typical endometrioma",
      imageSrc: nosology("endometrioid-cyst-real.jpg"),
      imageAlt: "Типичная эндометриома, ground glass",
      keySignsRu: [
        "≤3 камеры, без внутреннего кровотока",
        "Однородные low-level / ground glass echoes",
        "Гладкие стенки ± punctate foci в стенке",
      ],
      sizeNoteRu: "<10 см",
      managementRu: "Пре: если не удаляют — УЗИ через 12 мес. Пост: сначала подтвердить (УЗИ 2–3 мес / эксперт / МРТ).",
      subtype: "endometrioma",
      group: "classic-benign",
    }),
    card({
      id: "acr:2-paraovarian",
      category: 2,
      titleRu: "Типичная параовариальная киста",
      acrLabelEn: "Typical paraovarian cyst",
      imageSrc: nosology("paraovarian-cyst.jpg"),
      imageAlt: "Параовариальная киста отдельно от яичника",
      keySignsRu: ["Простая киста отдельно от яичника", "Любой размер"],
      managementRu: "УЗИ-контроль не требуется. Клиника — гинеколог по показаниям.",
      subtype: "paraovarian",
      group: "classic-benign",
    }),
    card({
      id: "acr:2-hydrosalpinx",
      category: 2,
      titleRu: "Типичный гидросальпинкс",
      acrLabelEn: "Typical hydrosalpinx",
      imageSrc: nosology("hydrosalpinx.jpg"),
      imageAlt: "Типичный гидросальпинкс",
      keySignsRu: [
        "Анэхогенная тубулярная структура",
        "± неполные септы (складки)",
        "± эндосальпингеальные складки",
      ],
      managementRu: "УЗИ-контроль не требуется. Клиника — гинеколог по показаниям.",
      subtype: "hydrosalpinx",
      group: "classic-benign",
    }),
    card({
      id: "acr:2-peritoneal-inclusion",
      category: 2,
      titleRu: "Типичная перитонеальная инклюзионная киста",
      acrLabelEn: "Typical peritoneal inclusion cyst",
      imageAlt: "Перитонеальная инклюзионная киста",
      keySignsRu: [
        "Жидкость, яичник по краю или «подвешен» внутри",
        "Контур повторяет соседние органы",
        "± септы (спайки)",
      ],
      managementRu: "УЗИ-контроль не требуется.",
      subtype: "peritoneal_inclusion",
      group: "classic-benign",
    }),
  ],
  3: [
    card({
      id: "acr:3-classic-ge-10",
      category: 3,
      titleRu: "Typical benign / гладкая киста ≥10 см",
      acrLabelEn: "Typical benign ovarian or uni-/bilocular smooth cyst ≥10 cm",
      imageSrc: nosology("dermoid-cyst.jpg"),
      imageAlt: "Classic benign крупнее 10 см",
      keySignsRu: ["Типичный classic benign или гладкая uni-/bilocular киста", "Наибольший диаметр ≥10 см"],
      sizeNoteRu: "≥10 см",
      managementRu: "Если не удаляют — УЗИ в пределах 6 мес.",
      group: "assessment",
    }),
    card({
      id: "acr:3-unilocular-irregular",
      category: 3,
      titleRu: "Однокамерная, неровная внутренняя стенка",
      acrLabelEn: "Unilocular cyst, irregular, any size",
      imageSrc: getReferatImagePath("atlas/irregular_wall"),
      imageAlt: "Неровная внутренняя стенка <3 мм",
      keySignsRu: ["Любой размер", "Irregular inner wall = высота <3 мм (не папилляра)"],
      managementRu: "Если не удаляют — УЗИ в пределах 6 мес.",
      group: "assessment",
    }),
    card({
      id: "acr:3-multilocular-smooth",
      category: 3,
      titleRu: "Многокамерная гладкая <10 см, CS <4",
      acrLabelEn: "Multilocular cyst, smooth, <10 cm, CS <4",
      imageSrc: getReferatImagePath("atlas/irregular_wall"),
      imageAlt: "Многокамерная гладкая киста",
      keySignsRu: ["≥3 камеры", "Гладкие стенки/септы", "<10 см", "Цветовой балл 1–3"],
      sizeNoteRu: "<10 см",
      managementRu: "Если не удаляют — УЗИ в пределах 6 мес.",
      group: "assessment",
    }),
    card({
      id: "acr:3-solid-cs1",
      category: 3,
      titleRu: "Солидное гладкое, CS 1 (± тень)",
      acrLabelEn: "Solid lesion, smooth, CS = 1",
      imageSrc: getReferatImagePath("atlas/solid_dominant"),
      imageAlt: "Солидное гладкое образование без кровотока",
      keySignsRu: ["≥80% солидной ткани", "Гладкий наружный контур", "CS 1 (нет кровотока)"],
      managementRu: "Рассмотреть УЗИ-эксперта или МРТ (O-RADS MRI). Клиника — гинеколог.",
      group: "assessment",
    }),
  ],
  4: [
    card({
      id: "acr:4-unilocular-pp-lt4",
      category: 4,
      titleRu: "Однокамерная: <4 папилляры или солидный компонент",
      acrLabelEn: "Unilocular cyst with <4 PPs or solid component(s)",
      imageSrc: getReferatImagePath("atlas/irregular_wall"),
      imageAlt: "Однокамерная киста с солидным компонентом / папиллярами 1–3",
      keySignsRu: [
        "1–3 папилляры (≥3 мм, жидкость с 3 сторон) или солидный компонент, не являющийся PP",
        "Любой размер",
      ],
      managementRu: "УЗИ-эксперт, МРТ или протокол онкогинеколога.",
      group: "assessment",
    }),
    card({
      id: "acr:4-multilocular-cs4-or-large",
      category: 4,
      titleRu: "Многокамерная без солидного: ≥10 см, CS 4 или неровная",
      acrLabelEn: "Multilocular cyst without solid: ≥10 cm, CS 4, or irregular",
      imageSrc: getReferatImagePath("atlas/irregular_wall"),
      imageAlt: "Многокамерная киста промежуточного риска",
      keySignsRu: ["Без солидного компонента", "Гладкая ≥10 см и CS <4, или любой размер при CS 4, или irregular"],
      managementRu: "УЗИ-эксперт, МРТ или протокол онкогинеколога.",
      group: "assessment",
    }),
    card({
      id: "acr:4-multilocular-solid-cs12",
      category: 4,
      titleRu: "Двух-/многокамерная с солидным, CS 1–2",
      acrLabelEn: "Bi- or multilocular cyst with solid component(s), CS 1–2",
      imageSrc: getReferatImagePath("atlas/solid_dominant"),
      imageAlt: "Многокамерная киста с солидным компонентом, низкий color score",
      keySignsRu: ["Солидный компонент ≥3 мм", "CS 1–2", "Любой размер"],
      managementRu: "УЗИ-эксперт, МРТ или протокол онкогинеколога.",
      group: "assessment",
    }),
    card({
      id: "acr:4-solid-smooth-cs23",
      category: 4,
      titleRu: "Солидное гладкое без тени, CS 2–3",
      acrLabelEn: "Solid lesion, non-shadowing, smooth, CS 2–3",
      imageSrc: getReferatImagePath("atlas/solid_dominant"),
      imageAlt: "Солидное гладкое образование, умеренный кровоток",
      keySignsRu: ["Гладкий контур", "Нет широкой акустической тени", "CS 2 или 3"],
      managementRu: "УЗИ-эксперт, МРТ или протокол онкогинеколога.",
      group: "assessment",
    }),
  ],
  5: [
    card({
      id: "acr:5-unilocular-pp4",
      category: 5,
      titleRu: "Однокамерная, ≥4 папилляры",
      acrLabelEn: "Unilocular cyst, ≥4 papillary projections",
      imageSrc: getReferatImagePath("atlas/papillary_4plus"),
      imageAlt: "Четыре и более папиллярных проекций",
      keySignsRu: ["≥4 PP", "Любой размер", "Любой CS"],
      managementRu: "По протоколу онкогинеколога.",
      group: "assessment",
    }),
    card({
      id: "acr:5-multilocular-solid-cs34",
      category: 5,
      titleRu: "Двух-/многокамерная с солидным, CS 3–4",
      acrLabelEn: "Bi- or multilocular cyst with solid component(s), CS 3–4",
      imageSrc: nosology("orads5-ovarian-cancer-1.jpg"),
      imageAlt: "Сложное кистозно-солидное образование с выраженным кровотоком",
      keySignsRu: ["Солидный компонент", "CS 3 или 4", "Любой размер"],
      managementRu: "По протоколу онкогинеколога.",
      group: "assessment",
    }),
    card({
      id: "acr:5-solid-cs4-or-irregular",
      category: 5,
      titleRu: "Солидное: CS 4 или неровный контур",
      acrLabelEn: "Solid smooth CS 4, or solid irregular any CS",
      imageSrc: nosology("orads5-ovarian-cancer-2.jpg"),
      imageAlt: "Солидное образование высокого риска",
      keySignsRu: ["Гладкое + CS 4 или irregular любой CS", "± тень не снижает категорию при irregular"],
      managementRu: "По протоколу онкогинеколога.",
      group: "assessment",
    }),
    card({
      id: "acr:5-ascites-nodules",
      category: 5,
      titleRu: "Асцит и/или перитонеальные узлы",
      acrLabelEn: "Ascites and/or peritoneal nodules",
      imageSrc: nosology("free-fluid-pelvis.jpg"),
      imageAlt: "Свободная жидкость в малом тазу",
      keySignsRu: [
        "Асцит и/или перитонеальные узлы",
        "Не из другой явной причины",
        "В O-RADS 1–2 асцит сначала искать иную этиологию",
      ],
      managementRu: "По протоколу онкогинеколога.",
      subtype: "free_fluid",
      group: "assessment",
    }),
  ],
};

export function getOradsCategoryPhotoCards(category: OradsPhotoCategoryId): OradsCategoryPhotoCard[] {
  return ACR_CARDS[category];
}

export function listOradsCategoryPhotoCards(): OradsCategoryPhotoCard[] {
  return ([0, 1, 2, 3, 4, 5] as const).flatMap((category) => getOradsCategoryPhotoCards(category));
}
