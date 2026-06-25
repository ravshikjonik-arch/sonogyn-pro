import type { KnowledgeFileId, WoodwardKnowledgeFile, WoodwardPathologyEntry } from "./schema";
import { KNOWLEDGE_FILES } from "./schema";

import aneuploidy from "./aneuploidy.json";
import brain from "./brain.json";
import chest from "./chest.json";
import faceNeck from "./face-neck.json";
import firstTrimester from "./first-trimester.json";
import gastrointestinal from "./gastrointestinal.json";
import genitourinary from "./genitourinary.json";
import growthWellbeing from "./growth-wellbeing.json";
import heart from "./heart.json";
import infection from "./infection.json";
import maternalConditions from "./maternal-conditions.json";
import multipleGestation from "./multiple-gestation.json";
import musculoskeletal from "./musculoskeletal.json";
import placenta from "./placenta.json";
import spine from "./spine.json";
import syndromes from "./syndromes.json";

export type { WoodwardPathologyEntry, WoodwardKnowledgeFile, KnowledgeFileId };
export { KNOWLEDGE_FILES };

const FILES: Record<KnowledgeFileId, WoodwardKnowledgeFile> = {
  "first-trimester": firstTrimester as WoodwardKnowledgeFile,
  brain: brain as WoodwardKnowledgeFile,
  spine: spine as WoodwardKnowledgeFile,
  "face-neck": faceNeck as WoodwardKnowledgeFile,
  chest: chest as WoodwardKnowledgeFile,
  heart: heart as WoodwardKnowledgeFile,
  gastrointestinal: gastrointestinal as WoodwardKnowledgeFile,
  genitourinary: genitourinary as WoodwardKnowledgeFile,
  musculoskeletal: musculoskeletal as WoodwardKnowledgeFile,
  placenta: placenta as WoodwardKnowledgeFile,
  "multiple-gestation": multipleGestation as WoodwardKnowledgeFile,
  aneuploidy: aneuploidy as WoodwardKnowledgeFile,
  syndromes: syndromes as WoodwardKnowledgeFile,
  infection: infection as WoodwardKnowledgeFile,
  "growth-wellbeing": growthWellbeing as WoodwardKnowledgeFile,
  "maternal-conditions": maternalConditions as WoodwardKnowledgeFile,
};

export function getKnowledgeFile(id: KnowledgeFileId): WoodwardKnowledgeFile {
  return FILES[id];
}

export function getAllPathologies(): WoodwardPathologyEntry[] {
  return KNOWLEDGE_FILES.flatMap((id) => FILES[id].entries);
}

export function findPathologyById(id: string): WoodwardPathologyEntry | undefined {
  return getAllPathologies().find((e) => e.id === id);
}

export function searchPathologies(query: string, limit = 25): WoodwardPathologyEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getAllPathologies()
    .filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.nameEn.toLowerCase().includes(q) ||
        e.differential_diagnosis.some((d) => d.toLowerCase().includes(q)) ||
        e.ultrasound_findings.some((u) => u.toLowerCase().includes(q)),
    )
    .slice(0, limit);
}
