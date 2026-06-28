import type {
  GenerateStructuredReportRequest,
  ObstetricStructuredReportInput,
  ReportLocale,
  StructuredReportDocument,
  StructuredReportOutput,
} from "@repo/types";

import { getReportI18n, type ReportCatalog } from "../i18n";
import {
  OBSTETRIC_BIOMETRY_V1_ENGINE_ID,
  OBSTETRIC_BIOMETRY_V1_TEMPLATE_SLUG,
} from "../templates/obstetric-biometry-v1";

export type RenderObstetricReportOptions = {
  locale?: ReportLocale;
  templateSlug?: string;
  engineId?: string;
  generatedAt?: string;
};

const BIOMETRY_LABELS: Record<ReportLocale, Record<string, string>> = {
  ru: { crl: "КТР", bpd: "БПР", hc: "ОГ", ac: "ОЖ", fl: "ДБ" },
  en: { crl: "CRL", bpd: "BPD", hc: "HC", ac: "AC", fl: "FL" },
};

function composeObstetricDescription(input: ObstetricStructuredReportInput, t: ReportCatalog, locale: ReportLocale): string {
  const b = input.biometry;
  const labels = BIOMETRY_LABELS[locale];
  const lines: string[] = [t.obstetric.ga(b.gestationalAgeWeeks, b.gestationalAgeDays)];

  lines.push(t.obstetric.biometry_line(labels.crl, b.crlMm));
  lines.push(t.obstetric.biometry_line(labels.bpd, b.bpdMm));
  lines.push(t.obstetric.biometry_line(labels.hc, b.hcMm));
  lines.push(t.obstetric.biometry_line(labels.ac, b.acMm));
  lines.push(t.obstetric.biometry_line(labels.fl, b.flMm));

  const efw = t.obstetric.efw(b.efwGrams);
  if (efw) lines.push(efw);
  const placenta = t.obstetric.placenta(b.placentaLocation);
  if (placenta) lines.push(placenta);
  const fluid = t.obstetric.fluid(b.amnioticFluid);
  if (fluid) lines.push(fluid);
  if (input.freeTextFindings?.trim()) lines.push(input.freeTextFindings.trim());

  return lines.filter(Boolean).join("\n");
}

export function renderObstetricStructuredReport(
  input: ObstetricStructuredReportInput,
  options: RenderObstetricReportOptions = {},
): StructuredReportOutput {
  const locale = options.locale ?? "ru";
  const templateSlug = options.templateSlug ?? OBSTETRIC_BIOMETRY_V1_TEMPLATE_SLUG;
  const engineId = options.engineId ?? OBSTETRIC_BIOMETRY_V1_ENGINE_ID;
  const t = getReportI18n(locale);

  const description = composeObstetricDescription(input, t, locale);

  return {
    description,
    impression: description,
    recommendations: t.obstetric.recommendations,
    citations: [
      {
        id: "isuog-biometry",
        standard: "ISUOG",
        label: "ISUOG practice guidelines for fetal biometry",
        url: "https://www.isuog.org/",
      },
    ],
    disclaimerKey: "report.assistive_footer",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    locale,
    engineId,
    templateSlug,
  };
}

export function renderObstetricStructuredDocument(
  input: ObstetricStructuredReportInput,
  options: RenderObstetricReportOptions = {},
): StructuredReportDocument {
  const locale = options.locale ?? "ru";
  const templateSlug = options.templateSlug ?? OBSTETRIC_BIOMETRY_V1_TEMPLATE_SLUG;
  const output = renderObstetricStructuredReport(input, options);

  return {
    version: "2026.1",
    status: "draft",
    templateSlug,
    locale,
    patient: input.patient,
    study: input.study ?? {
      modality: "ultrasound",
      region: getReportI18n(locale).report.study_region_obstetric,
    },
    input,
    output,
    editedBlocks: {},
    findings: [],
  };
}

export function generateObstetricReportFromRequest(
  request: GenerateStructuredReportRequest,
): StructuredReportDocument {
  if (request.input.domain !== "obstetric") {
    throw new Error(`Expected obstetric input, got ${request.input.domain}`);
  }
  return renderObstetricStructuredDocument(request.input, {
    locale: request.locale,
    templateSlug: request.templateSlug,
  });
}
