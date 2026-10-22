import { INTERNATIONAL_GUIDELINES } from "./international";
import { KR_MZ_RF_OBGYN } from "./kr-mz-rf-obgyn";
import { KR_MZ_RF_OBSTETRICS } from "./kr-mz-rf-obstetrics";
import { KR_MZ_RF_ULTRASOUND } from "./kr-mz-rf-ultrasound";
import { ORDERS_DZM } from "./orders-dzm";
import { ORDERS_MZ_RF } from "./orders-mz-rf";
import { PROTOCOLS_ORG } from "./protocols-org";
import { INGESTED_REGULATIONS } from "./ingested-regulations";
import { SYNCED_KR_MZ_RF } from "./synced-kr-mz-rf";
import type { ClinicalGuideline, GuidelineShelf } from "../types";

function mergeByShelf(base: ClinicalGuideline[], extra: ClinicalGuideline[]): ClinicalGuideline[] {
  const ids = new Set(base.map((g) => g.id));
  const add = extra.filter((g) => !ids.has(g.id));
  return add.length ? [...base, ...add] : base;
}

/** Ручные карточки с секциями и связями с nosology — поверх автосинка */
const CURATED_KR_MZ_RF: ClinicalGuideline[] = [
  ...KR_MZ_RF_OBGYN,
  ...KR_MZ_RF_OBSTETRICS,
  ...KR_MZ_RF_ULTRASOUND,
];

function mergeKrMzRfCatalog(): ClinicalGuideline[] {
  const curatedIds = new Set(CURATED_KR_MZ_RF.map((g) => g.id));
  const synced = SYNCED_KR_MZ_RF.filter((g) => !curatedIds.has(g.id));
  return [...CURATED_KR_MZ_RF, ...synced];
}

export const KR_MZ_RF_CATALOG = mergeKrMzRfCatalog();

const ingestedKr = INGESTED_REGULATIONS.filter((g) => g.shelf === "kr_mz_rf");
const ingestedDzm = INGESTED_REGULATIONS.filter((g) => g.shelf === "orders_dzm");
const ingestedMz = INGESTED_REGULATIONS.filter((g) => g.shelf === "orders_mz_rf");
const ingestedProto = INGESTED_REGULATIONS.filter((g) => g.shelf === "protocols_org");

const SHELF_KR_MZ_RF = mergeByShelf(KR_MZ_RF_CATALOG, ingestedKr);
const SHELF_ORDERS_DZM = mergeByShelf(ORDERS_DZM, ingestedDzm);
const SHELF_ORDERS_MZ_RF = mergeByShelf(ORDERS_MZ_RF, ingestedMz);
const SHELF_PROTOCOLS_ORG = mergeByShelf(PROTOCOLS_ORG, ingestedProto);

export const CLINICAL_GUIDELINES: ClinicalGuideline[] = [
  ...SHELF_KR_MZ_RF,
  ...SHELF_ORDERS_DZM,
  ...SHELF_ORDERS_MZ_RF,
  ...SHELF_PROTOCOLS_ORG,
  ...INTERNATIONAL_GUIDELINES,
];

export const GUIDELINES_BY_SHELF: Record<GuidelineShelf, ClinicalGuideline[]> = {
  kr_mz_rf: SHELF_KR_MZ_RF,
  orders_dzm: SHELF_ORDERS_DZM,
  orders_mz_rf: SHELF_ORDERS_MZ_RF,
  protocols_org: SHELF_PROTOCOLS_ORG,
  international: INTERNATIONAL_GUIDELINES,
};

export function getGuidelineById(id: string): ClinicalGuideline | undefined {
  return CLINICAL_GUIDELINES.find((g) => g.id === id);
}

export function countByShelf(): Record<GuidelineShelf, number> {
  return {
    kr_mz_rf: GUIDELINES_BY_SHELF.kr_mz_rf.length,
    orders_dzm: GUIDELINES_BY_SHELF.orders_dzm.length,
    orders_mz_rf: GUIDELINES_BY_SHELF.orders_mz_rf.length,
    protocols_org: GUIDELINES_BY_SHELF.protocols_org.length,
    international: GUIDELINES_BY_SHELF.international.length,
  };
}
