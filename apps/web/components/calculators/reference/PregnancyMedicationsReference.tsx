"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_LABELS,
  PREGNANCY_MEDS_DISCLAIMER,
  searchPregnancyMedications,
  type PregnancyDrugCategory,
} from "@repo/medical-calculations";

const CAT_COLORS: Record<PregnancyDrugCategory, string> = {
  A: "bg-emerald-100 text-emerald-900",
  B: "bg-teal-100 text-teal-900",
  C: "bg-amber-100 text-amber-900",
  D: "bg-orange-100 text-orange-900",
  X: "bg-red-100 text-red-900",
  N: "bg-slate-100 text-slate-800",
};

export function PregnancyMedicationsReference() {
  const [query, setQuery] = useState("");
  const items = useMemo(() => searchPregnancyMedications(query), [query]);

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/tools/calc/appointment">← Для приёма</Link>
      </Button>
      <header className="mx-auto max-w-3xl space-y-2">
        <Badge variant="outline">Справочник</Badge>
        <h1 className="text-3xl font-black tracking-tight">Лекарства при беременности</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">FDA legacy categories · ориентир для приёма</p>
      </header>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
          <Input
            className="pl-10"
            placeholder="Поиск: парацетамол, инсulin, варfarin…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-3">
          {items.map((m) => (
            <article key={m.id} className="sonogyn-glass-card rounded-2xl border border-[var(--clinical-border)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold">{m.nameRu}</h2>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CAT_COLORS[m.category]}`}>
                  {m.category}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{m.name}</p>
              <p className="mt-2 text-sm">{m.summary}</p>
              <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{m.trimesterNotes}</p>
              {m.alternatives ? (
                <p className="mt-1 text-xs font-semibold text-[var(--clinical-primary-deep)]">Альтернатива: {m.alternatives}</p>
              ) : null}
            </article>
          ))}
        </div>
        <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">{PREGNANCY_MEDS_DISCLAIMER}</p>
      </div>
    </div>
  );
}

export { CATEGORY_LABELS };
