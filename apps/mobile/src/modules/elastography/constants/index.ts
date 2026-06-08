/**
 * Этот файл — точка входа для всех констант модуля.
 * Не добавляй сюда новую логику — создавай отдельный файл в папке constants/
 *
 * Cut-off для расчёта: синхронный fallback из defaultConfig + асинхронный Remote Config.
 */

export { DEVICE_CALIBRATION } from "./device";
export { ELASTO_DISCLAIMER_KEY, REFERENCE_TABLE } from "./reference";
export { ORGAN_FIELD_DEFINITIONS, ORGAN_METHODS } from "./ui";

export {
  defaultConfig as ELASTOGRAPHY_CUTOFFS,
  mapConfigToElastographyCutoffs,
  mapConfigToLegacyCutoffs,
} from "../remoteConfig/defaultConfig";

export {
  BREAST_ELASTO,
  CERVIX_CCI,
  DEFAULT_ELASTOGRAPHY_CUTOFFS,
  MYOMETRIUM_SWE,
  OVARY_ELASTO,
  RISK_COLORS,
} from "@repo/medical-calculations/elastography";

export {
  getConfig,
  checkForUpdates,
  refreshConfig,
  resetToDefaultConfig,
  getCachedMeta,
  USE_LOCAL_CONFIG,
} from "../remoteConfig/configLoader";

export { useRemoteConfig } from "../remoteConfig/useRemoteConfig";
export { default as ConfigStatusBadge } from "../remoteConfig/ConfigStatusBadge";
export type { ElastographyConfig, UpdateStatus, ConfigResponse } from "../remoteConfig/types";
