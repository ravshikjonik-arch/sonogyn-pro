export type LocationType = "ovarian" | "extraovarian";
export type Menopause = "premenopausal" | "postmenopausal";
export type FlowType = "physiologic" | "lesion";
export type LesionKind =
  | "simple_cyst"
  | "hemorrhagic_cyst"
  | "dermoid"
  | "endometrioma"
  | "paraovarian"
  | "peritoneal"
  | "hydrosalpinx"
  | "other";
export type CystLocularity = "unilocular" | "multilocular" | "solid";
export type InnerContour = "smooth" | "irregular";
export type OuterContour = "smooth" | "irregular";
export type ColorScore = 1 | 2 | 3 | 4;

export type OradsFlowInput = {
  location?: LocationType;
  menopause: Menopause;
  flowType?: FlowType;
  follicle: boolean;
  corpusLuteum: boolean;
  lesionKind?: LesionKind;
  locularity: CystLocularity;
  innerContour: InnerContour;
  outerContour: OuterContour;
  papillaryCount: number;
  solidComponent: boolean;
  colorScore: ColorScore;
  ascitesOrImplants: boolean;
  sizeCm: number;
};

export type OradsResult = {
  category: string;
  risk: string;
  management: string[];
  summary: string;
};

type OradsRule = {
  id: string;
  match: (input: OradsFlowInput) => boolean;
  result: OradsResult;
};

