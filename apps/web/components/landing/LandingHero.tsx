import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type LandingHeroProps = {
  isAuthenticated: boolean;
};

const HERO_IMAGE = "/clinical/orads-hero/ovary-us-waves.jpg";

export function LandingHero({ isAuthenticated }: LandingHeroProps) {
  const primaryHref = "/home";
  const primaryLabel = isAuthenticated ? "В личный кабинет" : "Открыть кабинет";
  const secondaryHref = isAuthenticated ? "/profile/pro" : "/login?redirectedFrom=/home";
  const secondaryLabel = isAuthenticated ? "Тариф PRO" : "Войти";

  return (
    <section
      className="relative isolate min-h-[min(92vh,880px)] w-full overflow-hidden"
      aria-labelledby="landing-hero-heading"
    >
      {/* Full-bleed clinical visual plane */}
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-[70%_center] scale-110 sonogyn-hero-kenburns sm:object-right"
          sizes="100vw"
        />
        {/* Left readable text zone; right keeps clinical US plane dominant */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[var(--clinical-canvas)] from-0% via-[var(--clinical-canvas)]/88 via-45% to-transparent to-78% dark:from-[#0b0f19] dark:via-[#0b0f19]/85 dark:to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--clinical-canvas)] from-0% via-transparent via-40% to-[var(--clinical-canvas)]/40 dark:from-[#0b0f19] dark:to-[#0b0f19]/45"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto flex min-h-[min(92vh,880px)] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:pb-20 sm:pt-32 lg:justify-center lg:pb-24">
        <div className="max-w-xl space-y-6 lg:max-w-2xl">
          <p className="sonogyn-enter text-sm font-black tracking-[0.08em] text-[var(--clinical-primary-deep)] sm:text-base">
            SonoGyn Pro
          </p>

          <h1
            id="landing-hero-heading"
            className="sonogyn-enter sonogyn-enter-delay-1 text-4xl font-black tracking-tight text-[var(--clinical-foreground)] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]"
          >
            Рабочее место врача УЗИ и АГ
          </h1>

          <p className="sonogyn-enter sonogyn-enter-delay-2 max-w-lg text-base leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-lg">
            Калькуляторы по гайдлайнам, протоколы и Evidence — без автоматического диагноза.
            Интерпретация остаётся за специалистом.
          </p>

          <div className="sonogyn-enter sonogyn-enter-delay-3 flex flex-wrap gap-3 pt-1">
            <Button size="lg" className="sonogyn-cta-glow gap-2 px-7 font-bold" asChild>
              <Link href={primaryHref}>
                {primaryLabel} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="font-semibold" asChild>
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
