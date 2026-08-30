import type {
  CalculatorSystem,
  StructuredCalculatorBlock,
  StructuredSectionContent,
} from "@repo/types";
import { CALCULATOR_ALGORITHM_CATALOG } from "@repo/types";

import { sanitizeClinicalHtml } from "@/lib/clinical-editor/sanitize-clinical-html";
import { htmlToPlainText } from "@/lib/clinical-editor/html-to-plain";
import { structuredEditorUuid } from "@/lib/structured-editor/uuid";

export function createCalculatorBlock(input: {
  system: CalculatorSystem;
  category: string;
  summary: string;
  isAiDraft?: boolean;
}): StructuredCalculatorBlock {
  const catalog = CALCULATOR_ALGORITHM_CATALOG[input.system];
  return {
    id: structuredEditorUuid(),
    system: input.system,
    category: input.category.trim(),
    summary: input.summary.trim(),
    algorithmId: catalog.algorithmId,
    algorithmVersion: catalog.algorithmVersion,
    sourceLabel: catalog.sourceLabel,
    insertedAt: new Date().toISOString(),
    immutable: true,
    isAiDraft: input.isAiDraft ?? false,
  };
}

/** Calculator blocks are immutable — reject client attempts to mutate category/summary. */
export function mergeCalculatorBlocks(
  existing: StructuredCalculatorBlock[],
  incoming: StructuredCalculatorBlock[],
): StructuredCalculatorBlock[] {
  const byId = new Map(existing.map((b) => [b.id, b]));
  const out: StructuredCalculatorBlock[] = [];

  for (const block of incoming) {
    const prev = byId.get(block.id);
    if (prev) {
      out.push(prev);
      continue;
    }
    out.push({
      ...block,
      immutable: true,
      algorithmId: block.algorithmId || CALCULATOR_ALGORITHM_CATALOG[block.system].algorithmId,
      algorithmVersion:
        block.algorithmVersion || CALCULATOR_ALGORITHM_CATALOG[block.system].algorithmVersion,
      sourceLabel: block.sourceLabel || CALCULATOR_ALGORITHM_CATALOG[block.system].sourceLabel,
    });
  }

  return out.slice(0, 20);
}

export function sanitizeStructuredSection(section: StructuredSectionContent): StructuredSectionContent {
  const html = section.html?.trim() ? sanitizeClinicalHtml(section.html) : undefined;
  const plain = html ? htmlToPlainText(html) : section.plain?.trim() || undefined;
  return {
    html,
    plain,
    blocks: mergeCalculatorBlocks(section.blocks ?? [], section.blocks ?? []),
    mediaRefs: (section.mediaRefs ?? []).slice(0, 12),
  };
}

export function appendAiDraftHtml(section: StructuredSectionContent, draftText: string): StructuredSectionContent {
  const trimmed = draftText.trim();
  if (!trimmed) return section;
  const banner =
    '<p><em>[Черновик ИИ — требует проверки врачом]</em></p>';
  const esc = trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const addition = `${banner}<p>${esc.replace(/\n/g, "<br/>")}</p>`;
  const html = section.html?.trim()
    ? sanitizeClinicalHtml(section.html + addition)
    : sanitizeClinicalHtml(addition);
  return {
    ...section,
    html,
    plain: htmlToPlainText(html),
  };
}
