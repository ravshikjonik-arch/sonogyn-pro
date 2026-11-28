import { Suspense } from "react";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

import { EvidenceSourcesHub } from "@/components/evidence/EvidenceSourcesHub";

export const metadata = buildPublicMetadata({
  title: "Доказательства и источники",
  description: "Единый слой: КР МЗ РФ, Evidence-поиск, ГРЛС, лента «Новое», ссылки на PubMed/Cochrane/eLIBRARY по DOI.",
  path: "/tools/refs/evidence-sources",
});

export default function EvidenceSourcesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</div>}>
      <EvidenceSourcesHub />
    </Suspense>
  );
}
