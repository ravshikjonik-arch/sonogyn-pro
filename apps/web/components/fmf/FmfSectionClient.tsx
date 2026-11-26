"use client";

import Link from "next/link";
import { ArrowLeft, Baby } from "lucide-react";

import { FmfCalculators } from "@/components/fmf/FmfCalculators";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

const ANCHORS = [
  { id: "overview", label: "Обзор" },
  { id: "nt-tech", label: "Техника NT" },
  { id: "doppler", label: "Допплер" },
  { id: "calculators", label: "Калькуляторы" },
  { id: "nt-escalation", label: "NT ≥ 3.5" },
] as const;

const TEACH = [
  {
    id: "overview",
    title: "Окно 11+0 – 13+6",
    body: "Скрининг I триместра в коридоре 11+0–13+6. CRL 45–84 мм — валидный диапазон для срока по КТР и NT-модели.",
  },
  {
    id: "nt-tech",
    title: "Техника NT",
    body: "Внутренняя граница по median line; widest pocket; gain вниз. ≥2 измерений; при пуповине — среднее. 99-й ц. ≈ 3,5 мм (Wright 2008).",
  },
  {
    id: "doppler",
    title: "Допплер",
    body: "DV: sample 0,5–1,0 мм, угол <30°, sweep 2–3 см/с. Трикуспидальная регургитация: ≥½ систолы и >60 см/с без цветного ДП для скорости.",
  },
  {
    id: "nt-escalation",
    title: "NT ≥ 3,5 мм",
    body: "CVS + кариотип + микроаррей при показаниях. Детальные сканы 11–13 / +2 нед / 20 нед; эхо 14–16 и 20–22 нед.",
  },
];

export function FmfSectionClient() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/tools/refs">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Библиотека
          </Link>
        </Button>

        <header id="overview" className="scroll-mt-24 space-y-3">
          <Badge variant="outline" className="uppercase tracking-wide">
            Учебный раздел · FMF
          </Badge>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
            <Baby className="h-8 w-8 text-[var(--clinical-primary)]" aria-hidden />
            Скрининг 11–13 недель: от NT до cfDNA
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Факты: Fetal Medicine Foundation (курс The 11-13 weeks scan, 2025–2026; раздел Calculators). Изложение —
            SonoGyn Pro. Не диагноз. Модели из рецензируемых публикаций; код FMF не используется.
          </p>
          <p className="text-sm">
            <Link href="/ai/consultants/fmf" className="font-medium text-[var(--clinical-primary)] underline">
              Полный FMF-консультант (I/II/III триместр) →
            </Link>
          </p>
        </header>

        <nav
          aria-label="Разделы страницы"
          className="sticky top-14 z-10 flex flex-wrap gap-2 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-background)]/90 p-2 backdrop-blur"
        >
          {ANCHORS.map((a) => (
            <a
              key={a.id}
              href={`#${a.id}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--clinical-foreground-muted)]",
                "hover:bg-[var(--clinical-surface-elevated)] hover:text-[var(--clinical-foreground)]",
              )}
            >
              {a.label}
            </a>
          ))}
        </nav>

        <section className="grid gap-4 sm:grid-cols-2">
          {TEACH.map((card) => (
            <Card
              key={card.id}
              id={card.id}
              className={cn(
                "scroll-mt-24 border-[var(--clinical-border)] bg-[var(--clinical-surface)]",
                card.id === "overview" && "sm:col-span-2",
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{card.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <FmfCalculators />

        <footer className="space-y-2 border-t border-[var(--clinical-border)] pt-6 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          <p>
            Учебный/справочный инструмент · не диагноз · решение принимает лечащий специалист. Факты: The Fetal Medicine
            Foundation (курс The 11-13 weeks scan 2025–2026, раздел Calculators). Реализация по публикациям Wright
            2008/2018, Robinson 1975, Snijders 1994, Mari 2000 с атрибуцией.
          </p>
          <p>Код и медиа FMF / refractionx не копируются. Риск-модели этапов 2–3 — по публикациям или согласование с FMF.</p>
        </footer>
      </div>
    </div>
  );
}