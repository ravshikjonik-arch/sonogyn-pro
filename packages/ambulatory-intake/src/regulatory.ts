import type { RegionCode } from "./regions";

/**
 * Verification status for normative cards.
 * Never present REVIEW_REQUIRED / PARTIAL as fully binding ambulatory order text.
 */
export type RegulatoryVerifyStatus =
  | "VERIFIED"
  | "PARTIAL"
  | "REVIEW_REQUIRED"
  | "EXPIRED"
  | "NOT_CONFIGURED";

export type RegulatoryDocKind =
  | "federal_law"
  | "government_decree"
  | "mz_order"
  | "clinical_recommendation"
  | "methodical"
  | "standard"
  | "regional_order"
  | "regional_program";

export type RegulatoryDocument = {
  id: string;
  title: string;
  kind: RegulatoryDocKind;
  number?: string;
  date?: string;
  issuer: string;
  regionCode: RegionCode | "RF";
  status: RegulatoryVerifyStatus;
  officialUrl?: string;
  scenarioIds: string[];
  lastCheckedAt: string;
  notesRu: string;
};

/** Last identity check against public official / legal databases. */
const CHECKED = "2026-11-03";

/**
 * Normative registry for ambulatory checklist.
 * VERIFIED = реквизиты и предмет подтверждены по публичному источнику.
 * PARTIAL = документ найден, применимость к обычному амбулаторному чек-листу ограничена.
 * REVIEW_REQUIRED = в открытом доступе не подтверждён или не найден.
 */
