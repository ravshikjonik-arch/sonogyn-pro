import { FMF_ROOM } from "@repo/clinical-tools";

import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { FMF_HUB_GROUPS } from "@/lib/nav/domain-hubs";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/fmf");

export default function FmfRoomPage() {
  return (
    <ClinicalDomainHub
      title={FMF_ROOM.title}
      description={FMF_ROOM.description}
      groups={FMF_HUB_GROUPS}
      backHref="/tools/obstetrics"
      backLabel="← Акушерство"
    />
  );
}