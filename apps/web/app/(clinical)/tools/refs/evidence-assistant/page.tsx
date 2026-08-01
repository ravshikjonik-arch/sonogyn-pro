import { Suspense } from "react";

import { EvidenceAssistantWorkspace } from "@/components/evidence/EvidenceAssistantWorkspace";

export const metadata = {
  title: "Evidence Assistant · SonoGyn Pro",
  description: "Доказательная медицина: unified search PubMed, Cochrane, Europe PMC, Semantic Scholar, КР МЗ РФ.",
};

export default function EvidenceAssistantPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</div>}>
      <EvidenceAssistantWorkspace />
    </Suspense>
  );
}
