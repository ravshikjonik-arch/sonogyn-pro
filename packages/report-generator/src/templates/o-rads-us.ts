import { evaluateAdnexTriangulation, type AdnexCalcInput } from "@repo/adnex-education";
import { calculateORADS, type OradsInput, type OradsResult } from "@repo/orads-us/pro";
import { renderAdnexStructuredReport } from "@repo/report-engine";

import { mapOradsToAdnexSreInput } from "../adapters/map-orads-to-sre-input";
import { REPORT_GENERATOR_DISCLAIMER_RU } from "../disclaimer";
import {
  formatBloodFlow,
  formatDimensions,
  formatEchogenicity,
  formatExtraFeatures,
  formatLocalization,
  formatPapillary,
  formatSepta,
  formatSolidType,
  formatStructure,
  maxDiameterMm,
} from "../labels/orads-ru";
import { MISSING_VALUE_RU, formatField, joinSections } from "../placeholders";
import type { CalculatorReportPayload, GeneratedReport } from "../types";

const ORADS_VERSION = "O-RADS US v2022";

function parseOradsInput(raw: Record<string, unknown>): OradsInput {
  return raw as OradsInput;
}

function parseOradsResult(outputs: Record<string, unknown>, input: OradsInput): OradsResult {
  if (typeof outputs.category === "number") {
    return outputs as unknown as OradsResult;
  }
  if (outputs.result && typeof (outputs.result as OradsResult).category === "number") {
    return outputs.result as OradsResult;
  }
  return calculateORADS(input);
}

export function renderOradsUsReport(payload: CalculatorReportPayload): GeneratedReport {
  const input = parseOradsInput(payload.inputs);
  const result = parseOradsResult(payload.outputs, input);
  const missingFields: string[] = [];

  const tri = evaluateAdnexTriangulation(input as AdnexCalcInput, result.category);
  const sreInput = mapOradsToAdnexSreInput(input, result, undefined, tri);
  const sre = renderAdnexStructuredReport(sreInput, { locale: "ru" });

  const sizeMm = maxDiameterMm(input);
  const extras = formatExtraFeatures(input);
  const colorScore = input.iotaColorScore ? `color score ${input.iotaColorScore}` : null;

  const protocolLines = [
    "---",
    "УЗ-исследование органов малого таза. Оценка аднексальной образования.",
    `ПРОТОКОЛ (по ACR ${ORADS_VERSION}):`,
    "",
    formatField("Локализация", formatLocalization(input), missingFields),
    formatField(
      "Максимальный диаметр образования",
      sizeMm != null ? `${sizeMm} мм` : formatDimensions(input),
      missingFields,
    ),
    formatField("Структура", formatStructure(input), missingFields),
    formatField("Солидный компонент / морфология", formatSolidType(input), missingFields),
    formatField("Перегородки", formatSepta(input), missingFields),
    formatField("Папиллярные выстилки", formatPapillary(input), missingFields),
    formatField("Эхогенность", formatEchogenicity(input), missingFields),
    formatField(
      "Кровоток (CDI)",
      colorScore && formatBloodFlow(input)
        ? `${colorScore}, ${formatBloodFlow(input)}`
        : colorScore ?? formatBloodFlow(input),
      missingFields,
    ),
    formatField(
      "Дополнительные признаки",
      extras.length ? extras.join("; ") : undefined,
      missingFields,
    ),
    "",
    `КАТЕГОРИЯ O-RADS US: ${result.category} — ${result.riskText}`,
    result.patternLabel ? `Паттерн: ${result.patternLabel}.` : "",
    (() => {
      const adnexLine = sre.impression
        .split("\n")
        .find((l) => l.includes("ADNEX") || l.includes("злокачественности"));
      return adnexLine ?? `Риск злокачественности (модель ADNEX): ${MISSING_VALUE_RU}`;
    })(),
    "",
    "ЗАКЛЮЧЕНИЕ:",
    `Категория O-RADS US ${result.category}. ${result.recommendation}`,
    tri.managementRu ? `Тактика (assistive): ${tri.managementRu}` : "",
    "",
    "ДИСКЛЕЙМЕР:",
    REPORT_GENERATOR_DISCLAIMER_RU,
    "---",
  ].filter((line) => line !== "");

  const body = joinSections([{ lines: protocolLines }]);

  return {
    plainText: body,
    sections: [
      { id: "protocol", title: "ПРОТОКОЛ", body: sre.description },
      {
        id: "category",
        title: "КАТЕГОРИЯ O-RADS US",
        body: `O-RADS ${result.category} — ${result.riskText}`,
      },
      {
        id: "conclusion",
        title: "ЗАКЛЮЧЕНИЕ",
        body: `${result.recommendation}\n\n${sre.recommendations}`.trim(),
      },
    ],
    missingFields,
    disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
  };
}
