import type { OradsReferatDocument } from "./types";

/** Map wizard node id → referat section anchor for «?» help links. */
export function getReferatSectionIdForWizardNode(
  nodeId: string,
  doc: OradsReferatDocument,
): string | undefined {
  for (const section of doc.sections) {
    if (section.wizardNodeIds?.includes(nodeId)) return section.id;
  }
  for (const clinicalCase of doc.cases) {
    if (clinicalCase.wizardNodeIds?.includes(nodeId)) return clinicalCase.sectionId;
  }
  return undefined;
}

export function referatGuideHref(sectionId?: string, basePath = "/library/orads-guide"): string {
  if (!sectionId) return basePath;
  return `${basePath}#${sectionId}`;
}
