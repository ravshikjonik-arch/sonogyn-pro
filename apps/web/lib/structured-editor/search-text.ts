import type {
  StructuredCaseDocument,
  StructuredProtocolDraft,
  StructuredSectionContent,
} from "@repo/types";

function sectionPlain(section: StructuredSectionContent | undefined): string {
  if (!section) return "";
  const parts: string[] = [];
  if (section.plain?.trim()) parts.push(section.plain.trim());
  for (const block of section.blocks ?? []) {
    parts.push(`${block.system} ${block.category}: ${block.summary}`);
    parts.push(block.sourceLabel);
  }
  for (const ref of section.mediaRefs ?? []) {
    if (ref.label?.trim()) parts.push(ref.label.trim());
  }
  return parts.join("\n");
}

export function buildCaseSearchText(document: StructuredCaseDocument): string {
  return Object.values(document.sections)
    .map(sectionPlain)
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 32000);
}

export function buildProtocolSearchText(draft: StructuredProtocolDraft): string {
  const meta = [draft.scaleSource, draft.algorithmVersion, draft.algorithmDate]
    .filter(Boolean)
    .join(" ");
  const body = Object.values(draft.sections)
    .map(sectionPlain)
    .filter(Boolean)
    .join("\n\n");
  return [meta, body].filter(Boolean).join("\n\n").slice(0, 32000);
}

export function withCaseSearchText(document: StructuredCaseDocument): StructuredCaseDocument {
  return { ...document, searchText: buildCaseSearchText(document) };
}

export function withProtocolSearchText(draft: StructuredProtocolDraft): StructuredProtocolDraft {
  return { ...draft, searchText: buildProtocolSearchText(draft) };
}
