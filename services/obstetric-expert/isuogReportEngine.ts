import { generateReport, type GeneratedReport, type ReportFormat, type ReportInput } from "./sonographerAssistant";
import type { AneuploidyRiskOutput } from "./aneuploidyRiskEngine";
import type { ClinicalDecisionSupportOutput } from "./clinicalDecisionSupport";
import type { DopplerAssessmentOutput } from "./dopplerEngine";
import type { FetalBiometryOutput } from "./fetalBiometryEngine";
import type { ProtocolCompletenessOutput } from "./protocolAssistant";

export type IsuogReportInput = ReportInput & {
  biometry?: FetalBiometryOutput;
  doppler?: DopplerAssessmentOutput;
  aneuploidy?: AneuploidyRiskOutput;
  protocol?: ProtocolCompletenessOutput;
  clinicalDecision?: ClinicalDecisionSupportOutput;
};

export type IsuogStructuredReport = GeneratedReport & {
  /** Полный текст для протокола */
  fullText: string;
  /** Блоки для копирования в PACS/RIS */
  blocks: {
    biometry?: string;
    doppler?: string;
    aneuploidy?: string;
    protocol?: string;
    cds?: string;
  };
};

function blockBiometry(bio?: FetalBiometryOutput): string | undefined {
  if (!bio?.measurements.length) return undefined;
  const lines = bio.measurements
    .filter((m) => m.percentile != null)
    .map((m) => `${m.parameterRu}: ${m.value} ${m.unit} (~${m.percentile}-й перц.)`);
  if (bio.efw) lines.push(`EFW: ${bio.efw.grams} g (~${bio.efw.percentile ?? "—"}-й перц.)`);
  if (bio.growthPattern !== "unknown") lines.push(`Паттерн роста: ${bio.growthPattern}`);
  return lines.join("\n");
}

function blockDoppler(dop?: DopplerAssessmentOutput): string | undefined {
  if (!dop?.vessels.length) return undefined;
  const lines = dop.vessels.map((v) => `${v.labelRu}: PI ${v.pi?.toFixed(2) ?? "—"} — ${v.interpretationRu}`);
  if (dop.cpr) lines.push(`CPR: ${dop.cpr.value.toFixed(2)} (порог ${dop.cpr.threshold})`);
  return lines.join("\n");
}

function blockAneuploidy(risk?: AneuploidyRiskOutput): string | undefined {
  if (!risk) return undefined;
  const top = risk.risks[0];
  return [
    `Риск анеуплоидий (модель): ${risk.summaryRu}`,
    top ? `Ведущий: ${top.diagnosis} ${top.riskLabel}` : "",
    risk.activeMarkers.length ? `Маркеры: ${risk.activeMarkers.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function blockProtocol(proto?: ProtocolCompletenessOutput): string | undefined {
  if (!proto) return undefined;
  return [
    `${proto.checklist.labelRu} · полнота ${proto.completenessScore}%`,
    ...proto.nextActions.slice(0, 4),
  ].join("\n");
}

function blockCds(cds?: ClinicalDecisionSupportOutput): string | undefined {
  if (!cds?.actions.length) return undefined;
  return cds.actions
    .slice(0, 6)
    .map((a) => `[${a.priority}] ${a.labelRu}: ${a.rationale}`)
    .join("\n");
}

/**
 * Этап 8 — ISUOG-structured report с биометрией, допплером, риском и CDS.
 */
export function generateIsuogReport(
  input: IsuogReportInput,
  format: ReportFormat = "detailed",
): IsuogStructuredReport {
  const base = generateReport(input, format);

  const blocks = {
    biometry: blockBiometry(input.biometry),
    doppler: blockDoppler(input.doppler),
    aneuploidy: blockAneuploidy(input.aneuploidy),
    protocol: blockProtocol(input.protocol),
    cds: blockCds(input.clinicalDecision),
  };

  const extraRecs = [
    ...(input.biometry?.recommendations ?? []),
    ...(input.doppler?.recommendations ?? []),
    ...(input.aneuploidy?.recommendations ?? []),
    ...(input.clinicalDecision?.actions.filter((a) => a.priority === "required").map((a) => a.labelRu) ?? []),
  ];

  const recommendations = [...new Set([...base.recommendations, ...extraRecs])].slice(0, 12);

  const fullText = [
    "=== УЗИ ПЛОДА (ISUOG / Woodward expert assist) ===",
    "",
    `Показания: ${base.sections.indication ?? "—"}`,
    `Срок: ${base.gestationalAgeLabel}`,
    "",
    "— НАХОДКИ —",
    ...base.sections.findings,
    "",
    blocks.biometry ? `— БИОМЕТРИЯ —\n${blocks.biometry}` : "",
    blocks.doppler ? `— ДОППЛЕР —\n${blocks.doppler}` : "",
    blocks.aneuploidy ? `— СКРИНИНГ —\n${blocks.aneuploidy}` : "",
    "",
    "— ЗАКЛЮЧЕНИЕ —",
    base.sections.impression,
    "",
    blocks.cds ? `— РЕКОМЕНДАЦИИ (CDS) —\n${blocks.cds}` : "",
    "",
    "— РЕКОМЕНДАЦИИ —",
    ...recommendations.map((r) => `• ${r}`),
    "",
    base.isuogDisclaimer,
    input.clinicalDecision?.disclaimer ?? "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    ...base,
    recommendations,
    sections: {
      ...base.sections,
      biometry: blocks.biometry?.split("\n"),
      doppler: blocks.doppler?.split("\n"),
      recommendations,
    },
    fullText,
    blocks,
  };
}
