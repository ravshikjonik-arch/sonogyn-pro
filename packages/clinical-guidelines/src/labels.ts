import type {
  GuidelineDocumentKind,
  GuidelineIssuer,
  GuidelineShelf,
  GuidelineSpecialty,
  GuidelineStatus,
} from "./types";

export const SHELF_LABELS: Record<GuidelineShelf, string> = {
  kr_mz_rf: "Клинические рекомендации Минздрава РФ",
  orders_dzm: "Приказы и протоколы ДЗМ",
  orders_mz_rf: "Приказы и приказные документы МЗ РФ",
  protocols_org: "Локальные протоколы учреждений (по необходимости)",
  international: "Международные гайдлайны (ISUOG, ESHRE, WHO)",
};

export const SHELF_ORDER: GuidelineShelf[] = [
  "kr_mz_rf",
  "orders_dzm",
  "orders_mz_rf",
  "international",
];

export const SHELF_DESCRIPTIONS: Record<GuidelineShelf, string> = {
  kr_mz_rf: "Федеральные КР по акушерству, гинекологии и УЗИ — выдержки и ссылки на cr.minzdrav.gov.ru",
  orders_dzm: "Московские приказы Департамента здравоохранения: маршруты, скрининги, стандарты УЗИ",
  orders_mz_rf: "Приказные документы Минздрава РФ (не КР): порядки оказания помощи, стандарты",
  protocols_org: "Резерв для локальных протоколов клиник (каталог пуст, не отображается в виджете)",
  international: "ISUOG, ESHRE, FIGO и др. — дополнение к российским документам",
};

export const ISSUER_LABELS: Record<GuidelineIssuer, string> = {
  mz_rf: "Минздрав РФ",
  dzm: "Департамент здравоохранения Москвы",
  roag: "РОАГ",
  rosonm: "РОСОУМ",
  isuo: "ISUOG",
  eshre: "ESHRE",
  who: "ВОЗ",
  other: "Другой источник",
};

export const SPECIALTY_LABELS: Record<GuidelineSpecialty, string> = {
  obgyn: "Гинекология",
  obstetrics: "Акушерство",
  ultrasound: "Ультразвуковая диагностика",
  mammology: "Маммология",
  prenatal: "Пренатальная диагностика",
  general: "Общие",
};

export const DOCUMENT_KIND_LABELS: Record<GuidelineDocumentKind, string> = {
  clinical_recommendation: "Клиническая рекомендация",
  order: "Приказ",
  protocol: "Протокол",
  standard: "Стандарт / порядок",
};

export const STATUS_LABELS: Record<GuidelineStatus, string> = {
  active: "Действует",
  superseded: "Утратил силу",
  draft: "Черновик / на проверке",
};

export const SPECIALTY_FILTER_CHIPS: { id: GuidelineSpecialty | "all"; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "obgyn", label: "Гинекология" },
  { id: "obstetrics", label: "Акушерство" },
  { id: "ultrasound", label: "УЗИ" },
  { id: "prenatal", label: "Пренатал" },
  { id: "mammology", label: "МЖ" },
  { id: "general", label: "Общие" },
];

export const GUIDELINES_DISCLAIMER =
  "Структурированные выдержки для справки врача. Не заменяют полный текст официального документа и не являются диагнозом. Тактика — по очному осмотру и актуальной редакции на сайте издателя.";