const oradsRules: OradsRule[] = [
  {
    id: "orads5-ascites",
    match: (input) => input.ascitesOrImplants,
    result: {
      category: "O-RADS 5",
      risk: "ROM 50-100%",
      summary: "Перитонеальные солидные импланты/асцит",
      management: ["Немедленное направление к онкогинекологу", "Стадирование по протоколу центра"],
    },
  },
  {
    id: "orads5-papillary-4plus",
    match: (input) => input.papillaryCount >= 4,
    result: {
      category: "O-RADS 5",
      risk: "ROM 50-100%",
      summary: "Однокамерная киста с >=4 папиллярными разрастаниями",
      management: ["Онкогинекологический маршрут", "Доопределение распространенности процесса"],
    },
  },
  {
    id: "orads5-solid-irregular-outer",
    match: (input) => input.locularity === "solid" && input.outerContour === "irregular",
    result: {
      category: "O-RADS 5",
      risk: "ROM 50-100%",
      summary: "Солидное образование с неровным внешним контуром",
      management: ["Онкогинекологический маршрут", "Приоритетное дообследование"],
    },
  },
  {
    id: "orads5-solid-cs4",
    match: (input) => input.locularity === "solid" && input.outerContour === "smooth" && input.colorScore === 4,
    result: {
      category: "O-RADS 5",
      risk: "ROM 50-100%",
      summary: "Солидное образование, цветовой балл 4 (очень высокая васкуляризация)",
      management: ["Онкогинекологический маршрут", "Приоритетное дообследование"],
    },
  },
  {
    id: "orads5-multilocular-solid-cs3-4",
    match: (input) => input.locularity === "multilocular" && input.solidComponent && input.colorScore >= 3,
    result: {
      category: "O-RADS 5",
      risk: "ROM 50-100%",
      summary: "Многокамерная киста с солидным компонентом, цветовой балл 3-4 (умеренная/высокая васкуляризация)",
      management: ["Онкогинекологический маршрут", "Приоритетное дообследование"],
    },
  },
  {
    id: "orads1-follicle",
    match: (input) =>
      input.location === "ovarian" &&
      input.flowType === "physiologic" &&
      input.menopause === "premenopausal" &&
      input.follicle &&
      input.sizeCm <= 3,
    result: {
      category: "O-RADS 1",
      risk: "ROM 0%",
      summary: "Фолликул <=3 см",
      management: ["Визуализация: не требуется", "Клиническое ведение: без особенностей"],
    },
  },
  {
    id: "orads1-corpus-luteum",
    match: (input) =>
      input.location === "ovarian" &&
      input.flowType === "physiologic" &&
      input.menopause === "premenopausal" &&
      input.corpusLuteum &&
      input.sizeCm <= 3,
    result: {
      category: "O-RADS 1",
      risk: "ROM 0%",
      summary: "Желтое тело <=3 см",
      management: ["Визуализация: не требуется", "Клиническое ведение: без особенностей"],
    },
  },
  {
    id: "orads2-extraovarian",
    match: (input) => input.location === "extraovarian",
    result: {
      category: "O-RADS 2",
      risk: "ROM <1%",
      summary: "Типичное экстраовариальное доброкачественное образование",
      management: ["УЗ-контроль по локальному протоколу", "Рутинное ведение"],
    },
  },
  {
    id: "orads2-typical-benign-under-10",
    match: (input) =>
      (input.lesionKind === "hemorrhagic_cyst" || input.lesionKind === "dermoid" || input.lesionKind === "endometrioma") &&
      input.sizeCm < 10,
    result: {
      category: "O-RADS 2",
      risk: "ROM <1%",
      summary: "Типичная доброкачественная киста <10 см",
      management: ["УЗ-контроль по локальному протоколу", "Рутинное ведение"],
    },
  },
  {
    id: "orads2-paraovarian-peritoneal-hydrosalpinx",
    match: (input) =>
      input.lesionKind === "paraovarian" || input.lesionKind === "peritoneal" || input.lesionKind === "hydrosalpinx",
    result: {
      category: "O-RADS 2",
      risk: "ROM <1%",
      summary: "Типичное доброкачественное образование",
      management: ["УЗ-контроль по локальному протоколу", "Рутинное ведение"],
    },
  },
  {
    id: "orads4-multilocular-smooth-10plus-cs1-3",
    match: (input) =>
      input.locularity === "multilocular" &&
      !input.solidComponent &&
      input.innerContour === "smooth" &&
      input.sizeCm >= 10 &&
      [1, 2, 3].includes(input.colorScore),
    result: {
      category: "O-RADS 4",
      risk: "ROM 10-50%",
      summary: "Многокамерная киста, гладкий внутренний контур, >=10 см, цветовой балл 1-3",
      management: ["Консилиум/экспертное УЗИ", "Направление к профильному гинекологу"],
    },
  },
  {
    id: "orads4-multilocular-smooth-cs4",
    match: (input) =>
      input.locularity === "multilocular" &&
      !input.solidComponent &&
      input.innerContour === "smooth" &&
      input.colorScore === 4,
    result: {
      category: "O-RADS 4",
      risk: "ROM 10-50%",
      summary: "Многокамерная киста, гладкий внутренний контур, цветовой балл 4",
      management: ["Консилиум/экспертное УЗИ", "Направление к профильному гинекологу"],
    },
  },
  {
    id: "orads4-multilocular-irregular",
    match: (input) => input.locularity === "multilocular" && !input.solidComponent && input.innerContour === "irregular",
    result: {
      category: "O-RADS 4",
      risk: "ROM 10-50%",
      summary: "Многокамерная киста с неровным внутренним контуром/перегородками",
      management: ["Консилиум/экспертное УЗИ", "Направление к профильному гинекологу"],
    },
  },
  {
    id: "orads4-unilocular-solid-no-papillary",
    match: (input) => input.locularity === "unilocular" && input.solidComponent && input.papillaryCount === 0,
    result: {
      category: "O-RADS 4",
      risk: "ROM 10-50%",
      summary: "Однокамерная киста с солидным компонентом без папиллярных разрастаний",
      management: ["Консилиум/экспертное УЗИ", "Направление к профильному гинекологу"],
    },
  },
  {
    id: "orads4-unilocular-papillary-1-3",
    match: (input) => input.locularity === "unilocular" && input.papillaryCount >= 1 && input.papillaryCount <= 3,
    result: {
      category: "O-RADS 4",
      risk: "ROM 10-50%",
      summary: "Однокамерная киста с 1-3 папиллярными разрастаниями",
      management: ["Консилиум/экспертное УЗИ", "Направление к профильному гинекологу"],
    },
  },
  {
    id: "orads4-multilocular-solid-cs1-2",
    match: (input) => input.locularity === "multilocular" && input.solidComponent && [1, 2].includes(input.colorScore),
    result: {
      category: "O-RADS 4",
      risk: "ROM 10-50%",
      summary: "Многокамерная киста с солидным компонентом, цветовой балл 1-2",
      management: ["Консилиум/экспертное УЗИ", "Направление к профильному гинекологу"],
    },
  },
  {
    id: "orads4-solid-smooth-cs2-3",
    match: (input) => input.locularity === "solid" && input.outerContour === "smooth" && [2, 3].includes(input.colorScore),
    result: {
      category: "O-RADS 4",
      risk: "ROM 10-50%",
      summary: "Солидное образование с ровным внешним контуром, цветовой балл 2-3",
      management: ["Консилиум/экспертное УЗИ", "Направление к профильному гинекологу"],
    },
  },
  {
    id: "orads3-unilocular-smooth-10plus",
    match: (input) => input.locularity === "unilocular" && !input.solidComponent && input.innerContour === "smooth" && input.sizeCm >= 10,
    result: {
      category: "O-RADS 3",
      risk: "ROM 1-<10%",
      summary: "Однокамерная киста >=10 см",
      management: ["УЗ-контроль в динамике", "Плановая консультация гинеколога"],
    },
  },
  {
    id: "orads3-typical-benign-10plus",
    match: (input) =>
      (input.lesionKind === "hemorrhagic_cyst" || input.lesionKind === "dermoid" || input.lesionKind === "endometrioma") &&
      input.sizeCm >= 10,
    result: {
      category: "O-RADS 3",
      risk: "ROM 1-<10%",
      summary: "Типичная доброкачественная киста >=10 см",
      management: ["УЗ-контроль в динамике", "Плановая консультация гинеколога"],
    },
  },
  {
    id: "orads3-unilocular-irregular",
    match: (input) => input.locularity === "unilocular" && !input.solidComponent && input.innerContour === "irregular",
    result: {
      category: "O-RADS 3",
      risk: "ROM 1-<10%",
      summary: "Однокамерная киста с неровным внутренним контуром",
      management: ["УЗ-контроль в динамике", "Плановая консультация гинеколога"],
    },
  },
  {
    id: "orads3-multilocular-smooth-under10-cs1-3",
    match: (input) =>
      input.locularity === "multilocular" &&
      !input.solidComponent &&
      input.innerContour === "smooth" &&
      input.sizeCm < 10 &&
      [1, 2, 3].includes(input.colorScore),
    result: {
      category: "O-RADS 3",
      risk: "ROM 1-<10%",
      summary: "Многокамерная киста, гладкие стенки, <10 см, цветовой балл 1-3",
      management: ["УЗ-контроль в динамике", "Плановая консультация гинеколога"],
    },
  },
  {
    id: "orads3-solid-cs1",
    match: (input) => input.locularity === "solid" && input.colorScore === 1,
    result: {
      category: "O-RADS 3",
      risk: "ROM 1-<10%",
      summary: "Солидная опухоль, цветовой балл 1",
      management: ["УЗ-контроль/МРТ по показаниям", "Плановая консультация гинеколога"],
    },
  },
];

