/**
 * Цервикальная недостаточность — УЗИ-ориентиры (учебный модуль).
 */

export const CERVICAL_SOURCE =
  "УЗИ-скрининг цервикальной длины 16–24 нед; CL <25 мм — короткая шейка; воронка T→Y→V→U.";

export type FunnelShape = "T" | "Y" | "V" | "U" | "none";

export type CervicalAssessmentInput = {
  gestationalWeeks?: number;
  cervicalLengthMm?: number;
  funnelShape: FunnelShape;
  internalOsDilated: boolean;
  externalOsClosed: boolean;
  sludgePresent: boolean;
  dynamicShortening: boolean;
  membraneBulging: boolean;
  conclusionDraft?: string;
};

export const defaultCervicalInput: CervicalAssessmentInput = {
  funnelShape: "T",
  internalOsDilated: false,
  externalOsClosed: true,
  sludgePresent: false,
  dynamicShortening: false,
  membraneBulging: false,
};

export type CervicalRisk = "normal" | "short" | "high";

export function assessCervicalLength(input: CervicalAssessmentInput): {
  risk: CervicalRisk;
  messages: string[];
} {
  const messages: string[] = [];
  let risk: CervicalRisk = "normal";

  const cl = input.cervicalLengthMm;
  const gw = input.gestationalWeeks;

  if (cl != null && cl > 0 && cl < 25) {
    risk = "short";
    messages.push(`Длина шейки матки ${cl} мм < 25 мм — короткая шейка (до 24 нед).`);
  } else if (cl != null) {
    messages.push(`Длина шейки матки: ${cl} мм.`);
  }

  if (input.funnelShape === "U" || input.funnelShape === "V") {
    risk = risk === "short" ? "high" : "short";
    messages.push(`Воронка: форма ${input.funnelShape} — прогрессирующая/выраженная воронка.`);
  } else if (input.funnelShape === "Y") {
    messages.push("Воронка Y — ранняя воронка.");
  }

  if (input.sludgePresent) messages.push("Sludge у внутреннего зева — отметить в протоколе.");
  if (input.membraneBulging) {
    risk = "high";
    messages.push("Выпячивание плодных оболочек в цервикальный канал.");
  }
  if (input.dynamicShortening) {
    risk = risk === "normal" ? "short" : risk;
    messages.push("Динамическое укорочение при надавливании.");
  }

  if (gw != null && (gw < 16 || gw > 24)) {
    messages.push("Оптимальный скрининг CL: 16–24 нед (ориентир).");
  }

  return { risk, messages };
}

export function buildCervicalProtocol(input: CervicalAssessmentInput): string {
  const a = assessCervicalLength(input);
  const rec: string[] = [];

  if (a.risk === "high") {
    rec.push("Обсудить срочный акушерский маршрут, стационарный мониторинг.");
  } else if (a.risk === "short") {
    rec.push(
      "Обсудить тактику предотвращения ПР: цервикальный шов / прогестероны — по протоколу центра и сроку.",
    );
  } else {
    rec.push("Рутинное наблюдение по сроку беременности.");
  }

  return [
    "УЗИ · ШЕЙКА МАТКИ / ЦЕРВИКАЛЬНАЯ ДЛИНА",
    CERVICAL_SOURCE,
    "",
    input.gestationalWeeks != null ? `Срок беременности: ${input.gestationalWeeks} нед.` : "",
    input.cervicalLengthMm != null ? `CL: ${input.cervicalLengthMm} мм.` : "CL: не указана.",
    `Воронка: ${input.funnelShape === "none" ? "не описана" : input.funnelShape}`,
    `Внутренний зев расширен: ${input.internalOsDilated ? "да" : "нет"}`,
    `Наружный зев: ${input.externalOsClosed ? "закрыт/частично" : "открыт"}`,
    ...a.messages.map((m) => `• ${m}`),
    "",
    "РЕКОМЕНДАЦИИ (учебные)",
    ...rec.map((m) => `• ${m}`),
    "",
    "ЗАКЛЮЧЕНИЕ",
    input.conclusionDraft?.trim() || "—",
    "",
    "Не является диагнозом. Решение — акушер-гинеколог.",
  ]
    .filter(Boolean)
    .join("\n");
}

export const cervicalFormOptions = {
  funnelShape: [
    { value: "T", label: "T — норма" },
    { value: "Y", label: "Y — ранняя воронка" },
    { value: "V", label: "V" },
    { value: "U", label: "U — выраженная" },
    { value: "none", label: "Не оценивалась" },
  ] as const,
};
