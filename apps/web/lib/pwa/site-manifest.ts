/**
 * SSOT для PWA manifest (app/manifest.ts + public/manifest.json).
 * Цвета: клиническая dark-тема (tokens.css --bg-primary / --accent).
 */
export const PWA_BACKGROUND_COLOR = "#0d0f14";
export const PWA_THEME_COLOR = "#7c6df5";

/** После установки открываем кабинет, не маркетинг. */
export const PWA_START_URL = "/home";

export const PWA_ICONS = [
  {
    src: "/icons/icon-192.png",
    sizes: "192x192",
    type: "image/png" as const,
    purpose: "any" as const,
  },
  {
    src: "/icons/icon-512.png",
    sizes: "512x512",
    type: "image/png" as const,
    purpose: "any" as const,
  },
  {
    src: "/icons/icon-512.png",
    sizes: "512x512",
    type: "image/png" as const,
    purpose: "maskable" as const,
  },
];

export function buildWebAppManifest() {
  return {
    name: "SonoGyn Pro",
    short_name: "SonoGyn",
    description:
      "Клиническая платформа УЗИ и акушерства-гинекологии: калькуляторы по гайдлайнам, кабинет врача и обучение.",
    start_url: PWA_START_URL,
    scope: "/",
    display: "standalone" as const,
    orientation: "any" as const,
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    lang: "ru",
    categories: ["medical", "education", "productivity"],
    icons: PWA_ICONS,
  };
}
