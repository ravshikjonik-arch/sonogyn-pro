import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { LANDING_FEATURES } from "./data";

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-24">
      <div className="mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">Возможности</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">
          Всё для ежедневной практики УЗИ и АГ
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Инструмент ассистивный: классификации по гайдлайнам, без автоматического диагноза по пикселям.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {LANDING_FEATURES.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.title}
              className="sonogyn-tile-hover border-slate-200/80 bg-white/90 dark:bg-[var(--clinical-card)]"
            >
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                {item.body}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
