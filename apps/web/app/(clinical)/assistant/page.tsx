import { Brain, Stethoscope, Baby, GraduationCap } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const modes = [
  {
    href: "/assistant/gynecology",
    title: "Помощник врача-гинеколога",
    description: "Нозология → УЗИ → красные флаги → протокол. Маршруты по МКБ для приёма.",
    icon: Stethoscope,
    color: "from-[#831843] to-[#be185d]",
  },
  {
    href: "/assistant/obstetrics",
    title: "Помощник акушера",
    description: "Ранняя беременность, потери, ГСД, маршрутизация.",
    icon: Baby,
    color: "from-[#0f766e] to-[#0d9488]",
  },
  {
    href: "/assistant/fmf",
    title: "FMF · малый срок и I скрининг",
    description: "Малый срок, I/II/III скрининг, допплер — протокол FMF и red flags.",
    icon: GraduationCap,
    color: "from-[#0d9488] to-[#059669]",
  },
];

export default function AssistantHubPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="sonogyn-glass-card space-y-3 rounded-3xl p-8">
          <Badge variant="outline">Помощник врача</Badge>
          <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight">Выберите сценарий приёма</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Поиск по МКБ и синонимам. Клик по заболеванию — полный маршрут: приём, анализы, УЗИ, лечение, протокол
            (помощник врача-гинеколога). Не заменяет клиническое решение.
          </p>
          <Button variant="secondary" className="gap-2" asChild>
            <Link href="/workspace">
              <Brain className="h-4 w-4" />
              AI-зона: снимки и CDS-preview
            </Link>
          </Button>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.href} className="sonogyn-tile-hover overflow-hidden border-[var(--clinical-border)]">
                <div className={`h-2 bg-gradient-to-r ${m.color}`} />
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--clinical-primary-muted)]">
                    <Icon className="h-6 w-6 text-[var(--clinical-primary-deep)]" />
                  </div>
                  <CardTitle>{m.title}</CardTitle>
                  <CardDescription>{m.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href={m.href}>Открыть →</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="text-base">Связанные инструменты</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/nosologies">Справочник нозологий</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/uterus-3d">FIGO · 3D матка</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/breast-3d">BI-RADS · 3D МЖ</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/calculators/elastography">Эластография</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/assistant/fmf">FMF · I скрининг</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/library/basic-course">ISUOG курс</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
