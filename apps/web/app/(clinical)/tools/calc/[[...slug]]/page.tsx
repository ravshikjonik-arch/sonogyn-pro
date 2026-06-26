import { notFound } from "next/navigation";

import { CalculatorsCatalogPage } from "@/components/calculators/CalculatorsCatalogPage";

type Props = { params: Promise<{ slug?: string[] }> };

/** /tools/calc hub; unknown nested slugs → 404 */
export default async function ToolsCalcCatchAllPage({ params }: Props) {
  const { slug = [] } = await params;
  if (slug.length === 0) return <CalculatorsCatalogPage />;
  notFound();
}
