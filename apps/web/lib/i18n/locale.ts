import { CLINICAL_3D_LOCALES, DEFAULT_CLINICAL_3D_LOCALE, type Clinical3dLocale } from "@repo/clinical-3d";

export const APP_LOCALE_STORAGE_KEY = "sonogyn_app_locale";

export const APP_LOCALES = CLINICAL_3D_LOCALES;

export type AppLocale = Clinical3dLocale;

export const DEFAULT_APP_LOCALE = DEFAULT_CLINICAL_3D_LOCALE;

export function isAppLocale(value: string): value is AppLocale {
  return APP_LOCALES.some((l) => l.code === value);
}

export function saveAppLocale(locale: AppLocale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale === "ar" ? "ar" : locale;
}

export function readAppLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_APP_LOCALE;
  const saved = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY);
  return saved && isAppLocale(saved) ? saved : DEFAULT_APP_LOCALE;
}
