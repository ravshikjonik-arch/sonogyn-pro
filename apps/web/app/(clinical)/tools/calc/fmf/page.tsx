import Link from "next/link";

import { CalculatorSourceBadge } from "@/components/calculators/CalculatorSourceBadge";
import { FmfCalculators } from "@/components/fmf/FmfCalculators";
import { Button } from "@/components/ui/button";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "Калькуляторы FMF · оценка и тактика",
  description:
    "Калькуляторы FMF: датирование, ТВП, ПВМ, вес при рождении, допплер, PI маточных артерий — расчётный модуль платформы с атрибуцией публикаций.",
  path: "/tools/calc/fmf",
});

export default function FmfCalculatorsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-10">
      <header className="mb-6 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--clinical-primary-deep)]">
          FMF · калькуляторы
        </p>
        <h1 className="text-2xl font-semibold text-[var(--clinical-foreground)]">
          Оценка и клиническая тактика
        </h1>
        <p className="max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
          Шесть калькуляторов по моделям из публикаций (не софт FMF). Полный учебный раздел 11–13 нед — ниже.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/tools/refs/fmf-11-13">FMF · скрининг 11–13 (техника, риск учебно) →</Link>
        </Button>
      </header>
      <FmfCalculators />
      <CalculatorSourceBadge
        title="Публикации FMF / Wright et al."
        reference="Robinson 1975 (КТР) · Snijders 1994 (ОГ) · Wright 2008 (ТВП) · Wright 2018 (рост) · референсы допплера FMF"
        organization="FMF"
        verified="Сверено 11.2026 · расчётный модуль + юнит-тесты ✓"
      />
    </div>
  );
}