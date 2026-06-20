/**
 * VBAC / TOLAC — упрощённая стратификация (образовательная, не замена ACOG/NICE).
 * До родов: критерии отбора. В родах: мониторинг и «красные флаги».
 */

export type VbacPreInput = {
  /** Однократное поперечное КС в анамнезе */
  singleLtcs: boolean;
  /** Показание к прошлому КС не связано с прогрессией родов (напр. ПГ, тазовое) */
  nonRecurringIndication: boolean;
  /** Ранее успешные вагинальные роды (в т.ч. VBAC) */
  priorVaginalBirth: boolean;
  /** Интервал от последнего КС ≥18 мес (ориентир) */
  interval18Months: boolean;
  /** Планируемый вес плода <4000 г (нет подозрения на макросомию) */
  noMacrosomiaSuspected: boolean;
  /** Одноплодие, головное предлежание */
  cephalicSingleton: boolean;
  /** Нет placenta previa / vasa previa */
  noPlacentaPrevia: boolean;
  /** Нет классического/Т-образного рубца */
  noClassicalScar: boolean;
  /** Нет перорального рубца / ≥2 рубцов на матке */
  noUterineRuptureHistory: boolean;
  /** Готовность непрерывного CTG и экстренного КС */
  continuousMonitoringAvailable: boolean;
};

export type VbacPreResult = {
  score: number;
  maxScore: number;
  category: "благоприятный" | "промежуточный" | "неблагоприятный";
  tolacEligible: boolean;
  lines: string[];
};

export function assessVbacPreLabor(input: VbacPreInput): VbacPreResult {
  const checks: { label: string; weight: number; ok: boolean }[] = [
    { label: "Одиночное поперечное КС в анамнезе", weight: 2, ok: input.singleLtcs },
    { label: "Нерекурrentное показание к прошлому КС", weight: 1, ok: input.nonRecurringIndication },
    { label: "Ранее вагинальные роды / VBAC", weight: 2, ok: input.priorVaginalBirth },
    { label: "Интервал ≥18 мес от последнего КС", weight: 1, ok: input.interval18Months },
    { label: "Нет подозрения на макросомию (>4000 г)", weight: 1, ok: input.noMacrosomiaSuspected },
    { label: "Одноплодие, головное предлежание", weight: 2, ok: input.cephalicSingleton },
    { label: "Нет placenta previa", weight: 2, ok: input.noPlacentaPrevia },
    { label: "Нет классического/вертикального рубца", weight: 2, ok: input.noClassicalScar },
    { label: "Нет разрыва матки в анамнезе", weight: 2, ok: input.noUterineRuptureHistory },
    { label: "CTG + возможность экстренного КС", weight: 1, ok: input.continuousMonitoringAvailable },
  ];

  const maxScore = checks.reduce((s, c) => s + c.weight, 0);
  const score = checks.filter((c) => c.ok).reduce((s, c) => s + c.weight, 0);
  const lines = checks.map((c) => `${c.ok ? "✓" : "✗"} ${c.label}`);

  const hardStop = !input.noClassicalScar || !input.noUterineRuptureHistory || !input.noPlacentaPrevia;
  let category: VbacPreResult["category"];
  if (hardStop || score < 8) category = "неблагоприятный";
  else if (score >= 13) category = "благоприятный";
  else category = "промежуточный";

  const tolacEligible = !hardStop && input.singleLtcs && input.cephalicSingleton && input.continuousMonitoringAvailable;

  if (hardStop) {
    lines.push("", "⚠ Абсолютные/жёсткие противопоказания — TOLAC/VBAC не рекомендуется вне протокола центра.");
  } else if (category === "благоприятный") {
    lines.push("", "Ориентир: обсуждение TOLAC/VBAC с информированным согласием при наличии возможностей центра.");
  } else if (category === "промежуточный") {
    lines.push("", "Индивидуальное решение мультидисциплинарно; документируйте риски и план родов.");
  } else {
    lines.push("", "Плановое повторное КС или роды в центре III–IV уровня — по протоколу и согласию пациентки.");
  }

  return { score, maxScore, category, tolacEligible, lines };
}

export type VbacInLaborInput = {
  spontaneousLabor: boolean;
  /** Регулярные схватки, активная фаза */
  activeLabor: boolean;
  /** Раскрытие ≥4 см (ориентир для TOLAC) */
  dilationAtLeast4cm: boolean;
  /** Нет подозрения на гиперстимуляцию окситоцином */
  noExcessiveOxytocin: boolean;
  /** CTG категория I (нормальная) */
  ctgCategory1: boolean;
  /** Нет vaginal bleeding в родах */
  noAntepartumBleedingInLabor: boolean;
  /** Интервал между схватками не укорочен (<2 мин при гипердинамии) */
  noHyperstimulation: boolean;
  /** Эпидural analgesia допустима — не противопоказание */
  epiduralUsed?: boolean;
};

export type VbacInLaborResult = {
  continueTolac: boolean;
  alerts: string[];
  monitoring: string[];
};

export function assessVbacInLabor(input: VbacInLaborInput): VbacInLaborResult {
  const alerts: string[] = [];
  const monitoring: string[] = [
    "Непрерывный CTG после начала активной фазы.",
    "Избегать гиперстимуляции окситоцином; при необходимости — минимальные дозы по протоколу.",
    "Готовность к экстренному laparotomy при подозрении на разрыв (внезапная боль, кровотечение, децелерации, loss of station).",
  ];

  if (!input.ctgCategory1) alerts.push("⚠ CTG не категории I — усиленный мониторинг; при патологии рассмотреть экстренное КС.");
  if (!input.noAntepartumBleedingInLabor) alerts.push("⚠ Кровотечение в родах — прекращение TOLAC, экстренное КС.");
  if (!input.noExcessiveOxytocin || !input.noHyperstimulation)
    alerts.push("⚠ Гиперстимуляция — снизить/отменить окситоцин, оценить разрыв матки.");
  if (!input.spontaneousLabor && !input.activeLabor)
    alerts.push("Индукция при рубце — только по строгим протоколам центра с ripening.");

  const continueTolac =
    input.noAntepartumBleedingInLabor &&
    input.noHyperstimulation &&
    input.noExcessiveOxytocin &&
    input.ctgCategory1 &&
    input.activeLabor;

  if (continueTolac && alerts.length === 0) {
    monitoring.push("TOLAC продолжается при отсутствии признаков разрыва; повторная оценка каждые 30–60 мин.");
  } else if (alerts.length > 0) {
    monitoring.push("При сохранении TOLAC — непрерывный мониторинг; низкий порог для КС.");
  }

  return { continueTolac: continueTolac && alerts.length <= 1, alerts, monitoring };
}

export const VBAC_DISCLAIMER =
  "TOLAC/VBAC — только при возможностях центра III–IV уровня, информированном согласии и протоколе учреждения.";
