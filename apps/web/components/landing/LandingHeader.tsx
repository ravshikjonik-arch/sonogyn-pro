import Link from "next/link";

import { Button } from "@/components/ui/button";

type LandingHeaderProps = {
  isAuthenticated: boolean;
};

export function LandingHeader({ isAuthenticated }: LandingHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-[var(--clinical-border)]/60 bg-[var(--clinical-header)]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16">
        <Link
          href="/landing"
          className="flex min-w-0 items-center gap-2.5 rounded-lg px-1 py-1 text-[var(--clinical-foreground)] transition-opacity hover:opacity-80"
          aria-label="SonoGyn Pro — на главную"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--clinical-primary)] text-[10px] font-black tracking-tight text-white">
            SG
          </span>
          <span className="truncate text-sm font-bold tracking-tight sm:text-[15px]">SonoGyn Pro</span>
        </Link>
        <nav className="flex shrink-0 items-center justify-end gap-1 sm:gap-2" aria-label="Навигация лендинга">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/landing#features">Возможности</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/landing#pricing">Тарифы</Link>
          </Button>
          {isAuthenticated ? (
            <Button size="sm" className="sonogyn-cta-glow font-semibold" asChild>
              <Link href="/app">Кабинет</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Войти</Link>
              </Button>
              <Button size="sm" className="sonogyn-cta-glow font-semibold" asChild>
                <Link href="/register">Начать</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
