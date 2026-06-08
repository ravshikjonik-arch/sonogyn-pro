/** Поддерживаемые языки UI (русский — база). */
export const CLINICAL_3D_LOCALES = [
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "ar", label: "العربية" },
] as const;

export type Clinical3dLocale = (typeof CLINICAL_3D_LOCALES)[number]["code"];

export const DEFAULT_CLINICAL_3D_LOCALE: Clinical3dLocale = "ru";
