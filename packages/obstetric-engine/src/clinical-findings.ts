import type { ClinicalFinding, ObstetricMeasurementResult, SkeletonIndexResult } from "./types";

function ratio(a?: number, b?: number): number | null {
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return Math.round((a / b) * 1000) / 1000;
}

export function computeSkeletonIndices(
  input: {
    flMm?: number;
    hlMm?: number;
    acMm?: number;
    hcMm?: number;
    bpdMm?: number;
    footLengthMm?: number;
  },
  measurements: ObstetricMeasurementResult[],
): SkeletonIndexResult[] {
  const out: SkeletonIndexResult[] = [];
  const fl = input.flMm;
  const hl = input.hlMm;

  const push = (id: string, labelRu: string, num?: number, den?: number, note?: string) => {
    const r = ratio(num, den);
    if (r == null) return;
    out.push({
      id,
      labelRu,
      ratio: r,
      interpretation: note ?? `${labelRu} = ${r}. Сравнить с локальным протоколом.`,
    });
  };

  push("fl_ac", "FL / AC", fl, input.acMm);
  push("fl_hc", "FL / HC", fl, input.hcMm);
  push("fl_bpd", "FL / BPD", fl, input.bpdMm);
  push("fl_foot", "FL / Foot", fl, input.footLengthMm);
  push("hl_fl", "HL / FL", hl, fl);

  return out;
}

export function assessSkeletonFindings(
  measurements: ObstetricMeasurementResult[],
): ClinicalFinding[] {
  const findings: ClinicalFinding[] = [];
  const fl = measurements.find((m) => m.parameterId === "fl");
  const hl = measurements.find((m) => m.parameterId === "hl");
  const hc = measurements.find((m) => m.parameterId === "hc");
  const bpd = measurements.find((m) => m.parameterId === "bpd");

  if (fl && (fl.flag === "critical_low" || fl.flag === "low")) {
    findings.push({
      id: "short_femur",
      labelRu: "Укорочение бедренной кости",
      severity: fl.percentile <= 3 ? "severe" : "mild",
      interpretation: `FL ~${fl.percentile}-й перц. (MoM ${fl.mom}). Исключить хромосомопатию / дисплазию.`,
      source: fl.source,
    });
  }

  if (hl && (hl.flag === "critical_low" || hl.flag === "low")) {
    findings.push({
      id: "short_humerus",
      labelRu: "Укорочение плечевой кости",
      severity: hl.percentile <= 3 ? "severe" : "mild",
      interpretation: `HL ~${hl.percentile}-й перц. (MoM ${hl.mom}).`,
      source: hl.source,
    });
  }

  if (hc && hc.flag === "critical_low") {
    findings.push({
      id: "microcephaly",
      labelRu: "Микроцефалия (подозрение)",
      severity: "moderate",
      interpretation: `HC ~${hc.percentile}-й перц.`,
      source: hc.source,
    });
  }

  if (hc && hc.flag === "critical_high") {
    findings.push({
      id: "macrocephaly",
      labelRu: "Макроцефалия (подозрение)",
      severity: "moderate",
      interpretation: `HC ~${hc.percentile}-й перц.`,
      source: hc.source,
    });
  }

  if (
    fl &&
    hl &&
    (fl.flag === "low" || fl.flag === "critical_low") &&
    (hl.flag === "low" || hl.flag === "critical_low") &&
    bpd &&
    bpd.flag === "normal"
  ) {
    findings.push({
      id: "skeletal_dysplasia_risk",
      labelRu: "Риск скелетной дисплазии",
      severity: "moderate",
      interpretation: "Укорочение FL и HL при нормальном BPD — уточнить морфологию скелета.",
      source: "Медведев 2016 / ISUOG skeletal assessment",
    });
  }

  return findings;
}

export function assessGrowthCategory(efwPercentile?: number): ClinicalFinding | null {
  if (efwPercentile == null) return null;
  if (efwPercentile < 10) {
    return {
      id: "sga",
      labelRu: "Малый для срока (SGA)",
      severity: "moderate",
      interpretation: `EFW ~${efwPercentile}-й перц. (<10). Оценить допплер и FGR.`,
      source: "ISUOG FGR guidelines",
    };
  }
  if (efwPercentile > 90) {
    return {
      id: "lga",
      labelRu: "Крупный для срока (LGA)",
      severity: "info",
      interpretation: `EFW ~${efwPercentile}-й перц. (>90).`,
      source: "ISUOG",
    };
  }
  return null;
}
