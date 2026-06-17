import { POPQ_VALUE_OPTIONS_BY_POINT } from "./constants";
import {
  computePopQStage,
  leadingCompartment,
  leadingPointKey,
  parsePopQField,
  stageLabel,
} from "./compute";
import type { CompartmentKey, PopQInput, PopQPointKey, PopQStageKey } from "./types";

export type PopQStageResult = {
  stageKey: PopQStageKey;
  maxPoint: number | null;
  leadingPoint: PopQPointKey | null;
  leading: { key: CompartmentKey; value: number } | null;
  stageDescription: string;
  pointsUsed: number[];
  pointsUsedLabel: string;
};

const STAGE_POINTS: Array<"Aa" | "Ba" | "Ap" | "Bp" | "C" | "D"> = ["Aa", "Ba", "Ap", "Bp", "C", "D"];

const POINT_LABELS_RU: Record<PopQPointKey, string> = {
  Aa: "Aa — передняя стенка, 3 см от уретры",
  Ba: "Ba — самая низкая точка передней стенки",
  Ap: "Ap — задняя стенка, 3 см от гимена",
  Bp: "Bp — самая низкая точка задней стенки",
  C: "C — шейка матки / культя",
  D: "D — задний свод (только при матке)",
  GH: "GH — уретра → гимен",
  PB: "PB — гимен → анус",
  TVL: "TVL — длина влагалища при вправлении",
};

export const POPQ_STAGE_RULES_RU = [
  "Стадия 0: Aa = Ba = Ap = Bp = −3 см.",
  "Стадия I: самая нижняя точка выше −1 см.",
  "Стадия II: самая нижняя точка от −1 до +1 см.",
  "Стадия III: ниже +1 см, но меньше (TVL − 2).",
  "Стадия IV: ≥ (TVL − 2) см — полный выворот.",
] as const;

export function pointLabelRu(key: PopQPointKey): string {
  return POINT_LABELS_RU[key];
}

export function stageDescriptionRu(stage: PopQStageKey): string {
  if (stage === "0") return "Нет пролапса. Ключевые точки Aa, Ba, Ap, Bp на уровне −3 см.";
  if (stage === "1") return "Самая нижняя точка выше гимена более чем на 1 см.";
  if (stage === "2") return "Самая нижняя точка в пределах 1 см выше или ниже гимена.";
  if (stage === "3") {
    return "Самая нижняя точка ниже гимена более чем на 1 см, но не достигает полного выворота.";
  }
  if (stage === "4") return "Полный выворот влагалища: самая нижняя точка на уровне (TVL − 2) см или ниже.";
  return "Введите точки POP-Q и нажмите «Рассчитать стадию».";
}

function inRange(value: number, key: PopQPointKey): boolean {
  const options = POPQ_VALUE_OPTIONS_BY_POINT[key];
  const min = options[0];
  const max = options[options.length - 1];
  return value >= min && value <= max;
}

export function parsePopQValues(
  values: Record<PopQPointKey, string>,
  uterusPresent: boolean,
): { input: PopQInput; errors: string[] } {
  const errors: string[] = [];
  const input: PopQInput = {};

  const required: PopQPointKey[] = uterusPresent
    ? ["Aa", "Ba", "C", "D", "Ap", "Bp", "TVL"]
    : ["Aa", "Ba", "C", "Ap", "Bp", "TVL"];

  for (const key of required) {
    const raw = values[key]?.trim() ?? "";
    if (!raw) {
      errors.push(`Заполните точку ${key}.`);
      continue;
    }
    const parsed = parsePopQField(raw);
    if (parsed === undefined) {
      errors.push(`Точка ${key}: введите число в сантиметрах.`);
      continue;
    }
    if (!inRange(parsed, key)) {
      const opts = POPQ_VALUE_OPTIONS_BY_POINT[key];
      errors.push(`Точка ${key}: допустимо от ${opts[0]} до ${opts[opts.length - 1]} см.`);
      continue;
    }
    input[key] = parsed;
  }

  for (const key of ["GH", "PB"] as const) {
    const raw = values[key]?.trim() ?? "";
    if (!raw) continue;
    const parsed = parsePopQField(raw);
    if (parsed === undefined) {
      errors.push(`Точка ${key}: введите число в сантиметрах.`);
      continue;
    }
    if (!inRange(parsed, key)) {
      const opts = POPQ_VALUE_OPTIONS_BY_POINT[key];
      errors.push(`Точка ${key}: допустимо от ${opts[0]} до ${opts[opts.length - 1]} см.`);
      continue;
    }
    input[key] = parsed;
  }

  if (!uterusPresent) delete input.D;

  return { input, errors };
}

export function calculatePopQResult(
  values: Record<PopQPointKey, string>,
  uterusPresent: boolean,
): { ok: true; result: PopQStageResult } | { ok: false; errors: string[] } {
  const { input, errors } = parsePopQValues(values, uterusPresent);
  if (errors.length) return { ok: false, errors };

  const stage = computePopQStage(input);
  const leading = leadingCompartment(input, uterusPresent);
  const leadingPoint = leadingPointKey(input, uterusPresent);

  const pointKeys = uterusPresent ? STAGE_POINTS : STAGE_POINTS.filter((k) => k !== "D");
  const pointsUsed = pointKeys
    .map((k) => input[k])
    .filter((v): v is number => typeof v === "number");

  return {
    ok: true,
    result: {
      stageKey: stage.stageKey,
      maxPoint: stage.maxPoint,
      leadingPoint,
      leading,
      stageDescription: stageDescriptionRu(stage.stageKey),
      pointsUsed,
      pointsUsedLabel: pointsUsed.map((p) => p.toFixed(1)).join(", "),
    },
  };
}

export function buildPopQResultSummary(result: PopQStageResult, tvl?: number): string {
  const lead =
    result.leading && result.leadingPoint
      ? `${result.leadingPoint} (${result.leading.value} см)`
      : "—";
  return [
    stageLabel(result.stageKey),
    result.stageDescription,
    `Самая низкая точка: ${result.maxPoint != null ? `${result.maxPoint} см` : "—"} (${lead}).`,
    `Учтённые точки: ${result.pointsUsedLabel} см.`,
    tvl != null ? `TVL: ${tvl} см.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
