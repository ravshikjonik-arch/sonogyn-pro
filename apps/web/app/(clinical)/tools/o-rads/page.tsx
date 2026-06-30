import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { ORADS_HUB } from "@/lib/nav/domain-hubs";

export default function OradsHubPage() {
  return (
    <ClinicalDomainHub
      kicker="O-RADS US"
      title="O-RADS · калькулятор, эхограммы, реферат"
      description="Не нужно искать по библиотеке: калькулятор, карточки Озерской, 10 клинических случаев и IOTA 2026 — здесь."
      cards={ORADS_HUB}
      backHref="/tools/gynecology"
      backLabel="← Гинекология"
    />
  );
}
