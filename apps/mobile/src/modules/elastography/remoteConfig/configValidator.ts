/**
 * Валидация удалённого JSON-справочника эластографии.
 * Проверяет структуру, типы, диапазоны и совместимость с версией приложения.
 */

import Constants from "expo-constants";
import { logConfigError } from "./logConfigError";
import type { ConfigResponse } from "./types";
import { ConfigValidationError } from "./types";

const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;
const MAX_KPA = 1000;

/** Текущая версия приложения из Expo / package.json */
export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? "0.2.0";
}

/**
 * Сравнение семантических версий.
 * @returns отрицательное если a < b, 0 если равны, положительное если a > b
 */
export function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function assertObject(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new ConfigValidationError("INVALID_STRUCTURE", `Поле «${path}» должно быть объектом.`);
  }
}

function assertNumber(value: unknown, path: string, opts?: { min?: number; max?: number; positive?: boolean }) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ConfigValidationError("INVALID_TYPE", `Поле «${path}» должно быть числом.`);
  }
  if (opts?.positive && value <= 0) {
    throw new ConfigValidationError("INVALID_RANGE", `Поле «${path}» должно быть положительным числом.`);
  }
  if (opts?.min != null && value < opts.min) {
    throw new ConfigValidationError("INVALID_RANGE", `Поле «${path}» меньше допустимого минимума (${opts.min}).`);
  }
  if (opts?.max != null && value > opts.max) {
    throw new ConfigValidationError("INVALID_RANGE", `Поле «${path}» превышает допустимый максимум (${opts.max}).`);
  }
}

function assertString(value: unknown, path: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ConfigValidationError("INVALID_TYPE", `Поле «${path}» должно быть непустой строкой.`);
  }
}

function assertRange(min: number | undefined, max: number | undefined, path: string) {
  if (min != null && max != null && min >= max) {
    throw new ConfigValidationError("INVALID_RANGE", `Диапазон «${path}»: min (${min}) должен быть меньше max (${max}).`);
  }
}

function validateMeta(meta: unknown): void {
  assertObject(meta, "meta");
  assertString(meta.version, "meta.version");
  if (!SEMVER_RE.test(meta.version as string)) {
    throw new ConfigValidationError("INVALID_VERSION", `Версия «${meta.version}» должна быть в формате X.Y.Z.`);
  }
  assertString(meta.releaseDate, "meta.releaseDate");
  if (!ISO_DATE_RE.test(meta.releaseDate as string)) {
    throw new ConfigValidationError("INVALID_DATE", "Дата релиза должна быть в формате ISO 8601.");
  }
  const releaseMs = Date.parse(meta.releaseDate as string);
  if (Number.isNaN(releaseMs)) {
    throw new ConfigValidationError("INVALID_DATE", "Дата релиза не распознана.");
  }
  if (releaseMs > Date.now() + 86_400_000) {
    throw new ConfigValidationError("INVALID_DATE", "Дата релиза не может быть в будущем.");
  }
  if (meta.minAppVersion != null) {
    assertString(meta.minAppVersion, "meta.minAppVersion");
    if (!SEMVER_RE.test(meta.minAppVersion as string)) {
      throw new ConfigValidationError("INVALID_VERSION", "minAppVersion должна быть в формате X.Y.Z.");
    }
    const appVer = getAppVersion();
    if (compareSemver(appVer, meta.minAppVersion as string) < 0) {
      throw new ConfigValidationError(
        "INCOMPATIBLE_APP_VERSION",
        `Конфигурация v${meta.version} требует приложение ≥${meta.minAppVersion}, установлено ${appVer}.`,
      );
    }
  }
  assertString(meta.checksum, "meta.checksum");
  assertString(meta.source, "meta.source");
  if (!Array.isArray(meta.changelog)) {
    throw new ConfigValidationError("INVALID_STRUCTURE", "meta.changelog должен быть массивом.");
  }
}

function validateCervix(cervix: unknown): void {
  assertObject(cervix, "cutoffs.cervix");
  assertObject(cervix.strain, "cutoffs.cervix.strain");
  const strain = cervix.strain as Record<string, unknown>;
  assertObject(strain.cci, "cutoffs.cervix.strain.cci");
  const cci = strain.cci as Record<string, Record<string, unknown>>;
  for (const zone of ["soft", "intermediate", "firm"] as const) {
    assertObject(cci[zone], `cutoffs.cervix.strain.cci.${zone}`);
    if (cci[zone].min != null) assertNumber(cci[zone].min, `cutoffs.cervix.strain.cci.${zone}.min`, { min: 0, max: 1 });
    if (cci[zone].max != null) assertNumber(cci[zone].max, `cutoffs.cervix.strain.cci.${zone}.max`, { min: 0, max: 1 });
    assertRange(cci[zone].min as number | undefined, cci[zone].max as number | undefined, `cutoffs.cervix.strain.cci.${zone}`);
    assertString(cci[zone].label, `cutoffs.cervix.strain.cci.${zone}.label`);
    assertString(cci[zone].riskLevel, `cutoffs.cervix.strain.cci.${zone}.riskLevel`);
    assertString(cci[zone].colorHex, `cutoffs.cervix.strain.cci.${zone}.colorHex`);
  }
}

