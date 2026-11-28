import { Suspense } from "react";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

import { EvidenceAssistantWorkspace } from "@/components/evidence/EvidenceAssistantWorkspace";

export const metadata = buildPublicMetadata({
  title: "Evidence Assistant",
  description: "Доказательная медицина: unified search PubMed, Cochrane, Europe PMC, Semantic Scholar, КР МЗ РФ.",
  path: "/tools/refs/evidence-assistant",
});

export default function EvidenceAssistantPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</div>}>
      <EvidenceAssistantWorkspace />
    </Suspense>
  );
}
