/**
 * SSOT для PWA manifest. Каноничный URL — `/manifest.webmanifest` (app/manifest.ts).
 * `public/manifest.json` — legacy-копия для уже установленных PWA (scripts/sync-pwa-manifest.mjs).
 * Цвета: клиническая dark-тема (tokens.css --bg-primary / --accent).
 */
export const PWA_BACKGROUND_COLOR = "#0d0f14";
export const PWA_THEME_COLOR = "#6d28d9";

/** Старт PWA — маркетинг `/`; кабинет — через CTA «В кабинет» / сессию. */
export const PWA_START_URL = "/";

/** maskable: логотип в 80 % safe zone (scripts — см. icon-maskable-*.png). */
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
    src: "/icons/icon-maskable-192.png",
    sizes: "192x192",
    type: "image/png" as const,
    purpose: "maskable" as const,
  },
  {
    src: "/icons/icon-maskable-512.png",
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
