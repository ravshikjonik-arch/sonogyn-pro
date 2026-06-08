import type { ClinicalGuideline } from "../types";

/** КР Минздрава РФ — гинекология */
export const KR_MZ_RF_OBGYN: ClinicalGuideline[] = [
  {
    id: "kr-mz-myoma",
    title: "Лейомиома матки",
    summary: "Диагностика, наблюдение и лечение миомы матки. УЗИ, FIGO, тактика.",
    shelf: "kr_mz_rf",
    documentKind: "clinical_recommendation",
    issuer: "mz_rf",
    specialty: "obgyn",
    year: 2024,
    status: "active",
    officialUrl: "https://cr.minzdrav.gov.ru/",
    tags: ["миома", "FIGO", "УЗИ", "лейомиома"],
    relatedNosologyIds: ["uterine-myoma"],
    sections: [
      {
        title: "Диагностика (УЗИ)",
        bullets: [
          "ТВ-УЗИ — метод первой линии; оценка количества, размеров, локализации узлов (FIGO).",
          "При неясной локализации или подготовке к операции — МРТ малого таза.",
        ],
      },
    ],
  },
  {
    id: "kr-mz-endometriosis",
    title: "Эндометриоз",
    summary: "Диагностика и лечение эндометриоза, в т.ч. глубокой формы и болевого синдрома.",
    shelf: "kr_mz_rf",
    documentKind: "clinical_recommendation",
    issuer: "mz_rf",
    specialty: "obgyn",
    year: 2024,
    status: "active",
    officialUrl: "https://cr.minzdrav.gov.ru/",
    tags: ["эндометриоз", "дисменорея", "УЗИ", "IDEA"],
    relatedNosologyIds: ["pelvic-endometriosis", "endometrioma"],
  },
  {
    id: "kr-mz-hyperplasia",
    title: "Гиперпластические процессы эндометрия",
    summary: "Атипия, риск рака эндометрия, тактика при аномальных маточных кровотечениях.",
    shelf: "kr_mz_rf",
    documentKind: "clinical_recommendation",
    issuer: "mz_rf",
    specialty: "obgyn",
    year: 2023,
    status: "active",
    officialUrl: "https://cr.minzdrav.gov.ru/",
    tags: ["эндометрий", "АМК", "гиперплазия"],
    relatedNosologyIds: ["endometrial-hyperplasia"],
  },
];
