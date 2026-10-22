import type { MetadataRoute } from "next";

/** PWA manifest (also see `public/manifest.json` linked from root layout). SW disabled in `next.config.ts`. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SonoGyn Pro",
    short_name: "SonoGyn",
    description:
      "Клиническая платформа УЗИ и акушерства-гинекологии: калькуляторы по гайдлайнам, кабинет врача и обучение.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b1120",
    theme_color: "#1d6fd8",
    lang: "ru",
    categories: ["medical", "education", "productivity"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
