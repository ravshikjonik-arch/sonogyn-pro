import dynamic from "next/dynamic";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
const PopQFlow = dynamic(
  () => import("@/components/calculators/popq/PopQFlow").then((m) => ({ default: m.PopQFlow })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-sm text-[var(--clinical-foreground-muted)]">
        Загрузка POP-Q…
      </div>
    ),
  },
);

export const metadata = calculatorPageMetadata("/tools/calc/gyn/pop-q");

export default function PopQPage() {
  return <PopQFlow />;
}
