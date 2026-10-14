import { getKnowledgeLinksForNosology } from "@repo/clinical-tools";

import { KnowledgeLinksCard } from "@/components/knowledge/KnowledgeLinksCard";

type Props = {
  nosologyId: string;
};

export function NosologyKnowledgeLinksCard({ nosologyId }: Props) {
  return (
    <KnowledgeLinksCard
      fromType="nosology"
      fromId={nosologyId}
      initialLinks={getKnowledgeLinksForNosology(nosologyId)}
    />
  );
}
