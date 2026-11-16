"use client";

import { FIGO_ATLAS_ENTRIES, getFigoColor, type FigoDisplayCode } from "@repo/clinical-3d";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

import { FigoUsSchematic } from "./FigoUsSchematic";

export function FigoUsAtlasGallery({ highlightCode }: { highlightCode?: FigoDisplayCode | string }) {
  const [selected, setSelected] = useState<string>(highlightCode ? String(highlightCode) : "4");
  const entry = useMemo(
    () => FIGO_ATLAS_ENTRIES.find((e) => e.code === selected) ?? FIGO_ATLAS_ENTRIES[4]!,
    [selected],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Атлас · FIGO миома</CardTitle>
          <CardDescription>
            Учебная сагиттальная схема (MUSA/FIGO). Не снимок УЗИ — для разбора топографии узла и
            сопоставления с разметкой на коронарном/сагиттальном макете.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-wrap gap-2 lg:flex-col" role="listbox" aria-label="Типы FIGO">
            {FIGO_ATLAS_ENTRIES.map((e) => (
              <button
                key={e.code}
                type="button"
                role="option"
                aria-selected={selected === e.code}
                onClick={() => setSelected(e.code)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-primary)]",
                  selected === e.code
                    ? "border-[var(--clinical-primary)] bg-[var(--clinical-muted)] font-semibold"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/60",
                )}
              >
                <span className="font-bold">{e.title}</span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  {e.localization}
                </span>
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0a0c10] shadow-inner ring-1 ring-white/5">
              <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-white/10 bg-black/45 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-300 backdrop-blur-sm">
                схема · не снимок УЗИ
              </div>
              <FigoUsSchematic
                code={entry.code}
                size={480}
                className="mx-auto w-full max-w-lg transition-opacity duration-300"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge style={{ backgroundColor: getFigoColor(String(entry.primaryType) as "0") }}>
                {entry.title}
              </Badge>
              <Badge variant="outline">{entry.bucket}</Badge>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{entry.localization}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {entry.sonoGynBullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              Учебный CDS · PALM-COEIN (FIGO). Не заменяет УЗИ/МРТ. Заключение — за лечащим врачом.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
