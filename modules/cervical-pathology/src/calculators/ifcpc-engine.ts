import { finalizeIfcpcExam, getIfcpcSignById, IFCPC_SECTIONS, type IfcpcSectionDefinition } from "@repo/ifcpc-expert";

import type { IfcpcColposcopy } from "../domain/schemas";

/** Part 1 — IFCPC protocol & conclusion text generation. */
export function buildIfcpcProtocol(colposcopy: IfcpcColposcopy): {
  protocolText: string;
  conclusion: string;
  riskCategory: string;
} {
  const exam = finalizeIfcpcExam({
    schema: "ifcpc.colposcopy.exam",
    version: "1.0.0",
    performedAt: new Date().toISOString(),
    adequacyId: colposcopy.adequacyId,
    scjVisibilityId: colposcopy.scjVisibilityId,
    transformationZoneTypeId: colposcopy.transformationZoneTypeId,
    findingSignIds: colposcopy.findingSignIds as never[],
  });

  const sections = IFCPC_SECTIONS.map((sec: IfcpcSectionDefinition) => {
    const signs = colposcopy.findingSignIds
      .map((id) => getIfcpcSignById(id))
      .filter((s) => s?.sectionId === sec.id);
    if (sec.id === "adequacy" || sec.id === "scj_visibility" || sec.id === "transformation_zone_type") {
      return null;
    }
    if (!signs.length) return null;
    return `${sec.titleRu}: ${signs.map((s) => s!.titleRu).join("; ")}`;
  }).filter(Boolean);

  const protocolText = [
    "КОЛЬПОСКОПИЧЕСКИЙ ПРОТОКОЛ (IFCPC 2011)",
    `Адекватность: ${getIfcpcSignById(colposcopy.adequacyId)?.titleRu ?? colposcopy.adequacyId}`,
    `SCJ: ${getIfcpcSignById(colposcopy.scjVisibilityId)?.titleRu ?? colposcopy.scjVisibilityId}`,
    `TZ: ${getIfcpcSignById(colposcopy.transformationZoneTypeId)?.titleRu ?? colposcopy.transformationZoneTypeId}`,
    ...sections,
    colposcopy.freeTextNotes ? `Примечания: ${colposcopy.freeTextNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const assessment = exam.assessment!;
  const conclusion = [
    assessment.recommendationText,
    assessment.biopsyRationale,
    `Впечатление: ${assessment.overallImpression}. CIN2+ triage: ${assessment.biopsyUrgency}.`,
  ].join(" ");

  return {
    protocolText,
    conclusion,
    riskCategory: assessment.overallImpression,
  };
}
