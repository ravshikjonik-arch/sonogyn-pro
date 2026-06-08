import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CALCULATORS } from "@/lib/calculators/registry";
import { resolveCalculatorHref } from "@/lib/calculators/resolve-calculator-href";

const quickCalcSlugs = ["o-rads", "bi-rads", "endometrium", "cervical-length", "figo", "ti-rads", "elastography"] as const;

export default function CalculatorsPage() {
  const quick = CALCULATORS.filter((c) => quickCalcSlugs.includes(c.slug as (typeof quickCalcSlugs)[number]));
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <Badge variant="outline">Клиническая поддержка решений</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Калькуляторы</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            FIGO, O-RADS, BI-RADS и др. — по гайдлайнам. Записи сохраняются в{" "}
            <code className="font-mono text-xs">calculator_entries</code> (при входе). FIGO и интерактив — в{" "}
            <Link href="/uterus-3d" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
              3D матке
            </Link>
            .
          </p>
        </header>

        <section className="sonogyn-glass-card space-y-3 rounded-2xl p-5">
          <p className="text-sm font-bold text-[var(--clinical-foreground)]">Быстрые калькуляторы</p>
          <div className="flex flex-wrap gap-2">
            {quick.map((calc) => (
              <Button key={calc.slug} variant="outline" size="sm" className="rounded-full" asChild>
                <Link href={resolveCalculatorHref(calc)}>{calc.title}</Link>
              </Button>
            ))}
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link href="/assistant">Помощник врача</Link>
            </Button>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {CALCULATORS.map((calc) => (
            <Card key={calc.slug} className="flex flex-col border-slate-200 bg-white dark:bg-slate-900/40">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-lg font-semibold">{calc.title}</CardTitle>
                  <CardDescription>{calc.subtitle}</CardDescription>
                </div>
                <Badge variant="outline">{calc.code}</Badge>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <p className="text-sm text-[var(--clinical-foreground-muted)]">
                  {calc.fields.length === 0
                    ? "Интерактивный калькулятор · сохранение в историю"
                    : `${calc.fields.length} structured fields · saves to your account`}
                </p>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href={resolveCalculatorHref(calc)}>Открыть</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
