import { CervicalLengthCalculator } from "@/components/calculators/cervix/CervicalLengthCalculator";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";

export const metadata = {
  title: "Цервикальная длина",
};

export default function CervicalLengthCalculatorPage() {
  return (
    <>
      <CervicalLengthCalculator />
      <div className="mx-auto max-w-4xl px-4 pb-10">
        <CalculatorLiteraturePanel slug="cervical-length" />
      </div>
    </>
  );
}
