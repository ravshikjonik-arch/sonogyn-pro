import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export type CalculatorSeoEntry = {
  path: string;
  title: string;
  description: string;
  keywords: string[];
};

/** Канонические URL калькуляторов и ключевых модулей (для sitemap + metadata). */
export const CALCULATOR_SEO_REGISTRY: CalculatorSeoEntry[] = [
  {
    path: "/tools/calc/rads/o-rads",
    title: "Калькулятор O-RADS US онлайн",
    description:
      "Пошаговый калькулятор O-RADS US v2022 и IOTA для оценки аднексальных образований на УЗИ. Для врачей УЗД и акушеров-гинекологов.",
    keywords: ["O-RADS", "IOTA", "калькулятор", "яичник", "аднекс", "УЗИ"],
  },
  {
    path: "/tools/calc/rads/iota",
    title: "Калькулятор IOTA ADNEX / LR2 онлайн",
    description:
      "Вероятностные модели IOTA (ADNEX, LR2, Simple Rules) с сопоставлением категории O-RADS US. Поддержка решений, не диагноз.",
    keywords: ["IOTA", "ADNEX", "LR2", "Simple Rules", "O-RADS", "калькулятор"],
  },
  {
    path: "/tools/calc/rads/bi-rads",
    title: "Калькулятор BI-RADS US онлайн",
    description:
      "Структурированная оценка образований молочной железы по BI-RADS для ультразвукового исследования. ACR-ориентиры.",
    keywords: ["BI-RADS", "молочная железа", "УЗИ", "калькулятор"],
  },
  {
    path: "/tools/calc/rads/ti-rads",
    title: "Калькулятор TI-RADS ACR онлайн",
    description:
      "ACR TI-RADS: scoring TR1–TR5, pattern recognition и рекомендации по FNA для узлов щитовидной железы на УЗИ.",
    keywords: ["TI-RADS", "щитовидная железа", "ACR", "калькулятор", "УЗИ"],
  },
  {
    path: "/tools/calc/rads/ln-rads",
    title: "Калькулятор LN-RADS онлайн",
    description: "Классификация лимфатических узлов по LN-RADS на ультразвуковом исследовании.",
    keywords: ["LN-RADS", "лимфоузел", "УЗИ", "калькулятор"],
  },
  {
    path: "/tools/calc/ob/bishop",
    title: "Шкала Bishop онлайн",
    description: "Расчёт баллов по шкале Bishop для оценки зрелости шейки матки перед родами.",
    keywords: ["Bishop", "шейка матки", "акушерство", "калькулятор"],
  },
  {
    path: "/tools/calc/ob/vbac",
    title: "Калькулятор VBAC / TOLAC онлайн",
    description: "Оценка вероятности успешного vaginal birth after cesarean (VBAC) и рисков TOLAC.",
    keywords: ["VBAC", "TOLAC", "кесарево", "акушерство", "калькулятор"],
  },
  {
    path: "/tools/calc/ob/fetal-weight",
    title: "Калькулятор массы плода (EFW) онлайн",
    description:
      "Оценка массы плода по формулам Hadlock и др. по биометрии BPD, HC, AC, FL (мм). Акушерская фетометрия.",
    keywords: ["EFW", "масса плода", "Hadlock", "фетометрия", "калькулятор"],
  },
  {
    path: "/tools/calc/ob/cervical-length",
    title: "Длина шейки матки (CL) · калькулятор",
    description: "Скрининг укорочения шейки матки 16–24 нед, интерпретация CL на трансвагинальном УЗИ.",
    keywords: ["шейка матки", "CL", "укорочение", "акушерство", "УЗИ"],
  },
  {
    path: "/tools/calc/ob",
    title: "Акушерский калькулятор",
    description: "Срок беременности по ПМП, КТР, УЗИ, ЭКО; связанные акушерские расчёты в одном хабе.",
    keywords: ["срок беременности", "ПДР", "КТР", "акушерство", "калькулятор"],
  },
  {
    path: "/tools/calc/ob/fetometry-norms",
    title: "Нормы фетометрии онлайн",
    description:
      "Мастер номограмм (дерево решений) и каталог табличных норм фетометрии I–III триместра, допплер и эхокардиография плода.",
    keywords: ["фетометрия", "перцентили", "нормы", "акушерство"],
  },
  {
    path: "/tools/calc/ob/pregnancy-medications",
    title: "Лекарства при беременности · справочник",
    description: "Категории безопасности препаратов в беременности для клинического контекста приёма.",
    keywords: ["беременность", "лекарства", "фармакология", "акушерство"],
  },
  {
    path: "/tools/repos",
    title: "Репозитории платформы",
    description: "Каталоги Awesome и исследовательские репозитории УЗИ, подключённые к SonoGyn Pro.",
    keywords: ["репозитории", "awesome", "УЗИ"],
  },
  {
    path: "/tools/pharmacy",
    title: "Аптека врача",
    description: "Выбор препарата и ориентир по категории безопасности в беременности. Не заменяет формуляр и назначение.",
    keywords: ["аптека", "препараты", "беременность", "фармакология"],
  },
  {
    path: "/tools/calc/gyn",
    title: "Калькуляторы гинекологии",
    description: "Эндометрий, POP-Q, кольпоскопия, CIN, эластография и риски. Срок беременности — в ObCalc.",
    keywords: ["гинекология", "калькулятор", "эндометрий", "POP-Q", "кольпоскопия"],
  },
  {
    path: "/tools/calc/gyn/endometrium",
    title: "Калькулятор эндометрия онлайн",
    description: "M-эхо, пороги для пре- и постменопаузы, очаговые изменения; ISUOG и КР РФ.",
    keywords: ["эндометрий", "M-эхо", "менопауза", "гинекология", "УЗИ"],
  },
  {
    path: "/tools/calc/gyn/elastography",
    title: "Калькулятор эластографии онлайн",
    description: "Strain и SWE для шейки матки, миометрия, яичников и молочной железы.",
    keywords: ["эластография", "SWE", "strain", "УЗИ", "калькулятор"],
  },
  {
    path: "/tools/calc/gyn/colposcopy",
    title: "Протокол кольпоскопии онлайн",
    description: "Структурированный протокол кольпоскопии, Swede Score и риск CIN 2+.",
    keywords: ["кольпоскопия", "Swede Score", "шейка матки", "CIN"],
  },
  {
    path: "/tools/calc/gyn/cin-risk",
    title: "Калькулятор риска CIN онлайн",
    description: "Оценка риска CIN1/CIN2+/CIN3+ по HPV, цитологии Bethesda и кольпоскопии.",
    keywords: ["CIN", "HPV", "Bethesda", "кольпоскопия", "калькулятор"],
  },
  {
    path: "/tools/calc/gyn/cervical-intelligence",
    title: "Cervical Pathology Intelligence",
    description: "CDS-модуль: IFCPC, HPV, Bethesda, Swede Score и рекомендации по патологии шейки.",
    keywords: ["шейка матки", "CPI", "кольпоскопия", "CDS"],
  },
  {
    path: "/tools/calc/gyn/pop-q",
    title: "POP-Q · калькулятор тазового дна",
    description: "Русскоязычный калькулятор POP-Q для описания опущения органов малого таза.",
    keywords: ["POP-Q", "пролапс", "тазовое дно", "гинекология"],
  },
  {
    path: "/tools/calc/gyn/breast-risk",
    title: "Риск рака молочной железы · калькулятор",
    description: "Оценка индивидуального риска рака МЖ для маршрутизации скрининга.",
    keywords: ["молочная железа", "риск", "скрининг", "онкология"],
  },
  {
    path: "/tools/calc/gyn/cervical-cancer-risk",
    title: "Риск рака шейки матки · калькулятор",
    description: "Стратификация риска рака шейки матки для тактики наблюдения и направления.",
    keywords: ["шейка матки", "риск", "скрининг", "HPV"],
  },
  {
    path: "/tools/calc/gyn/ovarian-cancer-risk",
    title: "Риск рака яичников · калькулятор",
    description: "Оценка риска злокачественности аднексальных образований в связке с O-RADS/IOTA.",
    keywords: ["яичник", "O-RADS", "риск", "онкология"],
  },
  {
    path: "/tools/calc/gyn/cin-follow-up",
    title: "Наблюдение после CIN · калькулятор",
    description: "Интервалы и тактика наблюдения после лечения CIN по клиническим алгоритмам.",
    keywords: ["CIN", "наблюдение", "шейка матки"],
  },
  {
    path: "/tools/calc/appointment",
    title: "Калькуляторы приёма · хаб",
    description: "Быстрые расчёты для амбулаторного приёма акушера-гинеколога и врача УЗД.",
    keywords: ["приём", "калькулятор", "акушерство", "гинекология"],
  },
  {
    path: "/ai/consultants/fmf",
    title: "FMF · пренатальный скрининг онлайн",
    description:
      "Модуль FMF: I триместр, скрининги, допплер, шейка матки, рубец на матке. Калькуляторы и протоколы.",
    keywords: ["FMF", "скрининг", "KTР", "ТВП", "акушерство", "УЗИ"],
  },
  {
    path: "/tools/mapping/uterus",
    title: "Матка · FIGO и MUSA · 3D-карта",
    description: "Визуализация миом по FIGO, аденомиоз MUSA, рабочие маркеры для протокола УЗИ.",
    keywords: ["FIGO", "миома", "MUSA", "аденомиоз", "матка", "УЗИ"],
  },
  {
    path: "/tools/obstetrics",
    title: "Хаб акушерства · SonoGyn Pro",
    description: "FMF, фетометрия, Bishop, VBAC, атласы и помощник акушера в одном разделе.",
    keywords: ["акушерство", "FMF", "фетометрия", "УЗИ"],
  },
  {
    path: "/tools/gynecology",
    title: "Хаб гинекологии · SonoGyn Pro",
    description: "O-RADS, FIGO, эндометрий, шейка матки, эластография и нозологии.",
    keywords: ["гинекология", "O-RADS", "эндометрий", "УЗИ"],
  },
  {
    path: "/tools/calc",
    title: "Клинические калькуляторы · каталог",
    description: "O-RADS, BI-RADS, TI-RADS, IOTA, акушерские и гинекологические расчёты по гайдлайнам.",
    keywords: ["калькулятор", "O-RADS", "BI-RADS", "TI-RADS", "IOTA", "акушерство"],
  },
];

const byPath = new Map(CALCULATOR_SEO_REGISTRY.map((entry) => [entry.path, entry]));

export function getCalculatorSeoEntry(path: string): CalculatorSeoEntry | undefined {
  return byPath.get(path);
}

export function calculatorPageMetadata(path: string): Metadata {
  const entry = getCalculatorSeoEntry(path);
  if (!entry) {
    return buildPublicMetadata({
      title: "Клинический калькулятор",
      description: "Инструмент поддержки решений SonoGyn Pro для врачей УЗД и АГ.",
      path,
    });
  }
  return buildPublicMetadata(entry);
}
