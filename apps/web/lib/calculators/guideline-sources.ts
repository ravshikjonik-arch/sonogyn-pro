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
    { label: "Hadlock et al., Radiology 1985 (EFW)", href: "https://pubmed.ncbi.nlm.nih.gov/" },
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
};

export function getCalculatorGuidelineSources(calculatorId: string): GuidelineSourceLink[] {
  return CALCULATOR_GUIDELINE_SOURCES[calculatorId] ?? [];
}
