import type { Metadata } from "next";

import { ElastographyCalculator } from "@/components/calculators/elastography/ElastographyCalculator";

export const metadata: Metadata = {
  title: "Эластография — калькулятор",
  description: "Strain / SWE: шейка, миометрий, яичники, молочная железа.",
};

export default function ElastographyCalculatorPage() {
  return <ElastographyCalculator />;
}
