import Link from "next/link";

import { Button } from "@/components/ui/button";

type LandingHeaderProps = {
  isAuthenticated: boolean;
};

export function LandingHeader({ isAuthenticated }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[var(--clinical-header)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/landing" className="flex min-w-0 items-center gap-3">
          <div className="sonogyn-brand-mark shrink-0">SG</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black tracking-tight text-slate-950 dark:text-white">SonoGyn Pro</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--clinical-foreground-muted)]">
              УЗИ · АГ · клиника
            </p>
          </div>
        </Link>
        <nav className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/landing#features">Возможности</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/landing#pricing">Тарифы</Link>
          </Button>
          {isAuthenticated ? (
            <Button size="sm" className="sonogyn-cta-glow" asChild>
              <Link href="/app">В личный кабинет</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Войти</Link>
              </Button>
              <Button size="sm" className="sonogyn-cta-glow" asChild>
                <Link href="/register">Начать</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
