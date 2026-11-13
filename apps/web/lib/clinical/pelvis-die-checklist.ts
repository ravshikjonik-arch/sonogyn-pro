/**
 * Справочный чеклист структур малого таза для оценки глубины инфильтрации (DIE).
 * Не диагноз. Анатомические названия — к сверке с экспертом до включения 3D-модели.
 */

export type PelvisStructure = {
  id: string;
  titleRu: string;
  ultrasoundTips: string[];
  relatedIds: string[];
};

export const PELVIS_DIE_STRUCTURES: PelvisStructure[] = [
  {
    id: "uterus",
    titleRu: "Матка",
    ultrasoundTips: ["Контур", "Миометрий", "Переходные зоны при аденомиозе"],
    relatedIds: ["cervix", "uterosacral"],
  },
  {
    id: "cervix",
    titleRu: "Шейка матки",
    ultrasoundTips: ["Длина", "Строма", "Связь с задним сводом"],
    relatedIds: ["uterus", "uterosacral", "rectum"],
  },
  {
    id: "ovary_l",
    titleRu: "Яичник слева",
    ultrasoundTips: ["Подвижность", "Kissing ovaries", "Гидросальпинкс"],
    relatedIds: ["ovary_r", "uterosacral"],
  },
  {
    id: "ovary_r",
    titleRu: "Яичник справа",
    ultrasoundTips: ["Подвижность", "Kissing ovaries"],
    relatedIds: ["ovary_l", "uterosacral"],
  },
  {
    id: "bladder",
    titleRu: "Мочевой пузырь",
    ultrasoundTips: ["Стенка", "Везикоутеринное пространство"],
    relatedIds: ["uterus", "round_ligament"],
  },
  {
    id: "round_ligament",
    titleRu: "Круглые связки",
    ultrasoundTips: ["Передний компартмент при инфильтрации"],
    relatedIds: ["uterus", "bladder"],
  },
  {
    id: "infundibulopelvic",
    titleRu: "Воронкотазовые связки",
    ultrasoundTips: ["Латеральные края", "Сосудистый пучок"],
    relatedIds: ["ovary_l", "ovary_r"],
  },
  {
    id: "uterosacral",
    titleRu: "Крестцово-маточные связки",
    ultrasoundTips: ["Утолщение", "Болезненность при динамике", "Задний компартмент"],
    relatedIds: ["cervix", "rectum", "uterus"],
  },
  {
    id: "vessels",
    titleRu: "Сосуды таза",
    ultrasoundTips: ["Ориентиры", "Не путать с инфильтратом"],
    relatedIds: ["infundibulopelvic"],
  },
  {
    id: "lymph",
    titleRu: "Лимфоузлы (ориентир)",
    ultrasoundTips: ["Только как справочный ориентир, не staging"],
    relatedIds: ["vessels"],
  },
  {
    id: "rectum",
    titleRu: "Прямая кишка / ректосигмоид (смежно)",
    ultrasoundTips: ["Скольжение", "Глубина вовлечения стенки — справочно"],
    relatedIds: ["uterosacral", "cervix"],
  },
];

export const PELVIS_DIE_DISCLAIMER =
  "Справочная информация для врача УЗИ. Не является диагнозом и не заменяет КР / осмотр / МРТ по показаниям.";
