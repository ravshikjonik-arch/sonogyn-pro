import { CinRiskCalculator } from "@/components/calculators/colposcopy/CinRiskCalculator";

export const metadata = {
  title: "CIN Risk · IFCPC Expert · SonoGyn",
  description:
    "Калькулятор риска CIN1, CIN2, CIN3, AIS и инвазии: HPV, Bethesda, TZ, IFCPC, анамнез. Logit-модель ASCCP/IFCPC.",
};

export default function CinRiskPage() {
  return <CinRiskCalculator />;
}
