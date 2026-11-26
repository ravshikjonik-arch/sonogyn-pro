/**
 * FMF reference computations — assessment calculators.
 *
 * Sources (published models, reimplemented; NOT copied from FMF software):
 * - GA from CRL: Robinson HP, Fleming JE. BJOG 1975 (as used by FMF).
 * - GA from HC:  Snijders RJ, Nicolaides KH. UOG 1994;4:34-48.
 * - NT mixture model: Wright D, Kagan KO, Molina FS, Gazzoni A, Nicolaides KH.
 *   UOG 2008;31:376-83.
 * - EFW / weight charts: Wright D, Syngelaki A, Wright A, Akolekar R.
 *   "FMF fetal and neonatal population weight charts" UOG 2018.
 * - UA PI / MCA PI / CPR / UtA PI reference ranges: FMF reference ranges
 *   (cross-verified against archive.fetalmedicine.org outputs, 2026-11).
 * - MCA PSV (anemia): Mari G et al. NEJM 2000 (modified, as used by FMF).
 * - DV PI: FMF reference range (verified vs live calculators).
 *
 * Numerical verification: 33/33 checks against archive.fetalmedicine.org
 * JS engine (2026-11-26) matched to <=15 significant digits.
 */

const log10 = (x: number) => Math.log10(x);

/** Normal CDF, Abramowitz–Stegun 26.2.17 (same rational approx FMF uses). */
export function normalCdf(mean: number, sd: number, x: number): number {
  const n = (x - mean) / Math.sqrt(2 * sd * sd);
  const r = 1 / (1 + 0.3275911 * Math.abs(n));
  const l =
    1 -
    ((((1.061405429 * r - 1.453152027) * r + 1.421413741) * r - 0.284496736) * r + 0.254829592) *
      r *
      Math.exp(-n * n);
  return 0.5 * (1 + (n < 0 ? -1 : 1) * l);
}

/** z (SDS) -> centile 0..100 (rounded). */
export function centileFromZ(z: number): number {
  if (!Number.isFinite(z)) return NaN;
  return Math.round(100 * normalCdf(0, 1, z));
}

/* ---------------- Pregnancy dating ---------------- */

/** GA in DAYS from CRL (mm). Valid CRL 45–84. Robinson & Fleming 1975. */
export function gaFromCrl(crl: number): number | null {
  if (crl < 45 || crl > 84) return null;
  return 23.53 + 8.052 * Math.sqrt(1.037 * crl);
}

/** GA in DAYS from HC (mm). Valid HC 155–226. Snijders & Nicolaides 1994. */
export function gaFromHc(hc: number): number | null {
  if (hc < 155 || hc > 226) return null;
  const t = 0.0596493 ** 2 + 0.0029976 * (1.3369692 - log10(hc + 1));
  return (7 * (-0.0596493 + Math.sqrt(t))) / -0.0014988;
}

export function formatGa(days: number): string {
  const w = Math.floor(days / 7);
  const d = Math.round(days - w * 7);
  return `${w}+${d}`;
}

/* ---------------- NT (Wright 2008 mixture model) ---------------- */

const NT_P = {
  b0: -0.8951,
  b1: 0.0294,
  b2: -1.812e-4,
  a0: -0.3319,
  a1: -0.0379,
  m1: 0.3019,
  sdev1: 0.1945,
  sdReg: 0.079,
  sdOp: 0.0289,
  tp: 81.12582781,
} as const;
const NT_SD_REG = Math.sqrt(NT_P.sdReg ** 2 + NT_P.sdOp ** 2);
const NT_SDEV1 = Math.sqrt(NT_P.sdev1 ** 2 + NT_P.sdOp ** 2);

