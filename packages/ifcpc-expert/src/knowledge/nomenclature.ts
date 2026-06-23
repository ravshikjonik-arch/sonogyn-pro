import raw from "./ifcpc-nomenclature.json";
import type {
  IfcpcNomenclatureDocument,
  IfcpcSectionDefinition,
  IfcpcSectionId,
  IfcpcSignDefinition,
} from "../types";

export const IFCPC_NOMENCLATURE = raw as IfcpcNomenclatureDocument;

export const IFCPC_META = IFCPC_NOMENCLATURE.meta;

export const IFCPC_SECTIONS: IfcpcSectionDefinition[] = IFCPC_NOMENCLATURE.sections;

export const IFCPC_SIGNS: IfcpcSignDefinition[] = IFCPC_NOMENCLATURE.signs;

const signById = new Map(IFCPC_SIGNS.map((s) => [s.id, s]));

const sectionById = new Map(IFCPC_SECTIONS.map((s) => [s.id, s]));

export function getIfcpcSignById(id: string): IfcpcSignDefinition | undefined {
  return signById.get(id);
}

export function getIfcpcSectionById(id: IfcpcSectionId): IfcpcSectionDefinition | undefined {
  return sectionById.get(id);
}

export function getIfcpcSignsBySection(sectionId: IfcpcSectionId): IfcpcSignDefinition[] {
  const section = sectionById.get(sectionId);
  if (!section) return [];
  return section.signIds
    .map((id) => signById.get(id))
    .filter((s): s is IfcpcSignDefinition => Boolean(s));
}

/** Validates JSON integrity: unique ids, section references, sign counts. */
export function validateIfcpcNomenclature(doc: IfcpcNomenclatureDocument = IFCPC_NOMENCLATURE): void {
  const localSignById = new Map(doc.signs.map((s) => [s.id, s]));
  const signIds = doc.signs.map((s) => s.id);
  const duplicateSign = signIds.find((id, i) => signIds.indexOf(id) !== i);
  if (duplicateSign) {
    throw new Error(`[ifcpc-expert] Duplicate sign id: "${duplicateSign}"`);
  }

  for (const section of doc.sections) {
    for (const signId of section.signIds) {
      if (!localSignById.has(signId)) {
        throw new Error(`[ifcpc-expert] Section "${section.id}" references unknown sign "${signId}"`);
      }
    }
  }

  for (const sign of doc.signs) {
    if (!doc.sections.some((s) => s.id === sign.sectionId)) {
      throw new Error(`[ifcpc-expert] Sign "${sign.id}" has unknown sectionId "${sign.sectionId}"`);
    }
  }
}

validateIfcpcNomenclature();
