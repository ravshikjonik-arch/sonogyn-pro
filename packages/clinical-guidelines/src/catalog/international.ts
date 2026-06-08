import type { ClinicalGuideline } from "../types";

export const INTERNATIONAL_GUIDELINES: ClinicalGuideline[] = [
  {
    id: "int-isuog-obstetric",
    title: "ISUOG Practice Guidelines (акушерское УЗИ)",
    summary: "Международные практические рекомендации ISUOG — дополнение к КР РФ.",
    shelf: "international",
    documentKind: "standard",
    issuer: "isuo",
    specialty: "ultrasound",
    year: 2024,
    status: "active",
    officialUrl: "https://www.isuog.org/",
    tags: ["ISUOG", "акушерство", "УЗИ"],
  },
  {
    id: "int-eshre-endometriosis",
    title: "ESHRE Guideline — Endometriosis",
    summary: "Диагностика и лечение эндометриоза (европейский консенсус).",
    shelf: "international",
    documentKind: "clinical_recommendation",
    issuer: "eshre",
    specialty: "obgyn",
    year: 2022,
    status: "active",
    officialUrl: "https://www.eshre.eu/",
    tags: ["ESHRE", "эндометриоз"],
    relatedNosologyIds: ["pelvic-endometriosis", "endometrioma"],
  },
];
