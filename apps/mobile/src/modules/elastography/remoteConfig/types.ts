/**
 * Типы удалённого справочника эластографии (Remote Config).
 * Сервер отдаёт JSON по HTTPS; приложение кэширует локально.
 */

/** Уровень риска для cut-off зон */
export type ConfigRiskLevel = "low" | "intermediate" | "high" | "benign" | "malignant" | "uncertain";

/** Запись changelog */
export type ConfigChangelogEntry = {
  version: string;
  date: string;
  changes: string;
};

/** Метаданные конфигурации */
export type ConfigMeta = {
  version: string;
  releaseDate: string;
  minAppVersion?: string;
  checksum: string;
  source: string;
  changelog: ConfigChangelogEntry[];
};

/** Диапазон CCI для шейки матки */
export type CciZone = {
  min?: number;
  max?: number;
  label: string;
  riskLevel: ConfigRiskLevel;
  colorHex: string;
};

/** Cut-off: шейка матки (strain) */
export type CervixCutoffs = {
  strain: {
    cci: {
      soft: CciZone;
      intermediate: CciZone;
      firm: CciZone;
    };
    recommendations: Record<string, string>;
  };
};

/** Cut-off: миометрий (SWE) */
export type MyometriumCutoffs = {
  swe: {
    adenomyosis: { range: [number, number]; unit: string };
    fibroid: { min: number; unit: string };
    ratioCutoff: number;
    interpretations: Record<string, string>;
  };
};

/** Cut-off: яичники */
export type OvaryCutoffs = {
  strain: { ratioBenign: number; ratioMalignant: number };
  swe: { emaxBenign: number; emaxMalignant: number; unit: string };
  integratedAssessment: Record<string, string>;
};

/** Оценка Tsukuba */
export type TsukubaScoreEntry = {
  label: string;
  risk: ConfigRiskLevel;
};

/** Cut-off: молочная железа */
export type BreastCutoffs = {
  strain: {
    tsukubaScore: Record<string, TsukubaScoreEntry>;
    ratioBenign: number;
    ratioMalignant: number;
  };
  swe: {
    emaxBenign: number;
    emaxMalignant: number;
    unit: string;
  };
  biradsIntegration: Record<string, string>;
};

/** Маркеры шкалы UI */
export type ScaleMarker = {
  min: number;
  max: number;
  step: number;
  unit?: string;
};

/** UI-настройки из конфига */
export type ConfigUi = {
  gradientColors: string[];
  scaleMarkers: Record<string, ScaleMarker>;
};

/** Полный ответ сервера */
export type ConfigResponse = {
  meta: ConfigMeta;
  cutoffs: {
    cervix: CervixCutoffs;
    myometrium: MyometriumCutoffs;
    ovary: OvaryCutoffs;
    breast: BreastCutoffs;
  };
  ui: ConfigUi;
};

/** Активная конфигурация в приложении (alias) */
export type ElastographyConfig = ConfigResponse;

/** Метаданные кэша в AsyncStorage */
export type CachedConfigMeta = {
  version: string;
  releaseDate: string;
  source: string;
  etag?: string;
  lastModified?: string;
  fetchedAt: number;
  checksum: string;
  isFallback: boolean;
};

/** Статус проверки обновлений */
export type UpdateStatus = {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  changelog: ConfigChangelogEntry[];
  isOffline: boolean;
  error?: string;
};

/** Коды ошибок валидации */
export type ConfigValidationErrorCode =
  | "INVALID_STRUCTURE"
  | "INVALID_TYPE"
  | "INVALID_RANGE"
  | "INVALID_VERSION"
  | "INVALID_DATE"
  | "INCOMPATIBLE_APP_VERSION"
  | "CHECKSUM_MISMATCH";

/** Типизированная ошибка валидации конфигурации */
export class ConfigValidationError extends Error {
  readonly code: ConfigValidationErrorCode;

  constructor(code: ConfigValidationErrorCode, message: string) {
    super(message);
    this.name = "ConfigValidationError";
    this.code = code;
  }
}

/** Настройки загрузчика (из env) */
export type ConfigLoaderSettings = {
  configUrl: string;
  updateIntervalHours: number;
  requestTimeoutMs: number;
  useLocalConfig: boolean;
};
