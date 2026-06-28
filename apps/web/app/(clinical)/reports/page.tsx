import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TEMPLATES = [
  {
    href: "/reports/adnex",
    title: "Придатки · O-RADS US",
    description: "Из O-RADS Pro / wizard — описание, заключение, IOTA triangulation.",
    badge: "Adnex",
  },
  {
    href: "/reports/thyroid",
    title: "Щитовидная · ACR TI-RADS",
    description: "Composition, echogenicity, shape, margin, foci → категория и ТАБ.",
    badge: "Thyroid",
  },
  {
    href: "/reports/obstetric",
    title: "Акушерство · биометрия",
    description: "Срок, КТР, БПР, ОЖ, ДБ, масса — структурированный протокол.",
    badge: "OB",
  },
] as const;

export const metadata = {
  title: "Структурированные протоколы · SonoGyn",
  description: "Structured Reporting Engine — шаблоны Phase 1",
};

export default function ReportsHubPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 lg:px-10">
      <header className="space-y-2">
        <Badge variant="outline">SRE · Phase 1</Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Структурированные протоколы</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Описание, заключение, рекомендации — RU/EN. Не диагноз; интерпретация — специалист.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <Link key={t.href} href={t.href} className="block transition hover:opacity-90">
            <Card className="h-full border-[var(--clinical-border)] hover:border-[var(--clinical-primary)]">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{t.title}</CardTitle>
                  <Badge variant="secondary">{t.badge}</Badge>
                </div>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-[var(--clinical-primary-deep)]">Открыть →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
