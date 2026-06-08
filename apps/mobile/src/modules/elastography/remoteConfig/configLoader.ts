/**
 * Загрузчик удалённого справочника эластографии.
 * Кэширует в AsyncStorage, проверяет ETag/checksum, fallback на defaultConfig.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as Network from "expo-network";
import { defaultConfig } from "./defaultConfig";
import { setActiveCutoffsFromConfig, resetActiveCutoffsToDefault } from "./activeCutoffs";
import { compareSemver, logValidationError, validateConfig } from "./configValidator";
import type {
  CachedConfigMeta,
  ConfigLoaderSettings,
  ConfigResponse,
  ElastographyConfig,
  UpdateStatus,
} from "./types";
import { ConfigValidationError } from "./types";

/** Ключ AsyncStorage для JSON конфигурации */
const STORAGE_KEY_CONFIG = "@elastography_config";
/** Ключ AsyncStorage для метаданных кэша */
const STORAGE_KEY_META = "@elastography_config_meta";
/** Ключ времени последней проверки обновлений */
const STORAGE_KEY_LAST_CHECK = "@elastography_config_last_check";

/**
 * Dev-режим: загружать JSON из локального asset вместо сети.
 * Переопределяется EXPO_PUBLIC_ELASTOGRAPHY_USE_LOCAL=true|false.
 */
export const USE_LOCAL_CONFIG =
  process.env.EXPO_PUBLIC_ELASTOGRAPHY_USE_LOCAL === "true" ||
  (__DEV__ && process.env.EXPO_PUBLIC_ELASTOGRAPHY_USE_LOCAL !== "false");

/** Локальный тестовый конфиг (assets) */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOCAL_TEST_CONFIG: ConfigResponse = require("../../../../assets/test-elastography-config.json");

/** Настройки из переменных окружения */
export function getLoaderSettings(): ConfigLoaderSettings {
  return {
    configUrl:
      process.env.EXPO_PUBLIC_ELASTOGRAPHY_CONFIG_URL ??
      "https://api.yourapp.com/v1/elastography-config.json",
    updateIntervalHours: Number(process.env.EXPO_PUBLIC_ELASTOGRAPHY_UPDATE_INTERVAL_HOURS ?? 24),
    requestTimeoutMs: Number(process.env.EXPO_PUBLIC_ELASTOGRAPHY_REQUEST_TIMEOUT_MS ?? 10_000),
    useLocalConfig: USE_LOCAL_CONFIG,
  };
}

let memoryCache: ElastographyConfig | null = null;
let memoryMeta: CachedConfigMeta | null = null;
let initPromise: Promise<ElastographyConfig> | null = null;

/** Fetch с таймаутом */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Проверка доступности интернета */
async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return false;
  }
}

/** Каноническая строка для вычисления SHA-256 (без checksum) */
function buildChecksumPayload(config: ConfigResponse): string {
  return JSON.stringify({
    meta: { ...config.meta, checksum: "" },
    cutoffs: config.cutoffs,
    ui: config.ui,
  });
}

/** Вычисляет SHA-256 и возвращает в формате sha256:hex */
export async function computeConfigChecksum(config: ConfigResponse): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    buildChecksumPayload(config),
  );
  return `sha256:${digest}`;
}

/** Проверка checksum (пропуск для вшитого fallback) */
async function verifyChecksum(config: ConfigResponse): Promise<void> {
  if (config.meta.checksum.startsWith("sha256:embedded")) return;
  const expected = config.meta.checksum;
  const actual = await computeConfigChecksum(config);
  if (expected !== actual) {
    throw new ConfigValidationError(
      "CHECKSUM_MISMATCH",
      "Контрольная сумма конфигурации не совпадает — возможна подмена данных.",
    );
  }
}

async function readCached(): Promise<{ config: ElastographyConfig; meta: CachedConfigMeta } | null> {
  try {
    const [configRaw, metaRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_CONFIG),
      AsyncStorage.getItem(STORAGE_KEY_META),
    ]);
    if (!configRaw || !metaRaw) return null;
    const config = validateConfig(JSON.parse(configRaw));
    const meta = JSON.parse(metaRaw) as CachedConfigMeta;
    return { config, meta };
  } catch (error) {
    logValidationError(error);
    return null;
  }
}

