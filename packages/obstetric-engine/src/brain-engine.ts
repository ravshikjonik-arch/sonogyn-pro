import { BRAIN_CURVES, getBrainCurve, type BrainCurveId } from "./curves";
import { assessCurveMeasurement, gaWeeksDecimal } from "./measure";
import type { ClinicalFinding, ObstetricMeasurementResult, SecondThirdScreeningInput } from "./types";

const BRAIN_INPUT_MAP: Record<
  BrainCurveId,
  { field: keyof SecondThirdScreeningInput; priorKey: string }
> = {
  lateral_ventricle: { field: "lateralVentriclesMm", priorKey: "lateralVentricle" },
  cisterna_magna: { field: "cisternaMagnaMm", priorKey: "cisternaMagna" },
  cerebellum_transverse: { field: "cerebellumMm", priorKey: "cerebellum" },
};

export function assessAllBrain(input: SecondThirdScreeningInput): ObstetricMeasurementResult[] {
  const ga = gaWeeksDecimal(input.gaWeeks, input.gaDays ?? 0);
  const out: ObstetricMeasurementResult[] = [];

  for (const [curveId, meta] of Object.entries(BRAIN_INPUT_MAP) as [
    BrainCurveId,
    (typeof BRAIN_INPUT_MAP)[BrainCurveId],
  ][]) {
    const value = input[meta.field] as number | undefined;
    if (value == null || !Number.isFinite(value)) continue;
    const prior = input.priorMeasurements?.[meta.priorKey];
    const row = assessCurveMeasurement({
      curve: BRAIN_CURVES[curveId],
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

/** ISUOG-aligned пороги ventriculomegaly (лат. желудочки, мм). */
export function assessBrainFindings(
  measurements: ObstetricMeasurementResult[],
): ClinicalFinding[] {
  const findings: ClinicalFinding[] = [];
  const lv = measurements.find((m) => m.parameterId === "lateral_ventricle");
  const cm = measurements.find((m) => m.parameterId === "cisterna_magna");
  const cb = measurements.find((m) => m.parameterId === "cerebellum_transverse");

  if (lv) {
    const v = lv.value;
    if (v >= 15) {
      findings.push({
        id: "ventriculomegaly_severe",
        labelRu: "Вентрикуломегалия — тяжёлая",
        severity: "severe",
        interpretation: `Лат. желудочки ${v} мм (≥15). Уточнить по ISUOG/протоколу центра.`,
        source: "ISUOG Practice Guidelines (ventriculomegaly thresholds)",
      });
    } else if (v >= 12) {
      findings.push({
        id: "ventriculomegaly_moderate",
        labelRu: "Вентрикуломегалия — умеренная",
        severity: "moderate",
        interpretation: `Лат. желудочки ${v} мм (12–14.9). Динамическое наблюдение.`,
        source: "ISUOG Practice Guidelines",
      });
    } else if (v >= 10) {
      findings.push({
        id: "ventriculomegaly_mild",
        labelRu: "Вентрикуломегалия — лёгкая",
        severity: "mild",
        interpretation: `Лат. желудочки ${v} мм (10–11.9). Контроль через 2–3 нед.`,
        source: "ISUOG Practice Guidelines",
      });
    }
  }

  if (cm && cm.value >= 10) {
    findings.push({
      id: "mega_cisterna_magna",
      labelRu: "Мега-цистерна",
      severity: "moderate",
      interpretation: `Большая цистерна ${cm.value} мм (≥10). Исключить Dandy-Walker spectrum.`,
      source: "Медведев 2016 + ISUOG CNS",
    });
  }

  if (cb && (cb.flag === "critical_low" || cb.flag === "low")) {
    findings.push({
      id: "cerebellar_hypoplasia_suspect",
      labelRu: "Подозрение на гипоплазию мозжечка",
      severity: "moderate",
      interpretation: `Поперечный диаметр мозжечка ниже 5-го перцентиля (~${cb.percentile}).`,
      source: getBrainCurve("cerebellum_transverse").source,
    });
  }

  return findings;
}
