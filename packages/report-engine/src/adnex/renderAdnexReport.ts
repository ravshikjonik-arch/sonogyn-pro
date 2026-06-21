import { evaluateAdnexTriangulation } from "@repo/adnex-education";
import type {
  AdnexStructuredReportInput,
  GenerateStructuredReportRequest,
  ReportLocale,
  StructuredReportDocument,
  StructuredReportOutput,
} from "@repo/types";

import { buildAdnexReportCitations, ORADS_US_VERSION } from "./citations";
import { composeAdnexDescription, composeAdnexImpression, composeAdnexRecommendations } from "./composeBlocks";
import { getReportI18n } from "../i18n";
import { mapAdnexStructuredInputToCalcInput, resolveOradsCategory } from "./mapInput";
import { ADNEX_ORADS_V1_ENGINE_ID, ADNEX_ORADS_V1_TEMPLATE_SLUG } from "../templates/adnex-orads-v1";

export type RenderAdnexReportOptions = {
  locale?: ReportLocale;
  templateSlug?: string;
  engineId?: string;
  generatedAt?: string;
};

export function renderAdnexStructuredReport(
  input: AdnexStructuredReportInput,
  options: RenderAdnexReportOptions = {},
): StructuredReportOutput {
  const locale = options.locale ?? "ru";
  const templateSlug = options.templateSlug ?? ADNEX_ORADS_V1_TEMPLATE_SLUG;
  const engineId = options.engineId ?? ADNEX_ORADS_V1_ENGINE_ID;
  const t = getReportI18n(locale);

  const calcInput = mapAdnexStructuredInputToCalcInput(input);
  const oradsCategory = resolveOradsCategory(input);
  const tri = evaluateAdnexTriangulation(calcInput, oradsCategory);

  return {
    description: composeAdnexDescription(input, tri, t),
    impression: composeAdnexImpression(input, tri, t, ORADS_US_VERSION),
    recommendations: composeAdnexRecommendations(tri),
    citations: buildAdnexReportCitations(),
    disclaimerKey: "report.assistive_footer",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    locale,
    engineId,
    templateSlug,
  };
}

export function renderAdnexStructuredDocument(
  input: AdnexStructuredReportInput,
  options: RenderAdnexReportOptions = {},
): StructuredReportDocument {
  const locale = options.locale ?? "ru";
  const templateSlug = options.templateSlug ?? ADNEX_ORADS_V1_TEMPLATE_SLUG;
  const output = renderAdnexStructuredReport(input, options);

  return {
    version: "2026.1",
    status: "draft",
    templateSlug,
    locale,
    patient: input.patient,
    study: input.study ?? {
      modality: "ultrasound",
      region: getReportI18n(locale).report.study_region_adnex,
    },
    input,
    output,
    editedBlocks: {},
    findings: [],
  };
}

/** Convenience wrapper matching future POST /api/reports/generate body. */
export function generateStructuredReportFromRequest(
  request: GenerateStructuredReportRequest,
): StructuredReportDocument {
  if (request.input.domain !== "adnex") {
    throw new Error(`Unsupported report domain: ${(request.input as { domain: string }).domain}`);
  }
  return renderAdnexStructuredDocument(request.input, {
    locale: request.locale,
    templateSlug: request.templateSlug,
  });
}

export { mapAdnexStructuredInputToCalcInput, resolveOradsCategory } from "./mapInput";
