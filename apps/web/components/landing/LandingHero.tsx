import { ArrowRight, HeartPulse, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LANDING_FEATURES, LANDING_STATS } from "./data";

type LandingHeroProps = {
  isAuthenticated: boolean;
};

export function LandingHero({ isAuthenticated }: LandingHeroProps) {
  const primaryHref = isAuthenticated ? "/app" : "/register";
  const primaryLabel = isAuthenticated ? "В личный кабинет" : "Начать";
  const secondaryHref = isAuthenticated ? "/paywall" : "/login";
  const secondaryLabel = isAuthenticated ? "Тариф PRO" : "Войти";

  return (
    <section className="sonogyn-hero-orbs grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div className="space-y-8 sonogyn-enter">
        <p className="sonogyn-pill inline-flex items-center gap-2">
          <span className="sonogyn-live-dot" aria-hidden />
          <ShieldCheck className="h-3.5 w-3.5" />
          Для врачей УЗД и акушеров-гинекологов · не для пациентов
        </p>
        <h1 className="sonogyn-gradient-text text-4xl font-black tracking-tight sm:text-5xl lg:text-[3.4rem] lg:leading-[1.06] sonogyn-enter sonogyn-enter-delay-1">
          Клинический помощник, которому можно доверять
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-[var(--clinical-foreground-muted)]">
          SonoGyn Pro объединяет калькуляторы по международным классификациям, 3D-визуализацию,
          клинические рекомендации и кейсы — в одном рабочем месте: браузер сейчас, приложение всегда под рукой.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="sonogyn-cta-glow gap-2" asChild>
            <Link href={primaryHref}>
              {primaryLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {LANDING_STATS.map((s) => (
            <div key={s.label} className="sonogyn-stat-chip">
              <p className="text-2xl font-black text-[var(--clinical-primary-deep)]">{s.value}</p>
              <p className="mt-1 text-xs leading-snug text-[var(--clinical-foreground-muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <Card className="sonogyn-glass-card sonogyn-enter sonogyn-enter-delay-2 overflow-hidden border-white/20 shadow-2xl">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-900/50">
          <Image
            src="/clinical-atlas/orads-referat/case-01.png"
            alt="Пример эхограммы O-RADS в интерфейсе SonoGyn Pro"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 480px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
        </div>
        <div className="sonogyn-shimmer-bar h-1.5" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HeartPulse className="h-5 w-5 text-[var(--clinical-primary)]" />
            Что внутри платформы
          </CardTitle>
          <CardDescription>
            Архитектура «рабочая станция УЗИ»: мало кликов, предсказуемая навигация, тёмная тема для кабинета.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {LANDING_FEATURES.slice(0, 3).map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="flex gap-3 rounded-2xl bg-white/50 p-3 dark:bg-white/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{p.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{p.body}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
