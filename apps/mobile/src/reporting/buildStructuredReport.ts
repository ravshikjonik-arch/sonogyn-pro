import {
  ADNEX_ORADS_V1_TEMPLATE_SLUG,
  OBSTETRIC_BIOMETRY_V1_TEMPLATE_SLUG,
  THYROID_TIRADS_V1_TEMPLATE_SLUG,
  renderAdnexStructuredDocument,
  renderObstetricStructuredDocument,
  renderThyroidStructuredDocument,
} from "@repo/report-engine";
import type {
  ObstetricStructuredReportInput,
  ReportLocale,
  StructuredReportDocument,
  ThyroidStructuredReportInput,
} from "@repo/types";
import type { OradsTreePathStep, OradsTreeResult } from "@repo/orads-us";

import { mapOradsTreeToSreInput } from "./mapOradsTreeToSreInput";

export type SreDomain = "adnex" | "thyroid" | "obstetric";

export function templateSlugForDomain(domain: SreDomain): string {
  if (domain === "thyroid") return THYROID_TIRADS_V1_TEMPLATE_SLUG;
  if (domain === "obstetric") return OBSTETRIC_BIOMETRY_V1_TEMPLATE_SLUG;
  return ADNEX_ORADS_V1_TEMPLATE_SLUG;
}

export function buildStructuredReportFromOradsWizard(
  path: OradsTreePathStep[],
  result: OradsTreeResult,
  pathSummary: string[] = [],
  locale: ReportLocale = "ru",
): StructuredReportDocument {
  const input = mapOradsTreeToSreInput(path, result, pathSummary);
  return renderAdnexStructuredDocument(input, {
    locale,
    templateSlug: ADNEX_ORADS_V1_TEMPLATE_SLUG,
  });
}

export function buildStructuredReportFromThyroid(
  input: ThyroidStructuredReportInput,
  locale: ReportLocale = "ru",
): StructuredReportDocument {
  return renderThyroidStructuredDocument(input, {
    locale,
    templateSlug: THYROID_TIRADS_V1_TEMPLATE_SLUG,
  });
}

export function buildStructuredReportFromObstetric(
  input: ObstetricStructuredReportInput,
  locale: ReportLocale = "ru",
): StructuredReportDocument {
  return renderObstetricStructuredDocument(input, {
    locale,
    templateSlug: OBSTETRIC_BIOMETRY_V1_TEMPLATE_SLUG,
  });
}

export function mergeEditedBlocks(
  document: StructuredReportDocument,
  blocks: { description: string; impression: string; recommendations: string },
): StructuredReportDocument {
  return {
    ...document,
    editedBlocks: {
      description: blocks.description !== document.output.description ? blocks.description : undefined,
      impression: blocks.impression !== document.output.impression ? blocks.impression : undefined,
      recommendations:
        blocks.recommendations !== document.output.recommendations ? blocks.recommendations : undefined,
    },
    status: "edited",
  };
}

export function displayBlocks(document: StructuredReportDocument) {
  const { output, editedBlocks } = document;
  return {
    description: editedBlocks.description ?? output.description,
    impression: editedBlocks.impression ?? output.impression,
    recommendations: editedBlocks.recommendations ?? output.recommendations,
  };
}

export function blocksToPlainText(blocks: {
  description: string;
  impression: string;
  recommendations: string;
}): string {
  return [blocks.description, blocks.impression, blocks.recommendations].filter(Boolean).join("\n\n");
}

export function editedBlocksPayload(
  document: StructuredReportDocument,
  blocks: { description: string; impression: string; recommendations: string },
) {
  return {
    description: blocks.description !== document.output.description ? blocks.description : undefined,
    impression: blocks.impression !== document.output.impression ? blocks.impression : undefined,
    recommendations:
      blocks.recommendations !== document.output.recommendations ? blocks.recommendations : undefined,
  };
}

export function domainMeta(domain: SreDomain): { badge: string; subtitle: string; pdfTitle: string } {
  if (domain === "thyroid") {
    return {
      badge: "TI-RADS",
      subtitle: "УЗИ щитовидной железы · ACR TI-RADS. Не диагноз; интерпретация — лечащий специалист.",
      pdfTitle: "Протокол УЗИ · щитовидная железа TI-RADS",
    };
  }
  if (domain === "obstetric") {
    return {
      badge: "Акушерство",
      subtitle: "Биометрия плода · черновик SRE. Не диагноз; интерпретация — лечащий специалист.",
      pdfTitle: "Протокол УЗИ · акушерская биометрия",
    };
  }
  return {
    badge: "O-RADS",
    subtitle: "O-RADS US · три блока. Не диагноз; интерпретация — лечащий специалист.",
    pdfTitle: "Протокол УЗИ · придатки O-RADS",
  };
}
