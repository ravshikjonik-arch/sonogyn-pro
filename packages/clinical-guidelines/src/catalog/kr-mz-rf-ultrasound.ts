import type { ClinicalGuideline } from "../types";

/** КР и стандарты с акцентом на УЗ-диагностику */
export const KR_MZ_RF_ULTRASOUND: ClinicalGuideline[] = [
  {
    id: "kr-mz-breast-us",
    title: "УЗИ молочных желёз (в контексте КР по ЗНО МЖ)",
    summary: "Показания, описание образований, связь с BI-RADS, маршрутизация.",
    shelf: "kr_mz_rf",
    documentKind: "clinical_recommendation",
    issuer: "mz_rf",
    specialty: "mammology",
    year: 2024,
    status: "active",
    officialUrl: "https://cr.minzdrav.gov.ru/",
    tags: ["МЖ", "BI-RADS", "УЗИ", "маммология"],
  },
  {
    id: "kr-mz-gynecologic-us",
    title: "Ультразвуковая диагностика в гинекологии (обобщающие КР)",
    summary: "Стандарт описания органов малого таза, IOTA, O-RADS, документирование.",
    shelf: "kr_mz_rf",
    documentKind: "clinical_recommendation",
    issuer: "mz_rf",
    specialty: "ultrasound",
    year: 2024,
    status: "active",
    officialUrl: "https://cr.minzdrav.gov.ru/",
    tags: ["УЗИ", "O-RADS", "IOTA", "малого таза"],
    sections: [
      {
        title: "O-RADS / IOTA — тактика",
        bullets: [
          "Для образований яичников используйте структурированное описание (IOTA terms) и стратификацию риска O-RADS US.",
          "O-RADS 3: низкий риск — наблюдение по локальному протоколу; при росте или новых признаках — повторная оценка / эскалация.",
          "Заключение должно содержать категорию риска и рекомендованный интервал наблюдения — не диагноз «доброкачественное/злокачественное».",
        ],
      },
      {
        title: "Документирование",
        bullets: [
          "Стандартный протокол малого таза: матка, эндометрий, яичники, Дугласово пространство, допплер при показаниях.",
        ],
      },
    ],
  },
];
