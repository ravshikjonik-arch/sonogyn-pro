import { ConsensusHubClient } from "@/components/consensus/ConsensusHubClient";
import { buildConsensusHubCards } from "@repo/evidence-retrieval";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Международные стандарты · консенсусы | SonoGyn Pro",
  description:
    "Каталог O-RADS, BI-RADS, TI-RADS, FMF, FIGO, IOTA, ISUOG: калькуляторы, маршруты и статус внедрения.",
};

export default function ConsensusHubPage() {
  const cards = buildConsensusHubCards();
  return <ConsensusHubClient cards={cards} />;
}