import type { ClinicalDocumentSpec } from "@/lib/reporting/clinical-document";
import type { PatientLeaflet, PatientLeafletId } from "./types";

export const PATIENT_INFO_DISCLAIMER =
  "Информационный лист для пациентки. Не заменяет очную консультацию врача. Тактика лечения определяется лечащим специалистом с учётом вашей ситуации.";

export const PATIENT_LEAFLETS: PatientLeaflet[] = [
  {
    id: "short-cervical-length",
    titleRu: "Укороченная шейка матки при беременности",
    subtitle: "ISUOG · cervical length screening",
    source: "ISUOG Patient Information",
    relatedHref: "/tools/calc/ob/cervical-length",
    relatedLabel: "Калькулятор длины шейки",
    whenToUse: "После измерения CL <25 мм в II триместре при факторах риска преждевременных родов.",
    sections: [
      {
        heading: "Что мы измерили",
        body: "Длина шейки матки — один из показателей риска преждевременных родов. Измерение выполняется трансвагинально, когда шейка визуализируется.",
      },
      {
        heading: "Что это может означать",
        body: "Укорочение шейки не означает, что роды обязательно начнутся раньше срока. Это сигнал для более внимательного наблюдения и, при необходимости, профилактики.",
      },
      {
        heading: "Что может назначить врач",
        body: "Повторные измерения, наблюдение, прогesterone (по показаниям), ограничение нагрузок, госпитализация при высоком риске. Решение принимает акушер-гинеколог.",
      },
      {
        heading: "Когда обратиться срочно",
        body: "Регулярные схватки, выделения, давление внизу живота, подтекание вод — немедленно в стационар или вызов скорой.",
      },
    ],
  },
  {
    id: "o-rads-adnexal",
    titleRu: "Образование в области яичника (O-RADS)",
    subtitle: "ACR O-RADS US · patient explanation",
    source: "ACR O-RADS US v2022",
    relatedHref: "/tools/calc/rads/o-rads",
    relatedLabel: "Калькулятор O-RADS",
    whenToUse: "После УЗИ придатков с присвоением категории O-RADS 2–5.",
    sections: [
      {
        heading: "Что мы увидели на УЗИ",
        body: "В области яичника или придатка обнаружено образование. Врач описывает его по международной системе O-RADS — это помогает оценить риск и выбрать тактику.",
      },
      {
        heading: "Категории O-RADS (упрощённо)",
        body: "O-RADS 1–2: обычно доброкачественные, наблюдение.\nO-RADS 3: неопределённый риск — часто нужен контроль через 6–8 нед или до менopause.\nO-RADS 4–5: повышенный риск — обычно направление к онкогинекологу и дообследование (МРТ, онкомаркеры, консультация).",
      },
      {
        heading: "Важно понимать",
        body: "УЗИ не ставит окончательный диагноз. Категория — вероятностная оценка. Окончательное решение — после очного осмотра, анализов и, при необходимости, операции/биопсии.",
      },
      {
        heading: "Ваши следующие шаги",
        body: "Следуйте рекомендациям лечащего врача: срок контрольного УЗИ, консультация специалиста, при необходимости — МРТ малого таза.",
      },
    ],
  },
  {
    id: "cin-follow-up",
    titleRu: "Результаты скрининга шейки матки (цитология / HPV)",
    subtitle: "Bethesda · ASCCP-oriented follow-up",
    source: "ISUOG / ASCCP adapted",
    relatedHref: "/tools/refs/cervix-pathology?tab=cytology",
    relatedLabel: "Модуль цитологии",
    whenToUse: "После аномальной цитологии или положительного HPV-теста.",
    sections: [
      {
        heading: "Что такое скрининг",
        body: "Мазок (цитология) и/или тест на ВПЧ помогают выявить изменения шейки матки на ранней стадии, когда лечение наиболее эффективно.",
      },
      {
        heading: "Если результат «аномальный»",
        body: "Это не означает рак. Чаще речь о предраковых изменениях (дисплазия/CIN), которые подлежат наблюдению или лечению.",
      },
      {
        heading: "Что может назначить врач",
        body: "Повтор цитологии через 6–12 мес, кольпоскопия, биопсия шейки, при необходимости — удаление изменённого участка (конизация).",
      },
      {
        heading: "Вакцинация HPV",
        body: "Вакцинация снижает риск новых инфекций ВПЧ. Обсудите с врачом, если вы ещё не вакцинированы (возрастные ограничения — по инструкции препарата).",
      },
    ],
  },
  {
    id: "fetal-growth-restriction",
    titleRu: "Задержка роста плода (FGR / МГП)",
    subtitle: "ISUOG · Fetal growth restriction",
    source: "ISUOG Patient Information · FGR",
    relatedHref: "/calculators/fetal-weight",
    relatedLabel: "Калькулятор массы плода",
    whenToUse: "При EFW <10-го перцентиля или отставании роста на повторных УЗИ.",
    sections: [
      {
        heading: "Что это значит",
        body: "Плод растёт медленнее ожидаемого для срока беременности. Это требует более частого наблюдения и оценки состояния плода.",
      },
      {
        heading: "Как мы следим",
        body: "Повторные УЗИ (биометрия, объём вод), допpler (кровоток в пуповине и головном мозге плода), КТГ, при необходимости — госпитализация.",
      },
      {
        heading: "Риски и прогноз",
        body: "При своевременном наблюдении большинство беременностей завершаются благополучно. Тяжёлые формы требуют решения о сроке и способе родоразрешения в стационаре perinatal center.",
      },
      {
        heading: "Что делать вам",
        body: "Соблюдайте график визитов, отмечайте шевеления плода, при уменьшении активности — сразу в стационар.",
      },
    ],
  },
  {
    id: "first-trimester-screening",
    titleRu: "Скрининг I триместра (11–13+6 нед)",
    subtitle: "ISUOG · combined first trimester screening",
    source: "ISUOG / FMF",
    relatedHref: "/ai/consultants/fmf?section=first",
    relatedLabel: "FMF · I скрининг",
    whenToUse: "После УЗИ скрининга I триместра с расчётом риска хромosomal anomalies.",
    sections: [
      {
        heading: "Что включает скрининг",
        body: "УЗИ (КТР, ТВ, носовая кость, базовая анатомия) + анализ крови матери (PAPP-A, free β-hCG) → расчёт индивидуального риска.",
      },
      {
        heading: "Если риск низкий",
        body: "Обычно достаточно планового наблюдения и УЗИ II триместра. Скрининг не исключает все аномалии на 100%.",
      },
      {
        heading: "Если риск повышен",
        body: "Врач обсудит NIPT (неинвазивный пренatalный тест), инвазивную диагностику (хорion biopsy / amniocentesis) — только после консультации генетика.",
      },
      {
        heading: "Важно",
        body: "Скрининг — оценка вероятности, не диагноз. Окончательные решения — после консультации акушера-гинеколога и, при необходимости, генетика.",
      },
    ],
  },
];

export function getPatientLeaflet(id: PatientLeafletId): PatientLeaflet | undefined {
  return PATIENT_LEAFLETS.find((l) => l.id === id);
}

export function buildPatientLeafletSpec(leaflet: PatientLeaflet): ClinicalDocumentSpec {
  return {
    filenameBase: `patient-leaflet-${leaflet.id}`,
    title: leaflet.titleRu,
    meta: [
      { label: "Тип", value: "Информация для пациентки" },
      { label: "Источник", value: leaflet.source },
    ],
    sections: leaflet.sections,
    disclaimer: PATIENT_INFO_DISCLAIMER,
  };
}
