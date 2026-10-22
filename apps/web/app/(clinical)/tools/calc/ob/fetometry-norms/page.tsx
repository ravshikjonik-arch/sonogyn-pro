import { FetometryNormsCalculatorHub } from "@/components/calculators/ob/FetometryNormsCalculatorHub";
import { MEDVEDEV_ARCHIVE_PUBLIC_BASE, medvedevArchiveBookStats } from "@repo/medvedev-reference";

export const metadata = {
  title: "Калькулятор норм фетометрии · SonoGyn",
  description:
    "96 таблиц Медведева: перцентили по JSON и скан страницы для сверки. Срок, измерение, флаг нормы.",
};

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
