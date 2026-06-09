import type { MetadataRoute } from "next";

/** Progressive Web App installation manifest — paired with generated `/sw.js` via `@ducanh2912/next-pwa`. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ultrasound Clinical Education Suite",
    short_name: "Ultrasound Edu",
    description:
      "Cloud ultrasound imaging education and clinical decision-support workspace for training cohorts.",
    start_url: "/landing",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f8fafc",
    theme_color: "#005CB9",
    categories: ["medical", "education"],
    icons: [
      {
        src: "/next.svg",
        type: "image/svg+xml",
        sizes: "512x512",
        purpose: "any",
      },
    ],
  };
}
