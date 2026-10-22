"use client";

import { Pin, PinOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCalculatorWorkspace } from "@/lib/hooks/use-calculator-workspace";

type Props = {
  calculatorId: string;
};

export function CalculatorFavoriteButton({ calculatorId }: Props) {
  const { favorite, hydrated, toggleFavorite } = useCalculatorWorkspace(calculatorId);

  if (!hydrated) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleFavorite}
      className="gap-1.5 text-[var(--clinical-foreground-muted)]"
      aria-pressed={favorite}
      aria-label={favorite ? "Убрать из избранного на рабочем столе" : "Добавить в избранное"}
    >
      {favorite ? <Pin className="h-4 w-4 fill-current" /> : <PinOff className="h-4 w-4" />}
      <span className="hidden text-xs sm:inline">{favorite ? "В избранном" : "В избранное"}</span>
    </Button>
  );
}
