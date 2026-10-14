"use client";

import { getKnowledgeLinksForNosology } from "@repo/clinical-tools";
import { useMemo } from "react";

import { KnowledgeLinksCard } from "@/components/knowledge/KnowledgeLinksCard";

type Props = {
  nosologyId: string;
};

export function NosologyKnowledgeLinksCard({ nosologyId }: Props) {
  const initialLinks = useMemo(() => getKnowledgeLinksForNosology(nosologyId), [nosologyId]);
  return (
    <KnowledgeLinksCard
      fromType="nosology"
      fromId={nosologyId}
      initialLinks={initialLinks}
    />
  );
}
