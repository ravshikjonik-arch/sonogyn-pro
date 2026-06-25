import { getCurve } from "./curves";
import { assessMeasurement, assessNtFromCrl, calculateMap } from "./engine";
import { gaDaysFromCrlMm } from "./math";
import type {
  CategoricalResult,
  FirstTrimesterScreeningInput,
  FirstTrimesterScreeningOutput,
  PercentileResult,
} from "./types";

function normalizeNasalBone(
  v?: FirstTrimesterScreeningInput["nasalBone"],
): "present" | "absent" | "hypoplastic" | "uncertain" | undefined {
  if (!v) return undefined;
  if (v === "seen") return "present";
  if (v === "not_seen") return "absent";
  return v;
}

function assessNasalBone(
  category?: ReturnType<typeof normalizeNasalBone>,
): CategoricalResult | null {
  if (!category) return null;
  const curve = getCurve("nasal_bone") as unknown as {
    categories: Record<
      string,
      { labelRu: string; likelihoodRatioT21: number; interpretation: string }
    >;
  };
  const row = curve.categories[category];
  if (!row) return null;
  return {
    parameterId: "nasal_bone",
    labelRu: "Носовая кость",
    category: row.labelRu,
    likelihoodRatio: row.likelihoodRatioT21,
    interpretation: `${row.interpretation} (LR T21 ≈ ${row.likelihoodRatioT21}).`,
    source: getCurve("nasal_bone").source,
  };
}

function assessTricuspid(input: FirstTrimesterScreeningInput): CategoricalResult | null {
  const curve = getCurve("tricuspid_regurgitation") as unknown as {
    rules: Array<{
      class: string;
      labelRu: string;
      when: Record<string, number>;
      interpretation: string;
    }>;
    fallbackQualitative: Record<string, { class: string; interpretation: string }>;
  };

  const v = input.tricuspidVelocityCmS;
  const d = input.tricuspidDurationFraction;

  if (v != null && d != null) {
    for (const rule of [...curve.rules].reverse()) {
      const w = rule.when;
      const velOk =
        (w.minVelocityCmS == null || v >= w.minVelocityCmS) &&
        (w.maxVelocityCmS == null || v <= w.maxVelocityCmS);
      const durOk =
        (w.minDurationFraction == null || d >= w.minDurationFraction) &&
        (w.maxDurationFraction == null || d <= w.maxDurationFraction);
      if (velOk && durOk) {
        return {
          parameterId: "tricuspid_regurgitation",
          labelRu: "Трикуспидальная регургитация",
          category: rule.labelRu,
          interpretation: `${rule.interpretation} (V ${v} см/с, duration ${Math.round(d * 100)}%).`,
          source: getCurve("tricuspid_regurgitation").source,
        };
      }
    }
  }

  if (input.tricuspidRegurg) {
    const fb = curve.fallbackQualitative[input.tricuspidRegurg];
    if (fb) {
      return {
        parameterId: "tricuspid_regurgitation",
        labelRu: "Трикуспидальная регургитация",
        category: fb.class,
        interpretation: fb.interpretation,
        source: getCurve("tricuspid_regurgitation").source,
      };
    }
  }
  return null;
}

function assessDvAWave(aWave?: FirstTrimesterScreeningInput["dvAWave"]): CategoricalResult | null {
  if (!aWave) return null;
  const curve = getCurve("dv") as unknown as {
    aWave: Record<string, { interpretation: string; riskNote: string }>;
  };
  const row = curve.aWave[aWave];
  if (!row) return null;
  return {
    parameterId: "dv_a_wave",
    labelRu: "DV a-wave",
    category: aWave,
    interpretation: row.interpretation,
    source: getCurve("dv").source,
  };
}

/** Полный расчёт I скрининга: percentile / z / MoM для всех доступных параметров. */
export function assessFirstTrimesterScreening(
  input: FirstTrimesterScreeningInput,
): FirstTrimesterScreeningOutput {
  const gaDays =
    input.gaDays ??
    (input.crlMm ? (gaDaysFromCrlMm(input.crlMm) ?? undefined) : undefined);
  const gaWeeks = input.gaWeeks ?? (gaDays != null ? Math.floor(gaDays / 7) : undefined);

  const measurements: PercentileResult[] = [];

  const push = (r: PercentileResult | null) => {
    if (r) measurements.push(r);
  };

  if (input.msdMm != null && gaDays != null) {
    push(
      assessMeasurement({
        curveId: "msd",
        value: input.msdMm,
        gaDays,
        priorValue: input.priorMsdMm,
        priorGaDays: input.priorMsdGaDays,
      }),
    );
  }

  if (input.ysdMm != null && gaDays != null) {
    push(assessMeasurement({ curveId: "ysd", value: input.ysdMm, gaDays }));
  }

  if (input.crlMm != null && gaDays != null) {
    push(
      assessMeasurement({
        curveId: "crl",
        value: input.crlMm,
        gaDays,
        crlMm: input.crlMm,
        priorValue: input.priorCrlMm,
        priorGaDays: input.priorCrlGaDays,
      }),
    );
  }

  if (input.ntMm != null && input.crlMm != null) {
    push(assessNtFromCrl(input.crlMm, input.ntMm));
  }

  if (input.dvPi != null && gaDays != null) {
    push(assessMeasurement({ curveId: "dv", value: input.dvPi, gaDays }));
  }

  if (input.fhrBpm != null && gaDays != null) {
    push(assessMeasurement({ curveId: "fhr", value: input.fhrBpm, gaDays }));
  }

  let uterinePiMean: number | undefined;
  if (input.uterinePiLeft != null && input.uterinePiRight != null) {
    uterinePiMean = Math.round(((input.uterinePiLeft + input.uterinePiRight) / 2) * 1000) / 1000;
    if (gaWeeks != null) {
      push(assessMeasurement({ curveId: "uta", value: uterinePiMean, gaWeeks }));
    }
  }

  let mapMmHg: number | undefined;
  if (input.sbpMmHg != null && input.dbpMmHg != null) {
    mapMmHg = calculateMap(input.sbpMmHg, input.dbpMmHg);
    if (gaWeeks != null) {
      push(assessMeasurement({ curveId: "map", value: mapMmHg, gaWeeks }));
    }
  }

  const categorical: CategoricalResult[] = [];
  const nb = assessNasalBone(normalizeNasalBone(input.nasalBone));
  if (nb) categorical.push(nb);
  const tr = assessTricuspid(input);
  if (tr) categorical.push(tr);
  const dvA = assessDvAWave(input.dvAWave);
  if (dvA) categorical.push(dvA);

  return { measurements, categorical, mapMmHg, uterinePiMean };
}

export const FMF_ENGINE_DISCLAIMER =
  "Референсы FMF-compatible / custom Sonogyn Pro — не идентичны Astraia или закрытому FMF Calculator. Интерпретация — специалистом.";
