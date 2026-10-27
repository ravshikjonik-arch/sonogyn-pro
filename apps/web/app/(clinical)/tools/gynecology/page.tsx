import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { GYNECOLOGY_GROUPS } from "@/lib/nav/domain-hubs";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/gynecology");

export default function GynecologyHubPage() {
  return (
    <ClinicalDomainHub
      title="Гинекология"
      description="Придатки, матка, шейка, атласы и нозологии."
      groups={GYNECOLOGY_GROUPS}
    />
  );
}
