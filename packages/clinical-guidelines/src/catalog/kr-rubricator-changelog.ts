import type { ClinicalGuideline } from "../types";
import changelogRaw from "./synced-kr-mz-rf.changelog.json";

export type KrRubricatorChangelog = {
  syncedAt: string;
  added: Array<{
    id: string;
    title: string;
    officialUrl: string;
    specialty: ClinicalGuideline["specialty"];
    version: number;
  }>;
  updated: Array<{
    id: string;
    title: string;
    officialUrl: string;
    specialty: ClinicalGuideline["specialty"];
    version: number;
    previousVersion: number;
    previousId: string;
  }>;
  addedCount: number;
  updatedCount: number;
  total: number;
};

export const KR_RUBRICATOR_CHANGELOG: KrRubricatorChangelog =
  changelogRaw as KrRubricatorChangelog;

export function listKrRubricatorWhatsNewItems(limit = 12): Array<{
  id: string;
  title: string;
  summary: string;
  url: string;
  updatedAt: string;
  specialty: string;
}> {
  const iso = KR_RUBRICATOR_CHANGELOG.syncedAt.slice(0, 10);
  const items = [
    ...KR_RUBRICATOR_CHANGELOG.added.map((a) => ({
      id: `kr-new-${a.id}`,
      title: `Новая КР МЗ РФ: ${a.title}`,
      summary: `Версия v${a.version}. Специальность: ${a.specialty}. Откройте карточку в рубрикаторе.`,
      url: a.officialUrl,
      updatedAt: iso,
      specialty: a.specialty,
    })),
    ...KR_RUBRICATOR_CHANGELOG.updated.map((u) => ({
      id: `kr-upd-${u.id}`,
      title: `Обновлена КР: ${u.title}`,
      summary: `v${u.previousVersion} → v${u.version}. Проверьте изменения в официальном тексте.`,
      url: u.officialUrl,
      updatedAt: iso,
      specialty: u.specialty,
    })),
  ];
  return items.slice(0, limit);
}