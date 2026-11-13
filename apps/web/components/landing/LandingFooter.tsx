import Link from "next/link";

import { CookieSettingsButton } from "@/components/analytics/CookieSettingsButton";
import { TrackCtaLink } from "@/components/analytics/TrackCtaLink";
import { TelegramChannelLink } from "@/components/clinical/TelegramChannelLink";
import { ContentErrorReportLink } from "@/components/feedback/ContentErrorReportLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatLegalCopyrightLine,
  MEDICAL_DEVICE_DISCLAIMER_RU,
  readLegalPublicProfile,
} from "@/lib/config/legal";
import { CDS_DISCLAIMER_RU } from "@/lib/config/platform";

import { LANDING_PILLARS } from "./data";

type LandingFooterProps = {
  isAuthenticated: boolean;
};

export function LandingFooter({ isAuthenticated }: LandingFooterProps) {
  const legal = readLegalPublicProfile();

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
          <TrackCtaLink
            href="/app"
            cta="cabinet"
            placement="landing_footer_cta"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-[var(--clinical-primary-deep)] shadow transition hover:bg-white/95"
          >
            {isAuthenticated ? "В личный кабинет" : "Открыть кабинет"}
          </TrackCtaLink>
          <TrackCtaLink
            href={isAuthenticated ? "/profile/pro" : "/login?redirectedFrom=/profile/pro"}
            cta="pro"
            placement="landing_footer_cta"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/40 bg-transparent px-6 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {isAuthenticated ? "Тариф PRO" : "Войти для PRO"}
          </TrackCtaLink>
        </div>
      </section>

      <footer className="border-t border-[var(--clinical-border)] pt-10 text-center text-xs text-[var(--clinical-foreground-muted)]">
        <div className="mx-auto mb-6 max-w-md space-y-3">
          <TelegramChannelLink />
          <ContentErrorReportLink pagePath="/" className="text-left sm:text-center" />
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/#features" className="hover:text-[var(--clinical-primary-deep)]">
            Возможности
          </Link>
          <Link href="/#pricing" className="hover:text-[var(--clinical-primary-deep)]">
            Тарифы
          </Link>
          <Link href="/pricing" className="hover:text-[var(--clinical-primary-deep)]">
            Страница тарифов
          </Link>
          <Link href="/blog" className="hover:text-[var(--clinical-primary-deep)]">
            Блог
          </Link>
          <Link href="/privacy" className="hover:text-[var(--clinical-primary-deep)]">
            Политика
          </Link>
          <Link href="/offer" className="hover:text-[var(--clinical-primary-deep)]">
            Оферта
          </Link>
          <Link href="/contacts" className="hover:text-[var(--clinical-primary-deep)]">
            Контакты
          </Link>
          <CookieSettingsButton />
          <Link href="/app" className="hover:text-[var(--clinical-primary-deep)]">
            Кабинет
          </Link>
          {!isAuthenticated ? (
            <Link href="/login?redirectedFrom=/app" className="hover:text-[var(--clinical-primary-deep)]">
              Войти
            </Link>
          ) : null}
          <a
            href={`mailto:${legal.supportEmail}`}
            className="hover:text-[var(--clinical-primary-deep)]"
          >
            {legal.supportEmail}
          </a>
        </div>
        <p className="mt-4">{formatLegalCopyrightLine(legal)}</p>
        <p className="mt-2 text-[10px] text-[var(--clinical-foreground-muted)]">
          {MEDICAL_DEVICE_DISCLAIMER_RU}
        </p>
        <p className="mt-2 text-[10px] text-[var(--clinical-foreground-muted)]">{CDS_DISCLAIMER_RU}</p>
      </footer>
    </>
  );
}
