"use client";

import { CircleHelp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getFieldHelp } from "@repo/clinical-reference";

type Props = {
  fieldName: string;
  label?: string;
};

export function FieldHelpPopover({ fieldName, label }: Props) {
  const [open, setOpen] = useState(false);
  const snippet = useMemo(() => (open ? getFieldHelp(fieldName) : null), [open, fieldName]);

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
                <Button asChild size="sm" variant="secondary" className="mt-3 w-full">
                  <Link href={`/reference?topic=${snippet.topicId}`}>Открыть в справочнике</Link>
                </Button>
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
