import { OvarianCancerRiskCalculator } from "@/components/calculators/gynecologic/CancerRiskCalculators";

export const metadata = { title: "Риск рака яичников · SonoGyn" };

export default function OvarianCancerRiskPage() {
  return <OvarianCancerRiskCalculator />;
}
