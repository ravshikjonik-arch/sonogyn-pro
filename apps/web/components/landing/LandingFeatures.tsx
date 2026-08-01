import { LANDING_FEATURES } from "./data";

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-24">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
          Возможности
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-[var(--clinical-foreground)] sm:text-3xl">
          Инструменты ежедневной практики
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-base">
          Классификации по гайдлайнам. Без автоматического диагноза по пикселям.
        </p>
      </div>

      <ul className="mt-12 divide-y divide-[var(--clinical-border)] border-y border-[var(--clinical-border)]">
        {LANDING_FEATURES.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title} className="grid gap-4 py-8 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--clinical-foreground)]">{item.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-base">
                  {item.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
