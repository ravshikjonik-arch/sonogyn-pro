/** Public web path prefix (apps/web/public/clinical/orads-nosology). */
export const ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE = "/clinical/orads-nosology";

export type OradsNosologySubtype =
  | "simple_cyst"
  | "hemorrhagic"
  | "endometrioma"
  | "dermoid"
  | "paraovarian"
  | "peritoneal_inclusion"
  | "hydrosalpinx"
  | "free_fluid"
  | "orads5_ovarian_cancer";

export type OradsNosologyAtlasEntry = {
  id: string;
  subtype: OradsNosologySubtype;
  titleRu: string;
  oradsHint: string;
  keySignsRu?: string[];
  protocolText: string;
  /** Relative public URL; mobile resolves via web API base. */
  imageSrc: string;
  imageAlt: string;
  /** Реальная эхограмма (jpg/png). Если задано — показывается рядом с базовой. */
  realExampleImage?: string;
  /** Описание реального примера (подпись к эхограмме). */
  realExampleCaption?: string;
  /** Дополнительная реальная эхограмма (второй ракурс/пример). */
  realExampleImage2?: string;
  /** Подпись ко второй реальной эхограмме. */
  realExampleCaption2?: string;
  /** Несколько реальных примеров подряд. */
  realExampleImages?: string[];
  /** Подписей к каждому realExampleImages[i]; длина может быть короче массива. */
  realExampleCaptions?: string[];
  /** Учебная категория для фильтрации UI. */
  category?: string;
  /** Краткая подсказка для AI-ассистента (не диагноз). */
  aiAssistantNoteRu?: string;
  /** Учебный дисклеймер к примеру. */
  disclaimerRu?: string;
};

const DERMOID_DISCLAIMER_RU =
  "Обучающий пример для распознавания типичной картины дермоидной кисты. Не заменяет заключение специалиста и не является диагнозом.";

const EDUCATIONAL_DISCLAIMER_RU =
  "Обучающий пример. Не заменяет заключение специалиста и не является диагнозом.";

