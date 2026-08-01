import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Calculator, CheckCircle2, MessageCircle, ShieldCheck, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TELEGRAM_CHANNEL } from "@/lib/brand/telegram";

export const metadata: Metadata = {
  title: "O-RADS и IOTA для врача УЗД",
  description:
    "Рабочий вход в SonoGyn Pro: O-RADS калькулятор, IOTA-ориентиры, учебные кейсы и клинические материалы для врачей УЗД и акушеров-гинекологов.",
};

const campaign = "launch_orads_iota_2026_08";

function utm(path: string, source: string, medium: string): string {
  const qs = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
    utm_content: "lp_orads_iota",
  });
  return `${path}?${qs.toString()}`;
}

const toolLinks = [
  {
    href: utm("/tools/calc/rads/o-rads", "lp", "button"),
    icon: Calculator,
    title: "O-RADS калькулятор",
    body: "Структурировать признаки образования яичника и быстро сверить категорию риска.",
  },
  {
    href: utm("/tools/refs/iota-terms-2026", "lp", "button"),
    icon: BookOpenCheck,
    title: "IOTA terms",
    body: "Подсказки по описанию: стенка, перегородки, солидный компонент, папиллярные структуры.",
  },
  {
    href: utm("/cases", "lp", "button"),
    icon: MessageCircle,
    title: "Клинические кейсы",
    body: "Черновики и обсуждение учебных примеров без ФИО и идентификаторов пациента.",
  },
] as const;

const proofItems = [
  "Для врачей УЗД, акушеров-гинекологов и ординаторов",
  "Фокус на O-RADS, IOTA, BI-RADS, FIGO и клинических алгоритмах",
  "Учебный и справочный материал; итоговую интерпретацию выполняет специалист",
] as const;

export default function OradsIotaLandingPage() {
  return (
    <div className="sonogyn-mesh-bg min-h-screen text-[var(--clinical-foreground)]">
      <header className="border-b border-[var(--clinical-border)]/70 bg-[var(--clinical-header)]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/landing" className="flex items-center gap-2 font-bold tracking-tight" aria-label="SonoGyn Pro">
            <span className="sonogyn-brand-mark h-8 w-8 text-[10px]">SG</span>
            <span>SonoGyn Pro</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Навигация">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href={utm("/tools/calc/rads/o-rads", "lp", "nav")}>O-RADS</Link>
            </Button>
            <Button size="sm" className="font-semibold" asChild>
              <Link href={utm("/register", "lp", "nav")}>Начать</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.02fr_0.98fr] lg:py-14">
          <div className="max-w-2xl">
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="sonogyn-pill">Для врача УЗД</span>
              <span className="sonogyn-pill">O-RADS · IOTA · кейсы</span>
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              O-RADS и IOTA под рукой во время описания УЗИ
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--clinical-foreground-muted)] sm:text-lg">
              SonoGyn Pro помогает врачу структурировать признаки, сверить логику риска и сохранить учебный кейс для разбора. Без обещаний автономной диагностики: решение остаётся за специалистом.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 justify-center font-semibold" asChild>
                <Link href={utm("/tools/calc/rads/o-rads", "yandex", "search")}>
                  Открыть O-RADS
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" className="h-12 justify-center font-semibold" asChild>
                <Link href={utm("/register", "lp", "hero_secondary")}>Создать аккаунт</Link>
              </Button>
            </div>
            <div className="mt-7 grid gap-3 text-sm text-[var(--clinical-foreground-muted)] sm:grid-cols-3">
              {proofItems.map((item) => (
                <div key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--clinical-primary)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sonogyn-glass-card overflow-hidden rounded-2xl">
            <div className="relative aspect-[4/3]">
              <Image
                src="/clinical/orads-hero/ovary-us-waves.jpg"
                alt="УЗИ-изображение придатков для учебного разбора O-RADS"
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/20 bg-slate-950/72 p-4 text-white shadow-2xl backdrop-blur">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">SonoGyn Pro</span>
                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-100">учебный режим</span>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-300">Признаки</span>
                    <span className="font-semibold">стенка · солидный компонент · кровоток</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-300">Инструмент</span>
                    <span className="font-semibold">O-RADS / IOTA</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-300">Выход</span>
                    <span className="font-semibold">структурированный черновик</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--clinical-border)]/70 bg-[var(--clinical-card)]/55">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
            {toolLinks.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="sonogyn-glass-card group rounded-xl p-5 transition-transform hover:-translate-y-0.5"
              >
                <item.icon className="h-6 w-6 text-[var(--clinical-primary)]" />
                <h2 className="mt-4 text-lg font-bold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--clinical-foreground-muted)]">{item.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--clinical-primary-deep)]">
                  Перейти <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Для первого касания с врачом</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--clinical-foreground-muted)]">
              Эта страница рассчитана на трафик из Яндекс Поиска, рекламы в Telegram-каналах и постов в профессиональных сообществах. Главный путь: открыть инструмент, затем зарегистрироваться.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Stethoscope, title: "Практический вход", text: "Не общие обещания платформы, а рабочий сценарий врача УЗИ." },
              { icon: ShieldCheck, title: "Аккуратная медицина", text: "Без гарантий диагноза и без формулировок, опасных для рекламы медпродукта." },
              { icon: MessageCircle, title: "Прогрев в Telegram", text: `Переход в ${TELEGRAM_CHANNEL.handle} для доверия и дальнейшего общения.` },
              { icon: Calculator, title: "Измеримый результат", text: "UTM-метки разделяют поиск, Telegram-посевы и переходы со страницы." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5">
                <item.icon className="h-5 w-5 text-[var(--clinical-primary)]" />
                <h3 className="mt-3 font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--clinical-foreground-muted)]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="sonogyn-glass-card flex flex-col justify-between gap-5 rounded-2xl p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Запустить тест на 14 дней</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--clinical-foreground-muted)]">
                Начинаем с малого бюджета: Яндекс Поиск по горячим запросам и 3-6 ручных размещений в Telegram-каналах для врачей.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:min-w-56">
              <Button className="justify-center font-semibold" asChild>
                <Link href={utm("/register", "lp", "bottom_cta")}>Зарегистрироваться</Link>
              </Button>
              <Button variant="secondary" className="justify-center font-semibold" asChild>
                <Link href={TELEGRAM_CHANNEL.url}>Telegram-канал</Link>
              </Button>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-[var(--clinical-foreground-muted)]">
            SonoGyn Pro предоставляет учебные и справочные материалы для медицинских специалистов. Сервис не является медицинским изделием и не заменяет клиническую интерпретацию врача.
          </p>
        </section>
      </main>
    </div>
  );
}
