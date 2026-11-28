import { notFound } from "next/navigation";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

import { PelvisDieChecklistClient } from "@/components/clinical/PelvisDieChecklistClient";
import { isPelvis3dEnabled } from "@/lib/feature-flags/pelvis-3d";

export const metadata = buildPublicMetadata({
  title: "Малый таз · DIE (справочно)",
  description: "Чеклист структур малого таза для оценки глубины инфильтрации. Справочно, не диагноз.",
  path: "/tools/mapping/pelvis",
});

export default function PelvisMappingPage() {
  if (!isPelvis3dEnabled()) notFound();
  return <PelvisDieChecklistClient />;
}
