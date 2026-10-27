import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { OBSTETRICS_GROUPS } from "@/lib/nav/domain-hubs";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/obstetrics");

export default function ObstetricsHubPage() {
  return (
    <ClinicalDomainHub
      title="Акушерство"
      description="Приём, расчёты, срезы, атласы и протокол. Гинекологические риски остаются в акушерском калькуляторе."
      groups={OBSTETRICS_GROUPS}
    />
  );
}
