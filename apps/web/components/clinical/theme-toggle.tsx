"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme/theme-provider";

/** Только кабинет; лендинг игнорирует toggle (см. theme-paths resolveClinicalTheme). */
export function ThemeToggle() {
  const { mode, resolved, toggle } = useTheme();
  const systemHint = mode === "system" ? " · системная тема" : "";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="shrink-0 text-[var(--clinical-foreground-muted)]"
      title={
        resolved === "dark"
          ? `Включить светлую тему${systemHint}`
          : `Включить тёмную тему${systemHint}`
      }
      aria-label="Переключить тему кабинета"
      aria-pressed={resolved === "dark"}
    >
      {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
