import { REPORT_GENERATOR_DISCLAIMER_RU } from "../disclaimer";
import { MISSING_VALUE_RU, formatField, joinSections } from "../placeholders";
import type { CalculatorReportPayload, GeneratedReport } from "../types";

function num(raw: unknown): number | undefined {
  if (raw == null || raw === "") return undefined;
  const v = Number.parseFloat(String(raw).replace(",", "."));
  return Number.isFinite(v) ? v : undefined;
}

function mapFromSbpDbp(sbp?: number, dbp?: number): number | undefined {
  if (sbp == null || dbp == null) return undefined;
  return Math.round(dbp + (sbp - dbp) / 3);
}

/** FMF first-trimester PE screening — текстовый шаблон; полный FMF risk engine — отдельная интеграция. */
export function renderFmfPreeclampsiaReport(payload: CalculatorReportPayload): GeneratedReport {
  const missingFields: string[] = [];
  const gaWeeks = num(payload.inputs.gaWeeks ?? payload.inputs.gestationalWeeks);
  const sbp = num(payload.inputs.sbp);
  const dbp = num(payload.inputs.dbp);
  const map =
    num(payload.inputs.mapMmHg ?? payload.inputs.map) ??
    mapFromSbpDbp(sbp, dbp) ??
    num(payload.outputs.mapMmHg);
  const utaPi = num(payload.inputs.utaPi ?? payload.inputs.utaPI);
  const plgfMom = num(payload.inputs.plgfMom ?? payload.inputs.plgfMoM);
  const priorPe = payload.inputs.priorPe === true || payload.inputs.priorPe === "true";
  const chronicHt = payload.inputs.chronicHypertension === true || payload.inputs.chronicHypertension === "true";
  const diabetes = payload.inputs.diabetes === true || payload.inputs.diabetes === "true";
  const sle = payload.inputs.sle === true || payload.inputs.sle === "true";
  const aps = payload.inputs.aps === true || payload.inputs.aps === "true";

  const earlyRisk = payload.outputs.earlyPeRisk ?? payload.outputs.earlyRisk;
  const termRisk = payload.outputs.termPeRisk ?? payload.outputs.termRisk;

  const lines = [
    "---",
    "Скрининг I триместра · риск преэклампии (FMF algorithm).",
    "ПРОТОКОЛ:",
    "",
    formatField("Срок беременности", gaWeeks != null ? `${gaWeeks} нед` : undefined, missingFields),
    formatField("SBP", sbp != null ? `${sbp} мм рт.ст.` : undefined, missingFields),
    formatField("DBP", dbp != null ? `${dbp} мм рт.ст.` : undefined, missingFields),
    formatField("MAP", map != null ? `${map} мм рт.ст.` : undefined, missingFields),
    formatField("UtA PI", utaPi != null ? String(utaPi) : undefined, missingFields),
    formatField("PlGF MoM", plgfMom != null ? String(plgfMom) : undefined, missingFields),
    `Факторы: ${[
      priorPe ? "ПЭ в анамнезе" : null,
      chronicHt ? "ХАГ" : null,
      diabetes ? "СД" : null,
      sle ? "SLE" : null,
      aps ? "АФС" : null,
    ]
      .filter(Boolean)
      .join("; ") || "не указаны"}`,
    "",
    "РИСК (FMF):",
    typeof earlyRisk === "string" || typeof earlyRisk === "number"
      ? `Ранний ПЭ (<34 нед): ${earlyRisk}`
      : `Ранний ПЭ: ${MISSING_VALUE_RU}`,
    typeof termRisk === "string" || typeof termRisk === "number"
      ? `Term ПЭ (≥37 нед): ${termRisk}`
      : `Term ПЭ: ${MISSING_VALUE_RU}`,
    "",
    "ЗАКЛЮЧЕНИЕ:",
    "Стратификация риска преэклампии по протоколу FMF (MAP, UtA PI, maternal factors, PlGF при доступности). При повышенном assistive-риске — рассмотреть низкую дозу аспирина 150 mg на ночь с 11–14 нед по локальному протоколу.",
    "",
    "ДИСКЛЕЙМЕР:",
    REPORT_GENERATOR_DISCLAIMER_RU,
    "---",
  ];

  return {
    plainText: joinSections([{ lines }]),
    sections: [
      { id: "protocol", title: "ПРОТОКОЛ", body: lines.slice(4, -4).join("\n") },
      { id: "conclusion", title: "ЗАКЛЮЧЕНИЕ", body: String(lines.find((l) => l.startsWith("ЗАКЛЮЧЕНИЕ:")) ?? "") },
    ],
    missingFields,
    disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
  };
}
