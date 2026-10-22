import { FetometryNormsCalculatorHub } from "@/components/calculators/ob/FetometryNormsCalculatorHub";
import { MEDVEDEV_ARCHIVE_PUBLIC_BASE, medvedevArchiveBookStats } from "@repo/medvedev-reference";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/ob/fetometry-norms");

type Props = { searchParams: Promise<{ table?: string }> };

export default async function FetometryNormsPage({ searchParams }: Props) {
  const { table } = await searchParams;
  const book = medvedevArchiveBookStats();
  return (
    <>
      <p className="sr-only">
        {book.totalCards} таблиц · {MEDVEDEV_ARCHIVE_PUBLIC_BASE}
      </p>
      <FetometryNormsCalculatorHub initialTableId={table} />
    </>
  );
}
