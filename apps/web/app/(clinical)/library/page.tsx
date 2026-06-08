import Link from "next/link";

import { TelegramChannelLink } from "@/components/clinical/TelegramChannelLink";
import { BasicCourseWidget } from "@/components/education/BasicCourseWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "ISUOG — базовый курс",
    description:
      "Basic Training: презентации ISUOG. Сейчас — лекция 6: ранняя беременность 4–10 нед (одно- и многоплодная).",
    href: "/library/basic-course",
    primary: true,
  },
  {
    title: "Помощник врача",
    description:
      "Помощник врача-гинеколога: маршрут обследования, УЗИ, красные флаги, протокол. Поиск + голос.",
    href: "/assistant",
    primary: true,
  },
  {
    title: "Нозологии",
    description:
      "Справочник заболеваний: обследование, УЗ-диагностика, лечение, вставка в протокол. Офлайн после первой загрузки.",
    href: "/nosologies",
    primary: true,
  },
  {
    title: "Клинические нормы УЗИ",
    description:
      "Встроенные методики измерений (КТР, БПР, AFI, допплер), скрининговые сроки и ссылки на ISUOG / Hadlock.",
    href: "/reference",
  },
  {
    title: "Срез матки / FIGO",
    description: "Сагиттальный разрез с шейкой — маркеры для протокола (учебный атлас).",
    href: "/uterus-3d",
  },
  {
    title: "Калькуляторы RADS",
    description: "O-RADS, BI-RADS, TI-RADS, FIGO и др.",
    href: "/calculators",
  },
];

export default function LibraryPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="space-y-2">
          <Badge variant="outline">Библиотека</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
            Учебные материалы
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Встроенные справочные материалы и интерактивные инструменты. Тексты методик — в коде
            приложения, без привязки к конкретному изданию.
          </p>
        </header>

        <TelegramChannelLink className="max-w-xl" />

        <BasicCourseWidget variant="compact" className="max-w-xl" />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => (
            <Card
              key={section.title}
              className="flex flex-col border-[var(--clinical-border)] bg-[var(--clinical-card)]"
            >
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button variant={section.primary ? "default" : "secondary"} className="w-full" asChild>
                  <Link href={section.href}>Открыть</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