async function writeCache(config: ElastographyConfig, meta: CachedConfigMeta): Promise<void> {
  setActiveCutoffsFromConfig(config);
  await Promise.all([
    AsyncStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config)),
    AsyncStorage.setItem(STORAGE_KEY_META, JSON.stringify(meta)),
  ]);
  memoryCache = config;
  memoryMeta = meta;
}

function buildMetaFromConfig(config: ElastographyConfig, extra: Partial<CachedConfigMeta>): CachedConfigMeta {
  return {
    version: config.meta.version,
    releaseDate: config.meta.releaseDate,
    source: config.meta.source,
    checksum: config.meta.checksum,
    fetchedAt: Date.now(),
    isFallback: false,
    ...extra,
  };
}

/** Инициализация: записать defaultConfig при первом запуске */
async function ensureInitialCache(): Promise<ElastographyConfig> {
  const cached = await readCached();
  if (cached) {
    memoryCache = cached.config;
    memoryMeta = cached.meta;
    setActiveCutoffsFromConfig(cached.config);
    return cached.config;
  }

  const meta: CachedConfigMeta = {
    version: defaultConfig.meta.version,
    releaseDate: defaultConfig.meta.releaseDate,
    source: defaultConfig.meta.source,
    checksum: defaultConfig.meta.checksum,
    fetchedAt: Date.now(),
    isFallback: true,
  };
  await writeCache(defaultConfig, meta);
  console.info("[ElastographyConfig] Первый запуск — сохранена вшитая конфигурация v" + meta.version);
  return defaultConfig;
}

async function shouldCheckForUpdate(): Promise<boolean> {
  const settings = getLoaderSettings();
  const lastCheckRaw = await AsyncStorage.getItem(STORAGE_KEY_LAST_CHECK);
  if (!lastCheckRaw) return true;
  const lastCheck = Number(lastCheckRaw);
  const intervalMs = settings.updateIntervalHours * 3_600_000;
  return Date.now() - lastCheck >= intervalMs;
}

async function markChecked(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_LAST_CHECK, String(Date.now()));
}

/** HEAD-запрос: ETag / Last-Modified */
async function fetchRemoteHeaders(
  url: string,
  timeoutMs: number,
): Promise<{ etag?: string; lastModified?: string }> {
  const response = await fetchWithTimeout(url, { method: "HEAD" }, timeoutMs);
  if (!response.ok) {
    throw new Error(`HEAD ${response.status}: сервер недоступен`);
  }
  return {
    etag: response.headers.get("etag") ?? undefined,
    lastModified: response.headers.get("last-modified") ?? undefined,
  };
}

/** Загрузка JSON с сервера или локального URL */
async function downloadConfig(url: string, timeoutMs: number): Promise<ConfigResponse> {
  if (!__DEV__ && !url.startsWith("https://")) {
    throw new ConfigValidationError(
      "INVALID_STRUCTURE",
      "Production: URL конфигурации должен использовать HTTPS.",
    );
  }
  const response = await fetchWithTimeout(url, { method: "GET", headers: { Accept: "application/json" } }, timeoutMs);
  if (!response.ok) {
    throw new Error(`GET ${response.status}: не удалось загрузить конфигурацию`);
  }
  const raw: unknown = await response.json();
  const config = validateConfig(raw);
  await verifyChecksum(config);
  return config;
}

/** Попытка обновления с сервера (или локального dev-сервера) */
async function tryRemoteUpdate(force = false): Promise<ElastographyConfig | null> {
  const settings = getLoaderSettings();

  if (settings.useLocalConfig) {
    try {
      const local = validateConfig(LOCAL_TEST_CONFIG);
      await verifyChecksum(local).catch(() => {
        /* dev-файл может не иметь реального checksum */
      });
      const meta = buildMetaFromConfig(local, { isFallback: false, etag: "local-dev" });
      await writeCache(local, meta);
      await markChecked();
      console.info("[ElastographyConfig] Загружена локальная dev-конфигурация v" + local.meta.version);
      return local;
    } catch (error) {
      logValidationError(error);
      return null;
    }
  }

  if (!(await isOnline())) {
    console.info("[ElastographyConfig] Нет интернета — используем кэш");
    return null;
  }

  if (!force && !(await shouldCheckForUpdate())) {
    return null;
  }

  const cached = await readCached();
  const currentVersion = cached?.meta.version ?? defaultConfig.meta.version;
  const currentEtag = cached?.meta.etag;

  try {
    const headers = await fetchRemoteHeaders(settings.configUrl, settings.requestTimeoutMs);

    if (!force && headers.etag && currentEtag && headers.etag === currentEtag) {
      await markChecked();
      console.info("[ElastographyConfig] ETag совпадает — обновление не требуется");
      return null;
    }

    const remote = await downloadConfig(settings.configUrl, settings.requestTimeoutMs);

    if (!force && compareSemver(remote.meta.version, currentVersion) <= 0) {
      await markChecked();
      console.info("[ElastographyConfig] Версия на сервере не новее локальной");
      return null;
    }

    const meta = buildMetaFromConfig(remote, {
      etag: headers.etag,
      lastModified: headers.lastModified,
    });
    await writeCache(remote, meta);
    await markChecked();
    console.info("[ElastographyConfig] Обновлено до v" + remote.meta.version);
    return remote;
  } catch (error) {
    logValidationError(error);
    return null;
  }
}

