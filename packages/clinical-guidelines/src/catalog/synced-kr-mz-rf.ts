import type { ClinicalGuideline } from "../types";
import syncedRaw from "./synced-kr-mz-rf.json";

/** Автосинхронизация из рубрикатора Минздрава (metadata only). Обновление: npm run sync */
export const SYNCED_KR_MZ_RF: ClinicalGuideline[] = syncedRaw as ClinicalGuideline[];
