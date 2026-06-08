/**
 * FMF helpers — shared formulas live in @repo/medical-calculations.
 */
import {
  efwHadlock4,
  formatGestationalAge,
  gaDaysFromCrlMm,
} from "@repo/medical-calculations";

export function daysBetween(fromIso: string, to = new Date()): number | null {
  const d = new Date(fromIso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((to.getTime() - d.getTime()) / (24 * 3600 * 1000));
}

/** CRL (mm) → gestational days (Robinson-Fleming). */
export function gaDaysByCrl(crlMm: number): number | null {
  return gaDaysFromCrlMm(crlMm);
}

export function formatGa(days: number | null): string {
  if (days == null || days <= 0) return "не определен";
  return formatGestationalAge(days);
}

/** Hadlock IV (BPD, HC, AC, FL) — inputs in mm, output grams. */
export function hadlockEfwGrams(input: {
  bpd?: number;
  hc?: number;
  ac?: number;
  fl?: number;
}): number | null {
  const r = efwHadlock4({
    bpdMm: input.bpd,
    hcMm: input.hc,
    acMm: input.ac,
    flMm: input.fl,
  });
  return r?.grams ?? null;
}
