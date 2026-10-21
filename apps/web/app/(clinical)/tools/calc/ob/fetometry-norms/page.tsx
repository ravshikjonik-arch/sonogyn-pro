import { FetometryNormsCalculatorHub } from "@/components/calculators/ob/FetometryNormsCalculatorHub";

export const metadata = {
  title: "Калькулятор норм фетометрии · SonoGyn",
  description:
    "Табличные нормы фетометрии: срок беременности, измерение, перцентиль. Структурированные данные без PDF.",
};

type Props = { searchParams: Promise<{ table?: string }> };

export default async function FetometryNormsPage({ searchParams }: Props) {
  const { table } = await searchParams;
  return <FetometryNormsCalculatorHub initialTableId={table} />;
}
