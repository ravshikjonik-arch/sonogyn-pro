import Link from "next/link";

import { TrackCtaLink } from "@/components/analytics/TrackCtaLink";
import { BrandMark } from "@/components/brand/BrandMark";
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
          href="/"
          className={cn(
            "flex min-w-0 items-center gap-2.5 rounded-lg px-1 py-1 transition-opacity hover:opacity-80",
            marketing ? "text-white" : "text-[var(--clinical-foreground)]",
          )}
          aria-label="SonoGyn Pro — на главную"
        >
          <BrandMark className="h-8 w-8 rounded-lg" />
          <span className="truncate text-sm font-bold tracking-tight sm:text-[15px]">SonoGyn Pro</span>
        </Link>
        <nav className="flex shrink-0 items-center justify-end gap-1 sm:gap-2" aria-label="Навигация лендинга">
          <Button
            variant="ghost"
            size="sm"
            className={cn("hidden sm:inline-flex", marketing && "text-violet-100 hover:bg-white/10 hover:text-white")}
            asChild
          >
            <Link href="/#features">Возможности</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(marketing && "text-violet-100 hover:bg-white/10 hover:text-white")}
            asChild
          >
            <Link href="/#pricing">Тарифы</Link>
          </Button>
          {isAuthenticated ? (
            <Button size="sm" className="sonogyn-cta-glow font-semibold" asChild>
              <TrackCtaLink href="/app" cta="cabinet" placement="landing_header">
                Кабинет
              </TrackCtaLink>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={cn(marketing && "text-violet-100 hover:bg-white/10 hover:text-white")}
                asChild
              >
                <TrackCtaLink href="/login" cta="login" placement="landing_header">
                  Войти
                </TrackCtaLink>
              </Button>
              <Button
                size="sm"
                className={cn(
                  "font-semibold",
                  marketing
                    ? "bg-[var(--clinical-primary)] text-white hover:bg-[var(--clinical-primary-hover)]"
                    : "sonogyn-cta-glow",
                )}
                asChild
              >
                <TrackCtaLink href="/register" cta="register" placement="landing_header">
                  Начать
                </TrackCtaLink>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
