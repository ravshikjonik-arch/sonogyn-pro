import { Brain, Stethoscope, Baby, GraduationCap, Activity, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const modes = [
  {
    href: "/ai/consultants/gynecology",
    title: "Помощник врача-гинеколога",
    description: "Нозология → УЗИ → красные флаги → протокол. Маршруты по МКБ для приёма.",
    icon: Stethoscope,
    color: "from-[#831843] to-[#be185d]",
  },
  {
    href: "/ai/consultants/obstetrics",
    title: "Помощник акушера",
    description: "Ранняя беременность, потери, ГСД, маршрутизация.",
    icon: Baby,
    color: "from-[#0f766e] to-[#0d9488]",
  },
  {
    href: "/ai/consultants/fmf",
    title: "FMF · малый срок и I скрининг",
    description: "Малый срок, I/II/III скрининг, допплер — протокол FMF и red flags.",
    icon: GraduationCap,
    color: "from-[#0d9488] to-[#059669]",
  },
  {
    href: "/ai/consultants/vascular",
    title: "Сосудистое УЗД · дуплекс",
    description: "БЦА, TCD, артерии/вены НК, аорта — протокол, стеноз ВСА, AI-интерпретация (Куликов).",
    icon: Activity,
    color: "from-[#1e3a8a] to-[#2563eb]",
  },
];

export function ConsultantsHubPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="sonogyn-glass-card space-y-3 rounded-3xl p-8">
          <Badge variant="outline">Помощник врача</Badge>
          <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight">Выберите сценарий приёма</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Поиск по МКБ и синонимам. Клик по заболеванию — полный маршрут: приём, анализы, УЗИ, лечение, протокол.
            Evidence AI — live PubMed и КР с цитатами.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="gap-2" asChild>
              <Link href="/tools/refs/evidence-assistant">
                <Sparkles className="h-4 w-4" />
                Evidence AI
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/ai/workspace">
                <Brain className="h-4 w-4" />
                AI-зона · снимки
              </Link>
            </Button>
          </div>
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
              <Link href="/tools/refs/nosologies">Справочник нозологий</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tools/mapping/uterus">FIGO · 3D матка</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tools/mapping/breast">BI-RADS · 3D МЖ</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tools/calc/gyn/elastography">Эластография</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/ai/consultants/fmf">FMF · I скрининг</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tools/refs/basic-course">ISUOG курс</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
