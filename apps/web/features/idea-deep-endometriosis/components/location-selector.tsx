"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

import { noduleLocationSchema } from "../lib/schema";
import type { z } from "zod";

type Loc = z.infer<typeof noduleLocationSchema>;

const LABELS: Record<Loc, string> = {
  rectovaginal_septum: "Ректовагинальная перегородка",
  uterosacral_ligament_right: "Связка матки справа (крестцово-маточная)",
  uterosacral_ligament_left: "Связка матки слева (крестцово-маточная)",
  torus_uterinus: "Торус матки",
  bladder: "Мочевой пузырь",
  ureter_right: "Мочеточник справа",
  ureter_left: "Мочеточник слева",
  bowel_rectum: "Кишка — прямая",
  bowel_sigmoid: "Кишка — сигма",
  vagina: "Вагина",
};

const ALL: Loc[] = noduleLocationSchema.options;

export type LocationSelectorProps = {
  value: Loc;
  onChange: (v: Loc) => void;
  className?: string;
  testId?: string;
};

/** Доступный выбор локализации узла (выпадающий список). */
export function LocationSelector({ value, onChange, className, testId }: LocationSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className={cn("h-11 w-full justify-between font-normal", className)}
          data-testid={testId}
          aria-label="Локализация узла"
        >
          <span className="truncate">{LABELS[value]}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto">
        {ALL.map((loc) => (
          <DropdownMenuItem key={loc} onSelect={() => onChange(loc)} className="flex items-center gap-2">
            {value === loc ? <Check className="h-4 w-4" /> : <span className="w-4" />}
            {LABELS[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
