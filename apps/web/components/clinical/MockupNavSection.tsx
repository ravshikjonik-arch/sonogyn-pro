"use client";

import { ArrowDownUp, CircleDot, Heart, Layers, Stethoscope } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  MOCKUP_ROUTES,
  readMockupNavPrefs,
  swapMockupSidebarOrder,
  type MockupId,
  type MockupNavPrefs,
} from "@/lib/mockups/mockup-nav-prefs";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<MockupId, typeof Stethoscope> = {
  uterus: Stethoscope,
  breast: Heart,
  ovary: CircleDot,
};

type Props = {
  onNavigate?: () => void;
};

export function MockupNavSection({ onNavigate }: Props) {
  const pathname = usePathname();
  const [prefs, setPrefs] = useState<MockupNavPrefs>(() => readMockupNavPrefs());

  useEffect(() => {
    setPrefs(readMockupNavPrefs());
  }, []);

  const hubActive = pathname === "/mockups" || pathname.startsWith("/mockups/");

  const swapOrder = useCallback(() => {
    setPrefs(swapMockupSidebarOrder(prefs));
  }, [prefs]);

  return (
    <div className="mt-2 space-y-1 border-t border-[var(--clinical-border)] pt-3">
      <div className="flex items-center justify-between gap-2 px-3 pb-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--clinical-foreground-muted)]">
          Макеты УЗИ
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          title="Сдвинуть порядок макетов"
          onClick={swapOrder}
        >
          <ArrowDownUp className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Link
        href="/mockups"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          hubActive
            ? "sonogyn-nav-active text-[var(--clinical-primary-deep)]"
            : "text-[var(--clinical-foreground-muted)] hover:bg-black/[0.04] hover:text-[var(--clinical-foreground)]",
        )}
      >
        <Layers className="h-4 w-4 shrink-0 opacity-80" />
        Выбор макета
      </Link>

      {prefs.sidebarOrder.map((id) => {
        const meta = MOCKUP_ROUTES[id];
        const Icon = ICONS[id];
        const active = pathname === meta.href || pathname.startsWith(`${meta.href}/`);
        return (
          <Link
            key={id}
            href={meta.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg py-2 pl-8 pr-3 text-sm font-medium transition-all",
              active
                ? "sonogyn-nav-active text-[var(--clinical-primary-deep)]"
                : "text-[var(--clinical-foreground-muted)] hover:bg-black/[0.04] hover:text-[var(--clinical-foreground)]",
            )}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" />
            {meta.label}
          </Link>
        );
      })}
    </div>
  );
}