const fallbackRules: OradsRule[] = [
  {
    id: "fallback-orads4-intermediate",
    match: (input) => input.solidComponent || input.colorScore >= 3,
    result: {
      category: "O-RADS 4",
      risk: "ROM 10-50%",
      summary: "Промежуточный риск по признакам",
      management: ["Консилиум/экспертное УЗИ", "Направление к профильному гинекологу"],
    },
  },
  {
    id: "fallback-orads3-followup",
    match: (input) => input.sizeCm >= 10,
    result: {
      category: "O-RADS 3",
      risk: "ROM 1-<10%",
      summary: "Низкий риск, требуется наблюдение",
      management: ["УЗ-контроль в динамике", "Плановая консультация гинеколога"],
    },
  },
];

const defaultResult: OradsResult = {
  category: "O-RADS 2",
  risk: "ROM <1%",
  summary: "Вероятно доброкачественное образование",
  management: ["УЗ-контроль по локальному протоколу", "Рутинное ведение"],
};

export function calculateOradsFlowResult(input: OradsFlowInput): OradsResult {
  const matchedRule = oradsRules.find((rule) => rule.match(input));
  if (matchedRule) return matchedRule.result;

  const matchedFallback = fallbackRules.find((rule) => rule.match(input));
  if (matchedFallback) return matchedFallback.result;

  return defaultResult;
}
