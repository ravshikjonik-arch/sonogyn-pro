import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TEMPLATES = [
  {
    href: "/tools/calc/rads/adnex-report",
    title: "Придатки · O-RADS US",
    description: "Из O-RADS Pro или пошагового разбора — описание, заключение, рекомендации по ACR O-RADS.",
    badge: "Придатки",
    step: "1",
  },
  {
    href: "/reports/thyroid",
    title: "Щитовидная · ACR TI-RADS",
    description: "Состав, эхогенность, форма, контуры, фокусы → категория и показания к ТАБ.",
    badge: "ЩЖ",
    step: "2",
  },
  {
    href: "/reports/obstetric",
    title: "Акушерство · биометрия",
    description: "Срок, КТР, БПР, ОЖ, ДБ, масса — структурированный протокол плода.",
    badge: "Акушерство",
    step: "3",
  },
] as const;

export const metadata = {
  title: "Структурированные протоколы · SonoGyn",
  description: "Шаблоны структурированных УЗИ-протоколов",
};

export default function ReportsHubPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 lg:px-10">
      <header className="space-y-3">
        <Badge variant="outline">Протоколы УЗИ</Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
          Структурированные протоколы
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Один контур: ввод → описание / заключение / рекомендации → сохранить или финализировать.
          Не диагноз; интерпретация — специалист.
        </p>
        <ol className="flex flex-wrap gap-3 text-xs text-[var(--clinical-foreground-muted)]">
          <li className="rounded-full border border-[var(--clinical-border)] px-3 py-1">1. Выберите шаблон</li>
          <li className="rounded-full border border-[var(--clinical-border)] px-3 py-1">2. Сгенерируйте / сохраните</li>
          <li className="rounded-full border border-[var(--clinical-border)] px-3 py-1">3. При необходимости финализируйте</li>
        </ol>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <Link key={t.href} href={t.href} className="block transition hover:opacity-90">
            <Card className="h-full border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:border-[var(--clinical-primary)]">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug text-[var(--clinical-foreground)]">
                    <span className="mr-2 text-[var(--clinical-primary-deep)]">{t.step}.</span>
                    {t.title}
                  </CardTitle>
                  <Badge variant="secondary">{t.badge}</Badge>
                </div>
                <CardDescription className="text-[var(--clinical-foreground-muted)]">{t.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-[var(--clinical-primary-deep)]">Открыть протокол →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