export const REGULATORY_DOCUMENTS: RegulatoryDocument[] = [
  {
    id: "rf-323-fz",
    title: "Федеральный закон № 323-ФЗ «Об основах охраны здоровья граждан в РФ»",
    kind: "federal_law",
    number: "323-ФЗ",
    date: "21.11.2011",
    issuer: "РФ",
    regionCode: "RF",
    status: "VERIFIED",
    officialUrl: "https://pravo.gov.ru/",
    scenarioIds: ["primary", "preventive", "dispensarization", "pregnancy"],
    lastCheckedAt: CHECKED,
    notesRu:
      "Базовый ФЗ (ст. 37 — порядки оказания помощи). Конкретные статьи для алгоритма сверяйте в актуальной редакции на pravo.gov.ru.",
  },
  {
    id: "rf-mz-404n",
    title:
      "Приказ Минздрава России от 27.04.2021 № 404н «Об утверждении Порядка проведения профилактического медицинского осмотра и диспансеризации определенных групп взрослого населения»",
    kind: "mz_order",
    number: "404н",
    date: "27.04.2021",
    issuer: "Минздрав России",
    regionCode: "RF",
    status: "VERIFIED",
    officialUrl: "https://www.consultant.ru/document/cons_doc_LAW_388771/",
    scenarioIds: ["preventive", "dispensarization"],
    lastCheckedAt: CHECKED,
    notesRu:
      "Действует (с изменениями; срок действия порядка — до 01.07.2027). Объёмы скрининга — по приложениям и возрасту; не путать с ДОРЗ.",
  },
  {
    id: "rf-mz-747n",
    title:
      "Приказ Минздрава России от 19.12.2025 № 747н «О Порядке оказания медицинской помощи по профилю „акушерство и гинекология“»",
    kind: "mz_order",
    number: "747н",
    date: "19.12.2025",
    issuer: "Минздрав России",
    regionCode: "RF",
    status: "VERIFIED",
    officialUrl: "http://publication.pravo.gov.ru/document/0001202512300089",
    scenarioIds: ["primary", "followup", "pregnancy", "preventive"],
    lastCheckedAt: CHECKED,
    notesRu:
      "Опубликован 30.12.2025 (рег. Минюст № 84894). Вступил в силу 10.01.2026. Заменяет порядок 1130н (кроме приложений 7–9). Для чек-листа — организация помощи АГ, не автоматический список анализов.",
  },
  {
    id: "rf-gg-program",
    title: "Программа государственных гарантий бесплатного оказания медицинской помощи (год применения)",
    kind: "government_decree",
    issuer: "Правительство РФ",
    regionCode: "RF",
    status: "REVIEW_REQUIRED",
    officialUrl: "https://pravo.gov.ru/",
    scenarioIds: ["dispensarization", "dorz", "preventive"],
    lastCheckedAt: CHECKED,
    notesRu: "Ежегодный акт. Подставьте редакцию текущего года с pravo.gov.ru перед клиническим использованием.",
  },
  {
    id: "rf-kr-catalog",
    title: "Рубрикатор клинических рекомендаций Минздрава РФ",
    kind: "clinical_recommendation",
    issuer: "Минздрав России",
    regionCode: "RF",
    status: "VERIFIED",
    officialUrl: "https://cr.minzdrav.gov.ru/",
    scenarioIds: [
      "aub",
      "cycle",
      "infertility",
      "pcos",
      "pelvic_pain",
      "pid",
      "vv",
      "sti",
      "cervix",
      "myoma",
      "adenomyosis",
      "endometriosis",
      "ovarian_mass",
      "menopause",
      "contraception",
      "preconception",
      "pregnancy",
      "breast",
    ],
    lastCheckedAt: CHECKED,
    notesRu:
      "Официальный каталог КР. В кабинете: /tools/refs/guidelines. Конкретную КР открывайте по теме сценария.",
  },
  {
    id: "mow-dzm-1830r",
    title:
      "Распоряжение ДЗМ от 13.06.2024 № 1830-р «Об утверждении клиентских путей по профилю „акушерство и гинекология“»",
    kind: "regional_order",
    number: "1830-р",
    date: "13.06.2024",
    issuer: "ДЗМ",
    regionCode: "RU-MOW",
    status: "PARTIAL",
    officialUrl: "https://base.garant.ru/409211264/",
    scenarioIds: ["pregnancy", "infertility"],
    lastCheckedAt: CHECKED,
    notesRu:
      "Подтверждены реквизиты и тема (клиентские пути, в т.ч. «Нормальная беременность», «Бесплодие»). Не путать с распоряжением Правительства РФ № 1830-р от 11.07.2024.",
  },
  {
    id: "mow-dzm-291",
    title:
      "Приказ ДЗМ от 20.03.2025 № 291 «Об организации оперативного, динамического контроля (дистанционного мониторинга) угрожающих жизни заболеваний…» (АГ и неонатология)",
    kind: "regional_order",
    number: "291",
    date: "20.03.2025",
    issuer: "ДЗМ",
    regionCode: "RU-MOW",
    status: "PARTIAL",
    officialUrl: "https://base.garant.ru/411747507/",
    scenarioIds: ["pregnancy", "pelvic_pain", "aub"],
    lastCheckedAt: CHECKED,
    notesRu:
      "Реквизиты подтверждены: АДКЦ и мониторинг угрожающих жизни ситуаций. Это не чек-лист обычного амбулаторного визита — использовать при красных флагах / маршрутизации в Москве.",
  },
  {
    id: "mow-dzm-797-candidate",
    title: "Кандидат: приказ ДЗМ от 13.09.2024 № 797",
    kind: "regional_order",
    number: "797",
    date: "13.09.2024",
    issuer: "ДЗМ",
    regionCode: "RU-MOW",
    status: "REVIEW_REQUIRED",
    officialUrl: "https://www.mos.ru/dzdrav/documents/",
    scenarioIds: ["primary", "pregnancy"],
    lastCheckedAt: CHECKED,
    notesRu:
      "В открытых источниках на дату проверки полный текст/предмет не подтверждены. Не использовать как основание назначений.",
  },
  {
    id: "mow-gg-territorial",
    title: "Территориальная программа госгарантий города Москвы (год применения)",
    kind: "regional_program",
    issuer: "город Москва / ТФОМС",
    regionCode: "RU-MOW",
    status: "REVIEW_REQUIRED",
    officialUrl: "https://www.mos.ru/",
    scenarioIds: ["dispensarization", "dorz", "preventive"],
    lastCheckedAt: CHECKED,
    notesRu: "Подключите актуальную годовую редакцию с официального портала Москвы / ТФОМС.",
  },
];

export const REGULATORY_STATUS_LABELS: Record<RegulatoryVerifyStatus, string> = {
  VERIFIED: "Проверен",
  PARTIAL: "Частично",
  REVIEW_REQUIRED: "Требует проверки",
  EXPIRED: "Утратил силу",
  NOT_CONFIGURED: "Не настроено",
};

export function listRegulatoryForRegion(region: RegionCode): {
  federal: RegulatoryDocument[];
  regional: RegulatoryDocument[];
  regionalConfigured: boolean;
} {
  const federal = REGULATORY_DOCUMENTS.filter((d) => d.regionCode === "RF");
  const regional = REGULATORY_DOCUMENTS.filter((d) => d.regionCode === region);
  const regionalConfigured = regional.length > 0;
  return { federal, regional, regionalConfigured };
}

export function searchRegulatoryNaturalLanguage(
  query: string,
  region: RegionCode,
): RegulatoryDocument[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const { federal, regional, regionalConfigured } = listRegulatoryForRegion(region);
  const pool = [...federal, ...(regionalConfigured ? regional : [])];
  return pool.filter((d) => {
    const hay = [d.title, d.number, d.issuer, d.notesRu, ...d.scenarioIds].join(" ").toLowerCase();
    return hay.includes(q) || (q.includes("диспансер") && d.scenarioIds.includes("dispensarization"));
  });
}
