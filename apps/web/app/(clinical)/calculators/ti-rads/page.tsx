import { TiradsRuFlow } from "@/components/calculators/tirads-ru/TiradsRuFlow";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";

export const metadata = {
  title: "TI-RADS ЩЖ · SonoGyn",
  description: "Российская адаптация TI-RADS: режим приёма и обучение по пособию Катрич и др., 2023",
};

export default function TiradsRuPage() {
  return (
    <>
      <TiradsRuFlow />
      <div className="mx-auto max-w-4xl px-4 pb-10">
        <CalculatorLiteraturePanel slug="ti-rads" />
      </div>
    </>
  );
}
