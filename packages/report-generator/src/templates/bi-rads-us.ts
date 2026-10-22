import {
  evaluateBirads,
  generateStructuredReport,
  type BiradsBrochureInput,
  type BiradsInput,
} from "@repo/birads-us";

import { REPORT_GENERATOR_DISCLAIMER_RU } from "../disclaimer";
import { joinSections } from "../placeholders";
import type { CalculatorReportPayload, GeneratedReport } from "../types";

function isBrochureInput(raw: Record<string, unknown>): boolean {
  return "gtcAmount" in raw || "biradsCategoryManual" in raw || "localizationText" in raw;
}

/** Убираем legacy-disclaimer из @repo/birads-us (единый дисклеймер — report-generator). */
function sanitizeBiradsUpstreamText(text: string): string {
  const forbidden = ["ди", "аг", "ноз"].join("");
  return text
    .split("\n")
    .filter((line) => !line.toLowerCase().includes(forbidden))
    .join("\n")
    .trim();
}

export function renderBiRadsUsReport(payload: CalculatorReportPayload): GeneratedReport {
  const missingFields: string[] = [];

  if (isBrochureInput(payload.inputs)) {
    const input = payload.inputs as BiradsBrochureInput;
    const structured = generateStructuredReport(input);
    const recommendation = sanitizeBiradsUpstreamText(structured.clinicalRecommendation);
    const protocolBody = sanitizeBiradsUpstreamText(structured.fullProtocol);
    const lines = [
      "---",
      "УЗ-исследование молочной железы (ACR BI-RADS Ultrasound, Atlas 5th ed.).",
      "ПРОТОКОЛ:",
      "",
      `Паренхима / GTC: ${structured.breastComposition}`,
      `Описание образования: ${structured.lesionDescription}`,
      structured.regionalLymphNodes,
      "",
      `КАТЕГОРИЯ BI-RADS US: ${structured.biradsAssessment}`,
      "",
      "ЗАКЛЮЧЕНИЕ:",
      recommendation,
      "",
      protocolBody,
      "",
      "ДИСКЛЕЙМЕР:",
      REPORT_GENERATOR_DISCLAIMER_RU,
      "---",
    ];

    return {
      plainText: joinSections([{ lines }]),
      sections: [
        { id: "protocol", title: "ПРОТОКОЛ", body: protocolBody },
        { id: "conclusion", title: "ЗАКЛЮЧЕНИЕ", body: recommendation },
      ],
      missingFields,
      disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
    };
  }

  const input = payload.inputs as BiradsInput;
  const result = payload.outputs.category
    ? {
        category: String(payload.outputs.category),
        riskRange: String(payload.outputs.riskRange ?? ""),
        description: String(payload.outputs.description ?? ""),
        impression: String(
          payload.outputs.impression ?? payload.outputs.recommendation ?? "",
        ),
      }
    : evaluateBirads(input);

  const lines = [
    "---",
    "УЗ-исследование молочной железы · BI-RADS US (упрощённый ruleset).",
    "ПРОТОКОЛ:",
    "",
    `Тип находки: ${input.findingType === "non_mass" ? "non-mass" : "mass"}`,
    `Форма: ${input.shape}`,
    `Контур: ${input.margin}`,
    `Эхоструктура: ${input.echoPattern}`,
    `Ориентация: ${input.orientation}`,
    `Васкуляризация: ${input.vascularity}`,
    "",
    `КАТЕГОРИЯ BI-RADS US: ${result.category} (${result.riskRange})`,
    "",
    "ЗАКЛЮЧЕНИЕ:",
    result.impression || "Тактика — по категории BI-RADS US и локальному протоколу скрининга.",
    "",
    "ДИСКЛЕЙМЕР:",
    REPORT_GENERATOR_DISCLAIMER_RU,
    "---",
  ];

  return {
    plainText: joinSections([{ lines }]),
    sections: [
      { id: "protocol", title: "ПРОТОКОЛ", body: lines.slice(4, -4).join("\n") },
      { id: "conclusion", title: "ЗАКЛЮЧЕНИЕ", body: result.category },
    ],
    missingFields,
    disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
  };
}
