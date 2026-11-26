import { GYN_US_MORPHOLOGY_ROOM } from "@repo/clinical-tools";

import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { GYN_US_MORPHOLOGY_HUB_GROUPS } from "@/lib/nav/domain-hubs";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/gyn-us-morphology");

export default function GynUsMorphologyRoomPage() {
  return (
    <ClinicalDomainHub
      title={GYN_US_MORPHOLOGY_ROOM.title}
      description={GYN_US_MORPHOLOGY_ROOM.description}
      groups={GYN_US_MORPHOLOGY_HUB_GROUPS}
      backHref="/tools/gynecology"
      backLabel="← Гинекология"
    />
  );
}