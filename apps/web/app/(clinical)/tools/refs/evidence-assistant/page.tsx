import { EvidenceAssistantWorkspace } from "@/components/evidence/EvidenceAssistantWorkspace";

export const metadata = {
  title: "Evidence Assistant · SonoGyn Pro",
  description: "Доказательная медицина: unified search PubMed, Cochrane, Europe PMC, Semantic Scholar, КР МЗ РФ.",
};

export default function EvidenceAssistantPage() {
  return <EvidenceAssistantWorkspace />;
}
