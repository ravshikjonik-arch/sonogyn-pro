import type {
  GenerateStructuredReportRequest,
  ReportLocale,
  StructuredReportDocument,
  StructuredReportOutput,
  ThyroidStructuredReportInput,
} from "@repo/types";

import { getReportI18n, type ReportCatalog } from "../i18n";
import {
  mapEvidenceRecordsToReportCitations,
  mergeReportCitations,
  type EvidenceRecordLike,
} from "../evidence/mapEvidenceRecordsToCitations";
import { THYROID_TIRADS_V1_ENGINE_ID, THYROID_TIRADS_V1_TEMPLATE_SLUG } from "../templates/thyroid-tirads-v1";
import { evaluateThyroidFromInput } from "./mapInput";

const THYROID_STATIC_CITATIONS = [
  {
    id: "acr-tirads-2017",
    standard: "ACR TI-RADS",
    version: "2017",
    label: "ACR Thyroid Imaging Reporting and Data System",
    url: "https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/TI-RADS",
  },
] as const;

export type RenderThyroidReportOptions = {
  locale?: ReportLocale;
  templateSlug?: string;
  engineId?: string;
  generatedAt?: string;
  evidenceRecords?: EvidenceRecordLike[];
};

function composeThyroidDescription(input: ThyroidStructuredReportInput, t: ReportCatalog, locale: ReportLocale): string {
  const header = locale === "en" ? "Thyroid ultrasound:" : "УЗИ щитовидной железы:";
  const lines: string[] = [header];
  lines.push(t.thyroid.volume(input.measurements.thyroidVolumeMl));
  lines.push(t.thyroid.nodule_size(input.measurements.noduleMaxDiameterMm));
  if (input.morphology.noduleLocation) {
    lines.push(`Location: ${input.morphology.noduleLocation}.`);
  }
  if (input.freeTextFindings?.trim()) lines.push(input.freeTextFindings.trim());
  return lines.join("\n");
}

function composeThyroidRecommendations(t: ReportCatalog, input: ThyroidStructuredReportInput): string {
  const result = evaluateThyroidFromInput(input);
  const fna = result.fnaRecommended
    ? t.thyroid.fna_yes(result.fnaRationale)
    : t.thyroid.fna_no(result.fnaRationale);
  return [fna, t.thyroid.follow_up(result.followUpRecommendation)].join("\n");
}

export function renderThyroidStructuredReport(
  input: ThyroidStructuredReportInput,
  options: RenderThyroidReportOptions = {},
): StructuredReportOutput {
  const locale = options.locale ?? "ru";
  const templateSlug = options.templateSlug ?? THYROID_TIRADS_V1_TEMPLATE_SLUG;
  const engineId = options.engineId ?? THYROID_TIRADS_V1_ENGINE_ID;
  const t = getReportI18n(locale);

  const description = composeThyroidDescription(input, t, locale);
  const result = evaluateThyroidFromInput(input);
  const impression = t.thyroid.tirads_line(result.categoryLabel, result.totalPoints, result.malignancyRisk);
  const recommendations = composeThyroidRecommendations(t, input);

  return {
    description,
    impression,
    recommendations,
    citations: mergeReportCitations(
      [...THYROID_STATIC_CITATIONS],
      options.evidenceRecords
        ? mapEvidenceRecordsToReportCitations(options.evidenceRecords, {
            max: 8,
            standardPrefix: "EBM",
          })
        : [],
    ),
    disclaimerKey: "report.assistive_footer",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    locale,
    engineId,
    templateSlug,
  };
}

export function renderThyroidStructuredDocument(
  input: ThyroidStructuredReportInput,
  options: RenderThyroidReportOptions = {},
): StructuredReportDocument {
  const locale = options.locale ?? "ru";
  const templateSlug = options.templateSlug ?? THYROID_TIRADS_V1_TEMPLATE_SLUG;
  const output = renderThyroidStructuredReport(input, options);

  return {
    version: "2026.1",
    status: "draft",
    templateSlug,
    locale,
    patient: input.patient,
    study: input.study ?? {
      modality: "ultrasound",
      region: getReportI18n(locale).report.study_region_thyroid,
    },
    input,
    output,
    editedBlocks: {},
    findings: [],
  };
}

export function generateThyroidReportFromRequest(
  request: GenerateStructuredReportRequest,
): StructuredReportDocument {
  if (request.input.domain !== "thyroid") {
    throw new Error(`Expected thyroid input, got ${request.input.domain}`);
  }
  return renderThyroidStructuredDocument(request.input, {
    locale: request.locale,
    templateSlug: request.templateSlug,
  });
}
