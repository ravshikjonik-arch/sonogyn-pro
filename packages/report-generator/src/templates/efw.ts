import {
  efwMaternalAnthropometry,
  efwRudakov,
  estimateFetalWeightAll,
  type FetalPresentation,
} from "@repo/medical-calculations";

import { REPORT_GENERATOR_DISCLAIMER_RU } from "../disclaimer";
import { MISSING_VALUE_RU, formatField, joinSections } from "../placeholders";
import type { CalculatorReportPayload, GeneratedReport } from "../types";

function num(s: unknown): number | undefined {
  if (s == null || s === "") return undefined;
  const v = Number.parseFloat(String(s).replace(",", "."));
  return Number.isFinite(v) ? v : undefined;
}

type EfwHadlockRow = { grams: number; label: string };

export function renderEfwReport(payload: CalculatorReportPayload): GeneratedReport {
  const tab = payload.inputs.tab === "rudakov" || payload.inputs.tab === "maternal" ? payload.inputs.tab : "hadlock";
  const missingFields: string[] = [];

  if (tab === "hadlock") {
    const bpd = num(payload.inputs.bpd);
    const hc = num(payload.inputs.hc);
    const ac = num(payload.inputs.ac);
    const fl = num(payload.inputs.fl);

    const fromOutputs = payload.outputs.hadlockResults as EfwHadlockRow[] | undefined;
    const results =
      Array.isArray(fromOutputs) && fromOutputs.length
        ? fromOutputs
        : estimateFetalWeightAll({ bpdMm: bpd, hcMm: hc, acMm: ac, flMm: fl });

    const protocolLines = [
      "---",
      "Акушерское УЗИ. Оценка предполагаемой массы плода (EFW).",
      "ПРОТОКОЛ (формулы Hadlock, по биометрии):",
      "",
      formatField("BPD", bpd != null ? `${bpd} мм` : undefined, missingFields),
      formatField("HC", hc != null ? `${hc} мм` : undefined, missingFields),
      formatField("AC", ac != null ? `${ac} мм` : undefined, missingFields),
      formatField("FL", fl != null ? `${fl} мм` : undefined, missingFields),
    ];

    if (results.length === 0) {
      protocolLines.push("", "Расчёт: введите минимум комбинацию параметров для формулы Hadlock.");
    } else {
      protocolLines.push("", "РАСЧЁТ:");
      for (const r of results) {
        protocolLines.push(`• ${r.label}: ${r.grams} г`);
      }
    }

    const primary = results[0];
    protocolLines.push(
      "",
      "ЗАКЛЮЧЕНИЕ:",
      primary
        ? `Расчётная масса плода ~${primary.grams} г (${primary.label}). Сопоставить с гestational age и перцентилями по локальной таблице. // VERIFY: перцентили — только если введён срок`
        : `Расчётная масса плода: ${MISSING_VALUE_RU}`,
      "",
      "ДИСКЛЕЙМЕР:",
      REPORT_GENERATOR_DISCLAIMER_RU,
      "---",
    );

    return {
      plainText: joinSections([{ lines: protocolLines }]),
      sections: [
        { id: "protocol", title: "ПРОТОКОЛ", body: protocolLines.slice(4, -4).join("\n") },
        {
          id: "conclusion",
          title: "ЗАКЛЮЧЕНИЕ",
          body: primary ? `~${primary.grams} г · ${primary.label}` : MISSING_VALUE_RU,
        },
      ],
      missingFields,
      disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
    };
  }

  if (tab === "rudakov") {
    const vdm = num(payload.inputs.vdm);
    const ozh = num(payload.inputs.ozh);
    const presentation = (payload.inputs.presentation as FetalPresentation) ?? "cephalic";
    const rudakov =
      payload.outputs.grams != null
        ? {
            grams: Number(payload.outputs.grams),
            formula: String(payload.outputs.formula ?? "Рудаков"),
            note: payload.outputs.note as string | undefined,
          }
        : vdm != null && ozh != null
          ? efwRudakov({ fundalHeightCm: vdm, abdominalCircumferenceCm: ozh, presentation })
          : null;

    const lines = [
      "---",
      "Акушерское обследование. EFW по формуле Рудакова.",
      "ПРОТОКОЛ:",
      "",
      formatField("ВДМ", vdm != null ? `${vdm} см` : undefined, missingFields),
      formatField("ОЖ", ozh != null ? `${ozh} см` : undefined, missingFields),
      formatField(
        "Предлежание",
        presentation === "cephalic" ? "головное" : presentation === "breech" ? "тазовое" : "поперечное",
        missingFields,
      ),
      "",
      "ЗАКЛЮЧЕНИЕ:",
      rudakov
        ? `Расчётная масса плода ~${rudakov.grams} г (${rudakov.formula}).${rudakov.note ? ` ${rudakov.note}` : ""}`
        : `Расчётная масса плода: ${MISSING_VALUE_RU}`,
      "",
      "ДИСКЛЕЙМЕР:",
      REPORT_GENERATOR_DISCLAIMER_RU,
      "---",
    ];

    return {
      plainText: joinSections([{ lines }]),
      sections: [
        { id: "protocol", title: "ПРОТОКОЛ", body: lines.slice(4, -4).join("\n") },
        {
          id: "conclusion",
          title: "ЗАКЛЮЧЕНИЕ",
          body: rudakov ? `~${rudakov.grams} г` : MISSING_VALUE_RU,
        },
      ],
      missingFields,
      disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
    };
  }

  const weight = num(payload.inputs.weight);
  const height = num(payload.inputs.height);
  const vdm = num(payload.inputs.vdm);
  const nulliparous = payload.inputs.nulliparous !== false && payload.inputs.nulliparous !== "false";
  const maternal =
    payload.outputs.grams != null
      ? {
          grams: Number(payload.outputs.grams),
          formula: String(payload.outputs.formula ?? "антропометрия матери"),
          note: payload.outputs.note as string | undefined,
        }
      : weight != null && height != null && vdm != null
        ? efwMaternalAnthropometry({
            maternalWeightKg: weight,
            maternalHeightCm: height,
            fundalHeightCm: vdm,
            nulliparous,
          })
        : null;

  const lines = [
    "---",
    "Акушерское обследование. EFW по антропометрии матери.",
    "ПРОТОКОЛ:",
    "",
    formatField("Вес матери", weight != null ? `${weight} кг` : undefined, missingFields),
    formatField("Рост матери", height != null ? `${height} см` : undefined, missingFields),
    formatField("ВДМ", vdm != null ? `${vdm} см` : undefined, missingFields),
    `Паритет: ${nulliparous ? "первые роды" : "повторные роды"}`,
    "",
    "ЗАКЛЮЧЕНИЕ:",
    maternal
      ? `Расчётная масса плода ~${maternal.grams} г (${maternal.formula}).${maternal.note ? ` ${maternal.note}` : ""}`
      : `Расчётная масса плода: ${MISSING_VALUE_RU}`,
    "",
    "ДИСКЛЕЙМЕР:",
    REPORT_GENERATOR_DISCLAIMER_RU,
    "---",
  ];

  return {
    plainText: joinSections([{ lines }]),
    sections: [
      { id: "protocol", title: "ПРОТОКОЛ", body: lines.slice(4, -4).join("\n") },
      {
        id: "conclusion",
        title: "ЗАКЛЮЧЕНИЕ",
        body: maternal ? `~${maternal.grams} г` : MISSING_VALUE_RU,
      },
    ],
    missingFields,
    disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
  };
}
