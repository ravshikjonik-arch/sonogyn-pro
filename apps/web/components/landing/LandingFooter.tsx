import Link from "next/link";

import { TelegramChannelLink } from "@/components/clinical/TelegramChannelLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { LANDING_PILLARS } from "./data";

type LandingFooterProps = {
  isAuthenticated: boolean;
};

export function LandingFooter({ isAuthenticated }: LandingFooterProps) {
  return (
    <>
      <section className="grid gap-6 md:grid-cols-3">
        {LANDING_PILLARS.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="sonogyn-tile-hover border-slate-200/80 bg-white/90 dark:bg-[var(--clinical-card)]">
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
      </section>

      <section className="rounded-3xl bg-gradient-to-br from-[var(--clinical-primary)] to-violet-700 px-6 py-12 text-center text-white shadow-2xl sm:px-8">
        <h2 className="text-2xl font-black sm:text-3xl">Готовы попробовать на реальном кейсе?</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-white/85">
          Инструмент ассистивный. Заключение и решение — за лечащим врачом.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/app"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-[var(--clinical-primary-deep)] shadow transition hover:bg-white/95"
          >
            {isAuthenticated ? "В личный кабинет" : "Открыть кабинет"}
          </Link>
          <Link
            href={isAuthenticated ? "/profile/pro" : "/login?redirectedFrom=/profile/pro"}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/40 bg-transparent px-6 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {isAuthenticated ? "Тариф PRO" : "Войти для PRO"}
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--clinical-border)] pt-10 text-center text-xs text-[var(--clinical-foreground-muted)]">
        <div className="mx-auto mb-6 max-w-md">
          <TelegramChannelLink />
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/landing#features" className="hover:text-[var(--clinical-primary-deep)]">
            Возможности
          </Link>
          <Link href="/landing#pricing" className="hover:text-[var(--clinical-primary-deep)]">
            Тарифы
          </Link>
          <Link href="/pricing" className="hover:text-[var(--clinical-primary-deep)]">
            Страница тарифов
          </Link>
          <Link href="/app" className="hover:text-[var(--clinical-primary-deep)]">
            Кабинет
          </Link>
          {!isAuthenticated ? (
            <Link href="/login?redirectedFrom=/app" className="hover:text-[var(--clinical-primary-deep)]">
              Войти
            </Link>
          ) : null}
          <a href="mailto:support@sonogyn-pro.ru" className="hover:text-[var(--clinical-primary-deep)]">
            support@sonogyn-pro.ru
          </a>
        </div>
        <p className="mt-4">
          SonoGyn Pro · Yakrav7700 · не является медицинским изделием без регистрации
        </p>
        <p className="mt-2 text-[10px] text-slate-500">
          Информация на сайте не является медицинским диагнозом; интерпретация — за специалистом.
        </p>
      </footer>
    </>
  );
}
