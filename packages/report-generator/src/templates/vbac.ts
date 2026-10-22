import {
  assessVbacInLabor,
  assessVbacPreLabor,
  type VbacInLaborInput,
  type VbacInLaborResult,
  type VbacPreInput,
  type VbacPreResult,
} from "@repo/medical-calculations";

import { REPORT_GENERATOR_DISCLAIMER_RU } from "../disclaimer";
import { joinSections } from "../placeholders";
import type { CalculatorReportPayload, GeneratedReport } from "../types";

function parseBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

function parsePreInput(inputs: Record<string, unknown>): VbacPreInput {
  return {
    singleLtcs: parseBool(inputs.pre_singleLtcs ?? inputs.singleLtcs),
    nonRecurringIndication: parseBool(inputs.pre_nonRecurringIndication ?? inputs.nonRecurringIndication),
    priorVaginalBirth: parseBool(inputs.pre_priorVaginalBirth ?? inputs.priorVaginalBirth),
    interval18Months: parseBool(inputs.pre_interval18Months ?? inputs.interval18Months),
    noMacrosomiaSuspected: parseBool(inputs.pre_noMacrosomiaSuspected ?? inputs.noMacrosomiaSuspected),
    cephalicSingleton: parseBool(inputs.pre_cephalicSingleton ?? inputs.cephalicSingleton),
    noPlacentaPrevia: parseBool(inputs.pre_noPlacentaPrevia ?? inputs.noPlacentaPrevia),
    noClassicalScar: parseBool(inputs.pre_noClassicalScar ?? inputs.noClassicalScar),
    noUterineRuptureHistory: parseBool(inputs.pre_noUterineRuptureHistory ?? inputs.noUterineRuptureHistory),
    continuousMonitoringAvailable: parseBool(
      inputs.pre_continuousMonitoringAvailable ?? inputs.continuousMonitoringAvailable,
    ),
  };
}

function parseLaborInput(inputs: Record<string, unknown>): VbacInLaborInput {
  return {
    spontaneousLabor: parseBool(inputs.labor_spontaneousLabor ?? inputs.spontaneousLabor),
    activeLabor: parseBool(inputs.labor_activeLabor ?? inputs.activeLabor),
    dilationAtLeast4cm: parseBool(inputs.labor_dilationAtLeast4cm ?? inputs.dilationAtLeast4cm),
    noExcessiveOxytocin: parseBool(inputs.labor_noExcessiveOxytocin ?? inputs.noExcessiveOxytocin),
    ctgCategory1: parseBool(inputs.labor_ctgCategory1 ?? inputs.ctgCategory1),
    noAntepartumBleedingInLabor: parseBool(
      inputs.labor_noAntepartumBleedingInLabor ?? inputs.noAntepartumBleedingInLabor,
    ),
    noHyperstimulation: parseBool(inputs.labor_noHyperstimulation ?? inputs.noHyperstimulation),
    epiduralUsed: parseBool(inputs.labor_epiduralUsed ?? inputs.epiduralUsed),
  };
}

export function renderVbacReport(payload: CalculatorReportPayload): GeneratedReport {
  const tab = payload.inputs.tab === "labor" ? "labor" : "pre";
  const missingFields: string[] = [];

  if (tab === "pre") {
    const pre = parsePreInput(payload.inputs);
    const result =
      (payload.outputs as unknown as VbacPreResult)?.score != null
        ? (payload.outputs as unknown as VbacPreResult)
        : assessVbacPreLabor(pre);

    const lines = [
      "---",
      "Акушерский контекст: роды после кесарева сечения (TOLAC / VBAC).",
      "ПРОТОКОЛ (до родов):",
      "",
      ...result.lines,
      "",
      `ОЦЕНКА: ${result.score}/${result.maxScore} · ${result.category}`,
      result.tolacEligible
        ? "Ориентир: кандидатка для обсуждения TOLAC при наличии ресурсов центра."
        : "Ориентир: TOLAC не рекомендуется без устранения противопоказаний / по протоколу центра.",
      "",
      "ЗАКЛЮЧЕНИЕ:",
      `Стратификация TOLAC/VBAC: ${result.category}. Решение — после информированного согласия и протокола учреждения. // VERIFY: формулировки под ваш локальный КР/ACOG summary`,
      "",
      "ДИСКЛЕЙМЕР:",
      REPORT_GENERATOR_DISCLAIMER_RU,
      "---",
    ];

    return {
      plainText: joinSections([{ lines }]),
      sections: [
        { id: "protocol", title: "ПРОТОКОЛ", body: result.lines.join("\n") },
        {
          id: "conclusion",
          title: "ЗАКЛЮЧЕНИЕ",
          body: `${result.score}/${result.maxScore} · ${result.category}`,
        },
      ],
      missingFields,
      disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
    };
  }

  const labor = parseLaborInput(payload.inputs);
  const result =
    typeof payload.outputs.continueTolac === "boolean"
      ? (payload.outputs as unknown as VbacInLaborResult)
      : assessVbacInLabor(labor);

  const lines = [
    "---",
    "Мониторинг в родах после кесарева сечения (TOLAC).",
    "ПРОТОКОЛ (в родах):",
    "",
    ...result.alerts,
    "",
    "МОНИТОРИНГ:",
    ...result.monitoring,
    "",
    "ЗАКЛЮЧЕНИЕ:",
    result.continueTolac
      ? "TOLAC продолжается при сохранении критериев и CTG категории I; готовность к экстренному КС."
      : "Рассмотреть прекращение TOLAC и экстренное кесарево сечение по клинической ситуации.",
    "",
    "ДИСКЛЕЙМЕР:",
    REPORT_GENERATOR_DISCLAIMER_RU,
    "---",
  ];

  return {
    plainText: joinSections([{ lines }]),
    sections: [
      { id: "protocol", title: "ПРОТОКОЛ", body: [...result.alerts, "", ...result.monitoring].join("\n") },
      {
        id: "conclusion",
        title: "ЗАКЛЮЧЕНИЕ",
        body: result.continueTolac ? "TOLAC продолжается" : "Пересмотр TOLAC",
      },
    ],
    missingFields,
    disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
  };
}
