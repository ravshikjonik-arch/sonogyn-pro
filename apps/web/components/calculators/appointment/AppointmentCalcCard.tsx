"use client";

import Link from "next/link";
import { ArrowRight, Pin, PinOff } from "lucide-react";

import { AppointmentCalcIconView } from "@/components/calculators/appointment/AppointmentCalcIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { statusLabel, type AppointmentCalculator } from "@repo/clinical-tools";

type Props = {
  calc: AppointmentCalculator;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (id: string) => void;
  compact?: boolean;
};

export function AppointmentCalcCard({ calc, isFavorite, onToggleFavorite, onOpen, compact }: Props) {
  const canOpen = calc.status !== "missing" && Boolean(calc.webHref);

  const body = (
    <>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-2xl bg-[var(--clinical-primary)] text-white shadow-sm",
            compact ? "h-11 w-11" : "h-14 w-14",
          )}
        >
          <AppointmentCalcIconView icon={calc.icon} className={compact ? "h-5 w-5" : "h-7 w-7"} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("font-bold leading-snug text-[var(--clinical-foreground)]", compact ? "text-sm" : "text-base")}>
              {calc.title}
            </h3>
            {calc.status !== "implemented" ? (
              <Badge variant={calc.status === "partial" ? "secondary" : "outline"} className="text-[10px]">
                {statusLabel(calc.status)}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{calc.description}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(calc.id);
          }}
          className="shrink-0 rounded-lg p-2 text-[var(--clinical-foreground-muted)] transition hover:bg-[var(--clinical-muted)] hover:text-[var(--clinical-primary-deep)]"
          aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
        >
          {isFavorite ? <Pin className="h-4 w-4 fill-current" /> : <PinOff className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-4 flex justify-end">
        {canOpen ? (
          <Button
            size={compact ? "sm" : "default"}
            className="rounded-xl"
            onClick={() => onOpen(calc.id)}
            asChild
          >
            <Link href={calc.webHref!}>
              Открыть
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button size={compact ? "sm" : "default"} className="rounded-xl" disabled variant="outline">
            В разработке
          </Button>
        )}
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "sonogyn-glass-card rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] transition hover:border-[var(--clinical-primary)]/40",
        compact ? "p-4" : "p-5",
      )}
    >
      {body}
    </article>
  );
}
