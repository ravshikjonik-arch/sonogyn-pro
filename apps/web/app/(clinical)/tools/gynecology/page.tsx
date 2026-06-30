import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { GYNECOLOGY_HUB } from "@/lib/nav/domain-hubs";

export default function GynecologyHubPage() {
  return (
    <ClinicalDomainHub
      kicker="Гинекология"
      title="Всё для гинеколога — в одном разделе"
      description="O-RADS, FIGO, эндометрий, шейка, нозологии. Эхограммы O-RADS — через хаб O-RADS."
      cards={GYNECOLOGY_HUB}
    />
  );
}
