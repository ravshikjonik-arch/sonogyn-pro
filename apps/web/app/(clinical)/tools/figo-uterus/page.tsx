import { FIGO_UTERUS_ROOM } from "@repo/clinical-tools";

import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { FIGO_UTERUS_HUB_GROUPS } from "@/lib/nav/domain-hubs";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/figo-uterus");

export default function FigoUterusRoomPage() {
  return (
    <ClinicalDomainHub
      title={FIGO_UTERUS_ROOM.title}
      description={FIGO_UTERUS_ROOM.description}
      groups={FIGO_UTERUS_HUB_GROUPS}
      backHref="/tools/gynecology"
      backLabel="← Гинекология"
    />
  );
}