import { BreastRiskCalculator } from "@/components/calculators/gynecologic/CancerRiskCalculators";

export const metadata = { title: "Риск рака МЖ · SonoGyn" };

export default function BreastRiskPage() {
  return <BreastRiskCalculator />;
}
