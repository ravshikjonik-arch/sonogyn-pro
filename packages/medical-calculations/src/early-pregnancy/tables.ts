import type { EarlyBiometryParameter, GaReferenceRow } from "./types";

function ga(weeks: number, days = 0): { gaDays: number; gaLabel: string } {
  return { gaDays: weeks * 7 + days, gaLabel: `${weeks}+${days}` };
}

/** Плодное яйцо (MSD / СДП), мм — p5 / p50 / p95 по сроку. */
export const MSD_REFERENCE: GaReferenceRow[] = [
  { ...ga(4, 0), band: { p5: 2, p50: 3, p95: 5 } },
  { ...ga(4, 5), band: { p5: 5, p50: 7, p95: 10 } },
  { ...ga(5, 0), band: { p5: 7, p50: 10, p95: 14 } },
  { ...ga(5, 5), band: { p5: 12, p50: 16, p95: 21 } },
  { ...ga(6, 0), band: { p5: 15, p50: 20, p95: 26 } },
  { ...ga(6, 5), band: { p5: 20, p50: 27, p95: 34 } },
  { ...ga(7, 0), band: { p5: 23, p50: 30, p95: 38 } },
  { ...ga(8, 0), band: { p5: 33, p50: 40, p95: 48 } },
  { ...ga(9, 0), band: { p5: 43, p50: 50, p95: 58 } },
  { ...ga(10, 0), band: { p5: 53, p50: 60, p95: 69 } },
  { ...ga(11, 0), band: { p5: 63, p50: 70, p95: 80 } },
];

/** Желточный мешок (YSD), мм — целые недели. */
export const YSD_REFERENCE: GaReferenceRow[] = [
  { ...ga(5), band: { p5: 2.0, p50: 3.0, p95: 4.5 } },
  { ...ga(6), band: { p5: 2.5, p50: 3.5, p95: 5.0 } },
  { ...ga(7), band: { p5: 3.0, p50: 4.0, p95: 5.5 } },
  { ...ga(8), band: { p5: 3.5, p50: 4.5, p95: 6.0 } },
  { ...ga(9), band: { p5: 3.5, p50: 4.5, p95: 6.0 } },
  { ...ga(10), band: { p5: 3.0, p50: 4.0, p95: 5.5 } },
];

/** Эмбрион (CRL / КТР), мм. */
export const CRL_EARLY_REFERENCE: GaReferenceRow[] = [
  { ...ga(5, 5), band: { p5: 1, p50: 2, p95: 3 } },
  { ...ga(6, 0), band: { p5: 2, p50: 4, p95: 6 } },
  { ...ga(6, 5), band: { p5: 5, p50: 8, p95: 11 } },
  { ...ga(7, 0), band: { p5: 7, p50: 10, p95: 13 } },
  { ...ga(7, 5), band: { p5: 11, p50: 15, p95: 19 } },
  { ...ga(8, 0), band: { p5: 14, p50: 18, p95: 22 } },
  { ...ga(8, 5), band: { p5: 20, p50: 24, p95: 29 } },
  { ...ga(9, 0), band: { p5: 23, p50: 28, p95: 34 } },
  { ...ga(9, 5), band: { p5: 30, p50: 36, p95: 42 } },
  { ...ga(10, 0), band: { p5: 35, p50: 42, p95: 49 } },
  { ...ga(10, 5), band: { p5: 42, p50: 50, p95: 58 } },
  { ...ga(11, 0), band: { p5: 48, p50: 57, p95: 66 } },
  { ...ga(11, 6), band: { p5: 55, p50: 64, p95: 74 } },
];

export const EARLY_PREGNANCY_GROWTH_SOURCE =
  "Sonogyn Pro · ранняя беременность (MSD/YSD/CRL): референсные кривые p5–p95, расширение до P3–P97; клинические пороги ЖМ по ISUOG/RCOG.";

export const PARAMETER_LABELS_RU: Record<EarlyBiometryParameter, string> = {
  msd: "СДП (MSD)",
  ysd: "Желточный мешок (YSD)",
  crl: "КТР (CRL)",
};

export function referenceTableFor(parameter: EarlyBiometryParameter): GaReferenceRow[] {
  switch (parameter) {
    case "msd":
      return MSD_REFERENCE;
    case "ysd":
      return YSD_REFERENCE;
    case "crl":
      return CRL_EARLY_REFERENCE;
  }
}
