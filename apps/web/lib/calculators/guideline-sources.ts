export type GuidelineSourceLink = {
  label: string;
  href: string;
};

/** Публичные гайдлайны и внутренние рефераты SonoGyn (без подмены КР репозитория). */
export const CALCULATOR_GUIDELINE_SOURCES: Record<string, GuidelineSourceLink[]> = {
  bishop: [
    { label: "ACOG — индукция родов (клинический контекст)", href: "https://www.acog.org/clinical/clinical-guidance" },
    { label: "ISUOG — практические параметры УЗИ в акушерстве", href: "/tools/refs/norms" },
  ],
  vbac: [
    { label: "ACOG — TOLAC / VBAC", href: "https://www.acog.org/clinical/clinical-guidance" },
    { label: "Калькуляторы акушерства · хаб", href: "/tools/obstetrics" },
  ],
  "fetal-weight": [
    { label: "Hadlock et al., Radiology 1985 (EFW)", href: "https://pubmed.ncbi.nlm.nih.gov/3879946/" },
    { label: "Нормы фетометрии", href: "/tools/calc/ob/fetometry-norms" },
  ],
  "o-rads": [
    { label: "ACR O-RADS US v2022 — реферат", href: "/tools/refs/orads-guide" },
    { label: "IOTA Simple Rules", href: "/tools/calc/rads/iota" },
  ],
  iota: [
    { label: "IOTA — ADNEX model", href: "https://pubmed.ncbi.nlm.nih.gov/23896425/" },
    { label: "O-RADS US v2022", href: "/tools/refs/orads-guide" },
  ],
  "bi-rads": [
    { label: "ACR BI-RADS Ultrasound", href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/Bi-Rads" },
    { label: "BI-RADS · литература в приложении", href: "/tools/calc/rads/bi-rads" },
  ],
  "ti-rads": [
    { label: "ACR TI-RADS", href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/Ti-Rads" },
  ],
  endometrium: [
    { label: "ISUOG — endometrium", href: "/tools/refs/norms" },
  ],
  elastography: [
    { label: "WFUMB / strain guidelines (обзор)", href: "https://pubmed.ncbi.nlm.nih.gov/" },
  ],
  "breast-risk": [
    { label: "Gail model (NCI) — ориентир", href: "https://www.cancer.gov/research/infrastructure/cancer-research-data/bcrp/tools/gail" },
    { label: "BI-RADS", href: "/tools/calc/rads/bi-rads" },
  ],
  "cervical-cancer-risk": [
    { label: "КР МЗ РФ — РШМ", href: "/tools/refs/guidelines" },
    { label: "ASCCP risk-based management", href: "https://www.asccp.org/" },
  ],
  "ovarian-cancer-risk": [
    { label: "IOTA / O-RADS", href: "/tools/calc/rads/o-rads" },
    { label: "ACR O-RADS US v2022", href: "/tools/refs/orads-guide" },
  ],
  "cin-follow-up": [
    { label: "ASCCP 2019 (ориентир наблюдения)", href: "https://www.asccp.org/" },
    { label: "КР МЗ РФ — цервикальный рак", href: "/tools/refs/guidelines" },
  ],
  "cin-risk": [
    { label: "BSCCP / colposcopy standards", href: "/tools/calc/gyn/colposcopy" },
  ],
  colposcopy: [
    { label: "IFCPC terminology", href: "https://www.colposcopy.org/" },
    { label: "Swede score", href: "/tools/calc/gyn/colposcopy" },
  ],
  "cervical-intelligence": [
    { label: "КР РФ · цервикальный канал", href: "/tools/refs/cervix-pathology" },
  ],
  "cervical-length": [
    { label: "ISUOG — cervical length", href: "https://www.isuog.org/clinical-resources/guidelines" },
    { label: "Протокол приёма · CL", href: "/tools/calc/appointment" },
  ],
  "pop-q": [
    { label: "POP-Q staging (ICS)", href: "https://www.ics.org/" },
  ],
  "ln-rads": [
    { label: "ACR LN-RADS v2023", href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/LN-Rads" },
  ],
  "ob-afi": [
    { label: "Phelan et al. AFI (1987)", href: "https://pubmed.ncbi.nlm.nih.gov/3652045/" },
    { label: "ISUOG — amniotic fluid", href: "https://www.isuog.org/clinical-resources/guidelines" },
  ],
  "ob-crl": [
    { label: "ISUOG — 1st-trimester dating (clinical practice)", href: "https://www.isuog.org/clinical-resources/guidelines" },
    { label: "Фетометрия I триместра (табл. Медведева в приложении)", href: "/tools/calc/ob?tab=feto" },
    { label: "Robinson & Fleming, BJOG 1975 (CRL)", href: "https://pubmed.ncbi.nlm.nih.gov/1182090/" },
  ],
  "ob-hub": [
    { label: "Hadlock EFW", href: "/tools/calc/ob/fetal-weight" },
    { label: "Нормы УЗИ", href: "/tools/refs/norms" },
  ],
};

export function getCalculatorGuidelineSources(calculatorId: string): GuidelineSourceLink[] {
  return CALCULATOR_GUIDELINE_SOURCES[calculatorId] ?? [];
}
