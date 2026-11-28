import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

import { RcogGreenTopHub } from "@/components/guidelines/RcogGreenTopHub";

export const metadata = buildPublicMetadata({
  title: "RCOG Green-top Guidelines",
  description: "Приоритетные Green-top Guidelines RCOG для УЗИ и АГ: карточки, crosswalk в FMF/O-RADS, ссылки на оригинал. Не заменяет КР РФ.",
  path: "/tools/refs/rcog-green-top",
});

export default function RcogGreenTopPage() {
  return <RcogGreenTopHub />;
}
