import { generateStructuredThyroidReport, type TiradsAcrInput } from "@repo/tirads-acr";

import { REPORT_GENERATOR_DISCLAIMER_RU } from "../disclaimer";
import { joinSections } from "../placeholders";
import type { CalculatorReportPayload, GeneratedReport } from "../types";

function isLegacyTiRadsDisclaimerLine(line: string): boolean {
  const lower = line.toLowerCase();
  return lower.includes("не является") && lower.includes("интерпретац");
}

export function renderTiRadsReport(payload: CalculatorReportPayload): GeneratedReport {
  const input = payload.inputs as TiradsAcrInput;
  const { result, fullProtocol } = generateStructuredThyroidReport(input);
  const missingFields: string[] = [];

  const protocolBody = fullProtocol
    .split("\n")
    .filter((line) => !isLegacyTiRadsDisclaimerLine(line))
    .join("\n");

  const lines = [
    "---",
    protocolBody.trim(),
    "",
    "ДИСКЛЕЙМЕР:",
    REPORT_GENERATOR_DISCLAIMER_RU,
    "---",
  ];

  return {
    plainText: joinSections([{ lines }]),
    sections: [
      {
        id: "protocol",
        title: "ПРОТОКОЛ",
        body: protocolBody,
      },
      {
        id: "conclusion",
        title: "TI-RADS",
        body: `${result.categoryLabel} · ${result.totalPoints} баллов · ${result.malignancyRisk}`,
      },
      {
        id: "recommendations",
        title: "РЕКОМЕНДАЦИИ",
        body: result.fnaRecommended
          ? `ТАБ: ${result.fnaRationale}`
          : `Наблюдение: ${result.followUpRecommendation}`,
      },
    ],
    missingFields,
    disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
  };
}
