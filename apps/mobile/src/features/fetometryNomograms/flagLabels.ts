export const NOMOGRAM_FLAG_LABELS: Record<string, string> = {
  BELOW_P5: "Ниже нижней границы",
  P5_P50: "Ниже медианы",
  P50_P95: "В пределах центрального коридора",
  ABOVE_P95: "Выше верхней границы",
  BELOW_MIN: "Ниже min",
  LOW_MEAN: "Ниже mean low",
  WITHIN_MEAN: "Средний референс",
  HIGH_MEAN: "Выше mean high",
  ABOVE_MAX: "Выше max",
  BELOW_MOM_THRESHOLD: "Ниже порога MoM",
  AT_OR_ABOVE_MOM_THRESHOLD: "≥ порога MoM",
  out_of_range: "Вне диапазона",
  unknown: "Недостаточно данных",
};

export const ARCHIVE_FLAG_LABELS: Record<string, string> = {
  low: "Ниже нормы (≤5%)",
  normal: "В пределах табличной нормы",
  high: "Выше нормы (≥95%)",
  out_of_range: "Вне диапазона таблицы",
  unsupported: "Тип таблицы пока не поддержан",
  unknown: "Недостаточно данных",
};
