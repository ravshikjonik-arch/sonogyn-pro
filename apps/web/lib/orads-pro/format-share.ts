/** IQDOC-style plain-text result card for O-RADS (clipboard / Share). */
export function formatOradsShareCard(input: {
  categoryLabel: string;
  riskText: string;
  recommendation: string;
  protocolLine: string;
  sizeSummary?: string | null;
  patternLabel?: string | null;
  warning?: string | null;
  versionLabel?: string;
}): string {
  const lines = [
    "SonoGyn · O-RADS",
    input.versionLabel ?? "O-RADS US",
    "",
    `Категория: ${input.categoryLabel}`,
    `Риск: ${input.riskText}`,
  ];

  if (input.patternLabel) lines.push(`Паттерн: ${input.patternLabel}`);
  if (input.sizeSummary) lines.push(`Размер: ${input.sizeSummary}`);
  lines.push(`Тактика: ${input.recommendation}`);
  if (input.warning) lines.push(`Внимание: ${input.warning}`);

  lines.push("", "Строка для протокола:", input.protocolLine.trim(), "");
  lines.push(
    "Справочная информация (CDS). Не диагноз; интерпретация — специалист.",
    "https://sonogyn-pro.ru/tools/calc/rads/o-rads",
  );

  return lines.join("\n");
}
