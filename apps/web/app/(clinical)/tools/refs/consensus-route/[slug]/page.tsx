import { notFound } from "next/navigation";

import { ConsensusPlannedClient } from "@/components/consensus/ConsensusPlannedClient";
import { CONSENSUS_PLANNED_ROUTES, getConsensusPlannedRoute } from "@repo/clinical-tools";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CONSENSUS_PLANNED_ROUTES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const route = getConsensusPlannedRoute(slug);
  if (!route) return { title: "Маршрут консенсуса" };
  return {
    title: `${route.title} · маршрут`,
    description: route.subtitle,
  };
}

export default async function ConsensusPlannedPage({ params }: Props) {
  const { slug } = await params;
  const route = getConsensusPlannedRoute(slug);
  if (!route) notFound();
  return <ConsensusPlannedClient route={route} />;
}