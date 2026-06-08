"use client";

import { CircleHelp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getFieldHelp } from "@repo/clinical-reference";
import { getMedvedevBiometryBand } from "@repo/medvedev-reference";
import { normsUrlForField, PROTOCOL_FIELD_TO_MEDVEDEV_MARKER } from "@repo/medvedev-reference";

type Props = {
  fieldName: string;
  label?: string;
  /** Срок для перцентилей Медведева (нед + дни → decimal). */
  gaWeeks?: number;
  gaDays?: number;
};

function formatBand(p5: number, p50: number, p95: number, unit: string): string {
  if (unit === "г") {
    return `p5 ${Math.round(p5)} · p50 ${Math.round(p50)} · p95 ${Math.round(p95)} ${unit}`;
  }
  return `p5 ${p5} · p50 ${p50} · p95 ${p95} ${unit}`;
}

export function FieldHelpPopover({ fieldName, label, gaWeeks, gaDays }: Props) {
  const [open, setOpen] = useState(false);
  const snippet = useMemo(() => (open ? getFieldHelp(fieldName) : null), [open, fieldName]);

  const gaDecimal =
    gaWeeks !== undefined && Number.isFinite(gaWeeks) ? gaWeeks + (gaDays ?? 0) / 7 : null;

  const medvedevMarker = PROTOCOL_FIELD_TO_MEDVEDEV_MARKER[fieldName];
  const normBand = useMemo(() => {
    if (!open || gaDecimal == null || !medvedevMarker) return null;
    const marker = medvedevMarker as Parameters<typeof getMedvedevBiometryBand>[1];
    return getMedvedevBiometryBand(gaDecimal, marker);
  }, [open, gaDecimal, medvedevMarker]);

  const normsUrl = normsUrlForField(fieldName, gaDecimal ?? undefined);

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-[var(--clinical-primary)]"
        title={`Справка: ${label ?? fieldName}`}
        aria-label="Справка по измерению"
        onClick={() => setOpen((v) => !v)}
      >
        <CircleHelp className="h-4 w-4" />
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/20"
            aria-label="Закрыть"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full z-50 mt-1 w-[min(100vw-2rem,22rem)] rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 shadow-xl"
            role="dialog"
          >
            {snippet ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                  Клиническая справка
                </p>
                <p className="mt-1 font-semibold">{snippet.title}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                  {snippet.content}
                </p>
                {normBand && gaDecimal != null ? (
                  <div className="mt-3 rounded-lg bg-indigo-50/80 p-3 text-xs dark:bg-indigo-950/30">
                    <p className="font-bold text-indigo-950 dark:text-indigo-100">
                      Норма при {gaDecimal.toFixed(1)} нед (Медведев)
                    </p>
                    <p className="mt-1 font-mono text-indigo-900 dark:text-indigo-200">
                      {formatBand(normBand.p5, normBand.p50, normBand.p95, medvedevMarker === "efw" ? "г" : "мм")}
                    </p>
                  </div>
                ) : gaDecimal == null && medvedevMarker ? (
                  <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">
                    Укажите ПМП или фетометрию — покажем перцентили по сроку.
                  </p>
                ) : null}
                <div className="mt-3 flex flex-col gap-2">
                  <Button asChild size="sm" variant="secondary" className="w-full">
                    <Link href={`/reference?topic=${snippet.topicId}`}>Методика измерения</Link>
                  </Button>
                  {normsUrl ? (
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link href={normsUrl}>Таблица норм по сроку</Link>
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--clinical-foreground-muted)]">
                Справка для этого поля пока не добавлена.
              </p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
