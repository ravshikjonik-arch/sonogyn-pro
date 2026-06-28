import type { ElastographyReferenceRow } from "../types";

/**
 * Справочная таблица cut-off значений для UI (не для расчёта).
 * Отображается на экране калькулятора как клинический ориентир.
 */
export const REFERENCE_TABLE: ElastographyReferenceRow[] = [
  {
    organ: "cervix",
    parameter: "CCI (внутр./наруж.)",
    lowRisk: "> 0.7",
    intermediate: "0.5 – 0.7",
    highRisk: "< 0.5",
    source: "EFSUMB/WFUMB — cervical strain elastography (consensus)",
  },
  {
    organ: "myometrium",
    parameter: "SWE Ratio (Eобр/Eмио)",
    lowRisk: "зависит от типа",
    intermediate: "1.0 – 1.5",
    highRisk: "миома: >1.5, E>45 кПа",
    source: "Shear wave uterine fibroid literature",
  },
  {
    organ: "ovary",
    parameter: "Strain ratio / E (кПа)",
    lowRisk: "SR<3; E<30",
    intermediate: "SR 3–5; E 30–50",
    highRisk: "SR>5; E>50",
    source: "IOTA/ADNEX correlation; WFUMB adnexal SWE",
  },
  {
    organ: "breast",
    parameter: "Tsukuba / Emax",
    lowRisk: "1–2; Emax<80",
    intermediate: "3; Emax 80–160",
    highRisk: "4–5; Emax>160",
    source: "Tsukuba score; ACR BI-RADS US elastography adjunct",
  },
];

/** Ключ i18n для дисклеймера модуля эластографии. */
export const ELASTO_DISCLAIMER_KEY = "elasto_disclaimer";
