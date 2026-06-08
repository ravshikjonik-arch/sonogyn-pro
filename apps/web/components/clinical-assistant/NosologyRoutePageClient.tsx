"use client";

import { NosologyRouteView } from "@/components/clinical-assistant/NosologyRouteView";
import type { ObgynNosologyCard } from "@/lib/clinical-assistant";

type Props = {
  card: ObgynNosologyCard;
  backHref: string;
  initialPatientId?: string;
};

export function NosologyRoutePageClient({ card, backHref, initialPatientId }: Props) {
  return <NosologyRouteView card={card} backHref={backHref} initialPatientId={initialPatientId} />;
}
