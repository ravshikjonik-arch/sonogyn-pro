"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { History, Pin, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCalculatorShareUrl } from "@/lib/calculators/deep-link";
import {
  listFavoriteCalculators,
  listRecentCalculations,
  type CalcHistoryEntry,
} from "@/lib/calculators/workspace-storage";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function RecentCalculationsPanel() {
  const [recent, setRecent] = useState<CalcHistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<Array<{ id: string; title: string; href: string }>>([]);

  useEffect(() => {
    const refresh = () => {
      setRecent(listRecentCalculations(12));
      setFavorites(listFavoriteCalculators());
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("sonogyn:calculator-workspace", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("sonogyn:calculator-workspace", refresh);
    };
  }, []);

  if (recent.length === 0 && favorites.length === 0) return null;

  return (
    <Card className="border-[var(--clinical-border)] shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-[var(--clinical-primary)]" />
          Недавние расчёты
        </CardTitle>
        <CardDescription>Локально на устройстве (до 50 на калькулятор). Без персональных данных пациента.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {favorites.length > 0 ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--clinical-foreground-muted)]">
              <Pin className="h-3.5 w-3.5" />
              Избранное
            </p>
            <div className="flex flex-wrap gap-2">
              {favorites.map((f) => (
                <Button key={f.id} variant="outline" size="sm" asChild>
                  <Link href={f.href}>{f.title}</Link>
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {recent.length > 0 ? (
          <ul className="space-y-2">
            {recent.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--clinical-foreground)]">{row.title}</p>
                  <p className="text-xs text-[var(--clinical-foreground-muted)]">{row.summary}</p>
                  <p className="mt-1 text-[10px] text-[var(--clinical-foreground-muted)]">{formatWhen(row.at)}</p>
                </div>
                <Button variant="secondary" size="sm" className="shrink-0" asChild>
                  <Link href={buildCalculatorShareUrl(row.path, row.params)}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Повторить
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