function validateMyometrium(myometrium: unknown): void {
  assertObject(myometrium, "cutoffs.myometrium");
  assertObject(myometrium.swe, "cutoffs.myometrium.swe");
  const swe = myometrium.swe as Record<string, unknown>;
  assertObject(swe.adenomyosis, "cutoffs.myometrium.swe.adenomyosis");
  const adeno = swe.adenomyosis as Record<string, unknown>;
  if (!Array.isArray(adeno.range) || adeno.range.length !== 2) {
    throw new ConfigValidationError("INVALID_STRUCTURE", "cutoffs.myometrium.swe.adenomyosis.range должен быть [min, max].");
  }
  assertNumber(adeno.range[0], "adenomyosis.range[0]", { positive: true, max: MAX_KPA });
  assertNumber(adeno.range[1], "adenomyosis.range[1]", { positive: true, max: MAX_KPA });
  assertRange(adeno.range[0] as number, adeno.range[1] as number, "adenomyosis.range");
  assertObject(swe.fibroid, "cutoffs.myometrium.swe.fibroid");
  assertNumber((swe.fibroid as Record<string, unknown>).min, "fibroid.min", { positive: true, max: MAX_KPA });
  assertNumber(swe.ratioCutoff, "cutoffs.myometrium.swe.ratioCutoff", { positive: true, max: 20 });
}

function validateOvary(ovary: unknown): void {
  assertObject(ovary, "cutoffs.ovary");
  assertObject(ovary.strain, "cutoffs.ovary.strain");
  const strain = ovary.strain as Record<string, unknown>;
  assertNumber(strain.ratioBenign, "ovary.strain.ratioBenign", { positive: true, max: 50 });
  assertNumber(strain.ratioMalignant, "ovary.strain.ratioMalignant", { positive: true, max: 50 });
  assertRange(strain.ratioBenign as number, strain.ratioMalignant as number, "ovary.strain.ratio");
  assertObject(ovary.swe, "cutoffs.ovary.swe");
  const swe = ovary.swe as Record<string, unknown>;
  assertNumber(swe.emaxBenign, "ovary.swe.emaxBenign", { positive: true, max: MAX_KPA });
  assertNumber(swe.emaxMalignant, "ovary.swe.emaxMalignant", { positive: true, max: MAX_KPA });
  assertRange(swe.emaxBenign as number, swe.emaxMalignant as number, "ovary.swe.emax");
}

function validateBreast(breast: unknown): void {
  assertObject(breast, "cutoffs.breast");
  assertObject(breast.strain, "cutoffs.breast.strain");
  const strain = breast.strain as Record<string, unknown>;
  assertNumber(strain.ratioBenign, "breast.strain.ratioBenign", { positive: true, max: 50 });
  assertNumber(strain.ratioMalignant, "breast.strain.ratioMalignant", { positive: true, max: 50 });
  assertObject(strain.tsukubaScore, "cutoffs.breast.strain.tsukubaScore");
  assertObject(breast.swe, "cutoffs.breast.swe");
  const swe = breast.swe as Record<string, unknown>;
  assertNumber(swe.emaxBenign, "breast.swe.emaxBenign", { positive: true, max: MAX_KPA });
  assertNumber(swe.emaxMalignant, "breast.swe.emaxMalignant", { positive: true, max: MAX_KPA });
  assertRange(swe.emaxBenign as number, swe.emaxMalignant as number, "breast.swe.emax");
}

function validateUi(ui: unknown): void {
  assertObject(ui, "ui");
  if (!Array.isArray(ui.gradientColors) || (ui.gradientColors as unknown[]).length < 2) {
    throw new ConfigValidationError("INVALID_STRUCTURE", "ui.gradientColors должен быть массивом цветов.");
  }
  assertObject(ui.scaleMarkers, "ui.scaleMarkers");
}

/**
 * Валидирует полученный JSON конфигурации.
 * @throws ConfigValidationError при нарушении схемы
 */
export function validateConfig(raw: unknown): ConfigResponse {
  assertObject(raw, "root");
  validateMeta(raw.meta);
  assertObject(raw.cutoffs, "cutoffs");
  const cutoffs = raw.cutoffs as Record<string, unknown>;
  validateCervix(cutoffs.cervix);
  validateMyometrium(cutoffs.myometrium);
  validateOvary(cutoffs.ovary);
  validateBreast(cutoffs.breast);
  validateUi(raw.ui);
  return raw as ConfigResponse;
}

/**
 * Логирует ошибку валидации (консоль + analytics).
 */
export function logValidationError(error: unknown): void {
  logConfigError(error, "validation");
}