/** Подтипы без эхограммы — добавить в ORADS_NOSOLOGY_ATLAS, когда будут материалы. */
export const ORADS_NOSOLOGY_PENDING_SUBTYPES: OradsNosologySubtype[] = ["peritoneal_inclusion"];
/** Учебные эхограммы + готовые формулировки для протокола (O-RADS 2, типичные кисты). */
export const ORADS_NOSOLOGY_ATLAS: OradsNosologyAtlasEntry[] = [
  {
    id: "functional_cyst",
    subtype: "simple_cyst",
    titleRu: "Функциональная киста",
    oradsHint: "O-RADS 2 · простая / функциональная киста",
    keySignsRu: ["Однокамерная", "Анэхогенное содержимое", "Тонкая гладкая стенка", "Без солидного компонента"],
    protocolText:
      "Функциональная киста. В проекции яичника визуализируется анэхогенное округлое образование с анэхогенным внутренним содержимым без включений размерами 30×30 мм при ЦДК 0. Корковый слой яичника не прослеживается, фолликулы не визуализируются.",
    imageSrc: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/functional-cyst.jpg`,
    imageAlt: "УЗИ: простая функциональная киста яичника",
    realExampleImage: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/functional-cyst-real.jpg`,
    realExampleCaption: "Реальная эхограмма: функциональная киста — анэхогенное образование с чётким гиперэхогенным ободком. O-RADS 2.",
    realExampleImage2: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/functional-cyst-real-2.jpg`,
    realExampleCaption2: "Реальная эхограмма (второй ракурс): функциональная киста яичника. O-RADS 2.",
  },
  {
    id: "hemorrhagic_cyst_reticular",
    subtype: "hemorrhagic",
    titleRu: "Геморрагическая киста / ретикулярный тип",
    oradsHint: "O-RADS 2 · типичная геморрагическая киста",
    keySignsRu: [
      "Кистозное образование",
      "Ретикулярный рисунок / фибриновые нити или сгусток",
      "Без внутреннего кровотока",
      "Характерно у молодых/репродуктивного возраста",
      "Типично <10 см",
    ],
    protocolText:
      "Геморрагическая киста. В проекции яичника визуализируется округлое образование с неоднородной внутренней структурой в виде фибринового сгустка, размерами 32×30 мм. Корковый слой яичника не прослеживается, фолликулы не визуализируются. Гематоперитонеум?",
    imageSrc: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/hemorrhagic-cyst.jpg`,
    imageAlt: "УЗИ: геморрагическая киста яичника с сетчатым рисунком",
    aiAssistantNoteRu:
      "Похоже на геморрагическую кисту: сетчатость/нити в кисте. При типичном ретикулярном/гнилевом типе без выпячиваний O-RADS обычно 2.",
    disclaimerRu: EDUCATIONAL_DISCLAIMER_RU,
    realExampleImage: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/hemorrhagic-cyst-real.jpg`,
    realExampleCaption:
      "Реальная эхограмма: геморрагическая киста — ретикулярный внутренний рисунок без солидных зон.",
  },
  {
    id: "endometrioid_cyst",
    subtype: "endometrioma",
    titleRu: "Эндометриоидная («шоколадная») киста",
    oradsHint: "O-RADS 2 · эндометриома · «матовое стекло»",
    keySignsRu: ["Однородная мелкодисперсная взвесь", "Симптом «матового стекла»", "Обычно без солидного компонента", "Типично <10 см", "Двустороннее поражение — типично"],
    protocolText:
      "Эндометриоидная киста. В проекции яичника локализуется округлое образование с густым неоднородным внутренним содержимым — мелкодисперсная взвесь, «симптом матового стекла», размерами 37×31 мм; при ЦДК — слабый фрагментарный сигнал. Корковый слой яичника не прослеживается, фолликулы не визуализируются.",
    imageSrc: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/endometrioid-cyst.jpg`,
    imageAlt: "УЗИ: эндометриоидная киста яичника",
    realExampleImage: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/endometrioid-cyst-real.jpg`,
    realExampleCaption: "Реальная эхограмма: эндометриоидные кисты обеих яичников — двустороннее поражение, типичный мелкодисперсный паттерн. O-RADS 2.",
  },
  {
    id: "paraovarian_cyst",
    subtype: "paraovarian",
    titleRu: "Параовариальная киста",
    oradsHint: "O-RADS 2 · внеяичниковая локализация",
    keySignsRu: ["Расположена отдельно от яичника", "Однокамерная", "Анэхогенная", "Может быть любого размера"],
    protocolText:
      "Параовариальная киста. Однокамерное анэхогенное тонкостенное образование без пристеночных включений; внутреннее содержимое однородное, без перегородок, солидных компонентов и папиллярных разрастаний.",
    imageSrc: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/paraovarian-cyst.jpg`,
    imageAlt: "УЗИ: параовариальная киста рядом с яичником",
  },
  {
    id: "dermoid_cyst",
    subtype: "dermoid",
    titleRu: "Дермоидная киста",
    oradsHint: "O-RADS 2 · зрелая кистозная тератома · типичный паттерн",
    keySignsRu: ["Эхогенный компонент", "Акустическая тень", "Эхогенные сферические структуры", "Типично <10 см"],
    protocolText:
      "Дермоидная киста яичника (зрелая кистозная тератома). В проекции яичника визуализируется кистозное образование с эхогенным пристеночным узелком (Rokitansky nodule) и дермоидной сеткой внутри анэхогенного компонента. Типичный доброкачественный паттерн — O-RADS 2.",
    imageSrc: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/dermoid-cyst.jpg`,
    imageAlt: "УЗИ: дермоидная киста яичника с узелком Rokitansky и дермоидной сеткой",
    realExampleImage: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/dermoid-cyst-real.jpg`,
    realExampleCaption: "Реальная эхограмма: дермоидная киста (зрелая кистозная тератома) — эхогенные структуры, акустическая тень. O-RADS 2.",
  },
  {
    id: "hydrosalpinx",
    subtype: "hydrosalpinx",
    titleRu: "Гидросальпинкс",
    oradsHint: "O-RADS 2 · типичный гидросальпинкс · экстраовариальная локализация",
    keySignsRu: ["Тубулярная форма", "Неполные перегородки", "Эндосальпингеальные складки", "Однородное жидкостное содержимое"],
    protocolText:
      "Гидросальпинкс (расширенная маточная труба). Визуализируется трубчатое образование овальной/извитой формы с анэхогенным однородным содержимым, тонкими стенками и эффектом «бусин» от неполных перегородок. Экстраовариальная локализация — O-RADS 2 при типичном паттерне.",
    imageSrc: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/hydrosalpinx.jpg`,
    imageAlt: "УЗИ: гидросальпинкс с анэхогенным содержимым и эффектом бусин",
  },
  {
    id: "free_fluid_pelvis",
    subtype: "free_fluid",
    titleRu: "Свободная жидкость в малом тазу",
    oradsHint: "Модификатор · асцит · O-RADS 5 при подозрительных образованиях",
    keySignsRu: ["Свободная жидкость", "Оценивается вместе с образованием", "При подозрительных признаках повышает риск"],
    protocolText:
      "Свободная жидкость в малом тазу (асцит). При наличии двусторонних объёмных образований яичников с признаками злокачественности и свободной жидкости в малом тазу — категория O-RADS 5, высокий риск рака яичника. Интерпретация — специалистом; не диагноз.",
    imageSrc: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/free-fluid-pelvis.jpg`,
    imageAlt: "УЗИ: свободная жидкость в малом тазу на фоне объёмных образований яичников",
  },
  {
    id: "orads5_ovarian_cancer",
    subtype: "orads5_ovarian_cancer",
    titleRu: "Архетип O-RADS 5: подозрение на рак яичника",
    oradsHint: "O-RADS 5 · высокий риск ·-solid/cystic, сосочковые выпячивания, асцит",
    keySignsRu: [
      "Сложное солидно-кистозное образование яичника",
      "Полипозные/сосочковые выпячивания стенки",
      "Толщина перегородок >3 мм",
      "Внутрикистозный кровоток/папиллярные структуры",
      "Асцит/свободная жидкость в малом тазу",
    ],
    protocolText:
      "Подозрение на опухоль яичника. В проекции яичника визуализируется крупное солидно-кистозное образование с полипозными/сосочковыми выпячиваниями стенки и утолщёнными перегородками, включающимися при ЦДК; в малом тазу определяется свободная жидкость. Паттерн соответствует высокой вероятности злокачественности — O-RADS 5. Интерпретация — специалистом; не диагноз.",
    imageSrc: `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/orads5-ovarian-cancer-1.jpg`,
    imageAlt: "УЗИ: подозрение на рак яичника, пример 1",
    realExampleImages: [
      `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/orads5-ovarian-cancer-1.jpg`,
      `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/orads5-ovarian-cancer-2.jpg`,
      `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/orads5-ovarian-cancer-3.jpg`,
      `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/orads5-ovarian-cancer-4.jpg`,
      `${ORADS_NOSOLOGY_PUBLIC_IMAGE_BASE}/orads5-ovarian-cancer-5.jpg`,
    ],
    realExampleCaptions: [
      "Реальная эхограмма: папиллярные/сосочковые элементы. O-RADS 5.",
      "Реальная эхограмма: доп. ракурс/пример 2. O-RADS 5.",
      "Реальная эхограмма: доп. ракурс/пример 3. O-RADS 5.",
      "Реальная эхограмма: доп. ракурс/пример 4. O-RADS 5.",
      "Реальная эхограмма: доп. ракурс/пример 5. O-RADS 5.",
    ],
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
