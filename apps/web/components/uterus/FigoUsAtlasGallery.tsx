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
          <CardTitle>Атлас УЗИ · FIGO миома</CardTitle>
          <CardDescription>
            Сагиттальный TVUS-стиль (MUSA/FIGO). Без подписей на снимке — для учебного разбора и сопоставления с
            разметкой на 3D/срезе.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-wrap gap-2 lg:flex-col">
            {FIGO_ATLAS_ENTRIES.map((e) => (
              <button
                key={e.code}
                type="button"
                onClick={() => setSelected(e.code)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition",
                  selected === e.code
                    ? "border-violet-500 bg-violet-50 font-semibold dark:bg-violet-950/40"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700",
                )}
              >
                <span className="font-bold">{e.title}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{e.localization}</span>
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black">
              <FigoUsSchematic code={entry.code} size={480} className="mx-auto w-full max-w-lg" />
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
