import { ISUOG_OB_ROOM } from "@repo/clinical-tools";

import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { ISUOG_OB_HUB_GROUPS } from "@/lib/nav/domain-hubs";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/isuog-ob");

export default function IsuogObRoomPage() {
  return (
    <ClinicalDomainHub
      title={ISUOG_OB_ROOM.title}
      description={ISUOG_OB_ROOM.description}
      groups={ISUOG_OB_HUB_GROUPS}
      backHref="/tools/obstetrics"
      backLabel="← Акушерство"
    />
  );
}