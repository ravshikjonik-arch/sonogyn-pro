import {
  formatFigoProtocolLine,
  formatFigoSonoGynBlock,
  getFigoAtlasEntryForType,
  type FigoVariantCode,
} from "@repo/clinical-3d";

import { REPORT_GENERATOR_DISCLAIMER_RU } from "../disclaimer";
import { MISSING_VALUE_RU, formatField, joinSections } from "../placeholders";
import type { CalculatorReportPayload, GeneratedReport } from "../types";

export function renderFigoMyomaReport(payload: CalculatorReportPayload): GeneratedReport {
  const missingFields: string[] = [];
  const figoTypeRaw = payload.inputs.figoType ?? payload.outputs.figoType ?? payload.category;
  const figoType = Number(figoTypeRaw);
  const variant = (payload.inputs.figoVariant ?? payload.outputs.figoVariant) as FigoVariantCode | undefined;
  const localizationRu =
    typeof payload.inputs.localizationRu === "string" ? payload.inputs.localizationRu : undefined;
  const sizeLine = typeof payload.inputs.sizeLine === "string" ? payload.inputs.sizeLine : undefined;

  if (!Number.isFinite(figoType) || figoType < 0 || figoType > 8) {
    missingFields.push("FIGO тип");
  }

  const entry =
    Number.isFinite(figoType) && figoType >= 0 && figoType <= 8
      ? getFigoAtlasEntryForType(figoType, variant ?? null)
      : null;

  const protocolLine = entry
    ? formatFigoProtocolLine(figoType, variant ?? null, localizationRu, sizeLine)
    : `Классификация миомы FIGO 2018: ${MISSING_VALUE_RU}`;

  const atlasBlock = entry ? formatFigoSonoGynBlock(entry) : "";

  const lines = [
    "---",
    "УЗ-исследование матки. Миоматозные узлы — классификация FIGO 2018 (PALM-COEIN).",
    "ПРОТОКОЛ:",
    "",
    formatField("FIGO", entry?.title ?? undefined, missingFields),
    formatField("Локализация", localizationRu ?? entry?.localization, missingFields),
    formatField("Размеры", sizeLine, missingFields),
    "",
    protocolLine,
    "",
    atlasBlock,
    "",
    "ЗАКЛЮЧЕНИЕ:",
    entry
      ? `${entry.title}. ${entry.summaryRu} Тактика — по симптоматике, репродуктивным планам и протоколу учреждения. // VERIFY: FIGO 2018 + локальный КР`
      : MISSING_VALUE_RU,
    "",
    "ДИСКЛЕЙМЕР:",
    REPORT_GENERATOR_DISCLAIMER_RU,
    "---",
  ].filter(Boolean);

  return {
    plainText: joinSections([{ lines: lines as string[] }]),
    sections: [
      { id: "protocol", title: "ПРОТОКОЛ", body: [protocolLine, atlasBlock].filter(Boolean).join("\n\n") },
      { id: "conclusion", title: "ЗАКЛЮЧЕНИЕ", body: entry?.summaryRu ?? MISSING_VALUE_RU },
    ],
    missingFields,
    disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
  };
}
