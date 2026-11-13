import type { Metadata } from "next";

import { RcogGreenTopHub } from "@/components/guidelines/RcogGreenTopHub";

export const metadata: Metadata = {
  title: "RCOG Green-top Guidelines · SonoGyn Pro",
  description:
    "Приоритетные Green-top Guidelines RCOG для УЗИ и АГ: карточки, crosswalk в FMF/O-RADS, ссылки на оригинал. Не заменяет КР РФ.",
};

export default function RcogGreenTopPage() {
  return <RcogGreenTopHub />;
}
