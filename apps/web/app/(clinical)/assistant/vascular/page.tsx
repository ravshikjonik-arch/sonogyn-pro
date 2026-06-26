import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";

import { VascularUltrasoundAssistantClient } from "@/components/assistant/VascularUltrasoundAssistantClient";
import { VASCULAR_US_DISCLAIMER, VASCULAR_US_SOURCE } from "@/lib/education/vascular-ultrasound";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Сосудистое УЗД · клинический модуль",
  description:
    "Протоколы дуплексного сканирования, градация стеноза БЦА, AI-интерпретация по методологии Куликова.",
};

export default async function VascularAssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/assistant">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Помощник
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Клиника</Badge>
              <Badge variant="outline">Дуплекс</Badge>
              <Badge variant="outline">Куликов 2015</Badge>
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <Activity className="h-8 w-8 text-[var(--clinical-primary)]" />
              Сосудистое УЗД · протокол и интерпретация
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              Модуль 1: стандарт исследования по бассейнам, калькулятор стеноза ВСА, AI-эксперт (описание →
              гемодинамика → заключение). Методология: {VASCULAR_US_SOURCE.author}, «{VASCULAR_US_SOURCE.title}».
            </p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{VASCULAR_US_DISCLAIMER}</p>
            <Link href="/tools/refs/vascular-ultrasound" className="text-sm font-medium text-[var(--clinical-primary)] underline">
              Модуль 2 · образовательный курс для ординаторов →
            </Link>
          </div>
        </header>
        <VascularUltrasoundAssistantClient defaultTab={tab} />
      </div>
    </div>
  );
}
