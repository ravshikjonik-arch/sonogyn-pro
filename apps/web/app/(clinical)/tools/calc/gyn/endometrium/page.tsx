import { EndometriumCalculator } from "@/components/calculators/endometrium/EndometriumCalculator";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";

export const metadata = {
  title: "Эндометрий · ISUOG",
};

export default function EndometriumCalculatorPage() {
  return (
    <>
      <EndometriumCalculator />
      <div className="mx-auto max-w-4xl px-4 pb-10">
        <CalculatorLiteraturePanel slug="endometrium" />
      </div>
    </>
  );
}
