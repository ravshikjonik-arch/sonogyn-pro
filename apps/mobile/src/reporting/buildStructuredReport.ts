import { renderAdnexStructuredDocument, ADNEX_ORADS_V1_TEMPLATE_SLUG } from "@repo/report-engine";
import type { StructuredReportDocument } from "@repo/types";
import type { OradsTreePathStep, OradsTreeResult } from "@repo/orads-us";

import { mapOradsTreeToSreInput } from "./mapOradsTreeToSreInput";

export function buildStructuredReportFromOradsWizard(
  path: OradsTreePathStep[],
  result: OradsTreeResult,
  pathSummary: string[] = [],
): StructuredReportDocument {
  const input = mapOradsTreeToSreInput(path, result, pathSummary);
  return renderAdnexStructuredDocument(input, {
    locale: "ru",
    templateSlug: ADNEX_ORADS_V1_TEMPLATE_SLUG,
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
