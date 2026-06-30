import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { OBSTETRICS_HUB } from "@/lib/nav/domain-hubs";

export default function ObstetricsHubPage() {
  return (
    <ClinicalDomainHub
      kicker="Акушерство"
      title="Всё для акушера — в одном разделе"
      description="Помощник, FMF, калькуляторы сроков, атласы и протоколы. Калькуляторы не смешиваются с гинекологией."
      cards={OBSTETRICS_HUB}
    />
  );
}
