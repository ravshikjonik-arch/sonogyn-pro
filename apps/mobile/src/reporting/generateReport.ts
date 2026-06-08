import i18n from "../i18n";
import type { ReportInput } from "./ovaryReportInput";

function clampOrads(n: number): number {
  if (!Number.isFinite(n)) return 2;
  const r = Math.round(n);
  if (r < 1) return 1;
  if (r > 5) return 5;
  return r;
}

function oradsBand(o: number): "1" | "2" | "3" | "4plus" {
  if (o <= 1) return "1";
  if (o === 2) return "2";
  if (o === 3) return "3";
  return "4plus";
}

/**
 * Builds a concise ovarian ultrasound conclusion from structured inputs.
 * Wording follows common reporting practice; localised via i18n.
 */
export function generateReport(input: ReportInput): string {
  if (input.organ !== "ovary") {
    return i18n.t("report_unsupported_organ");
  }

  const o = clampOrads(input.orads);
  const band = oradsBand(o);
  const desc = input.description.trim() || i18n.t("report_placeholder_description");

  const patientLine = i18n.t("report_patient_context", {
    status: i18n.t(`orads_patient_${input.menopausalStatus}`),
  });

  const oradsLine = i18n.t(`report_orads_body_${band}`, { category: `O-RADS ${o}` });

  const parts = [desc, patientLine, oradsLine];

  if (input.roma !== undefined && Number.isFinite(input.roma) && input.roma >= 0) {
    const pct = Math.round(input.roma * 10) / 10;
    const romaLine =
      input.romaRisk === "high"
        ? i18n.t("report_roma_line_high", { pct: String(pct) })
        : i18n.t("report_roma_line_low", { pct: String(pct) });
    parts.push(romaLine);
  }

  parts.push(i18n.t(`report_conclusion_${band}`));
  parts.push(i18n.t(`report_rec_line_${band}`));
  parts.push(i18n.t("report_assistive_footer"));

  return parts.join("\n\n");
}

/** Parse numeric O-RADS category from flow labels such as "O-RADS 2". */
export function parseOradsNumberFromCategory(category: string): number {
  const m = category.match(/O-RADS\s*(\d+)/i);
  if (!m) return 2;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : 2;
}
