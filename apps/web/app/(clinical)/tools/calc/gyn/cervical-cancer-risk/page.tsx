import { CervicalCancerRiskCalculator } from "@/components/calculators/gynecologic/CancerRiskCalculators";

export const metadata = { title: "Риск рака шейки · SonoGyn" };

export default function CervicalCancerRiskPage() {
  return <CervicalCancerRiskCalculator />;
}
