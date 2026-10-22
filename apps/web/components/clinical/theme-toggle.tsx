"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme/theme-provider";

export function ThemeToggle() {
  const { mode, resolved, toggle } = useTheme();
  const systemHint = mode === "system" ? " (системная)" : "";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-2 text-[var(--clinical-foreground-muted)]"
      title={
        resolved === "dark"
          ? `Светлая тема${systemHint}`
          : `Тёмная тема${systemHint}`
      }
      aria-label="Переключить тему кабинета"
      aria-pressed={resolved === "dark"}
    >
      {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden text-xs font-semibold sm:inline">
        {resolved === "dark" ? "Светлая" : "Тёмная"}
      </span>
    </Button>
  );
}
