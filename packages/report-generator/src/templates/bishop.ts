import {
  bishopScore,
  type BishopInput,
  type BishopResult,
} from "@repo/medical-calculations";

import { REPORT_GENERATOR_DISCLAIMER_RU } from "../disclaimer";
import { joinSections } from "../placeholders";
import type { CalculatorReportPayload, GeneratedReport } from "../types";

function parseBishopInput(inputs: Record<string, unknown>): BishopInput {
  return {
    dilation: Number(inputs.dilation) as BishopInput["dilation"],
    effacement: Number(inputs.effacement) as BishopInput["effacement"],
    station: Number(inputs.station) as BishopInput["station"],
    consistency: Number(inputs.consistency) as BishopInput["consistency"],
    position: Number(inputs.position) as BishopInput["position"],
  };
}

function parseBishopResult(outputs: Record<string, unknown>): BishopResult | null {
  if (typeof outputs.total !== "number") return null;
  return outputs as unknown as BishopResult;
}

export function renderBishopReport(payload: CalculatorReportPayload): GeneratedReport {
  const input = parseBishopInput(payload.inputs);
  const result = parseBishopResult(payload.outputs) ?? bishopScore(input);
  const missingFields: string[] = [];

  const protocolLines = [
    "---",
    "Трансвагинальное / трансабdominalное исследование. Оценка зрелости шейки матки (modified Bishop).",
    "ПРОТОКОЛ:",
    "",
    ...result.hints,
    "",
    `СУММА БАЛЛОВ: ${result.total} / 13 (${result.favorable ? "≥6 — благоприятная шейка" : "<6 — неблагоприятная / промежуточная"})`,
    "",
    "ЗАКЛЮЧЕНИЕ:",
    result.interpretation,
    "",
    "ДИСКЛЕЙМЕР:",
    REPORT_GENERATOR_DISCLAIMER_RU,
    "---",
  ];

  const body = joinSections([{ lines: protocolLines }]);

  return {
    plainText: body,
    sections: [
      { id: "protocol", title: "ПРОТОКОЛ", body: result.hints.join("\n") },
      {
        id: "conclusion",
        title: "ЗАКЛЮЧЕНИЕ",
        body: `Bishop ${result.total}/13. ${result.interpretation}`,
      },
    ],
    missingFields,
    disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
  };
}
