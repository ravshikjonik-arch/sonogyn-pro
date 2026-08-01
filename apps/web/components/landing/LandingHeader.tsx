import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type LandingHeaderProps = {
  isAuthenticated: boolean;
  variant?: "clinical" | "marketing";
};

export function LandingHeader({ isAuthenticated, variant = "clinical" }: LandingHeaderProps) {
  const marketing = variant === "marketing";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-30 border-b backdrop-blur-xl",
        marketing
          ? "border-violet-500/20 bg-[#05030a]/75"
          : "border-[var(--clinical-border)]/60 bg-[var(--clinical-header)]/75",
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href="/landing"
          className={cn(
            "flex min-w-0 items-center gap-2.5 rounded-lg px-1 py-1 transition-opacity hover:opacity-80",
            marketing ? "text-white" : "text-[var(--clinical-foreground)]",
          )}
          aria-label="SonoGyn Pro — на главную"
        >
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black tracking-tight text-white",
              marketing
                ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-[0_0_16px_rgba(168,85,247,0.45)]"
                : "bg-[var(--clinical-primary)]",
            )}
          >
            SG
          </span>
          <span className="truncate text-sm font-bold tracking-tight sm:text-[15px]">SonoGyn Pro</span>
        </Link>
        <nav className="flex shrink-0 items-center justify-end gap-1 sm:gap-2" aria-label="Навигация лендинга">
          <Button
            variant="ghost"
            size="sm"
            className={cn("hidden sm:inline-flex", marketing && "text-violet-100 hover:bg-white/10 hover:text-white")}
            asChild
          >
            <Link href="/landing#features">Возможности</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(marketing && "text-violet-100 hover:bg-white/10 hover:text-white")}
            asChild
          >
            <Link href="/landing#pricing">Тарифы</Link>
          </Button>
          {isAuthenticated ? (
            <Button size="sm" className="sonogyn-cta-glow font-semibold" asChild>
              <Link href="/app">Кабинет</Link>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={cn(marketing && "text-violet-100 hover:bg-white/10 hover:text-white")}
                asChild
              >
                <Link href="/landing#join">Войти</Link>
              </Button>
              <Button size="sm" className={cn("font-semibold", marketing ? "bg-violet-600 hover:bg-violet-500" : "sonogyn-cta-glow")} asChild>
                <Link href="/landing#join">Начать</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
