import { notFound } from "next/navigation";

import { CalculatorsCatalogPage } from "@/components/calculators/CalculatorsCatalogPage";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

type Props = { params: Promise<{ slug?: string[] }> };

export const metadata = calculatorPageMetadata("/tools/calc");

/** /tools/calc hub; unknown nested slugs → 404 */
export default async function ToolsCalcCatchAllPage({ params }: Props) {
  const { slug = [] } = await params;
  if (slug.length === 0) return <CalculatorsCatalogPage />;
  notFound();
}
