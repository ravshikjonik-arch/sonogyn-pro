import type { EarlyPregnancyCheckInput, RuleCheckResult } from "../types";

/** Базовые пороги из атласа Блинов/Емельяненко (с. 9, 19 и др.). */
export const BLINOV_EARLY_THRESHOLDS = {
  gestSacRingMinMm: 2,
  yolkSacMinMm: 3,
  yolkSacMaxMm: 6,
} as const;

export function evaluateEarlyPregnancyRules(input: EarlyPregnancyCheckInput): RuleCheckResult[] {
  const results: RuleCheckResult[] = [];

  if (input.gest_sac_ring_mm != null) {
    const ok = input.gest_sac_ring_mm >= BLINOV_EARLY_THRESHOLDS.gestSacRingMinMm;
    results.push({
      id: "gest_sac_ring_mm",
      label: "Кольцо плодного яйца",
      ok,
      message: ok
        ? `Кольцо ${input.gest_sac_ring_mm} мм — в норме (≥${BLINOV_EARLY_THRESHOLDS.gestSacRingMinMm} мм).`
        : `Кольцо ${input.gest_sac_ring_mm} мм — меньше ${BLINOV_EARLY_THRESHOLDS.gestSacRingMinMm} мм (атлас: неблагоприятно).`,
    });
  }

  if (input.yolk_sac_diameter_mm != null) {
    const { yolkSacMinMm, yolkSacMaxMm } = BLINOV_EARLY_THRESHOLDS;
    const ok =
      input.yolk_sac_diameter_mm >= yolkSacMinMm && input.yolk_sac_diameter_mm <= yolkSacMaxMm;
    results.push({
      id: "yolk_sac_diameter_mm",
      label: "Диаметр желточного мешка",
      ok,
      message: ok
        ? `ЖК ${input.yolk_sac_diameter_mm} мм — в норме (${yolkSacMinMm}–${yolkSacMaxMm} мм).`
        : `ЖК ${input.yolk_sac_diameter_mm} мм — вне ${yolkSacMinMm}–${yolkSacMaxMm} мм (атлас: неблагоприятный прогноз).`,
    });
  }

  if (input.yolk_sac_count != null && input.embryo_count != null) {
    const ok = input.yolk_sac_count === input.embryo_count;
    results.push({
      id: "yolk_embryo_ratio",
      label: "Соотношение ЖК и эмбрионов",
      ok,
      message: ok
        ? "Один желточный мешок на один эмбрион."
        : "Число ЖК не соответствует числу эмбрионов — неблагоприятный прогноз (атлас).",
    });
  }

  if (input.yolk_sac_echogenicity && input.yolk_sac_echogenicity !== "unknown") {
    const ok = input.yolk_sac_echogenicity === "anechoic";
    results.push({
      id: "yolk_sac_echogenicity",
      label: "Эхогенность ЖК",
      ok,
      message: ok ? "ЖК анехогенный — норма." : "Нарушение эхогенности ЖК — неблагоприятный прогноз.",
    });
  }

  if (input.yolk_sac_shape && input.yolk_sac_shape !== "unknown") {
    const ok = input.yolk_sac_shape === "round";
    results.push({
      id: "yolk_sac_shape",
      label: "Форма ЖК",
      ok,
      message: ok ? "ЖК правильной формы." : "Неправильная форма ЖК — неблагоприятный прогноз.",
    });
  }

  return results;
}

export function earlyPregnancyPrognosis(
  results: RuleCheckResult[],
): "normal" | "unfavorable" | "incomplete" {
  if (results.length === 0) return "incomplete";
  return results.every((r) => r.ok) ? "normal" : "unfavorable";
}
