import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

/** Metadata for the public marketing home (`/`). */
export const landingPageMetadata: Metadata = buildPublicMetadata({
  title: "Клинический помощник для УЗИ и АГ",
  description:
    "Калькуляторы O-RADS, IOTA, BI-RADS, TI-RADS, FIGO, 3D-визуализация, клинические рекомендации и кейсы для врачей УЗД и АГ. Не для пациентов.",
  path: "/",
  keywords: [
    "УЗИ",
    "акушерство-гинекология",
    "O-RADS",
    "IOTA",
    "BI-RADS",
    "калькулятор",
    "клинические рекомендации",
    "SonoGyn Pro",
  ],
  skipCdsDisclaimer: true,
});
