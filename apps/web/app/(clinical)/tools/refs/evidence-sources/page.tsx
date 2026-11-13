import { Suspense } from "react";

import { EvidenceSourcesHub } from "@/components/evidence/EvidenceSourcesHub";

export const metadata = {
  title: "Доказательства и источники · SonoGyn Pro",
  description:
    "Единый слой: КР МЗ РФ, Evidence-поиск, ГРЛС, лента «Новое», ссылки на PubMed/Cochrane/eLIBRARY по DOI.",
};

export default function EvidenceSourcesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</div>}>
      <EvidenceSourcesHub />
    </Suspense>
  );
}
