import { VbacCalculator } from "@/components/calculators/obstetric/VbacCalculator";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/ob/vbac");

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function VbacPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  return <VbacCalculator initialTab={tab} />;
}
