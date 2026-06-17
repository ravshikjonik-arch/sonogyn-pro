import { TiradsRuFlow } from "@/components/calculators/tirads-ru/TiradsRuFlow";

export const metadata = {
  title: "TI-RADS ЩЖ · SonoGyn",
  description: "Российская адаптация TI-RADS: режим приёма и обучение по пособию Катрич и др., 2023",
};

export default function TiradsRuPage() {
  return <TiradsRuFlow />;
}
