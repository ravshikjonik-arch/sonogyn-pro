import { wipeOradsLocalStorage } from "../../features/oradsPro/storage/oradsStorage";
import { clearElastographyHistory } from "../../modules/elastography/utils/historyStorage";

/** Стереть локальные клинические черновики при выходе (mobile). */
export async function wipeMobileClinicalLocalData(): Promise<void> {
  await Promise.all([
    wipeOradsLocalStorage().catch(() => undefined),
    clearElastographyHistory().catch(() => undefined),
  ]);
}
