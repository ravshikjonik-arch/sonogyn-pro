import { PRODUCT } from "./product";

export const BRAND_PRESETS = {
  ge: {
    appName: PRODUCT.fullName,
    pilot: { enabled: true, label: "Pilot · врачи УЗИ и АГ" },
    colors: {
      primary: "#005CB9",
      background: "#F5F7FA",
      card: "#FFFFFF",
      text: "#0F172A",
      textSecondary: "#475569",
      bannerBorder: "#BFDBFE",
    },
    accents: { orads: "#F59E0B", prolapse: "#7C3AED", fmf: "#5B21B6" },
  },
  clinicA: {
    appName: "Clinic A Ovarian-Calc",
    pilot: { enabled: true, label: "Internal Trial • Clinic A" },
    colors: {
      primary: "#0F766E",
      background: "#F4F7F6",
      card: "#FFFFFF",
      text: "#0F172A",
      textSecondary: "#475569",
      bannerBorder: "#99F6E4",
    },
    accents: { orads: "#D97706", prolapse: "#7C3AED", fmf: "#0F766E" },
  },
  clinicB: {
    appName: "Clinic B Ovarian-Calc",
    pilot: { enabled: true, label: "Pilot Cohort • Clinic B" },
    colors: {
      primary: "#1D4ED8",
      background: "#F6F8FC",
      card: "#FFFFFF",
      text: "#0F172A",
      textSecondary: "#475569",
      bannerBorder: "#BFDBFE",
    },
    accents: { orads: "#F59E0B", prolapse: "#8B5CF6", fmf: "#4338CA" },
  },
} as const;

export type BrandingPresetKey = keyof typeof BRAND_PRESETS;
export const ACTIVE_BRAND: BrandingPresetKey = "ge";
export const branding = BRAND_PRESETS[ACTIVE_BRAND];

export type BrandingConfig = (typeof BRAND_PRESETS)[BrandingPresetKey];
