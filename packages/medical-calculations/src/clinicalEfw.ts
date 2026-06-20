/**
 * Метод Рудакова — оценка массы плода по наружному акушерскому осмотру.
 * М (г) = (ВДМ − n) × ОЖ, где ВДМ и ОЖ в см.
 * n: 12 — головное, 11 — тазовое, 14 — поперечное (классическая адаптация).
 */

export type FetalPresentation = "cephalic" | "breech" | "transverse";

export type RudakovInput = {
  /** Высота дна матки, см */
  fundalHeightCm: number;
  /** Окружность живота на уровне пупка, см */
  abdominalCircumferenceCm: number;
  presentation: FetalPresentation;
};

export type RudakovResult = {
  grams: number;
  formula: string;
  note: string;
};

const PRESENTATION_N: Record<FetalPresentation, number> = {
  cephalic: 12,
  breech: 11,
  transverse: 14,
};

export function efwRudakov(input: RudakovInput): RudakovResult | null {
  const { fundalHeightCm, abdominalCircumferenceCm, presentation } = input;
  if (fundalHeightCm <= 0 || abdominalCircumferenceCm <= 0) return null;
  const n = PRESENTATION_N[presentation];
  const grams = Math.round((fundalHeightCm - n) * abdominalCircumferenceCm);
  if (grams <= 0 || grams > 6000) return null;
  return {
    grams,
    formula: `(ВДМ − ${n}) × ОЖ = (${fundalHeightCm} − ${n}) × ${abdominalCircumferenceCm}`,
    note: "Применимо во II–III триместре; погрешность выше, чем у УЗИ-Hadlock. Не для клинического диагноза ЗРП/макросомии.",
  };
}

export type MaternalAnthropometryInput = {
  /** Масса матери, кг (текущая или до беременности) */
  maternalWeightKg: number;
  /** Рост матери, см */
  maternalHeightCm: number;
  /** ВДМ, см */
  fundalHeightCm: number;
  /** Первые роды */
  nulliparous: boolean;
};

/**
 * Упрощённая формула по антропометрии матери (Johnson-style clinical estimate).
 * log10(EFW) = 1.599 + 0.144(BPD_equiv) — здесь BPD заменён оценкой через ВДМ.
 * Альтернатива: EFW ≈ (ВДМ − поправка) × коэффициент веса матери.
 */
export function efwMaternalAnthropometry(input: MaternalAnthropometryInput): RudakovResult | null {
  const { maternalWeightKg, maternalHeightCm, fundalHeightCm, nulliparous } = input;
  if (maternalWeightKg <= 0 || maternalHeightCm <= 0 || fundalHeightCm <= 0) return null;
  const bmi = maternalWeightKg / (maternalHeightCm / 100) ** 2;
  const correction = nulliparous ? 12 : 11;
  const bmiFactor = bmi > 30 ? 0.92 : bmi < 20 ? 1.05 : 1;
  const base = (fundalHeightCm - correction) * (maternalWeightKg * 0.45 + 15);
  const grams = Math.round(base * bmiFactor);
  if (grams <= 0 || grams > 6000) return null;
  return {
    grams,
    formula: `ВДМ ${fundalHeightCm} см, вес ${maternalWeightKg} кг, BMI ${bmi.toFixed(1)}`,
    note: "Ориентир по ВДМ и антропометрии матери; для решений используйте УЗИ-фетометрию (Hadlock) и перцентили.",
  };
}

export const CLINICAL_EFW_DISCLAIMER =
  "Оценка массы плода — ориентир. Диагноз ЗРП/макросомии — по протоколу (УЗИ, динамика, допплер).";