/**
 * Возвращает актуальную конфигурацию (кэш → remote → default).
 */
export async function getConfig(): Promise<ElastographyConfig> {
  if (memoryCache) return memoryCache;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const base = await ensureInitialCache();
    const updated = await tryRemoteUpdate(false);
    return updated ?? base;
  })();

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

/**
 * Проверяет наличие обновления на сервере.
 */
export async function checkForUpdates(): Promise<UpdateStatus> {
  const settings = getLoaderSettings();
  const cached = await readCached();
  const currentVersion = cached?.meta.version ?? defaultConfig.meta.version;
  const changelog = cached?.config.meta.changelog ?? defaultConfig.meta.changelog;

  if (!(await isOnline()) && !settings.useLocalConfig) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      changelog,
      isOffline: true,
      error: "Нет подключения к интернету",
    };
  }

  try {
    if (settings.useLocalConfig) {
      const local = validateConfig(LOCAL_TEST_CONFIG);
      const hasUpdate = compareSemver(local.meta.version, currentVersion) > 0;
      return {
        hasUpdate,
        currentVersion,
        latestVersion: local.meta.version,
        changelog: local.meta.changelog,
        isOffline: false,
      };
    }

    const remote = await downloadConfig(settings.configUrl, settings.requestTimeoutMs);
    const hasUpdate = compareSemver(remote.meta.version, currentVersion) > 0;
    return {
      hasUpdate,
      currentVersion,
      latestVersion: remote.meta.version,
      changelog: remote.meta.changelog,
      isOffline: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка проверки обновлений";
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      changelog,
      isOffline: !(await isOnline()),
      error: message,
    };
  }
}

/**
 * Принудительное обновление конфигурации с сервера.
 */
export async function refreshConfig(): Promise<ElastographyConfig> {
  const updated = await tryRemoteUpdate(true);
  if (updated) return updated;
  const cached = await readCached();
  return cached?.config ?? defaultConfig;
}

/**
 * Сброс на вшитую fallback-конфигурацию.
 */
export async function resetToDefaultConfig(): Promise<ElastographyConfig> {
  const meta: CachedConfigMeta = {
    version: defaultConfig.meta.version,
    releaseDate: defaultConfig.meta.releaseDate,
    source: defaultConfig.meta.source,
    checksum: defaultConfig.meta.checksum,
    fetchedAt: Date.now(),
    isFallback: true,
  };
  await writeCache(defaultConfig, meta);
  resetActiveCutoffsToDefault();
  await AsyncStorage.removeItem(STORAGE_KEY_LAST_CHECK);
  console.info("[ElastographyConfig] Восстановлена вшитая конфигурация v" + meta.version);
  return defaultConfig;
}

/** Метаданные активного кэша (для UI) */
export async function getCachedMeta(): Promise<CachedConfigMeta | null> {
  if (memoryMeta) return memoryMeta;
  const cached = await readCached();
  return cached?.meta ?? null;
}

/** Синхронный доступ к in-memory конфигу (после getConfig) */
export function getMemoryConfig(): ElastographyConfig | null {
  return memoryCache;
}

export function getMemoryMeta(): CachedConfigMeta | null {
  return memoryMeta;
}

/** Очистка in-memory кэша (для тестов / refresh) */
export function clearMemoryCache(): void {
  memoryCache = null;
  memoryMeta = null;
  initPromise = null;
}
