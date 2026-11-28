/** Единые подписи акушерских полей протокола (RU). */

export const PLACENTA_LOCATION_LABELS: Record<string, string> = {
  anterior: "передняя стенка",
  posterior: "задняя стенка",
  right_lateral: "правая боковая",
  left_lateral: "левая боковая",
  fundal: "дно матки",
  anterolateral: "передне-боковая",
  posterolateral: "задне-боковая",
  anterior_posterior: "передняя + задняя (полумесяц)",
  low_lying: "низкое прикрепление",
  previa: "предлежание плаценты",
  /** @deprecated legacy values */
  lateral: "боковая стенка",
};

export const PHENOTYPIC_GENITALIA_LABELS: Record<string, string> = {
  female_appearance: "признаки по женскому типу (по УЗИ)",
  male_appearance: "признаки по мужскому типу (по УЗИ)",
  ambiguous: "неоднозначная визуализация",
  not_assessed: "не оценено",
};

export const SEX_DOCUMENTATION_DISCLAIMER =
  "Оценка внешних признаков по УЗИ не эквивалентна генетическому/гонадальному полу; при расхождении с кариотипом — указать отдельно.";

export const DOPPLER_UA_RI_LABEL = "RI АП (индекс резистентности)";
export const DOPPLER_MCA_PI_LABEL = "PI СМА (среднее)";
export const DOPPLER_MCA_PSV_LABEL = "PSV СМА";

export const PLACENTA_SITE_CHIP_OPTIONS: { id: string; label: string }[] = [
  { id: "anterior", label: "Передняя" },
  { id: "posterior", label: "Задняя" },
  { id: "right_lateral", label: "Правая бок." },
  { id: "left_lateral", label: "Левая бок." },
  { id: "anterolateral", label: "Передне-бок." },
  { id: "posterolateral", label: "Задне-бок." },
  { id: "anterior_posterior", label: "Полумесяц" },
  { id: "fundal", label: "Дно" },
  { id: "low_lying", label: "Низкое прикрепление" },
  { id: "previa", label: "Предлежание" },
];

export function formatPlacentaLocationRu(
  location?: string,
  previaGrade?: string,
  note?: string,
): string {
  const base = location ? (PLACENTA_LOCATION_LABELS[location] ?? location) : "не указано";
  const previa =
    previaGrade && previaGrade !== "none" ? `; предлежание: ${previaGrade}` : "";
  const n = note?.trim() ? `; ${note.trim()}` : "";
  return `${base}${previa}${n}`;
}