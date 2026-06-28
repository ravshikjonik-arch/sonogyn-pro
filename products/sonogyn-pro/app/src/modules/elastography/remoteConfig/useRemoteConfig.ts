/**
 * React-хук для доступа к удалённому справочнику эластографии.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkForUpdates as loaderCheckForUpdates,
  getCachedMeta,
  getConfig,
  getMemoryConfig,
  getMemoryMeta,
  refreshConfig as loaderRefreshConfig,
  resetToDefaultConfig,
} from "./configLoader";
import type { ElastographyConfig, UpdateStatus } from "./types";

export type UseRemoteConfigResult = {
  /** Текущая конфигурация */
  config: ElastographyConfig | null;
  /** Идёт загрузка */
  isLoading: boolean;
  /** Ошибка загрузки (человекочитаемая) */
  error: string | null;
  /** true — используется вшитая fallback-версия */
  isUsingFallback: boolean;
  /** Версия активного конфига */
  configVersion: string;
  /** Дата релиза (ISO) */
  configDate: string;
  /** Источник данных (EFSUMB, WFUMB…) */
  configSource: string;
  /** Проверка обновлений на сервере */
  checkForUpdates: () => Promise<UpdateStatus>;
  /** Принудительное обновление */
  refreshConfig: () => Promise<void>;
  /** Сброс на defaultConfig */
  resetToDefault: () => Promise<void>;
};

/**
 * Хук Remote Config для экранов эластографии.
 * При монтировании загружает конфиг; кэширует между перерисовками.
 */
export function useRemoteConfig(): UseRemoteConfigResult {
  const mounted = useRef(true);
  const [config, setConfig] = useState<ElastographyConfig | null>(() => getMemoryConfig());
  const [isLoading, setIsLoading] = useState(!getMemoryConfig());
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [configVersion, setConfigVersion] = useState(() => getMemoryMeta()?.version ?? "—");
  const [configDate, setConfigDate] = useState(() => getMemoryMeta()?.releaseDate ?? "—");
  const [configSource, setConfigSource] = useState(() => getMemoryMeta()?.source ?? "—");

  const syncFromMeta = useCallback(async () => {
    const meta = getMemoryMeta() ?? (await getCachedMeta());
    if (!meta || !mounted.current) return;
    setIsUsingFallback(meta.isFallback);
    setConfigVersion(meta.version);
    setConfigDate(meta.releaseDate);
    setConfigSource(meta.source);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await getConfig();
      if (!mounted.current) return;
      setConfig(loaded);
      await syncFromMeta();
    } catch (e) {
      if (!mounted.current) return;
      const message = e instanceof Error ? e.message : "Не удалось загрузить справочник";
      setError(message);
      console.warn("[useRemoteConfig]", message);
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [syncFromMeta]);

  useEffect(() => {
    mounted.current = true;
    if (!getMemoryConfig()) {
      void load();
    } else {
      void syncFromMeta();
    }
    return () => {
      mounted.current = false;
    };
  }, [load, syncFromMeta]);

  const checkForUpdates = useCallback(async (): Promise<UpdateStatus> => {
    return loaderCheckForUpdates();
  }, []);

  const refreshConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await loaderRefreshConfig();
      if (!mounted.current) return;
      setConfig(updated);
      await syncFromMeta();
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "Ошибка обновления");
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [syncFromMeta]);

  const resetToDefault = useCallback(async () => {
    setIsLoading(true);
    try {
      const restored = await resetToDefaultConfig();
      if (!mounted.current) return;
      setConfig(restored);
      await syncFromMeta();
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [syncFromMeta]);

  return {
    config,
    isLoading,
    error,
    isUsingFallback,
    configVersion,
    configDate,
    configSource,
    checkForUpdates,
    refreshConfig,
    resetToDefault,
  };
}
