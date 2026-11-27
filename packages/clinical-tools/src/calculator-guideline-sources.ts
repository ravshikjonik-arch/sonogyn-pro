export type GuidelineSourceLink = {
  label: string;
  href: string;
};

/** Публичные гайдлайны и рефераты (App Store 1.4.1 · web + mobile). */
export const CALCULATOR_GUIDELINE_SOURCES: Record<string, GuidelineSourceLink[]> = {
  bishop: [
    { label: "ACOG — индукция родов (клинический контекст)", href: "https://www.acog.org/clinical/clinical-guidance" },
    { label: "ISUOG — practice guidelines (obstetric US)", href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html" },
  ],
  vbac: [
    { label: "ACOG — TOLAC / VBAC", href: "https://www.acog.org/clinical/clinical-guidance" },
    { label: "Акушерский хаб SonoGyn Pro", href: "https://sonogyn-pro.ru/tools/calc/ob" },
  ],
  "fetal-weight": [
    { label: "Hadlock et al., Radiology 1985 (EFW)", href: "https://pubmed.ncbi.nlm.nih.gov/" },
    { label: "Фетометрия · нормы", href: "https://sonogyn-pro.ru/tools/calc/ob/fetal-weight" },
  ],
  "o-rads": [
    { label: "ACR O-RADS US v2022", href: "https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/O-RADS" },
    { label: "Реферат O-RADS US · SonoGyn Pro", href: "https://sonogyn-pro.ru/tools/refs/orads-guide" },
    { label: "IOTA — ADNEX / Simple Rules", href: "https://pubmed.ncbi.nlm.nih.gov/23896425/" },
  ],
  iota: [
    { label: "IOTA ADNEX model", href: "https://pubmed.ncbi.nlm.nih.gov/23896425/" },
    { label: "IOTA Simple Rules (consensus)", href: "https://pubmed.ncbi.nlm.nih.gov/26442448/" },
    { label: "ACR O-RADS US v2022", href: "https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/O-RADS" },
  ],
  "bi-rads": [
    { label: "ACR BI-RADS Ultrasound", href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/Bi-Rads" },
    { label: "ACR BI-RADS Mammography", href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/Bi-Rads" },
  ],
  "ti-rads": [
    { label: "ACR TI-RADS 2017", href: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/Ti-Rads" },
    { label: "ETA EU-TIRADS (thyroid nodules)", href: "https://eta-website.org" },
  ],
  endometrium: [
    { label: "ISUOG — sonographic assessment of the endometrium (2024)", href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html" },
    { label: "IETA consensus (endometrial morphology)", href: "https://pubmed.ncbi.nlm.nih.gov/29504838/" },
  ],
  elastography: [
    { label: "WFUMB — strain elastography (overview)", href: "https://pubmed.ncbi.nlm.nih.gov/" },
  ],
  fmf: [
    { label: "Fetal Medicine Foundation", href: "https://www.fetalmedicine.org" },
    { label: "ISUOG — 11–14 week ultrasound scan (2024)", href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html" },
    { label: "FMF · комната SonoGyn Pro", href: "https://sonogyn-pro.ru/tools/fmf" },
  ],
  "ga-crl": [
    { label: "ISUOG — pregnancy dating / CRL", href: "https://www.isuog.org/clinical-resources/isuog-guidelines.html" },
    { label: "Robinson & Fleming (CRL dating)", href: "https://pubmed.ncbi.nlm.nih.gov/11869252/" },
  ],
};

export function getCalculatorGuidelineSources(calculatorId: string): GuidelineSourceLink[] {
  return CALCULATOR_GUIDELINE_SOURCES[calculatorId] ?? [];
}