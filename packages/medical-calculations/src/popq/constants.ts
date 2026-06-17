import type { PopQInput, PopQPointKey } from "./types";

/** Типичная норма для демонстрации пациентке (иллюстрация, не диагноз). */
export const NORMAL_ANATOMY: PopQInput = {
  Aa: -3,
  Ba: -3,
  Ap: -3,
  Bp: -3,
  C: -8,
  D: -10,
  GH: 3,
  PB: 3,
  TVL: 10,
};

function range(min: number, max: number, step = 0.5): number[] {
  const out: number[] = [];
  for (let v = min; v <= max; v += step) out.push(Math.round(v * 10) / 10);
  return out;
}

export const POPQ_VALUE_OPTIONS: number[] = range(-3, 10);

/** Рекомендованные диапазоны для выпадающих списков POP-Q. */
export const POPQ_VALUE_OPTIONS_BY_POINT: Record<PopQPointKey, number[]> = {
  Aa: range(-3, 3),
  Ba: range(-3, 10),
  Ap: range(-3, 3),
  Bp: range(-3, 10),
  C: range(-15, 15),
  D: range(-15, 15),
  GH: range(0, 10),
  PB: range(0, 10),
  TVL: range(3, 15),
};

export const POINT_HINTS: Record<PopQPointKey, string> = {
  Aa: "Передняя стенка на 3 см от уретры (референс: -3 см).",
  Ba: "Самая низкая точка передней стенки (референс: -3 см).",
  Ap: "Задняя стенка на 3 см от гимена (референс: -3 см).",
  Bp: "Самая низкая точка задней стенки (референс: -3 см).",
  C: "Шейка матки или культя влагалища.",
  D: "Задний свод (только при наличии матки).",
  GH: "Промежуток от наружного отверстия уретры до заднего края гимена.",
  PB: "От заднего края гимена до середины анального отверстия.",
  TVL: "Глубина влагалища при репозиции C/D.",
};

export type PopQPreset = {
  id: string;
  label: string;
  uterusPresent: boolean;
  values: PopQInput;
};

export const POPQ_PRESETS: PopQPreset[] = [
  {
    id: "normal",
    label: "Норма (образец)",
    uterusPresent: true,
    values: NORMAL_ANATOMY,
  },
  {
    id: "cystocele-2",
    label: "Цистоцеле · стадия II",
    uterusPresent: true,
    values: { Aa: -1, Ba: 1, Ap: -2, Bp: -2, C: -6, D: -8, GH: 4, PB: 3, TVL: 9 },
  },
  {
    id: "rectocele-2",
    label: "Ректоцеле · стадия II",
    uterusPresent: true,
    values: { Aa: -2, Ba: -2, Ap: -1, Bp: 1, C: -6, D: -8, GH: 4, PB: 4, TVL: 9 },
  },
  {
    id: "apical-3",
    label: "Апикальный пролапс · стадия III",
    uterusPresent: true,
    values: { Aa: -2, Ba: -1, Ap: -2, Bp: -1, C: 4, D: 3, GH: 5, PB: 3, TVL: 8 },
  },
  {
    id: "vault-3",
    label: "Выпадение культи · стадия III",
    uterusPresent: false,
    values: { Aa: -2, Ba: -1, Ap: -2, Bp: 0, C: 3, GH: 4, PB: 3, TVL: 8 },
  },
];

export function inputToFieldStrings(values: PopQInput): Record<PopQPointKey, string> {
  const out: Record<PopQPointKey, string> = {
    Aa: "",
    Ba: "",
    Ap: "",
    Bp: "",
    C: "",
    D: "",
    GH: "",
    PB: "",
    TVL: "",
  };
  (Object.keys(out) as PopQPointKey[]).forEach((k) => {
    const v = values[k];
    if (typeof v === "number" && Number.isFinite(v)) out[k] = String(v);
  });
  return out;
}
