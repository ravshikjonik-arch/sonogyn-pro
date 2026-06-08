/**
 * Единая конфигурация PWA для web-сборки (manifest + meta + регистрация SW).
 * Не импортировать тяжёлые модули — доступно при старте App.
 */
export const pwaWebConfig = {
  manifestPath: "/manifest.webmanifest",
  serviceWorkerPath: "/sw.js",
  shortName: "Помощник АГ и УЗИ",
  themeColor: "#005CB9",
  /** Для Safari «На экран Домой» */
  appleMobileWebAppTitle: "Помощник АГ и УЗИ",
} as const;
