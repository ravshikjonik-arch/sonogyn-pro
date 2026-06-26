"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { CalcChip } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import {
  LN_ATLAS_ENTRIES,
  LN_ATLAS_INTRO,
  atlasImageUrl,
  type LnPatternId,
} from "@/lib/ln-rads-us";

const SHAPES: { id: LnPatternId; label: string }[] = [
  { id: "oval", label: "Овальный" },
  { id: "round", label: "Округлый" },
  { id: "lobulated", label: "Дольчатый" },
  { id: "spiculated", label: "Spiculated" },
];

export function LnRadsMorphologyAtlas() {
  const [filter, setFilter] = useState<LnPatternId | "all">("all");

  const entries = useMemo(
    () => (filter === "all" ? LN_ATLAS_ENTRIES : LN_ATLAS_ENTRIES.filter((e) => e.shapeCategory === filter || e.id.includes(filter))),
    [filter],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-8">
      <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{LN_ATLAS_INTRO}</p>

      <div className="flex flex-wrap gap-2">
        <CalcChip label="Все" selected={filter === "all"} onClick={() => setFilter("all")} />
        {SHAPES.map((s) => (
          <CalcChip key={s.id} label={s.label} selected={filter === s.id} onClick={() => setFilter(s.id)} />
        ))}
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <article key={entry.id} className="clinical-surface overflow-hidden rounded-2xl border border-[var(--clinical-border)]">
            <div className="relative aspect-[16/9] w-full bg-slate-100">
              <Image
                src={atlasImageUrl(entry.imageFile)}
                alt={entry.titleRu}
                fill
                className="object-contain p-2"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
            <div className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-[var(--clinical-primary-deep)]">{entry.titleRu}</h3>
                <Badge variant="outline">{entry.typicalLnRads}</Badge>
              </div>
              <p className="text-sm">{entry.description}</p>
              <div className="grid gap-2 text-xs md:grid-cols-2">
                <div>
                  <p className="font-bold">Ключевые моменты</p>
                  <ul className="mt-1 list-inside list-disc">
                    {entry.teachingPoints.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-bold">B-mode / Doppler</p>
                  <p className="mt-1">{entry.ultrasoundFindings.join(" · ")}</p>
                  <p className="mt-1 text-[var(--clinical-foreground-muted)]">{entry.dopplerFindings.join(" · ")}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
