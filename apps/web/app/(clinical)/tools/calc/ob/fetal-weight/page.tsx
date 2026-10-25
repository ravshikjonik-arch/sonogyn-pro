import { FetalWeightCalculator } from "@/components/calculators/obstetric/FetalWeightCalculator";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/ob/fetal-weight");

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function FetalWeightPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  return <FetalWeightCalculator initialTab={tab} />;
}
