import type { ClinicalGuideline } from "../types";

/** КР Минздрава РФ — акушерство и пренатальная диагностика */
export const KR_MZ_RF_OBSTETRICS: ClinicalGuideline[] = [
  {
    id: "kr-mz-ectopic",
    title: "Внематочная (эктопическая) беременность",
    summary: "Диагностика на ранних сроках, тактика (медикаментозная / хирургическая).",
    shelf: "kr_mz_rf",
    documentKind: "clinical_recommendation",
    issuer: "mz_rf",
    specialty: "obstetrics",
    year: 2024,
    status: "active",
    officialUrl: "https://cr.minzdrav.gov.ru/",
    tags: ["ВБ", "эктопическая", "ХГЧ", "УЗИ"],
  },
  {
    id: "kr-mz-prenatal-screening",
    title: "Пrenatal screening (скрининг 1–2 триместра)",
    summary: "Сроки, маркеры, комбинированный скрининг, направление к генетику.",
    shelf: "kr_mz_rf",
    documentKind: "clinical_recommendation",
    issuer: "mz_rf",
    specialty: "prenatal",
    year: 2024,
    status: "active",
    officialUrl: "https://cr.minzdrav.gov.ru/",
    tags: ["скрининг", "КТР", "ТВП", "11-13", "18-21"],
  },
];
