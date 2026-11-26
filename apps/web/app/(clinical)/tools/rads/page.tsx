import { ACR_RADS_ROOM } from "@repo/clinical-tools";

import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { ACR_RADS_HUB_GROUPS } from "@/lib/nav/domain-hubs";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/rads");

export default function AcrRadsRoomPage() {
  return (
    <ClinicalDomainHub
      title={ACR_RADS_ROOM.title}
      description={ACR_RADS_ROOM.description}
      groups={ACR_RADS_HUB_GROUPS}
      backHref="/tools/consensus"
      backLabel="← Международные стандарты"
    />
  );
}