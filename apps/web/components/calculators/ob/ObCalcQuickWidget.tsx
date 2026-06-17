"use client";

import Link from "next/link";
import { Baby, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_TABS = [
  { tab: "lmp", label: "По ПМП" },
  { tab: "us", label: "По УЗИ" },
  { tab: "crl", label: "По КТР" },
  { tab: "ivf", label: "ЭКО" },
  { tab: "feto", label: "Фетометрия" },
] as const;

type Props = {
  className?: string;
  compact?: boolean;
};

/** Виджет быстрого доступа к калькулятору срока беременности. */
export function ObCalcQuickWidget({ className, compact }: Props) {
  return (
    <Card
      className={`overflow-hidden border-teal-200/80 bg-gradient-to-br from-teal-50/90 to-cyan-50/50 dark:border-teal-900/50 dark:from-teal-950/40 dark:to-cyan-950/20 ${className ?? ""}`}
    >
      <div className="h-1 bg-gradient-to-r from-teal-600 to-cyan-500" />
      <CardHeader className={compact ? "pb-2" : undefined}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
            <Baby className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-lg">Калькулятор расчёта срока беременности</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              ПМП, УЗИ, КТР, ЭКО, фетометрия, декрет — отдельный модуль. В поиске:{" "}
              <strong>срок</strong>, <strong>ПДР</strong>, <strong>ПМП</strong>.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {QUICK_TABS.map((item) => (
            <Button key={item.tab} variant="outline" size="sm" className="rounded-full bg-[var(--clinical-card)]/80" asChild>
              <Link href={`/calculators/ob?tab=${item.tab}`}>{item.label}</Link>
            </Button>
          ))}
        </div>
        <Button className="w-full sm:w-auto" asChild>
          <Link href="/calculators/ob">
            <CalendarDays className="mr-2 h-4 w-4" />
            Открыть калькулятор
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
