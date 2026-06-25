import { BIOMETRY_CURVES, getBiometryCurve, type BiometryCurveId } from "./curves";
import { assessCurveMeasurement, gaWeeksDecimal } from "./measure";
import type { EfwAssessment, ObstetricMeasurementResult, SecondThirdScreeningInput } from "./types";

function hadlockEfwGrams(input: {
  bpdMm?: number;
  hcMm?: number;
  acMm?: number;
  flMm?: number;
}): number | null {
  const { bpdMm, hcMm, acMm, flMm } = input;
  if (![bpdMm, hcMm, acMm, flMm].every((x) => typeof x === "number" && x > 0)) return null;
  const bpd = bpdMm! / 10;
  const hc = hcMm! / 10;
  const ac = acMm! / 10;
  const fl = flMm! / 10;
  const log10 =
    1.3596 - 0.00386 * ac * fl + 0.0064 * hc + 0.00061 * bpd * ac + 0.0424 * ac + 0.174 * fl;
  return Math.round(10 ** log10);
}

const BIOMETRY_INPUT_MAP: Record<
  BiometryCurveId,
  { field: keyof SecondThirdScreeningInput; priorKey: string }
> = {
  bpd: { field: "bpdMm", priorKey: "bpd" },
  ofd: { field: "ofdMm", priorKey: "ofd" },
  hc: { field: "hcMm", priorKey: "hc" },
  ac: { field: "acMm", priorKey: "ac" },
  fl: { field: "flMm", priorKey: "fl" },
  hl: { field: "hlMm", priorKey: "hl" },
};

export function assessBiometryMeasurement(
  curveId: BiometryCurveId,
  value: number,
  gaWeeks: number,
  gaDays = 0,
  prior?: { value: number; gaWeeks: number; gaDays?: number },
): ObstetricMeasurementResult | null {
  const ga = gaWeeksDecimal(gaWeeks, gaDays);
  const curve = getBiometryCurve(curveId);
  return assessCurveMeasurement({
    curve,
    value,
    gaWeeksDecimal: ga,
    priorValue: prior?.value,
    priorGaWeeksDecimal: prior ? gaWeeksDecimal(prior.gaWeeks, prior.gaDays ?? 0) : undefined,
  });
}

export function assessAllBiometry(input: SecondThirdScreeningInput): ObstetricMeasurementResult[] {
  const ga = gaWeeksDecimal(input.gaWeeks, input.gaDays ?? 0);
  const out: ObstetricMeasurementResult[] = [];

  for (const [curveId, meta] of Object.entries(BIOMETRY_INPUT_MAP) as [
    BiometryCurveId,
    (typeof BIOMETRY_INPUT_MAP)[BiometryCurveId],
  ][]) {
    const value = input[meta.field] as number | undefined;
    if (value == null || !Number.isFinite(value)) continue;
    const prior = input.priorMeasurements?.[meta.priorKey];
    const row = assessCurveMeasurement({
      curve: BIOMETRY_CURVES[curveId],
      value,
      gaWeeksDecimal: ga,
      priorValue: prior?.value,
      priorGaWeeksDecimal: prior
        ? gaWeeksDecimal(prior.gaWeeks, prior.gaDays ?? 0)
        : undefined,
    });
    if (row) out.push(row);
  }

  return out;
}

/** EFW Hadlock IV + перцентиль по composite band (p5/p50/p95 от крайних biometry). */
export function assessEfwHadlockIv(
  input: SecondThirdScreeningInput,
  biometry: ObstetricMeasurementResult[],
): EfwAssessment | undefined {
  const grams = hadlockEfwGrams({
    bpdMm: input.bpdMm,
    hcMm: input.hcMm,
    acMm: input.acMm,
    flMm: input.flMm,
  });
  if (grams == null) return undefined;

  const bpd = biometry.find((m) => m.parameterId === "bpd");
  const hc = biometry.find((m) => m.parameterId === "hc");
  const ac = biometry.find((m) => m.parameterId === "ac");
  const fl = biometry.find((m) => m.parameterId === "fl");
  if (!bpd?.band || !hc?.band || !ac?.band || !fl?.band) return undefined;

  const p5 = hadlockEfwGrams({
    bpdMm: bpd.band.p5,
    hcMm: hc.band.p5,
    acMm: ac.band.p5,
    flMm: fl.band.p5,
  });
  const p50 = hadlockEfwGrams({
    bpdMm: bpd.band.p50,
    hcMm: hc.band.p50,
    acMm: ac.band.p50,
    flMm: fl.band.p50,
  });
  const p95 = hadlockEfwGrams({
    bpdMm: bpd.band.p95,
    hcMm: hc.band.p95,
    acMm: ac.band.p95,
    flMm: fl.band.p95,
  });

  if (p5 == null || p50 == null || p95 == null) return undefined;

  const sd = (p95 - p5) / 3.29;
  const z = (grams - p50) / sd;
  const percentile = Math.max(0.1, Math.min(99.9, Math.round((50 + z * 34) * 10) / 10));
  const mom = Math.round((grams / p50) * 1000) / 1000;

  let growthCategory: "sga" | "aga" | "lga" | "unknown" = "aga";
  if (percentile < 10) growthCategory = "sga";
  else if (percentile > 90) growthCategory = "lga";

  return {
    grams,
    formula: "Hadlock IV (BPD-HC-AC-FL, 1985)",
    expected: p50,
    sd,
    percentile,
    zScore: Math.round(z * 100) / 100,
    mom,
    growthCategory,
    interpretation: `EFW ${grams} г (~${percentile}-й перц., ${growthCategory.toUpperCase()}). Hadlock IV. Не диагноз.`,
  };
}
