import type { CompartmentKey, PopQInput, PopQPointKey, PopQStageKey } from "./types";

export type { CompartmentKey, PopQInput, PopQPointKey, PopQStageKey } from "./types";

export function parsePopQField(raw: string): number | undefined {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return undefined;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}

export function computePopQStage(input: PopQInput): { maxPoint: number | null; stageKey: PopQStageKey } {
  const keys: Array<"Aa" | "Ba" | "Ap" | "Bp" | "C" | "D"> = ["Aa", "Ba", "Ap", "Bp", "C", "D"];
  const values = keys.map((k) => input[k]).filter((v): v is number => typeof v === "number");
  if (values.length === 0) return { maxPoint: null, stageKey: "na" };

  const maxPoint = Math.max(...values);
  const tvl = typeof input.TVL === "number" && Number.isFinite(input.TVL) ? input.TVL : 6;
  const allBelowMinus1 = keys.every((k) => typeof input[k] === "number" && (input[k] as number) < -1);
  const allKeysPresent = keys.every((k) => typeof input[k] === "number");

  if (allKeysPresent && allBelowMinus1) return { maxPoint, stageKey: "0" };
  if (maxPoint < -1) return { maxPoint, stageKey: "1" };
  if (maxPoint >= -1 && maxPoint <= 1) return { maxPoint, stageKey: "2" };

  const threshold = tvl - 2;
  if (threshold <= 1) return { maxPoint, stageKey: "4" };
  if (maxPoint > 1 && maxPoint < threshold) return { maxPoint, stageKey: "3" };
  if (maxPoint >= threshold) return { maxPoint, stageKey: "4" };
  return { maxPoint, stageKey: "2" };
}

export function stageLabel(stage: PopQStageKey): string {
  if (stage === "na") return "—";
  return `POP-Q Stage ${stage === "0" ? "0" : stage}`;
}

export function leadingCompartment(
  input: PopQInput,
  uterusPresent: boolean,
): { key: CompartmentKey; value: number } | null {
  const anterior = [input.Aa, input.Ba].filter((v): v is number => typeof v === "number");
  const posterior = [input.Ap, input.Bp].filter((v): v is number => typeof v === "number");
  const apicalRaw = uterusPresent ? [input.C, input.D] : [input.C];
  const apical = apicalRaw.filter((v): v is number => typeof v === "number");

  const points: Array<{ key: CompartmentKey; value: number }> = [];
  if (anterior.length) points.push({ key: "anterior", value: Math.max(...anterior) });
  if (posterior.length) points.push({ key: "posterior", value: Math.max(...posterior) });
  if (apical.length) points.push({ key: "apical", value: Math.max(...apical) });
  if (!points.length) return null;
  points.sort((a, b) => b.value - a.value);
  return points[0] ?? null;
}

export function leadingPointKey(input: PopQInput, uterusPresent: boolean): PopQPointKey | null {
  const keys: Array<"Aa" | "Ba" | "Ap" | "Bp" | "C" | "D"> = uterusPresent
    ? ["Aa", "Ba", "Ap", "Bp", "C", "D"]
    : ["Aa", "Ba", "Ap", "Bp", "C"];
  let best: { key: PopQPointKey; value: number } | null = null;
  for (const k of keys) {
    const v = input[k];
    if (typeof v !== "number") continue;
    if (!best || v > best.value) best = { key: k, value: v };
  }
  return best?.key ?? null;
}

export function compartmentLabel(key: CompartmentKey): string {
  if (key === "anterior") return "Передний компартмент";
  if (key === "posterior") return "Задний компартмент";
  return "Апикальный компартмент";
}

export function buildProtocolLine(input: {
  stageKey: PopQStageKey;
  leading: { key: CompartmentKey; value: number } | null;
  tvl?: number;
}): string {
  const stageText = stageLabel(input.stageKey);
  const leadText = input.leading
    ? `${compartmentLabel(input.leading.key)} (${input.leading.value} см)`
    : "ведущий отдел не определён";
  const tvlText = input.tvl !== undefined ? `${input.tvl} см` : "не указан";
  return `POP-Q: ${stageText}. Ведущий отдел: ${leadText}. TVL: ${tvlText}.`;
}

export function buildPatientReportText(input: {
  protocolLine: string;
  uterusPresent: boolean;
  points: PopQInput;
}): string {
  const lines = [
    "Результаты осмотра по шкале POP-Q",
    "",
    input.protocolLine,
    "",
    "Точки (см относительно гимена):",
    ...(["Aa", "Ba", "Ap", "Bp", "C", "D", "GH", "PB", "TVL"] as PopQPointKey[])
      .filter((k) => k !== "D" || input.uterusPresent)
      .map((k) => {
        const v = input.points[k];
        return `  ${k}: ${v !== undefined ? `${v} см` : "—"}`;
      }),
    "",
    "Иллюстрация носит обучающий характер и не является точным изображением вашего осмотра.",
    "Интерпретация и тактика лечения определяются лечащим врачом.",
  ];
  return lines.join("\n");
}

export {
  NORMAL_ANATOMY,
  POINT_HINTS,
  POPQ_PRESETS,
  POPQ_VALUE_OPTIONS,
  inputToFieldStrings,
  type PopQPreset,
} from "./constants";

export {
  POP_Q_CALCULATOR_HREF,
  PROLAPSE_ASSISTANT_HREF,
  PROLAPSE_CASES_HREF,
  buildPopQCaseTitle,
  isProlapseNosologyCode,
  isProlapseTeachingCase,
} from "./integration";
