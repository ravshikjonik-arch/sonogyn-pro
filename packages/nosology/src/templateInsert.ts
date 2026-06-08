/** Подставляет плейсхолдеры в шаблон протокола. Неизвестные ключи остаются как есть. */
export function applyProtocolTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) => {
    const trimmed = key.trim();
    if (values[trimmed] !== undefined && values[trimmed] !== "") {
      return values[trimmed];
    }
    return match;
  });
}

export const DEFAULT_TEMPLATE_PLACEHOLDERS: Record<string, string> = {
  размер: "—",
  локализация: "не уточнена",
  степень: "не оценена",
};

export function buildProtocolInsertion(
  diagnosisLine: string,
  protocolTemplate: string,
  overrides?: Record<string, string>,
): { diagnosis: string; conclusion: string; examinationPlan: string } {
  const conclusion = applyProtocolTemplate(protocolTemplate, {
    ...DEFAULT_TEMPLATE_PLACEHOLDERS,
    ...overrides,
  });
  const examinationPlan = conclusion.includes("Рекомендовано:")
    ? conclusion.slice(conclusion.indexOf("Рекомендовано:"))
    : "";
  return {
    diagnosis: diagnosisLine,
    conclusion,
    examinationPlan,
  };
}
