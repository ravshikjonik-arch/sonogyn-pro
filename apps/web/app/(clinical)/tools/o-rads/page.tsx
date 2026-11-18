import { ORADS_US_ROOM } from "@repo/clinical-tools";
import { ORADS_US_CALCULATOR_TITLE_RU } from "@repo/orads-us/product-copy";

import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { ORADS_HUB_GROUPS } from "@/lib/nav/domain-hubs";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/o-rads");

export default function OradsUsRoomPage() {
  return (
    <ClinicalDomainHub
      title={ORADS_US_CALCULATOR_TITLE_RU}
      description={ORADS_US_ROOM.description}
      groups={ORADS_HUB_GROUPS}
      backHref="/tools/gynecology"
      backLabel="← Гинекология"
    />
  );
}