function ntP1(crl: number): number {
  return 1 / (1 + Math.exp(-(NT_P.a0 + NT_P.a1 * crl)));
}
function ntMreg(crl: number): number {
  const a = Math.min(crl, NT_P.tp);
  return NT_P.b0 + NT_P.b1 * a + NT_P.b2 * a * a;
}
/** Median NT (mm) for CRL 45–84. */
export function ntMedian(crl: number): number | null {
  if (crl < 45 || crl > 84) return null;
  return Math.pow(10, ntMreg(crl));
}
/** log10 of median NT (FMF expectedNtLog10). */
export function expectedNtLog10(crl: number): number | null {
  if (crl < 45 || crl > 84) return null;
  return ntMreg(crl);
}
/** Delta NT = measured − median (mm). */
export function ntDelta(nt: number, crl: number): number | null {
  if (crl < 45 || crl > 84 || nt <= 0) return null;
  return nt - ntMedian(crl)!;
}
/** Centile of NT (mm) for CRL 45–84 (0..100). */
export function ntCentile(nt: number, crl: number): number | null {
  if (crl < 45 || crl > 84 || nt <= 0) return null;
  const pp =
    (1 - ntP1(crl)) * normalCdf(ntMreg(crl), NT_SD_REG, log10(nt)) +
    ntP1(crl) * normalCdf(NT_P.m1, NT_SDEV1, log10(nt));
  return Math.floor(100 * pp);
}

/* ---------------- Fetal heart rate ---------------- */

/** Expected FHR (bpm) for GA in DAYS. */
export function fhrExpected(gaDays: number): number {
  return 265.98 - 1.7631 * gaDays + 0.0064445 * gaDays * gaDays;
}
/** FHR delta (bpm, measured − expected). */
export function fhrDelta(fhr: number, gaDays: number): number | null {
  if (fhr <= 0 || gaDays <= 0) return null;
  return fhr - fhrExpected(gaDays);
}

/* ---------------- EFW & weight charts (Wright 2018) ---------------- */

/** log10(expected weight g) for GA in DAYS (valid >= 150). */
export function expectedFwLog10(gaDays: number): number | null {
  if (gaDays < 150) return null;
  const x = gaDays - 199,
    t = x * x;
  return 3.0893 + 0.00835 * x - 2.965e-5 * t - 6.062e-8 * t * x;
}
export function expectedFw(gaDays: number): number | null {
  const l = expectedFwLog10(gaDays);
  return l === null ? null : Math.pow(10, l);
}
export function expectedFwSdLog10(gaDays: number): number {
  return 0.02464 + 5.639669e-5 * gaDays;
}
/** z-score of EFW (g) for GA in DAYS. */
export function fwZ(efw: number, gaDays: number): number | null {
  const m = expectedFwLog10(gaDays);
  if (efw <= 0 || m === null) return null;
  return (log10(efw) - m) / expectedFwSdLog10(gaDays);
}
/** SD for birth weight (adds measurement variance 0.03363 in log10). */
export function daveBwSdLog10(gaDays: number): number {
  return Math.sqrt(expectedFwSdLog10(gaDays) ** 2 + 0.03363 ** 2);
}
/** z of measured weight (g, >500) vs GA in DAYS (FMF daveBwZ). */
export function daveBwZ(bw: number, gaDays: number): number | null {
  if (bw <= 500) return null;
  const m = expectedFwLog10(gaDays);
  if (m === null) return null;
  return (log10(bw) - m) / daveBwSdLog10(gaDays);
}
/** z of birth weight (g) vs GA in WEEKS (FMF bwZ, polynomial form). */
export function bwZ(bw: number, gaWeeks: number): number | null {
  if (bw <= 0 || gaWeeks < 22 || gaWeeks > 42) return null;
  const x = gaWeeks - 40;
  const m = 3459.38166 + 156.06885 * x - 11.78448 * x * x - 0.67449 * x * x * x;
  const sd = 1.253314 * (0.15085 * m - 23.90275 - 1.39e-5 * m * m);
  return (bw - m) / sd;
}

/* ---------------- Doppler PI reference ranges (GA in DAYS > 139) ---------------- */

export function expectedUa(gaDays: number): number | null {
  return gaDays > 139 ? 1.64737123 - 0.003004566 * gaDays : null;
}
export function uaSdLog10(gaDays: number): number | null {
  return gaDays > 139
    ? 0.0871258999174847 - 2.93587139447361e-4 * gaDays + 9.35493584242832e-7 * gaDays * gaDays
    : null;
}
export function uaZ(pi: number, gaDays: number): number | null {
  if (pi <= 0) return null;
  const e = expectedUa(gaDays),
    s = uaSdLog10(gaDays);
  return e === null || s === null ? null : (log10(pi) - log10(e)) / s;
}

