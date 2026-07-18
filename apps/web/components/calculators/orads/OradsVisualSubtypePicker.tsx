"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ORADS_NOSOLOGY_ATLAS,
  type OradsNosologySubtype,
} from "@/lib/orads-pro/nosology-atlas";
import { cn } from "@/lib/utils/cn";

type Props = {
  selected?: string;
  onSelect: (subtype: OradsNosologySubtype) => void;
};

const VISIBLE_SUBTYPES = new Set<OradsNosologySubtype>([
  "simple_cyst",
  "hemorrhagic",
  "endometrioma",
  "dermoid",
  "paraovarian",
  "hydrosalpinx",
]);

export function OradsVisualSubtypePicker({ selected, onSelect }: Props) {
  const entries = ORADS_NOSOLOGY_ATLAS.filter((entry) => VISIBLE_SUBTYPES.has(entry.subtype));

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-black text-[var(--clinical-foreground)]">Выберите по картинке</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          Сравните находку с учебной эхограммой. Если похоже, нажмите кнопку — тип кисты подставится в калькулятор.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => {
          const active = selected === entry.subtype;
          return (
            <article
              key={entry.id}
              className={cn(
                "overflow-hidden rounded-xl border bg-[var(--clinical-card)] shadow-sm transition",
                active ? "border-[var(--clinical-primary)] ring-2 ring-[var(--clinical-primary-muted)]" : "border-[var(--clinical-border)]",
              )}
            >
              <div className="relative aspect-[4/3] bg-black/5">
                <Image
                  src={entry.imageSrc}
                  alt={entry.imageAlt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 50vw, 280px"
                />
              </div>
              <div className="space-y-2 p-3">
                <div>
                  <p className="text-sm font-bold text-[var(--clinical-foreground)]">{entry.titleRu}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--clinical-foreground-muted)]">{entry.oradsHint}</p>
                </div>
                {entry.keySignsRu?.length ? (
                  <ul className="space-y-1 text-xs text-[var(--clinical-foreground-muted)]">
                    {entry.keySignsRu.slice(0, 3).map((sign) => (
                      <li key={sign}>• {sign}</li>
                    ))}
                  </ul>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  className="w-full gap-1.5"
                  onClick={() => onSelect(entry.subtype)}
                >
                  {active ? <CheckCircle2 className="h-4 w-4" /> : null}
                  {active ? "Выбрано" : "Похоже"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
