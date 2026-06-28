/**
 * Синхронный доступ к активным cut-off (обновляется configLoader после getConfig).
 */

import type { ElastographyCutoffs } from "@repo/medical-calculations/elastography";
import { DEFAULT_ELASTOGRAPHY_CUTOFFS } from "@repo/medical-calculations/elastography";
import { defaultConfig, mapConfigToElastographyCutoffs } from "./defaultConfig";
import type { ConfigResponse } from "./types";

let activeCutoffs: ElastographyCutoffs = mapConfigToElastographyCutoffs(defaultConfig);

/** Текущие cut-off для калькуляторов (sync) */
export function getActiveCutoffs(): ElastographyCutoffs {
  return activeCutoffs;
}

/** Обновить cut-off из загруженного Remote Config */
export function setActiveCutoffsFromConfig(config: ConfigResponse): void {
  activeCutoffs = mapConfigToElastographyCutoffs(config);
}

/** Сброс на вшитый defaultConfig */
export function resetActiveCutoffsToDefault(): void {
  activeCutoffs = mapConfigToElastographyCutoffs(defaultConfig);
}

export { DEFAULT_ELASTOGRAPHY_CUTOFFS };