export function expectedMca(gaDays: number): number | null {
  const logM = expectedMcaLog10(gaDays);
  return gaDays > 139 && logM !== null ? Math.pow(10, logM) : null;
}
function expectedMcaLog10(gaDays: number): number | null {
  return gaDays > 139
    ? 0.3117131 - 0.007099515 * gaDays + 6.345179e-5 * gaDays * gaDays - 1.442668e-7 * gaDays ** 3
    : null;
}
export const MCA_SD_LOG10 = 0.06349;
export function mcaZ(pi: number, gaDays: number): number | null {
  if (pi <= 0) return null;
  const e = expectedMcaLog10(gaDays);
  return e === null ? null : (log10(pi) - e) / MCA_SD_LOG10;
}

export function expectedCpr(gaDays: number): number | null {
  const logM = expectedCprLog10(gaDays);
  return gaDays > 139 && logM !== null ? Math.pow(10, logM) : null;
}
function expectedCprLog10(gaDays: number): number | null {
  return gaDays > 139
    ? 3.969296e-4 * gaDays - 0.3564455 + 3.199398e-5 * gaDays * gaDays - 9.265749e-8 * gaDays ** 3
    : null;
}
export function cprSdLog10(gaDays: number): number | null {
  return gaDays > 139 ? 0.1948405 - 0.001220327 * gaDays + 3.26213e-6 * gaDays * gaDays : null;
}
export function cprZ(cpr: number, gaDays: number): number | null {
  if (cpr <= 0) return null;
  const e = expectedCprLog10(gaDays),
    s = cprSdLog10(gaDays);
  return e === null || s === null ? null : (log10(cpr) - e) / s;
}

export function expectedUtpi(gaDays: number): number | null {
  const logM = expectedUtpiLog10(gaDays);
  return gaDays > 139 && logM !== null ? Math.pow(10, logM) : null;
}
function expectedUtpiLog10(gaDays: number): number | null {
  return gaDays > 139
    ? 0.625710181487661 - 0.0053761907652857 * gaDays + 8.86906485714508e-6 * gaDays * gaDays
    : null;
}
export function utpiSdLog10(gaDays: number): number | null {
  return gaDays > 139 ? 0.132424838 - 1.04066e-4 * gaDays : null;
}
export function utpiZ(pi: number, gaDays: number): number | null {
  if (pi <= 0) return null;
  const e = expectedUtpiLog10(gaDays),
    s = utpiSdLog10(gaDays);
  return e === null || s === null ? null : (log10(pi) - e) / s;
}

/* ---------------- Ductus venosus PI (GA in DAYS 126–294) ---------------- */

export function expectedDvpi(gaDays: number): number | null {
  const w = gaDays / 7;
  const m = expectedDvpiSqrt(w);
  return m === null ? null : m * m;
}
export function expectedDvpiSqrt(gaWeeks: number): number | null {
  return gaWeeks >= 18 && gaWeeks <= 42 ? 2e-4 * gaWeeks * gaWeeks - 0.019 * gaWeeks + 1.0847 : null;
}
export function expectedDvpiSdSqrt(gaWeeks: number): number {
  return 5e-5 * gaWeeks + 0.0912;
}
export function dvpiZ(pi: number, gaDays: number): number | null {
  if (pi <= 0) return null;
  const w = gaDays / 7;
  const m = expectedDvpiSqrt(w);
  if (m === null) return null;
  return (Math.sqrt(pi) - m) / expectedDvpiSdSqrt(w);
}

/* ---------------- Fetal anemia: MCA PSV + Hb (GA in WEEKS 18–38) ---------------- */

export function expectedMcaPsv(gaWeeks: number): number | null {
  return gaWeeks >= 18 && gaWeeks <= 38 ? Math.pow(10, 0.963 + 0.0223 * gaWeeks) : null;
}
export function expectedMcaPsvSd(gaWeeks: number): number | null {
  const e = expectedMcaPsv(gaWeeks);
  return e === null ? null : Math.pow(10, 1.045981 + 0.0223 * gaWeeks) - e;
}
export function mcaPsvZ(psv: number, gaWeeks: number): number | null {
  const e = expectedMcaPsv(gaWeeks),
    s = expectedMcaPsvSd(gaWeeks);
  return e === null || s === null || psv <= 0 ? null : (psv - e) / s;
}
export function expectedHb(gaWeeks: number): number | null {
  return gaWeeks >= 18 && gaWeeks <= 38 ? 7.9 + 0.19 * gaWeeks : null;
}