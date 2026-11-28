import { EvidenceAssistantWorkspace } from "@/components/evidence/EvidenceAssistantWorkspace";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "Evidence Assistant",
  description: "Доказательная медицина: unified search и AI-ассистент.",
  path: "/evidence-assistant",
});

export default function EvidenceAssistantLegacyPage() {
  return <EvidenceAssistantWorkspace />;
}
